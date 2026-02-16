export interface FoodMenuItem {
  id: string;
  /** Links to vocabulary word ID in vocabularyDB */
  wordId: string;
  /** Image path relative to public/ */
  image: string;
  /** Price in yen (flavor only) */
  price: number;
}

export interface FoodMenu {
  id: string;
  title: string;
  items: FoodMenuItem[];
}

export const FOOD_MENUS: Record<string, FoodMenu> = {
  vending_machine: {
    id: 'vending_machine',
    title: 'じどうはんばいき',
    items: [
      {
        id: 'ocha',
        wordId: 'w_ocha',
        image: 'assets/sprites/objects/food/ocha.png',
        price: 150,
      },
      {
        id: 'koohii',
        wordId: 'w_koohii',
        image: 'assets/sprites/objects/food/coffee.png',
        price: 130,
      },
      {
        id: 'juusu',
        wordId: 'w_juusu',
        image: 'assets/sprites/objects/food/juice.png',
        price: 160,
      },
    ],
  },
  food_stall: {
    id: 'food_stall',
    title: 'やたい',
    items: [
      {
        id: 'yakitori',
        wordId: 'w_yakitori',
        image: 'assets/sprites/objects/food/yakitori.png',
        price: 200,
      },
      {
        id: 'onigiri',
        wordId: 'w_onigiri',
        image: 'assets/sprites/objects/food/onigiri.png',
        price: 150,
      },
      {
        id: 'taiyaki',
        wordId: 'w_taiyaki',
        image: 'assets/sprites/objects/food/taiyaki.png',
        price: 180,
      },
      {
        id: 'yakiguri',
        wordId: 'w_yakiguri',
        image: 'assets/sprites/objects/food/yakiguri.png',
        price: 300,
      },
    ],
  },
};
