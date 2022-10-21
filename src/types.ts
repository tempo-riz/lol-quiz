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

// ## items
// - ornn upgrades
// - guess from stats/price
// ## champs
// - guess champ from one of its voicelines
// - guess champ from a spell icon
// - guess champ from it's skins
// - guess champ from a spell name
// ## spells
// - guess cooldowns

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

// type stats = {
//   FlatPhysicalDamageMod:"AD";
//   FlatMagicDamageMod:"AP";
//   FlatHPPoolMod:"HP";
//   FlatMPPoolMod:"MP";
//   FlatArmorMod:"Armor";
//   FlatSpellBlockMod:"MR";
//   FlatCritChanceMod:"Crit";
//   FlatMovementSpeedMod:"MS";
//   FlatAttackSpeedMod:"AS";
//   PercentAttackSpeedMod:"%AS";
//   PercentMovementSpeedMod:"%MS";
//   PercentSpellBlockMod:"%MR";
//   PercentArmorMod:"%Armor";
//   PercentCritChanceMod:"%Crit";
//   PercentHPPoolMod:"%HP";
//   PercentMPPoolMod:"%MP";
//   PercentLifeStealMod:"%LS";

//   PercentSpellVampMod:"%SV";
//   FlatBlockMod:"Block";
//   PercentBlockMod:"%Block";
//   FlatEnergyRegenMod:"ER";
//   PercentEnergyRegenMod:"%ER";
//   FlatEnergyPoolMod:"EP";
//   PercentEnergyPoolMod:"%EP";
//   FlatCritDamageMod:"CD";
//   PercentCritDamageMod:"%CD";
//   FlatEXPBonus:"EXP";
//   PercentEXPBonus:"%EXP";
//   FlatHPPoolMod:"HP";

// };
//filter not in store ! and ornn upgrades with following fields :
// inStore: boolean;
// requiredAlly: string;

// type stats = {
//   hp: number;
//   ad: number;
//   ap: number;
//   as: number;
//   // cdr: number; //ability haste not in stats
//   mr: number;
//   armor: number;
//   ms: number;
// };

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
