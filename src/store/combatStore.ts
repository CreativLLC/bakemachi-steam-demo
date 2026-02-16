import { create } from 'zustand';
import { useGameStore } from './gameStore';

export type MiniGameType = 'vocab_quiz' | 'quick_match' | 'word_scramble';
export type TimerTier = 'fast' | 'medium' | 'slow' | 'miss';
export type CombatPhase =
  | 'intro'           // Enemy appears, brief message
  | 'action-select'   // Player picks mini-game or item
  | 'mini-game'       // Mini-game is active
  | 'player-result'   // Show damage dealt
  | 'enemy-turn'      // Enemy attacks
  | 'victory'         // Player won
  | 'defeat';         // Player lost

export interface CombatEnemy {
  id: string;
  name: string;         // Japanese name
  nameEn: string;       // English name (for display)
  spriteBase: string;   // Path to LPC standard/ directory (e.g. '/assets/sprites/NPCs/enemies/skeleton-basic/standard')
  hp: number;
  attack: number;       // Damage per hit to player
  yenReward: number;
  xpReward: number;
  battleDialogue: string[];  // Random things enemy says
  npcSpriteBase?: string;  // Original NPC sprite path for post-victory transform effect
}

export interface CombatLogEntry {
  text: string;
  type: 'info' | 'player-action' | 'enemy-action' | 'damage' | 'heal' | 'important';
}

interface CombatState {
  isActive: boolean;
  isRandomEncounter: boolean;
  enemy: CombatEnemy | null;
  enemyHp: number;
  enemyMaxHp: number;
  playerHp: number;
  playerMaxHp: number;
  phase: CombatPhase;
  currentRound: number;

  // Mini-game
  selectedMiniGame: MiniGameType | null;
  currentWeakness: MiniGameType;  // Random each round

  // Result display
  lastTier: TimerTier | null;
  lastDamageDealt: number;
  lastDamageTaken: number;

  // Combat log
  combatLog: CombatLogEntry[];

  // Actions
  startCombat: (enemy: CombatEnemy, isRandomEncounter?: boolean) => void;
  endCombat: () => void;
  finishIntro: () => void;
  selectMiniGame: (type: MiniGameType) => void;
  completeMiniGame: (tier: TimerTier) => void;
  useItem: (healAmount: number, itemName: string) => void;
  startEnemyTurn: () => void;
  finishEnemyTurn: () => void;
  finishPlayerResult: () => void;
}

// Damage calculation
const BASE_DAMAGE = 25;
const TIER_MULTIPLIERS: Record<TimerTier, number> = {
  fast: 1.5,
  medium: 1.0,
  slow: 0.5,
  miss: 0,
};
const WEAKNESS_BONUS = 1.5;

function randomWeakness(): MiniGameType {
  const types: MiniGameType[] = ['vocab_quiz', 'quick_match', 'word_scramble'];
  return types[Math.floor(Math.random() * types.length)];
}

function addLog(logs: CombatLogEntry[], text: string, type: CombatLogEntry['type']): CombatLogEntry[] {
  return [...logs, { text, type }];
}

export const useCombatStore = create<CombatState>((set, get) => ({
  isActive: false,
  isRandomEncounter: false,
  enemy: null,
  enemyHp: 0,
  enemyMaxHp: 0,
  playerHp: 100,
  playerMaxHp: 100,
  phase: 'intro',
  currentRound: 1,
  selectedMiniGame: null,
  currentWeakness: 'vocab_quiz',
  lastTier: null,
  lastDamageDealt: 0,
  lastDamageTaken: 0,
  combatLog: [],

  startCombat: (enemy, isRandomEncounter) => {
    const level = useGameStore.getState().level;
    const maxHp = 100 + (level - 1) * 10;
    set({
      isActive: true,
      isRandomEncounter: isRandomEncounter ?? false,
      enemy,
      enemyHp: enemy.hp,
      enemyMaxHp: enemy.hp,
      playerHp: maxHp,
      playerMaxHp: maxHp,
      phase: 'intro',
      currentRound: 1,
      selectedMiniGame: null,
      currentWeakness: randomWeakness(),
      lastTier: null,
      lastDamageDealt: 0,
      lastDamageTaken: 0,
      combatLog: [{ text: `${enemy.name}が現れた！`, type: 'important' }],
    });
  },

  endCombat: () => set({
    isActive: false,
    isRandomEncounter: false,
    enemy: null,
    phase: 'intro',
    combatLog: [],
    selectedMiniGame: null,
  }),

  finishIntro: () => set({ phase: 'action-select' }),

  selectMiniGame: (type) => set({ selectedMiniGame: type, phase: 'mini-game' }),

  completeMiniGame: (tier) => {
    const { enemy, currentWeakness, selectedMiniGame, enemyHp } = get();
    if (!enemy) return;

    const isWeak = selectedMiniGame === currentWeakness;
    const tierMult = TIER_MULTIPLIERS[tier];
    const weakMult = isWeak ? WEAKNESS_BONUS : 1;
    const damage = Math.round(BASE_DAMAGE * tierMult * weakMult);
    const newEnemyHp = Math.max(0, enemyHp - damage);

    const tierLabels: Record<TimerTier, string> = {
      fast: 'すばらしい！',    // Wonderful!
      medium: 'よし！',        // Good!
      slow: 'おそい...',       // Slow...
      miss: 'ミス！',          // Miss!
    };

    let logs = get().combatLog;
    logs = addLog(logs, tierLabels[tier], tier === 'fast' ? 'important' : tier === 'miss' ? 'enemy-action' : 'info');
    if (damage > 0) {
      const weakText = isWeak ? ' (弱点！)' : '';
      logs = addLog(logs, `${damage}ダメージ！${weakText}`, 'damage');
    }

    if (newEnemyHp <= 0) {
      logs = addLog(logs, `${enemy.name}を倒した！`, 'important');
    }

    // Always go through player-result so the attack animation plays
    set({
      enemyHp: Math.max(0, newEnemyHp),
      phase: 'player-result',
      lastTier: tier,
      lastDamageDealt: damage,
      combatLog: logs,
    });
  },

  useItem: (healAmount, itemName) => {
    const { playerHp, playerMaxHp } = get();
    const healed = Math.min(healAmount, playerMaxHp - playerHp);
    const newHp = playerHp + healed;

    let logs = get().combatLog;
    logs = addLog(logs, `${itemName}を使った！ HP+${healed}`, 'heal');

    set({
      playerHp: newHp,
      combatLog: logs,
      phase: 'enemy-turn',
    });
  },

  finishPlayerResult: () => {
    // If enemy is dead, go to victory instead of enemy turn
    if (get().enemyHp <= 0) {
      set({ phase: 'victory' });
    } else {
      set({ phase: 'enemy-turn' });
    }
  },

  startEnemyTurn: () => {
    const { enemy, playerHp } = get();
    if (!enemy) return;

    // Damage variance: 0.8x to 1.2x
    const variance = 0.8 + Math.random() * 0.4;
    const damage = Math.round(enemy.attack * variance);
    const newPlayerHp = Math.max(0, playerHp - damage);

    let logs = get().combatLog;

    // 30% chance for battle dialogue
    if (Math.random() < 0.3 && enemy.battleDialogue.length > 0) {
      const line = enemy.battleDialogue[Math.floor(Math.random() * enemy.battleDialogue.length)];
      logs = addLog(logs, `「${line}」`, 'enemy-action');
    }

    logs = addLog(logs, `${enemy.name}の攻撃！ ${damage}ダメージ！`, 'enemy-action');

    if (newPlayerHp <= 0) {
      logs = addLog(logs, 'やられた...！', 'important');
      set({
        playerHp: 0,
        lastDamageTaken: damage,
        phase: 'defeat',
        combatLog: logs,
      });
      return;
    }

    set({
      playerHp: newPlayerHp,
      lastDamageTaken: damage,
      combatLog: logs,
    });
  },

  finishEnemyTurn: () => {
    // Next round: new random weakness
    set((s) => ({
      phase: 'action-select',
      currentRound: s.currentRound + 1,
      currentWeakness: randomWeakness(),
      selectedMiniGame: null,
      lastTier: null,
      lastDamageDealt: 0,
      lastDamageTaken: 0,
    }));
  },
}));
