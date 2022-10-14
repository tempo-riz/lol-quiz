/* eslint-disable no-prototype-builtins */
// import fetch from 'node-fetch';
// const fetch2 = import('node-fetch');
import env from 'dotenv';
import Server from './server';
env.config();

new Server().run();
