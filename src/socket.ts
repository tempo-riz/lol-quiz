import * as IO from 'socket.io';
import http from 'http';
import Fetcher from './fetcher';

type Player = {
  username: string;
  points: number;
  socketId: string;
  lifes: number;
};

class ServerIO extends IO.Server {
  private maxPlayers: number = parseInt(process.env.MAX_PLAYERS);
  private maxRound: number = parseInt(process.env.MAX_ROUNDS);
  //to reset after gameOver
  private players: Player[] = [];
  private currentRound = 0;
  private host: Player;

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
      const p: Player = {
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

    socket.on('start', () => {
      this.newTurn();
    });

    socket.on('pick', (value) => {
      //   const correct = value == this.crtQuestion.answer;
      //   for (let i = 0; i < this.score.length; i++) {
      //     //get player by socket id
      //     if (this.score[i].socketId == socket.id) {
      //       if (correct) {
      //         this.to('quiz').emit('result', { correct: value });
      //         this.score[i].points++;
      //         console.log(this.score[i].username + ' was correct !');
      //       } else {
      //         this.to('quiz').emit('result', { correct: this.crtQuestion.answer, wrong: value });
      //         this.score[i].points -= 2;
      //         console.log(this.score[i].username + ' was wrong !');
      //       }
      //     }
      //   }
      //   if (this.currentRound++ < this.maxRound) {
      //     console.log('round ' + this.currentRound + '/' + this.maxRound);
      //     this.newTurn();
      //   } else {
      //     this.gameOver();
      //   }
    });

    socket.on('disconnect', () => {
      console.log(this.players.filter((p) => p.socketId != socket.id)[0]?.username + ' left room');
    });
  }

  newTurn() {
    //get random question
    // this.crtQuestion = this.fetcher.getRandomQuestion();
    // this.to('quiz').emit('newTurn', this.crtQuestion);
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
