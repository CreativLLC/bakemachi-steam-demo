import { create } from 'zustand';
import type { DialogueNode, Word } from '../japanese/types';
import { COMBAT_ENEMIES } from '../data/combatConfig';
import { useCombatStore } from './combatStore';

interface UIState {
  // Dialogue
  activeDialogue: DialogueNode | null;
  currentLineIndex: number;
  isDialogueActive: boolean;

  // Word popup (press-and-hold)
  wordPopup: { word: Word; x: number; y: number } | null;

  // Food selection menu
  activeFoodMenu: string | null;

  // Food matching mini-game
  activeMatchingGame: string | null;

  // Sentence scramble mini-game
  activeScrambleGame: string | null;

  // Reading comprehension mini-game
  activeReadingGame: string | null;

  // Tutorial
  tutorialComplete: boolean;

  // Yen + item notifications
  yenSpend: number | null;
  yenGain: number | null;
  itemToast: { name: string; image: string } | null;

  // Menu overlay
  activeMenu: 'inventory' | 'settings' | 'vocabbook' | 'status' | 'journal' | 'menu' | null;

  // Input mode
  inputMode: 'keyboard' | 'gamepad' | 'touch';

  // Dialogue focus — true when React has a focusable item selected (blocks OverworldScene advanceLine)
  dialogueFocusActive: boolean;

  // Chapter title card
  chapterTitle: { chapter: string; subtitle: string } | null;

  // Settings
  showRomaji: boolean;
  difficulty: 'off' | 'easy' | 'medium' | 'hard';

  // Actions
  startDialogue: (node: DialogueNode) => void;
  advanceLine: () => void;
  closeDialogue: () => void;
  showWordPopup: (word: Word, x: number, y: number) => void;
  hideWordPopup: () => void;
  openFoodMenu: (menuId: string) => void;
  closeFoodMenu: () => void;
  openMatchingGame: (menuId: string) => void;
  closeMatchingGame: () => void;
  openScrambleGame: (id: string) => void;
  closeScrambleGame: () => void;
  openReadingGame: (id: string) => void;
  closeReadingGame: () => void;
  completeTutorial: () => void;
  showYenSpend: (amount: number) => void;
  clearYenSpend: () => void;
  showYenGain: (amount: number) => void;
  clearYenGain: () => void;
  showItemToast: (name: string, image: string) => void;
  clearItemToast: () => void;
  openMenu: (menu: 'inventory' | 'settings' | 'vocabbook' | 'journal' | 'menu') => void;
  closeMenu: () => void;
  setInputMode: (mode: 'keyboard' | 'gamepad' | 'touch') => void;
  setDialogueFocusActive: (active: boolean) => void;
  setShowRomaji: (show: boolean) => void;
  setDifficulty: (d: 'off' | 'easy' | 'medium' | 'hard') => void;
  showChapterTitle: (chapter: string, subtitle: string) => void;
  hideChapterTitle: () => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  activeDialogue: null,
  currentLineIndex: 0,
  isDialogueActive: false,
  wordPopup: null,
  activeFoodMenu: null,
  activeMatchingGame: null,
  activeScrambleGame: null,
  activeReadingGame: null,
  tutorialComplete: false,
  yenSpend: null,
  yenGain: null,
  itemToast: null,
  chapterTitle: null,
  activeMenu: null,
  inputMode: 'keyboard',
  dialogueFocusActive: false,
  showRomaji: true,
  difficulty: 'medium',

  startDialogue: (node) =>
    set({
      activeDialogue: node,
      currentLineIndex: 0,
      isDialogueActive: true,
      wordPopup: null,
      dialogueFocusActive: false,
    }),

  advanceLine: () => {
    const { activeDialogue, currentLineIndex } = get();
    if (!activeDialogue) return;

    if (currentLineIndex < activeDialogue.lines.length - 1) {
      set({ currentLineIndex: currentLineIndex + 1, wordPopup: null });
    } else {
      // Last line — if choices exist, don't close (UI shows choice buttons)
      if (activeDialogue.choices && activeDialogue.choices.length > 0) return;

      // If there's a chained dialogue, start it instead of closing
      if (activeDialogue.nextDialogue) {
        set({
          activeDialogue: activeDialogue.nextDialogue,
          currentLineIndex: 0,
          wordPopup: null,
        });
        return;
      }

      // Close dialogue
      const combatTrigger = activeDialogue.combatTrigger;
      const menuTrigger = activeDialogue.menuTrigger;
      const scrambleTrigger = activeDialogue.scrambleTrigger;
      const readingTrigger = activeDialogue.readingTrigger;
      set({
        activeDialogue: null,
        currentLineIndex: 0,
        isDialogueActive: false,
        wordPopup: null,
      });

      // If this dialogue triggers combat, start it
      if (combatTrigger && COMBAT_ENEMIES[combatTrigger]) {
        setTimeout(() => {
          useCombatStore.getState().startCombat(COMBAT_ENEMIES[combatTrigger]);
        }, 300);
      }

      // If this dialogue triggers a food/drink menu, open it
      if (menuTrigger) {
        setTimeout(() => {
          get().openMatchingGame(menuTrigger);
        }, 300);
      }

      // If this dialogue triggers a scramble game, open it
      if (scrambleTrigger) {
        setTimeout(() => {
          get().openScrambleGame(scrambleTrigger);
        }, 300);
      }

      // If this dialogue triggers a reading game, open it
      if (readingTrigger) {
        setTimeout(() => {
          get().openReadingGame(readingTrigger);
        }, 300);
      }
    }
  },

  closeDialogue: () =>
    set({
      activeDialogue: null,
      currentLineIndex: 0,
      isDialogueActive: false,
      wordPopup: null,
      dialogueFocusActive: false,
    }),

  showWordPopup: (word, x, y) => set({ wordPopup: { word, x, y } }),
  hideWordPopup: () => set({ wordPopup: null }),
  openFoodMenu: (menuId) => set({ activeFoodMenu: menuId }),
  closeFoodMenu: () => set({ activeFoodMenu: null }),
  openMatchingGame: (menuId) => set({ activeMatchingGame: menuId }),
  closeMatchingGame: () => set({ activeMatchingGame: null }),
  openScrambleGame: (id) => set({ activeScrambleGame: id }),
  closeScrambleGame: () => set({ activeScrambleGame: null }),
  openReadingGame: (id) => set({ activeReadingGame: id }),
  closeReadingGame: () => set({ activeReadingGame: null }),
  completeTutorial: () => set({ tutorialComplete: true }),
  showYenSpend: (amount) => set({ yenSpend: amount }),
  clearYenSpend: () => set({ yenSpend: null }),
  showYenGain: (amount) => set({ yenGain: amount }),
  clearYenGain: () => set({ yenGain: null }),
  showItemToast: (name, image) => set({ itemToast: { name, image } }),
  clearItemToast: () => set({ itemToast: null }),
  openMenu: (menu) => set({ activeMenu: menu }),
  closeMenu: () => set({ activeMenu: null }),
  setInputMode: (mode) => set({ inputMode: mode }),
  setDialogueFocusActive: (active) => set({ dialogueFocusActive: active }),
  setShowRomaji: (show) => set({ showRomaji: show }),
  setDifficulty: (d) => set({ difficulty: d }),
  showChapterTitle: (chapter, subtitle) => set({ chapterTitle: { chapter, subtitle } }),
  hideChapterTitle: () => set({ chapterTitle: null }),
}));
