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

enum questionType {
  Ornn,
  Price,
  Stat,
  Voiceline,
  Sfx,
  Spell,
  Skin
}

type opaque = {
  type: string;
  difficulty: number;
  question: string;
  propositions: Array<string>;
  src?: string;
};

type question = {
  type: questionType;
  difficulty: number;
  question: string;
  correct_answer: string;
  incorrect_answers: Array<string>;
  src?: string;
};

type item = {
  id: string;
  name: string;
  description: string;
  from: Array<string>; //items needed to build this item
  into: Array<string>; //items that can be built from this item
  gold: {
    base: number;
    total: number;
    sell: number;
  };
  stats: {
    hp: number;
    ad: number;
    ap: number;
    as: number;
    // cdr: number; //ability haste not in stats
    mr: number;
    armor: number;
    ms: number;
  };
};

export { champion, spell, skin, item, question, opaque, questionType };
