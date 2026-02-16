import { create } from 'zustand';
import { useGameStore } from './gameStore';

const ENERGY_PER_NEW_WORD = 2;

interface WordProgress {
  wordId: string;
  firstSeen: number;
  timesEncountered: number;
  timesTapped: number;
  lastSeen: number;
  mastery: 'new' | 'seen' | 'learning' | 'known';
  exportedToAnki: boolean;
}

interface VocabularyState {
  progress: Record<string, WordProgress>;
  markEncountered: (wordId: string) => void;
  markTapped: (wordId: string) => void;
  markExported: (wordId: string) => void;
  getProgress: (wordId: string) => WordProgress | undefined;
}

function computeMastery(encountered: number, tapped: number, _lastTapped: number): WordProgress['mastery'] {
  if (encountered === 0) return 'new';
  if (encountered <= 2) return 'seen';
  if (encountered >= 10 && tapped === 0) return 'known';
  return 'learning';
}

export const useVocabularyStore = create<VocabularyState>((set, get) => ({
  progress: {},
  markEncountered: (wordId) => {
    const isFirstEncounter = !get().progress[wordId];

    set((state) => {
      const existing = state.progress[wordId];
      const now = Date.now();
      const updated: WordProgress = existing
        ? {
            ...existing,
            timesEncountered: existing.timesEncountered + 1,
            lastSeen: now,
            mastery: computeMastery(
              existing.timesEncountered + 1,
              existing.timesTapped,
              existing.lastSeen
            ),
          }
        : {
            wordId,
            firstSeen: now,
            timesEncountered: 1,
            timesTapped: 0,
            lastSeen: now,
            mastery: 'seen',
            exportedToAnki: false,
          };
      return { progress: { ...state.progress, [wordId]: updated } };
    });

    if (isFirstEncounter) {
      const scene = useGameStore.getState().currentScene;
      if (scene !== 'TrainRideScene') {
        useGameStore.getState().drainEnergy(ENERGY_PER_NEW_WORD);
      }
    }
  },
  markTapped: (wordId) =>
    set((state) => {
      const existing = state.progress[wordId];
      if (!existing) return state;
      return {
        progress: {
          ...state.progress,
          [wordId]: {
            ...existing,
            timesTapped: existing.timesTapped + 1,
          },
        },
      };
    }),
  markExported: (wordId) =>
    set((state) => {
      const existing = state.progress[wordId];
      if (!existing) return state;
      return {
        progress: {
          ...state.progress,
          [wordId]: { ...existing, exportedToAnki: true },
        },
      };
    }),
  getProgress: (wordId) => get().progress[wordId],
}));
