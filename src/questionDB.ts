import { champion, spell, skin, question, item, opaque, questionType } from './types';

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function random(max: number) {
  return randInt(0, max);
}

class QuestionDB {
  usedRandoms: number[] = [];
  champs: Array<champion> = [];
  ornnUpgrades: item[];
  mythics: item[];
  legendary: item[];
  items: item[] = [];
  boots: item[];
  skinlines: Array<string>;

  //gererate random number that haven't been generated before
  uniqueRandom(max: number): number {
    let rand;
    do {
      rand = randInt(0, max);
    } while (this.usedRandoms.includes(rand));
    this.usedRandoms.push(rand);

    return rand;
  }

  RandomAndClear(max: number): number {
    const rand = this.uniqueRandom(max);
    this.usedRandoms = [];
    return rand;
  }

  getRandomLegendary(): item {
    return this.legendary[this.uniqueRandom(this.legendary.length - 1)];
  }

  getRandomMythic(): item {
    return this.mythics[this.uniqueRandom(this.mythics.length - 1)];
  }

  getRandomItem(): item {
    return this.items[this.uniqueRandom(this.items.length - 1)];
  }

  getRandomOrnnUpgrade(): item {
    return this.ornnUpgrades[this.uniqueRandom(this.ornnUpgrades.length - 1)];
  }

  getRandomChamp(): champion {
    return this.champs[this.uniqueRandom(this.champs.length - 1)];
  }

  getRandomSkinline(): string {
    return this.skinlines[this.uniqueRandom(this.skinlines.length - 1)];
  }

  getRandomOrnnQuestion(): question {
    const ornn_item = this.getRandomOrnnUpgrade();
    const id = ornn_item.from[0];

    //make sure the item are unique
    const i = this.mythics.findIndex((item) => item.id === id);
    this.usedRandoms.push(i);

    const question: question = {
      type: questionType.Ornn,
      difficulty: 5,
      question: `What item upgrades into ${ornn_item.name} ?`,
      correct_answer: this.mythics[i].name,
      incorrect_answers: [this.getRandomMythic().name, this.getRandomMythic().name, this.getRandomMythic().name]
    };
    this.usedRandoms = []; //clear used randoms
    return question;
  }

  getRandomPriceQuestion(): question {
    const item = this.getRandomItem();

    const price = item.gold.total;

    const question: question = {
      type: questionType.Price,
      difficulty: 2,
      question: `How much cost ${item.name} ?`,
      correct_answer: price.toString(),
      incorrect_answers: [(price + 100).toString(), (price - 100).toString(), (price - 200).toString()]
    };
    this.usedRandoms = []; //clear used randoms
    return question;
  }
  //pick or ban voiceline
  getRandomVoiceQuestion(): question {
    const champ = this.getRandomChamp();

    const question: question = {
      type: questionType.Voiceline,
      difficulty: 5,
      question: `Who is this champion ?`,
      correct_answer: champ.name,
      incorrect_answers: [this.getRandomChamp().name, this.getRandomChamp().name, this.getRandomChamp().name],

      src: `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/${randInt(0, 1) ? 'champion-choose-vo' : 'champion-ban-vo'}/${champ.key}.ogg`
    };
    this.usedRandoms = []; //clear used randoms
    return question;
  }

  getRandomSfxQuestion(): question {
    const champ = this.getRandomChamp();

    const question: question = {
      type: questionType.Sfx,
      difficulty: 5,
      question: `Who is this champion ?`,
      correct_answer: champ.name,
      incorrect_answers: [this.getRandomChamp().name, this.getRandomChamp().name, this.getRandomChamp().name],

      src: `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-sfx-audios/${champ.key}.ogg`
    };
    this.usedRandoms = []; //clear used randoms
    return question;
  }

  getANonZeroStat(item: item): [string, number] {
    if (item.stats.hp) return ['hp', item.stats.hp];
    if (item.stats.ad) return ['ad', item.stats.ad];
    if (item.stats.ap) return ['ap', item.stats.ap];
    if (item.stats.armor) return ['armor', item.stats.armor];
    if (item.stats.mr) return ['mr', item.stats.mr];
    if (item.stats.as) return ['as', item.stats.as];
    if (item.stats.ms) return ['ms', item.stats.ms];
    return null;
  }

  //get a random item with at least one stat not equal to 0
  getRandomItemWithStat(): item {
    let item: item;
    do {
      item = this.getRandomItem();
    } while (!this.getANonZeroStat(item));
    return item;
  }

  getRandomStatQuestion(): question {
    const item = this.getRandomItemWithStat();
    const [stat, value] = this.getANonZeroStat(item);

    const question: question = {
      type: questionType.Stat,
      difficulty: 5,
      question: `How much ${stat} gives ${item.name} ?`,
      correct_answer: value.toString(),
      incorrect_answers: [(value + 5).toString(), (value - 5).toString(), (value - 10).toString()]
    };
    this.usedRandoms = []; //clear used randoms

    return question;
  }

  getRandomSpellQuestion(): question {
    const champ = this.getRandomChamp();
    const spell = champ.spells[random(3)];

    const question: question = {
      type: questionType.Spell,
      difficulty: 5,
      question: `${spell.name} belongs to which champ ?`,
      correct_answer: champ.name,
      incorrect_answers: [this.getRandomChamp().name, this.getRandomChamp().name, this.getRandomChamp().name]
    };
    this.usedRandoms = []; //clear used randoms

    return question;
  }

  getRandomSkinQuestion(): question {
    //get a random skinline and find a champ with that skinline
    let champ;
    let skinline: string;
    do {
      skinline = this.getRandomSkinline();
      champ = this.champs.find((champ) => champ.skins.some((skin) => skin.name.includes(skinline)));
    } while (!champ);
    this.usedRandoms = []; //clear used randoms
    //find 3 others champ without that skinline
    const otherChamps: champion[] = [];

    while (otherChamps.length < 3) {
      const otherChamp = this.getRandomChamp();
      if (otherChamp.skins.some((skin) => skin.name.includes(skinline))) continue;
      otherChamps.push(otherChamp);
    }
    this.usedRandoms = []; //clear used randoms

    const question: question = {
      type: questionType.Skin,
      difficulty: 5,
      question: `Which champ has a ${skinline} skin ?`,
      correct_answer: champ.name,
      incorrect_answers: otherChamps.map((champ) => champ.name)
    };
    return question;
  }

  ToOpaque(question: question): opaque {
    const opaque: opaque = {
      type: questionType[question.type],
      difficulty: question.difficulty,
      question: question.question,
      //randomize answers
      propositions: [question.correct_answer, ...question.incorrect_answers].sort(() => Math.random() - 0.5),
      src: question.src
    };
    return opaque;
  }

  getRandomQuestion(): question {
    const nb_types = Object.keys(questionType).length / 2;
    const type = randInt(0, nb_types - 1);

    switch (type) {
      case questionType.Ornn:
        return this.getRandomOrnnQuestion();
      case questionType.Price:
        return this.getRandomPriceQuestion();
      case questionType.Voiceline:
        return this.getRandomVoiceQuestion();
      case questionType.Sfx:
        return this.getRandomSfxQuestion();
      case questionType.Spell:
        return this.getRandomSpellQuestion();
      case questionType.Skin:
        return this.getRandomSkinQuestion();
      case questionType.Stat:
        return this.getRandomStatQuestion();
    }
    return this.getRandomQuestion(); //else retry
  }

  getXQuestions(x: number): question[] {
    const questions: question[] = [];
    for (let i = 0; i < x; i++) {
      questions.push(this.getRandomQuestion());
      this.usedRandoms = []; //clear used randoms
    }
    return questions;
  }
}

export default QuestionDB;
