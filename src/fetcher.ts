import { RequestInfo, RequestInit } from 'node-fetch';
import QuestionDB from './questionDB';
import { champion, spell, skin, question, item, opaque } from './types';
const fetch = (url: RequestInfo, init?: RequestInit) => import('node-fetch').then(({ default: fetch }) => fetch(url, init));

let DRAGON_VERSION: number;

class Fetcher {
  db: QuestionDB;

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

  async loadSkinlines(): Promise<void> {
    console.time('skinlines loaded');
    fetch(`https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/skinlines.json`, {
      method: 'get',
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .then((response) => response.json())
      .then((content: Array<{ id: number; name: string; description: string }>) => {
        this.db.skinlines = content.map((skinline) => skinline.name);
        //remove first index (empty name "")
        this.db.skinlines.shift();

        console.timeEnd('skinlines loaded');
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
    this.db.champs = results;
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
        const mythics: Array<item> = [];
        const legendary: Array<item> = [];
        const ornnUpgrades: Array<item> = [];
        const boots: Array<item> = [];
        // const elixir: Array<item> = [];

        const itemNames: Array<string> = Object.getOwnPropertyNames(content.data);

        for (let i = 0; i < itemNames.length; i++) {
          const item: item = {
            id: itemNames[i],
            name: content.data[itemNames[i]].name,
            description: content.data[itemNames[i]].description,
            from: content.data[itemNames[i]].from,
            into: content.data[itemNames[i]].into,
            gold: content.data[itemNames[i]].gold,
            stats: {
              hp: content.data[itemNames[i]].stats.FlatHPPoolMod || 0,
              ad: content.data[itemNames[i]].stats.FlatPhysicalDamageMod || 0,
              ap: content.data[itemNames[i]].stats.FlatMagicDamageMod || 0,
              as: content.data[itemNames[i]].stats.PercentAttackSpeedMod * 10 || 0,
              mr: content.data[itemNames[i]].stats.FlatSpellBlockMod || 0,
              armor: content.data[itemNames[i]].stats.FlatArmorMod || 0,
              ms: content.data[itemNames[i]].stats.FlatMovementSpeedMod || 0
            }
          };

          //remove ARAM (11 is 5v5 rift)
          if (!content.data[itemNames[i]].maps['11']) {
            continue;
          }

          //remove consumed items (wards, trinkets, consumables)
          if (content.data[itemNames[i]].consumed) {
            continue;
          }
          //boots
          if (content.data[itemNames[i]].tags.includes('Boots')) {
            boots.push(item);
            continue;
          }

          //remove starters items
          if (content.data[itemNames[i]].gold.total < 600) {
            continue;
          }

          //remove special items (gp ult fidl trinket...)
          if (content.data[itemNames[i]].inStore == false) {
            //get ornn upgrades
            if (content.data[itemNames[i]].requiredAlly == 'Ornn') {
              ornnUpgrades.push(item);
            }
          } else {
            //get legendary
            if (content.data[itemNames[i]].description.includes('<rarityMythic>')) {
              mythics.push(item);
            } else {
              legendary.push(item);
            }
          }
        }
        this.db.mythics = mythics;
        this.db.legendary = legendary;
        this.db.items = [...mythics, ...legendary];
        this.db.ornnUpgrades = ornnUpgrades;
        this.db.boots = boots;
        // console.log('mythics', mythics.length);
        // console.log('legendary', legendary.length);
        // console.log('ornnUpgrades', ornnUpgrades.length);
        // console.log('boots', boots.length);

        console.timeEnd('items loaded');
      })
      .catch(console.error);
  }

  constructor() {
    this.db = new QuestionDB();
    try {
      this.setDragonVersion().then(() => {
        this.loadChamps();
        this.loadItems();
        this.loadSkinlines();
      });
    } catch (error) {
      console.log(error);
    }
  }
}

export default Fetcher;
