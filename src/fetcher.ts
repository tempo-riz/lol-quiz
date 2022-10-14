import { RequestInfo, RequestInit } from 'node-fetch';
import { champion, spell, skin } from './types';
const fetch = (url: RequestInfo, init?: RequestInit) => import('node-fetch').then(({ default: fetch }) => fetch(url, init));

let DRAGON_VERSION: number;

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

class Fetcher {
  async setDragonVersion() {
    await fetch('https://ddragon.leagueoflegends.com/api/versions.json', {
      method: 'get',
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .then((response) => response.json())
      .then((data) => {
        DRAGON_VERSION = data[0];
        console.log(`dragon version: ${DRAGON_VERSION}`);
      })
      .catch(console.error);
  }

  async getChampionsList(): Promise<Array<string>> {
    return new Promise((resolve, reject) => {
      // fr_FR;
      fetch(`http://ddragon.leagueoflegends.com/cdn/${DRAGON_VERSION}/data/en_US/champion.json`, {
        method: 'get',
        headers: {
          'Content-Type': 'application/json'
        }
      })
        .then((response) => response.json())
        .then((content) => resolve(Object.getOwnPropertyNames(content.data)))
        .catch(reject);
    });
  }

  async getRandomChamp(): Promise<champion> {
    const champs: Array<string> = await this.getChampionsList();
    console.log(champs.length);
    const r = randInt(0, champs.length - 1);
    const champName = champs[r];

    return fetch(`http://ddragon.leagueoflegends.com/cdn/${DRAGON_VERSION}/data/en_US/champion/${champs[r]}.json`, {
      method: 'get',
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .then((response) => response.json())
      .then((content) => {
        return content.data[champName];
      });
  }

  constructor() {
    this.setDragonVersion();
  }
}

export default Fetcher;
