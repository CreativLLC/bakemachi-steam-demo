import type { CombatEnemy } from '../store/combatStore';

/** Timer configuration (milliseconds) — kept for backward compat */
export const TIMER_CONFIG = {
  totalMs: 10000,
  fastThreshold: 3000,
  mediumThreshold: 6500,
  slowThreshold: 9000,
};

export type Difficulty = 'off' | 'easy' | 'medium' | 'hard';

/** Per-minigame base timers (these are the "medium" difficulty values) */
export const GAME_TIMERS: Record<string, { totalMs: number; fastThreshold: number; mediumThreshold: number; slowThreshold: number }> = {
  vocab_quiz: {
    totalMs: 10000,
    fastThreshold: 3000,
    mediumThreshold: 6500,
    slowThreshold: 9000,
  },
  quick_match: {
    totalMs: 15000,
    fastThreshold: 5000,
    mediumThreshold: 10000,
    slowThreshold: 13500,
  },
  word_scramble: {
    totalMs: 20000,
    fastThreshold: 7000,
    mediumThreshold: 14000,
    slowThreshold: 18000,
  },
};

/** Difficulty multipliers applied to ALL timer values */
export const DIFFICULTY_MULTIPLIERS: Record<Difficulty, number> = {
  off: 1.0,
  easy: 1.5,
  medium: 1.0,
  hard: 0.7,
};

/** Get the full timer config for a specific mini-game at a given difficulty.
 *  When difficulty is 'off', returns totalMs: 0 to signal that the timer should be hidden. */
export function getGameTimer(gameType: 'vocab_quiz' | 'quick_match' | 'word_scramble', difficulty: Difficulty) {
  if (difficulty === 'off') {
    return { totalMs: 0, fastThreshold: 0, mediumThreshold: 0, slowThreshold: 0 };
  }
  const base = GAME_TIMERS[gameType];
  const mult = DIFFICULTY_MULTIPLIERS[difficulty];
  return {
    totalMs: Math.round(base.totalMs * mult),
    fastThreshold: Math.round(base.fastThreshold * mult),
    mediumThreshold: Math.round(base.mediumThreshold * mult),
    slowThreshold: Math.round(base.slowThreshold * mult),
  };
}

/** Mini-game labels for the action menu */
export const MINI_GAME_LABELS = {
  vocab_quiz: { jp: 'ことばクイズ', en: 'Vocab Quiz', icon: '📝' },
  quick_match: { jp: 'マッチング', en: 'Matching', icon: '🔗' },
  word_scramble: { jp: 'ならべかえ', en: 'Unscramble', icon: '🔀' },
} as const;

/** Tier display info */
export const TIER_INFO = {
  fast: { label: 'GREAT!', color: '#2a8a4e', jp: 'すばらしい！' },
  medium: { label: 'GOOD', color: '#d4af37', jp: 'よし！' },
  slow: { label: 'SLOW', color: '#c08a00', jp: 'おそい...' },
  miss: { label: 'MISS', color: '#c44', jp: 'ミス！' },
} as const;

/** Item healing values -- maps inventory item ID to HP restored */
export const ITEM_HEALING: Record<string, number> = {
  ocha: 15,
  koohii: 15,
  juusu: 15,
  yakitori: 30,
  onigiri: 25,
  taiyaki: 20,
  yakiguri: 40,
  sensei_omiyage: 20,
};

/** Player sprite base path (LPC standard directory) */
export const PLAYER_SPRITE_BASE = '/assets/sprites/new-main-character-lpc/standard';

/** First enemy: Cowlick-glasses NPC possessed */
export const COMBAT_ENEMIES: Record<string, CombatEnemy> = {
  cowlick_npc: {
    id: 'cowlick_npc',
    name: '化けメガネくん',
    nameEn: 'Possessed Glasses Guy',
    spriteBase: '/assets/sprites/NPCs/enemies/goblin2/standard',
    npcSpriteBase: '/assets/sprites/NPCs/generic/NPC4/standard',
    hp: 120,
    attack: 15,
    yenReward: 500,
    xpReward: 50,
    battleDialogue: [
      'にほんご...にほんご...！',
      'ことば...もっと...！',
      'うぅぅ...！',
    ],
  },
  station_ghost_1: {
    id: 'station_ghost_1',
    name: 'ゴースト',
    nameEn: 'Station Ghost',
    spriteBase: '/assets/sprites/NPCs/enemies/goblin2/standard',
    hp: 60,
    attack: 10,
    yenReward: 150,
    xpReward: 30,
    battleDialogue: ['...', 'にほんご...', '...！'],
  },
  station_ghost_2: {
    id: 'station_ghost_2',
    name: 'かげ',
    nameEn: 'Shadow',
    spriteBase: '/assets/sprites/NPCs/enemies/goblin2/standard',
    hp: 80,
    attack: 12,
    yenReward: 200,
    xpReward: 40,
    battleDialogue: ['ことば...', 'もっと...もっと...！', 'うぅ...！'],
  },
};

/** Registry of NPC prefixes eligible for random encounter disguises.
 *  These reference generic NPCs already loaded by BootScene's LPC_NPC_REGISTRY.
 *  The encounter system picks randomly from this pool. */
export const ENCOUNTER_NPC_REGISTRY: { prefix: string }[] = [
  { prefix: 'lpc-generic-16' },
  { prefix: 'lpc-generic-17' },
  { prefix: 'lpc-generic-18' },
  { prefix: 'lpc-generic-19' },
];

export interface EncounterConfig {
  enabled: boolean;
  enemies: string[];
  npcSprites: string[];
  minSteps: number;
  maxSteps: number;
}

export const MAP_ENCOUNTERS: Record<string, EncounterConfig> = {
  tiled_train_station: {
    enabled: false,
    enemies: ['station_ghost_1', 'station_ghost_2'],
    npcSprites: ['lpc-generic-16', 'lpc-generic-17', 'lpc-generic-18', 'lpc-generic-19'],
    minSteps: 15,
    maxSteps: 30,
  },
};
