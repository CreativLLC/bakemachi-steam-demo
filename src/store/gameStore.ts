import { create } from 'zustand';

interface GameState {
  currentScene: string;
  currentMap: string;
  playerPosition: { x: number; y: number };
  chapter: number;
  yen: number;
  xp: number;
  level: number;
  energy: number;
  maxEnergy: number;
  questStates: Record<string, string>;
  titleNewGameClicked: boolean;
  setCurrentScene: (scene: string) => void;
  setCurrentMap: (map: string) => void;
  setPlayerPosition: (x: number, y: number) => void;
  setChapter: (chapter: number) => void;
  setYen: (yen: number) => void;
  spendYen: (amount: number) => boolean;
  addXp: (amount: number) => void;
  drainEnergy: (amount: number) => void;
  setQuestState: (questId: string, state: string) => void;
  clickTitleNewGame: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  currentScene: 'BootScene',
  currentMap: 'tiled_train_station',
  playerPosition: { x: 7, y: 7 },
  chapter: 1,
  yen: 2000,
  xp: 0,
  level: 1,
  energy: 100,
  maxEnergy: 100,
  questStates: {},
  titleNewGameClicked: false,
  setCurrentScene: (scene) => set({ currentScene: scene }),
  setCurrentMap: (map) => set({ currentMap: map }),
  setPlayerPosition: (x, y) => set({ playerPosition: { x, y } }),
  setChapter: (chapter) => set({ chapter }),
  setYen: (yen) => set({ yen }),
  spendYen: (amount) => {
    const current = useGameStore.getState().yen;
    if (current < amount) return false;
    set({ yen: current - amount });
    return true;
  },
  addXp: (amount) =>
    set((prev) => {
      let xp = prev.xp + amount;
      let level = prev.level;
      let maxEnergy = prev.maxEnergy;
      while (xp >= level * 100) {
        xp -= level * 100;
        level++;
        maxEnergy += 5;
      }
      return { xp, level, maxEnergy };
    }),
  drainEnergy: (amount) => set((prev) => ({ energy: Math.max(0, prev.energy - amount) })),
  setQuestState: (questId, state) =>
    set((prev) => ({
      questStates: { ...prev.questStates, [questId]: state },
    })),
  clickTitleNewGame: () => set({ titleNewGameClicked: true }),
}));
