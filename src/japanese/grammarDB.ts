import type { GrammarPattern } from './types';

export const GRAMMAR_PATTERNS: GrammarPattern[] = [
  // ──────────────────────────────────────────────
  //  Chapter 1  —  JLPT N5 Foundations
  // ──────────────────────────────────────────────

  {
    id: 'g_desu',
    name: 'XはYです',
    jlptLevel: 5,
    chapter: 1,
    structure: 'Noun は Noun/Adjective です',
    explanation:
      'The most basic Japanese sentence pattern. は (wa) marks the topic ' +
      'of the sentence, and です (desu) is the polite copula meaning ' +
      '"is/am/are." Use this to identify things, describe attributes, ' +
      'or state facts. です makes the sentence polite — dropping it ' +
      'produces casual speech.',
    examples: [
      {
        japanese: '私は学生です。',
        english: 'I am a student.',
      },
      {
        japanese: 'コンビニは近いです。',
        english: 'The convenience store is close.',
      },
      {
        japanese: 'ここは化け町です。',
        english: 'This place is Bakemachi.',
      },
    ],
    prerequisiteGrammar: [],
  },

  {
    id: 'g_arimasu',
    name: 'があります / がいます',
    jlptLevel: 5,
    chapter: 1,
    structure: 'Noun が あります / います',
    explanation:
      'Expresses the existence or presence of something. が (ga) marks ' +
      'the subject that exists. Use あります (arimasu) for inanimate ' +
      'objects, plants, and abstract things. Use います (imasu) for ' +
      'living, animate beings such as people and animals. Both are the ' +
      'polite present-tense forms.',
    examples: [
      {
        japanese: 'コンビニがあります。',
        english: 'There is a convenience store.',
      },
      {
        japanese: '友達がいます。',
        english: 'I have a friend.',
      },
      {
        japanese: '公園に猫がいます。',
        english: 'There is a cat in the park.',
      },
    ],
    prerequisiteGrammar: [],
  },

  {
    id: 'g_wo',
    name: 'を + verb',
    jlptLevel: 5,
    chapter: 1,
    structure: 'Noun を Verb',
    explanation:
      'The particle を (wo/o) marks the direct object of a transitive ' +
      'verb — the thing that receives the action. It comes directly ' +
      'after the noun being acted upon and before the verb. This is one ' +
      'of the most frequently used particles in Japanese.',
    examples: [
      {
        japanese: '弁当を食べる。',
        english: 'Eat a bento.',
      },
      {
        japanese: '水を買う。',
        english: 'Buy water.',
      },
      {
        japanese: '日本語を勉強する。',
        english: 'Study Japanese.',
      },
    ],
    prerequisiteGrammar: [],
  },

  {
    id: 'g_ni_he',
    name: 'に/へ + movement verb',
    jlptLevel: 5,
    chapter: 1,
    structure: 'Place に/へ Verb',
    explanation:
      'The particles に (ni) and へ (e) indicate the direction or ' +
      'destination of a movement verb such as 行く (iku, to go), ' +
      '来る (kuru, to come), or 帰る (kaeru, to return). に emphasizes ' +
      'the arrival point, while へ emphasizes the direction of movement. ' +
      'In everyday speech they are largely interchangeable.',
    examples: [
      {
        japanese: '駅に行く。',
        english: 'Go to the station.',
      },
      {
        japanese: '学校へ来る。',
        english: 'Come to school.',
      },
      {
        japanese: '家に帰る。',
        english: 'Go home.',
      },
    ],
    prerequisiteGrammar: [],
  },

  {
    id: 'g_no',
    name: 'の (possession / connection)',
    jlptLevel: 5,
    chapter: 1,
    structure: 'Noun の Noun',
    explanation:
      'The particle の (no) connects two nouns, most commonly to show ' +
      "possession (similar to English 's or 'of'), but also to express " +
      'association, origin, or description. The first noun modifies or ' +
      'narrows the meaning of the second noun.',
    examples: [
      {
        japanese: '私の友達。',
        english: 'My friend.',
      },
      {
        japanese: '駅の近く。',
        english: 'Near the station.',
      },
      {
        japanese: '日本語の本。',
        english: 'A Japanese-language book.',
      },
    ],
    prerequisiteGrammar: [],
  },

  {
    id: 'g_ka',
    name: 'か (question marker)',
    jlptLevel: 5,
    chapter: 1,
    structure: 'Sentence + か',
    explanation:
      'Adding か (ka) to the end of a sentence turns it into a ' +
      'yes/no question. In polite speech, か replaces the period. ' +
      'It can also follow question words like 何 (nani, what), ' +
      'どこ (doko, where), and いつ (itsu, when) to form ' +
      'information questions.',
    examples: [
      {
        japanese: 'これは何ですか？',
        english: 'What is this?',
      },
      {
        japanese: '大丈夫ですか？',
        english: 'Are you okay?',
      },
      {
        japanese: 'トイレはどこですか？',
        english: 'Where is the restroom?',
      },
    ],
    prerequisiteGrammar: [],
  },

  {
    id: 'g_tekudasai',
    name: 'てください (polite request)',
    jlptLevel: 5,
    chapter: 1,
    structure: 'Verb-て form + ください',
    explanation:
      'Attach ください (kudasai) to the て-form (te-form) of a verb to ' +
      'make a polite request meaning "please do ~." This is the standard ' +
      'way to ask someone to do something in polite Japanese. The ' +
      'て-form itself varies depending on verb conjugation group.',
    examples: [
      {
        japanese: '見てください。',
        english: 'Please look.',
      },
      {
        japanese: '助けてください。',
        english: 'Please help.',
      },
      {
        japanese: 'ここに来てください。',
        english: 'Please come here.',
      },
    ],
    prerequisiteGrammar: ['g_wo'],
  },
];

export function getGrammar(id: string): GrammarPattern | undefined {
  return GRAMMAR_PATTERNS.find((g) => g.id === id);
}

export function getGrammarByChapter(chapter: number): GrammarPattern[] {
  return GRAMMAR_PATTERNS.filter((g) => g.chapter === chapter);
}
