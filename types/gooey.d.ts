export interface RawGooey {
  tokenID: number;
  name: string;
  description: string;
  image: string;
  attributes: Array<{ trait_type: string; value: any }>;
}

export interface FlatGooey {
  tokenID: number;
  name: string;
  description: string;
  image: string;
  [key: string]: any;
}

export interface Gooey {
  tokenID: number;
  name: string;
  description: string;
  image: string;
  generation: number;
  health: number;
  disposition: string;
  age: string;
  isAwake: boolean;
  isBuried: boolean;
  mitosisCredits: number;
  parentID: (number | null);
  body: (string | null);
  background: (string | null);
  sidekick: (string | null);
  accessory: (string | null);
  food: (string | null);
  wings: (string | null);
  weather: (string | null);
  cushion: (string | null);
  // inFlight: (string | null);
  freeSlot: (string | null);
  ethGobbled: number;

  last_update: number;
}