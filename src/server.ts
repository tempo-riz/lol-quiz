import { StatusCodes } from 'http-status-codes';
import express, { json } from 'express';
import { Express } from 'express-serve-static-core';
import http from 'http';
import cors from 'cors';
import * as IO from 'socket.io';
import ServerIO from './socket';
import bodyParser from 'body-parser';
import path from 'path';
import Fetcher from './fetcher';

class Server {
  private readonly backend: Express;
  private readonly server: http.Server;
  private readonly io: IO.Server;
  readonly fetcher: Fetcher;

  constructor() {
    this.backend = express();

    this.backend.use(cors()); //Allow CORS requests
    this.backend.use(express.json());
    this.backend.use(bodyParser.urlencoded({ extended: true })); // parse application/x-www-form-urlencoded
    this.backend.use(express.static(path.join(__dirname, 'FRONT')));

    this.server = http.createServer(this.backend);
    this.fetcher = new Fetcher();
    this.io = new ServerIO(this.server, this.fetcher);

    this.backend.get('/', (req: express.Request, res: express.Response) => {
      console.log('get index.html');
      res.render('index.html');
    });
  }

  run() {
    const port = Number(process.env.API_PORT);
    const ip = String(process.env.API_IP);
    this.server.listen(port, ip, () => {
      console.log(`Server started on http://${ip}:${port}`);
    });
  }
}

export default Server;
