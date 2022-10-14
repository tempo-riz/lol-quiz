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

export { champion, spell, skin };
