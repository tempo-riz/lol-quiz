import * as IO from 'socket.io';
import http from 'http';
import Fetcher from './fetcher';
import { question } from './types';

type player = {
  username: string;
  points: number;
  socketId: string;
  lifes: number;
};

class ServerIO extends IO.Server {
  private maxRound = 5;
  //to reset after gameOver
  private players: player[] = [];
  private currentRound = 0;
  private host: player;
  crtQuestion: question;

  constructor(server: http.Server, private fetcher: Fetcher) {
    super(server, {
      cors: {
        origin: '*'
      }
    });

    this.fetcher = fetcher;

    this.on('connection', (socket: IO.Socket) => {
      // logger.info(`Nouveau socket vers ${socket.client.conn.remoteAddress}`);

      this.registerEventsOnSocket(socket);
    });
  }

  private registerEventsOnSocket(socket: IO.Socket) {
    socket.on('join', (username: string) => {
      //create player
      const p: player = {
        username: username,
        points: 0,
        socketId: socket.id,
        lifes: 3
      };
      //first to join becomes host
      if (this.players.length == 0) {
        this.host = p;
        console.log(p.username + ' created room');
      } else {
        console.log(p.username + ' joined room');
      }
      this.players.push(p);

      //join room
      socket.join('quiz');
      //wait host to start the game
      this.to('quiz').emit(
        'wait',
        this.players.map((p) => p.username),
        this.host.username == p.username //is host
      );
    });

    socket.on('start', (nb_round) => {
      // this.maxRound = nb_round;
      // console.log('start game with', nb_round, 'rounds');
      this.newTurn();
    });

    socket.on('pick', (value) => {
      const correct = value == this.crtQuestion.correct_answer;
      const p = this.players.find((p) => p.socketId == socket.id);

      //get player by socket id
      if (correct) {
        this.to('quiz').emit('result', { correct: value }, p.username, p.points);
        p.points++;
        console.log(p.username + ' was correct !');
      } else {
        this.to('quiz').emit('result', { correct: this.crtQuestion.correct_answer, wrong: value }, p.username, p.points);
        p.points--;
        // p.lifes--;
        // if (p.lifes == 0) {
        //   this.to('quiz').emit('playerLost', p.username);
        //   console.log(p.username + 'is dead');

        //   this.players = this.players.filter((p) => p.lifes > 0);
        // }
        console.log(p.username + ' was wrong !');
      }

      if (this.currentRound++ < this.maxRound) {
        console.log('round ' + this.currentRound + '/' + this.maxRound);
        this.newTurn();
      } else {
        this.gameOver();
      }
    });

    socket.on('disconnect', () => {
      console.log(this.players.filter((p) => p.socketId != socket.id)[0]?.username + ' left room');
      // this.players = this.players.filter((p) => p.socketId != socket.id);
    });
  }

  newTurn() {
    //get random question
    this.crtQuestion = this.fetcher.getRandomOrnnQuestion();
    //send question to players
    this.to('quiz').emit('newTurn', this.fetcher.ToOpaque(this.crtQuestion), this.currentRound, this.maxRound, this.players);
  }

  gameOver() {
    console.log('game over');

    this.to('quiz').emit('gameOver', this.players);

    //reset for next game
    this.players = [];
    this.currentRound = 0;
  }
}

export default ServerIO;
