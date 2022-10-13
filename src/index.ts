/* eslint-disable no-prototype-builtins */
// import fetch from 'node-fetch';
// const fetch2 = import('node-fetch');
import express, { json } from 'express';

import { RequestInfo, RequestInit } from 'node-fetch';
import { version } from 'os';

const fetch = (url: RequestInfo, init?: RequestInit) => import('node-fetch').then(({ default: fetch }) => fetch(url, init));

let DRAGON_VERSION: number;

enum userType {
  GUEST,
  PLAYER,
  ADMIN
}

type skin = {
  id: string;
  num: number;
  name: string;
  chromas: boolean;
};

type spell = {
  id: string;
  name: string;
  description: string;
  tooltip: string;
  cooldown: Array<number>;
  cost: Array<number>;
};

type champion = {
  name: string;
  title: string;
  key: string;
  spells: Array<spell>;
  skins: Array<skin>;
  partype: string; //ressource type "Mana"...
};

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function setDragonVersion() {
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

async function getChampionsList(): Promise<Array<string>> {
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

async function getRandomChamp(): Promise<champion> {
  const champs: Array<string> = await getChampionsList();
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

async function main() {
  await setDragonVersion();

  const c = await getRandomChamp();
  console.log(c.name);

  console.log(c.spells[0].name);
  console.log(c.skins[3].name);
}

main();
