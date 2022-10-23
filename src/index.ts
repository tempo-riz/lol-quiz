/* eslint-disable no-prototype-builtins */
// import fetch from 'node-fetch';
// const fetch2 = import('node-fetch');
// import env from 'dotenv';
// env.config();
import Server from './server';

//wait 2 seconds to fetch before starting server to make sure the db is ready
const server = new Server();
setTimeout(() => {
  server.run();
}, 2000);
