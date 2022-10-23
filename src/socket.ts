import * as IO from 'socket.io';
import http from 'http';
import Fetcher from './fetcher';
import { question } from './types';
import QuestionDB from './questionDB';

type player = {
  username: string;
  points: number;
  socketId: string;
  lifes: number;
};

type room = {
  roomId: string;
  host: player;
  players: Array<player>;
  questions: Array<question>;
  crtQuestion: question;
  crtQuestionIndex: number;
  crtRound: number;
  nbRounds: number;
};

class ServerIO extends IO.Server {
  private MAX_ROUND = 50;
  //to reset after gameOver
  // private players: player[] = [];
  // private currentRound = 0;
  // private host: player;
  // crtQuestion: question;
  db: QuestionDB;
  rooms: room[] = [];

  constructor(server: http.Server, db: QuestionDB) {
    super(server, {
      cors: {
        origin: '*'
      }
    });

    this.db = db;

    this.on('connection', (socket: IO.Socket) => {
      // logger.info(`Nouveau socket vers ${socket.client.conn.remoteAddress}`);

      this.registerEventsOnSocket(socket);
    });
  }

  getRoom(socket: IO.Socket): room {
    const iterator = socket.rooms.values(); //rooms contains {socket id, room id,some other rooms}
    iterator.next();
    const roomId = iterator.next().value;
    return this.rooms.find((r) => r.roomId === roomId);
  }

  private registerEventsOnSocket(socket: IO.Socket) {
    //random id for the room

    socket.on('create', (username: string, nb_round: number) => {
      const roomId = Math.random().toString(36).substring(7);

      //create player
      const p: player = {
        username: username,
        points: 0,
        socketId: socket.id,
        lifes: 3
      };

      // set number of round
      nb_round = nb_round < this.MAX_ROUND ? nb_round : this.MAX_ROUND;

      //create room
      const r: room = {
        roomId: roomId,
        host: p,
        players: [p],
        questions: this.db.getXQuestions(nb_round),
        crtQuestion: null,
        crtQuestionIndex: 0,
        crtRound: 0,
        nbRounds: nb_round
      };

      this.rooms.push(r);

      //join room
      socket.join(roomId);
      console.log(`Room ${roomId} created by ${username}`);

      //wait host to start the game
      this.to(r.roomId).emit(
        'wait',
        r.players.map((p) => p.username),
        r.host.username == p.username, //is host (bool)
        r.roomId
      );
    });

    socket.on('join', (username: string, roomId: string) => {
      const r = this.rooms.find((r) => r.roomId == roomId);

      //check that room exists
      if (!r) {
        console.log('room does not exist');
        this.error('room does not exist', socket);
        return;
      }

      //check that username is not already taken in this room
      if (r.players.find((p) => p.username == username)) {
        console.log('username already taken');
        this.error('username already taken', socket);
        return;
      }

      //create player
      const p: player = {
        username: username,
        points: 0,
        socketId: socket.id,
        lifes: 3
      };

      //join room
      socket.join(roomId);

      //add player to room
      r.players.push(p);

      //wait host to start the game
      this.to(roomId).emit(
        'wait',
        r.players.map((p) => p.username),
        r.host.username == p.username, //is host (bool)
        r.roomId
      );
    });

    socket.on('start', (replay: boolean) => {
      const r = this.getRoom(socket);
      if (replay) {
        //reset for new game
        r.crtRound = 0;
        r.crtQuestionIndex = 0;
        r.players.forEach((p) => {
          p.points = 0;
          p.lifes = 3;
        });
        r.questions = this.db.getXQuestions(r.nbRounds);
      }
      this.newTurn(r);
    });

    socket.on('pick', (value) => {
      const r = this.getRoom(socket);

      const correct = value == r.crtQuestion.correct_answer;
      const p = r.players.find((p) => p.socketId == socket.id);

      //get player by socket id
      if (correct) {
        this.to(r.roomId).emit('result', { correct: value }, p.username, p.points);
        p.points++;
        console.log(p.username + ' was correct !');
      } else {
        this.to(r.roomId).emit('result', { correct: r.crtQuestion.correct_answer, wrong: value }, p.username, p.points);
        p.points--;
        // p.lifes--;
        // if (p.lifes == 0) {
        //   this.to(r.roomId).emit('playerLost', p.username);
        //   console.log(p.username + 'is dead');

        //   this.players = this.players.filter((p) => p.lifes > 0);
        // }
        console.log(p.username + ' was wrong !');
      }
      r.crtRound++;
      if (r.crtRound < r.nbRounds) {
        console.log('round ' + (r.crtRound + 1) + '/' + r.nbRounds);
        this.newTurn(r);
      } else {
        this.gameOver(r);
      }
    });

    socket.on('disconnect', () => {
      console.log('user disconnected');

      // console.log(this.players.filter((p) => p.socketId != socket.id)[0]?.username + ' left room');
      // this.players = this.players.filter((p) => p.socketId != socket.id);
    });
  }

  newTurn(r: room) {
    //get next question
    r.crtQuestion = r.questions[r.crtQuestionIndex++];
    //send question to players
    this.to(r.roomId).emit('newTurn', this.db.ToOpaque(r.crtQuestion), r.crtRound + 1, r.nbRounds, r.players);
  }

  gameOver(r: room) {
    console.log('game over');

    this.to(r.roomId).emit('gameOver', r.players);
  }

  error(message: string, socket: IO.Socket) {
    console.log('error');
    socket.emit('error', message);
  }
}

export default ServerIO;
