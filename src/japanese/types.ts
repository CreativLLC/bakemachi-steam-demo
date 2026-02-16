export type PartOfSpeech =
  | 'noun'
  | 'verb-ichidan'
  | 'verb-godan'
  | 'i-adjective'
  | 'na-adjective'
  | 'adverb'
  | 'particle'
  | 'counter'
  | 'expression'
  | 'conjunction'
  | 'pronoun';

export interface Word {
  id: string;
  kanji: string;
  kana: string;
  romaji: string;
  meaning: string;
  jlptLevel: 5 | 4 | 3 | 2 | 1;
  partOfSpeech: PartOfSpeech;
  tags: string[];
  /** When in the game's progression this word upgrades from kana to kanji display.
   *  1 = show kanji from the start, 2 = after chapter 1, 3 = after chapter 2, etc.
   *  Words with introductionLevel > player's current chapter display in kana form. */
  introductionLevel: number;
  exampleSentence?: {
    japanese: string;
    english: string;
  };
}

export interface GrammarPattern {
  id: string;
  name: string;
  jlptLevel: 5 | 4 | 3 | 2 | 1;
  explanation: string;
  structure: string;
  examples: {
    japanese: string;
    english: string;
  }[];
  prerequisiteGrammar: string[];
  chapter: number;
}

export interface TextSegment {
  text: string;
  wordId?: string;
  type: 'word' | 'particle' | 'grammar' | 'punctuation';
}

export interface DialogueLine {
  japanese: string;
  english: string;
  segments: TextSegment[];
}

export interface DialogueChoice {
  japanese: string;
  english: string;
  segments: TextSegment[];
  leadsTo: string;
  requiredWords?: string[];
  /** If set, this choice is part of a quiz — true = correct answer, false = wrong */
  isCorrect?: boolean;
}

export interface DialogueNode {
  id: string;
  speaker: string;
  speakerPortrait?: string;
  /** If set, the speaker name is tappable and links to this vocabulary word */
  speakerWordId?: string;
  lines: DialogueLine[];
  choices?: DialogueChoice[];
  next?: string;
  conditions?: { type: string; value: string }[];
  /** If set, triggers combat with this enemy ID after dialogue ends */
  combatTrigger?: string;
  /** If set, opens a food/drink selection menu after dialogue ends */
  menuTrigger?: string;
  /** If set, opens a sentence scramble game after dialogue ends */
  scrambleTrigger?: string;
  /** If set, opens a reading comprehension game after dialogue ends */
  readingTrigger?: string;
  /** If set, this dialogue node is a quiz — value is used as quest state key for first-try tracking */
  quizId?: string;
  /** Yen bonus for first-try correct answer (default 0) */
  quizBonus?: number;
  /** If set, this dialogue starts immediately after the current one ends (speaker change mid-scene) */
  nextDialogue?: DialogueNode;
}

export interface WordProgress {
  wordId: string;
  firstSeen: number;
  timesEncountered: number;
  timesTapped: number;
  lastSeen: number;
  mastery: 'new' | 'seen' | 'learning' | 'known';
  exportedToAnki: boolean;
}
