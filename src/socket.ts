import * as IO from 'socket.io';
import http from 'http';

type Player = {
  username: string;
  points: number;
  socketId: string;
};

class ServerIO extends IO.Server {
  private maxPlayers: number = parseInt(process.env.MAX_PLAYERS);
  private maxRound: number = parseInt(process.env.MAX_ROUNDS);
  //to reset after gameOver
  private score: Player[] = [];
  private currentRound = 0;

  constructor(server: http.Server) {
    super(server, {
      cors: {
        origin: '*'
      }
    });

    //init db

    this.on('connection', (socket: IO.Socket) => {
      // logger.info(`Nouveau socket vers ${socket.client.conn.remoteAddress}`);

      this.registerEventsOnSocket(socket);
    });
  }

  private registerEventsOnSocket(socket: IO.Socket) {
    socket.on('auth', (username) => {
      //create player
      const p: Player = {
        username: username,
        points: 0,
        socketId: socket.id
      };
      this.score.push(p);

      //join room
      const status = this.score.length + '/' + this.maxPlayers;
      socket.join('quiz');
      this.to('quiz').emit('wait', status);
      console.log(p.username + ' joined room, ' + status);

      if (this.score.length >= this.maxPlayers) {
        console.log('starting !');
        this.newTurn();
      }
      //else wait more players
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

    socket.on('disconnect', (_) => {
      console.log('a user disconected');
    });
  }

  newTurn() {
    //get random question
    // this.crtQuestion = this.questions.getRandom();
    // this.to('quiz').emit('newTurn', this.crtQuestion);
  }

  gameOver() {
    console.log('game over');

    this.to('quiz').emit('gameOver', this.score);

    //reset for next game
    this.score = [];
    this.currentRound = 0;
  }
}

export default ServerIO;
