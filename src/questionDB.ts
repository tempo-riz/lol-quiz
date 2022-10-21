import { champion, spell, skin, question, item, opaque ,questionType} from './types';


function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

class QuestionDB {
  usedRandoms: number[] = [];
  champs: Array<champion> = [];
  ornnUpgrades: item[];
  mythics: item[];
  legendary: item[];
  items: item[] = [];
  boots: item[];
  questions:Array<question>

  //gererate random number that haven't been generated before
  random(max: number): number {
    let rand;
    do {
      rand = randInt(0, max);
    } while (this.usedRandoms.includes(rand));
    this.usedRandoms.push(rand);

    return rand;
  }

  RandomAndClear(max: number): number {
    const rand = this.random(max);
    this.usedRandoms = [];
    return rand;
  }


  getRandomLegendary(): item {
    return this.legendary[this.random(this.legendary.length - 1)];
  }

  getRandomMythic(): item {
    return this.mythics[this.random(this.mythics.length - 1)];
  }

  getRandomItem(): item {
    return this.items[this.random(this.items.length - 1)];
  }

  getRandomOrnnUpgrade(): item {
    return this.ornnUpgrades[this.random(this.ornnUpgrades.length - 1)];
  }

  getRandomChamp(): champion {
    return this.champs[this.random(this.champs.length - 1)];
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

  getRandomItemQuestion(): question {
    const item = this.getRandomItem();

    
    const price = item.gold.total;


    const question: question = {
      type: questionType.Items,
      difficulty: 2,
      question: `What is ${item.name}'s price ?`,
      correct_answer: price.toString(),
      incorrect_answers: [(price+100).toString(),(price-100).toString(),(price-50).toString()]
    };
    this.usedRandoms = []; //clear used randoms
    return question;
  }

  ToOpaque(question: question): opaque {
    const opaque: opaque = {
      type: questionType[question.type],
      difficulty: question.difficulty,
      question: question.question,
      //randomize answers
      propositions: [question.correct_answer, ...question.incorrect_answers].sort(() => Math.random() - 0.5)
    };
    return opaque;
  }

  generateQuestions():Array<question>{
    //todo
    return []
  }


  constructor() {
    //create array of questions
    this.questions=this.generateQuestions()
  }
}

export default QuestionDB;
