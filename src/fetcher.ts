import { RequestInfo, RequestInit } from 'node-fetch';
import { champion, spell, skin, question, item } from './types';
const fetch = (url: RequestInfo, init?: RequestInit) => import('node-fetch').then(({ default: fetch }) => fetch(url, init));

let DRAGON_VERSION: number;

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

class Fetcher {
  champs: Array<champion> = [];
  items: item[];
  ornnUpgrades: item[];

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

  //get extra info about a champion
  async getChampInfo(champName: string): Promise<champion> {
    return new Promise((resolve, reject) => {
      fetch(`http://ddragon.leagueoflegends.com/cdn/${DRAGON_VERSION}/data/en_US/champion/${champName}.json`, {
        method: 'get',
        headers: {
          'Content-Type': 'application/json'
        }
      })
        .then((response) => response.json())
        .then((content) => {
          const champ: champion = {
            name: content.data[champName].name,
            title: content.data[champName].title,
            key: content.data[champName].key,
            spells: [],
            skins: [],
            partype: content.data[champName].partype
          };
          //get spells
          for (let i = 0; i < content.data[champName].spells.length; i++) {
            const spell: spell = {
              id: content.data[champName].spells[i].id,
              name: content.data[champName].spells[i].name,
              description: content.data[champName].spells[i].description,
              tooltip: content.data[champName].spells[i].tooltip,
              cooldown: content.data[champName].spells[i].cooldown,
              cost: content.data[champName].spells[i].cost
            };
            champ.spells.push(spell);
          }
          //get skins
          for (let i = 0; i < content.data[champName].skins.length; i++) {
            const skin: skin = {
              id: content.data[champName].skins[i].id,
              num: content.data[champName].skins[i].num,
              name: content.data[champName].skins[i].name,
              chromas: content.data[champName].skins[i].chromas
            };
            champ.skins.push(skin);
          }
          resolve(champ);

          // console.log(champ);
        })
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

  //get all champs object in an array  of champions concurently SLOW (4S VS 200MS !!!)
  // async getAllChampsSLOW(): Promise<Array<champion>> {
  //   console.time('getAllChamps');
  //   const champNames: Array<string> = await this.getChampionsList();
  //   const allChamps: Array<champion> = [];
  //   for (let i = 0; i < champNames.length; i++) {
  //     allChamps.push(await this.getChampInfo(champNames[i]));
  //   }

  //   console.timeEnd('getAllChamps');
  //   return allChamps;
  // }

  async loadChamps(): Promise<void> {
    console.time('champs loaded');

    const champNames: Array<string> = await this.getChampionsList();
    const results = await Promise.all(champNames.map((champName) => this.getChampInfo(champName)));
    this.champs = results;
    console.timeEnd('champs loaded');
  }

  //get all items object and returns array of items and orrn's upgrades
  async loadItems(): Promise<void> {
    console.time('items loaded');
    fetch(`http://ddragon.leagueoflegends.com/cdn/${DRAGON_VERSION}/data/en_US/item.json`, {
      method: 'get',
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .then((response) => response.json())
      .then((content) => {
        const items: Array<item> = [];
        const ornnUpgrades: Array<item> = [];
        const itemNames: Array<string> = Object.getOwnPropertyNames(content.data);

        for (let i = 0; i < itemNames.length; i++) {
          const item: item = {
            id: itemNames[i],
            name: content.data[itemNames[i]].name,
            description: content.data[itemNames[i]].description,
            from: content.data[itemNames[i]].from,
            into: content.data[itemNames[i]].into,
            gold: content.data[itemNames[i]].gold,
            stats: content.data[itemNames[i]].stats
          };

          if (content.data[itemNames[i]].inStore == false) {
            if (content.data[itemNames[i]].requiredAlly == 'Ornn') {
              ornnUpgrades.push(item);
            }
          } else {
            items.push(item);
          }
        }
        this.items = items;
        this.ornnUpgrades = ornnUpgrades;
        console.timeEnd('items loaded');
      });
  }

  constructor() {
    try {
      this.setDragonVersion().then(() => {
        this.loadChamps();
        this.loadItems();
      });
    } catch (error) {
      console.log(error);
    }
  }
}

export default Fetcher;
