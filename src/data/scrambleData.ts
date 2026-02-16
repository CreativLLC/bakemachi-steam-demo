export interface ScrambleTile {
  text: string;
  /** Links to vocabulary word for tap-to-learn (optional for particles) */
  wordId?: string;
}

export interface ScrambleSentence {
  /** English translation shown as hint */
  hint: string;
  /** Tiles in CORRECT order — game shuffles them for the player */
  tiles: ScrambleTile[];
}

export interface ScrambleReward {
  itemId: string;
  itemName: string;
  itemImage: string;
  price: number;
  wordId?: string;
}

export interface ScrambleSet {
  id: string;
  sentences: ScrambleSentence[];
  reward: ScrambleReward;
  /** Quest state key to set when purchased (e.g. 'stationOmiyageBought') */
  questState?: string;
}

export const SCRAMBLE_SETS: Record<string, ScrambleSet> = {
  omiyage_shop: {
    id: 'omiyage_shop',
    questState: 'stationOmiyageBought',
    sentences: [
      {
        hint: 'Souvenir, please',
        tiles: [
          { text: 'おみやげ', wordId: 'w_omiyage' },
          { text: 'ください', wordId: 'w_kudasai' },
        ],
      },
      {
        hint: 'This one, please',
        tiles: [
          { text: 'これ', wordId: 'w_kore' },
          { text: 'を' },
          { text: 'ください', wordId: 'w_kudasai' },
        ],
      },
      {
        hint: "Sensei's souvenir",
        tiles: [
          { text: 'せんせい', wordId: 'w_sensei' },
          { text: 'の' },
          { text: 'おみやげ', wordId: 'w_omiyage' },
        ],
      },
    ],
    reward: {
      itemId: 'sensei_omiyage',
      itemName: 'おみやげ',
      itemImage: '/assets/sprites/objects/various/sensei-omiyage.png',
      price: 200,
      wordId: 'w_omiyage',
    },
  },
  sister_present: {
    id: 'sister_present',
    questState: 'stationSisterPresentBought',
    sentences: [
      {
        hint: 'A toy, please',
        tiles: [
          { text: 'おもちゃ', wordId: 'w_omocha' },
          { text: 'を' },
          { text: 'ください', wordId: 'w_kudasai' },
        ],
      },
      {
        hint: "My younger sister's souvenir",
        tiles: [
          { text: 'いもうと', wordId: 'w_imouto' },
          { text: 'の' },
          { text: 'おみやげ', wordId: 'w_omiyage' },
        ],
      },
      {
        hint: 'This one, please (polite)',
        tiles: [
          { text: 'これ', wordId: 'w_kore' },
          { text: 'を' },
          { text: 'おねがいします', wordId: 'w_onegaishimasu' },
        ],
      },
    ],
    reward: {
      itemId: 'pocket_creature',
      itemName: 'ポケットクリーチャー',
      itemImage: '/assets/sprites/objects/various/pocket-creature1.png',
      price: 400,
      wordId: 'w_omocha',
    },
  },
};
