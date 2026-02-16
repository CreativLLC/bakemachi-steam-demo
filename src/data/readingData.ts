export interface ReadingPassage {
  japanese: string;
  english: string;
  isCorrect: boolean;
}

export interface ReadingChallenge {
  id: string;
  prompt: string;
  passages: ReadingPassage[];
  reward: {
    item: string;
    itemName: string;
    itemImage: string;
    cost: number;
  };
}

export const READING_CHALLENGES: Record<string, ReadingChallenge> = {
  postcard_grandma: {
    id: 'postcard_grandma',
    prompt: 'Pick the best postcard to send to Grandma \u2014 she wants to know you\'re doing well!',
    passages: [
      {
        japanese: 'げんき です！ だいじょうぶ です！',
        english: "I'm well! I'm doing fine!",
        isCorrect: true,
      },
      {
        japanese: 'おなか すいた！ たべもの ください！',
        english: "I'm hungry! Food please!",
        isCorrect: false,
      },
      {
        japanese: 'さようなら！ さようなら！',
        english: "Goodbye! Goodbye!",
        isCorrect: false,
      },
      {
        japanese: 'すみません... だいじょうぶ？',
        english: "Excuse me... are you okay?",
        isCorrect: false,
      },
    ],
    reward: {
      item: 'postcard',
      itemName: 'はがき',
      itemImage: '/assets/sprites/objects/various/postcard.png',
      cost: 150,
    },
  },
};
