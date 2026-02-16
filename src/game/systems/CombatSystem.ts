// Combat system - expanded in Phase 6
export interface CombatState {
  playerHp: number;
  playerMp: number;
  enemyHp: number;
  turn: 'player' | 'enemy';
  log: string[];
}
