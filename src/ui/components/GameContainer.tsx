import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { createGameConfig } from '../../game/config';
import { DialogueBox } from './DialogueBox';
import { WordPopup } from './WordPopup';
import { CombatScreen } from './CombatScreen';
import { TrainTutorial } from './TrainTutorial';
import { TitleScreen } from './TitleScreen';
import { FoodSelectionMenu } from './FoodSelectionMenu';
import { FoodMatchingGame } from './FoodMatchingGame';
import { SentenceScramble } from './SentenceScramble';
import { ReadingGame } from './ReadingGame';
import { PlayerHUD } from './PlayerHUD';
import { ItemToast } from './ItemToast';
import { MenuBar } from './MenuBar';
import { QuestTracker } from './QuestTracker';
import { ChapterTitle } from './ChapterTitle';
import { GameMenu } from './GameMenu';
import { VirtualDPad } from './VirtualDPad';
import { useCombatStore } from '../../store/combatStore';
import { useGameStore } from '../../store/gameStore';
import { useUIStore } from '../../store/uiStore';

export function GameContainer() {
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isCombatActive = useCombatStore((s) => s.isActive);
  const currentScene = useGameStore((s) => s.currentScene);

  useEffect(() => {
    if (containerRef.current && !gameRef.current) {
      const config = createGameConfig('phaser-canvas');
      gameRef.current = new Phaser.Game(config);
    }

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []);

  // Auto-detect touch device on mount
  useEffect(() => {
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const hasCoarsePrimary = window.matchMedia('(pointer: coarse)').matches;
    if (isTouchDevice && hasCoarsePrimary) {
      useUIStore.getState().setInputMode('touch');
    }
  }, []);

  return (
    <div id="game-container">
      <style>{`
        #ui-overlay button:not(:disabled):hover {
          filter: brightness(1.15);
          transition: filter 0.1s ease;
        }
        #ui-overlay button:not(:disabled):active {
          filter: brightness(0.95);
          transform: scale(0.98);
          transition: filter 0.05s ease, transform 0.05s ease;
        }
        #ui-overlay [style*="cursor: pointer"]:hover {
          filter: brightness(1.1);
          transition: filter 0.1s ease;
        }
      `}</style>
      <div id="phaser-canvas" ref={containerRef} style={{
        // Hide the overworld canvas during combat
        visibility: isCombatActive ? 'hidden' : 'visible',
      }} />
      <div id="ui-overlay">
        <PlayerHUD />
        <ItemToast />
        <TitleScreen />
        <TrainTutorial />
        <DialogueBox />
        <WordPopup />
        <FoodSelectionMenu />
        <FoodMatchingGame />
        <SentenceScramble />
        <ReadingGame />
        <QuestTracker />
        <ChapterTitle />
        <VirtualDPad />
        <MenuBar />
        <GameMenu />
        <CombatScreen />
      </div>
    </div>
  );
}
