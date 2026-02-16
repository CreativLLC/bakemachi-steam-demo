import type { DialogueLine } from '../japanese/types';

export interface RevealOption {
  wordId: string;
  label: string;
  correct: boolean;
}

export interface BakemonoEnemy {
  id: string;
  name: string;
  trueIdentityWordId: string;
  spriteColor: number;
  hp: number;
  attack: number;
  defense: number;
  expReward: number;
  clues: DialogueLine[];
  revealOptions: RevealOption[];
  combatDialogue: DialogueLine[];
  /** Damage multiplier when stunned (attacks during stun window) */
  stunDamageMultiplier: number;
  /** Percentage of max HP dealt as bonus damage on correct reveal (0-1) */
  revealDamagePercent: number;
}

export const ENEMIES: Record<string, BakemonoEnemy> = {
  bakemono_clerk: {
    id: 'bakemono_clerk',
    name: '化けコンビニ店員',
    trueIdentityWordId: 'w_ten_in',
    spriteColor: 0xcc3333,
    hp: 60,
    attack: 8,
    defense: 3,
    expReward: 25,
    stunDamageMultiplier: 2,
    revealDamagePercent: 0.4,
    clues: [
      {
        japanese: 'コンビニにいます。',
        english: 'It is at the convenience store.',
        segments: [
          { text: 'コンビニ', wordId: 'w_konbini', type: 'word' },
          { text: 'に', type: 'particle' },
          { text: 'います。', type: 'grammar' },
        ],
      },
      {
        japanese: '「いらっしゃいませ！」',
        english: '"Welcome!"',
        segments: [
          { text: '「いらっしゃいませ！」', type: 'grammar' },
        ],
      },
    ],
    revealOptions: [
      { wordId: 'w_ten_in', label: '店員', correct: true },
      { wordId: 'w_sensei', label: '先生', correct: false },
      { wordId: 'w_gakusei', label: '学生', correct: false },
      { wordId: 'w_kodomo', label: '子供', correct: false },
    ],
    combatDialogue: [
      {
        japanese: 'いらっしゃいませ...！',
        english: 'Welcome...!',
        segments: [
          { text: 'いらっしゃいませ...！', type: 'grammar' },
        ],
      },
      {
        japanese: '弁当！弁当！',
        english: 'Bento! Bento!',
        segments: [
          { text: '弁当', wordId: 'w_bentou', type: 'word' },
          { text: '！', type: 'punctuation' },
          { text: '弁当', wordId: 'w_bentou', type: 'word' },
          { text: '！', type: 'punctuation' },
        ],
      },
    ],
  },

  bakemono_student: {
    id: 'bakemono_student',
    name: '化け学生',
    trueIdentityWordId: 'w_gakusei',
    spriteColor: 0x9933cc,
    hp: 45,
    attack: 10,
    defense: 2,
    expReward: 20,
    stunDamageMultiplier: 2,
    revealDamagePercent: 0.4,
    clues: [
      {
        japanese: '学校にいます。',
        english: 'It is at the school.',
        segments: [
          { text: '学校', wordId: 'w_gakkou', type: 'word' },
          { text: 'に', type: 'particle' },
          { text: 'います。', type: 'grammar' },
        ],
      },
      {
        japanese: '本があります。',
        english: 'It has books.',
        segments: [
          { text: '本', type: 'grammar' },
          { text: 'が', type: 'particle' },
          { text: 'あります。', type: 'grammar' },
        ],
      },
    ],
    revealOptions: [
      { wordId: 'w_gakusei', label: '学生', correct: true },
      { wordId: 'w_sensei', label: '先生', correct: false },
      { wordId: 'w_ten_in', label: '店員', correct: false },
      { wordId: 'w_tomodachi', label: '友達', correct: false },
    ],
    combatDialogue: [
      {
        japanese: 'テスト！テスト！',
        english: 'Tests! Tests!',
        segments: [
          { text: 'テスト！テスト！', type: 'grammar' },
        ],
      },
      {
        japanese: '先生...！',
        english: 'Teacher...!',
        segments: [
          { text: '先生', wordId: 'w_sensei', type: 'word' },
          { text: '...！', type: 'punctuation' },
        ],
      },
    ],
  },

  bakemono_shadow: {
    id: 'bakemono_shadow',
    name: '公園のかげ',
    trueIdentityWordId: 'w_kodomo',
    spriteColor: 0x333366,
    hp: 80,
    attack: 12,
    defense: 5,
    expReward: 35,
    stunDamageMultiplier: 2,
    revealDamagePercent: 0.4,
    clues: [
      {
        japanese: '小さいです。',
        english: 'It is small.',
        segments: [
          { text: '小さい', wordId: 'w_chiisai', type: 'word' },
          { text: 'です。', type: 'grammar' },
        ],
      },
      {
        japanese: '公園にいます。',
        english: 'It is at the park.',
        segments: [
          { text: '公園', wordId: 'w_kouen', type: 'word' },
          { text: 'に', type: 'particle' },
          { text: 'います。', type: 'grammar' },
        ],
      },
    ],
    revealOptions: [
      { wordId: 'w_kodomo', label: '子供', correct: true },
      { wordId: 'w_bakemono', label: '化け物', correct: false },
      { wordId: 'w_gakusei', label: '学生', correct: false },
      { wordId: 'w_rinjin', label: '隣人', correct: false },
    ],
    combatDialogue: [
      {
        japanese: 'うわああ！',
        english: 'WAAH!',
        segments: [
          { text: 'うわああ！', type: 'grammar' },
        ],
      },
      {
        japanese: 'ここ...こわい...！',
        english: 'Here... scary...!',
        segments: [
          { text: 'ここ', wordId: 'w_koko', type: 'word' },
          { text: '...こわい...！', type: 'grammar' },
        ],
      },
    ],
  },
};
