import { create } from 'zustand';

interface SettingsState {
  textSpeed: 'slow' | 'normal' | 'fast';
  showTranslation: boolean;
  showFurigana: boolean;
  hideKanaModal: boolean;
  setTextSpeed: (speed: 'slow' | 'normal' | 'fast') => void;
  setShowTranslation: (show: boolean) => void;
  setShowFurigana: (show: boolean) => void;
  setHideKanaModal: (hide: boolean) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  textSpeed: 'normal',
  showTranslation: true,
  showFurigana: false,
  hideKanaModal: false,
  setTextSpeed: (textSpeed) => set({ textSpeed }),
  setShowTranslation: (showTranslation) => set({ showTranslation }),
  setShowFurigana: (showFurigana) => set({ showFurigana }),
  setHideKanaModal: (hideKanaModal) => set({ hideKanaModal }),
}));
