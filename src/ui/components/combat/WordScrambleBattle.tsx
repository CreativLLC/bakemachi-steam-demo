import { useState, useEffect, useRef, useCallback } from 'react';
import { getGameTimer } from '../../../data/combatConfig';
import { UI, UI_FONT, UI_FONT_BOLD, PANELS } from '../../pixelTheme';
import { PixelPanel } from '../PixelPanel';
import { CombatTimer, getTierFromElapsed } from './CombatTimer';
import { getRandomLearnedWords } from './getLearnedWords';
import { useInputAction } from '../../hooks/useInputAction';
import { useUIStore } from '../../../store/uiStore';
import type { TimerTier } from '../../../store/combatStore';
import type { Word } from '../../../japanese/types';

const SCRAMBLE_STYLES = `
@keyframes scramble-correct {
  0% { background: rgba(42, 138, 78, 0.0); }
  50% { background: rgba(42, 138, 78, 0.3); }
  100% { background: rgba(42, 138, 78, 0.1); }
}
`;

interface WordScrambleBattleProps {
  onComplete: (tier: TimerTier) => void;
}

/** Fisher-Yates shuffle */
function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Split kana string into individual characters */
function splitKana(kana: string): string[] {
  return [...kana];
}

/** Shuffle chars, ensuring they're not in the original order (if possible) */
function scrambleChars(chars: string[]): string[] {
  if (chars.length <= 1) return [...chars];

  // Try up to 10 times to get a different order
  for (let attempt = 0; attempt < 10; attempt++) {
    const shuffled = shuffle(chars);
    const isSame = shuffled.every((c, i) => c === chars[i]);
    if (!isSame) return shuffled;
  }
  // Fallback: reverse
  return [...chars].reverse();
}

const GAMEPAD_FOCUS_STYLE: React.CSSProperties = {
  border: '3px solid #d4af37',
  background: 'rgba(212, 175, 55, 0.2)',
  animation: 'gamepad-focus-pulse 1s ease-in-out infinite',
};

export function WordScrambleBattle({ onComplete }: WordScrambleBattleProps) {
  const [targetWord, setTargetWord] = useState<Word | null>(null);
  const [scrambledChars, setScrambledChars] = useState<string[]>([]);
  const [builtChars, setBuiltChars] = useState<string[]>([]);
  const [availableIndices, setAvailableIndices] = useState<Set<number>>(new Set());
  const [isRunning, setIsRunning] = useState(false);
  const [completedAt, setCompletedAt] = useState<number | undefined>(undefined);
  const [isCorrect, setIsCorrect] = useState(false);
  const startTimeRef = useRef<number>(0);
  const inputMode = useUIStore((s) => s.inputMode);
  const isGamepad = inputMode === 'gamepad';
  const [cursorIndex, setCursorIndex] = useState(0);
  const difficulty = useUIStore((s) => s.difficulty);
  const timerConfig = getGameTimer('word_scramble', difficulty);

  // Initialize on mount
  useEffect(() => {
    const words = getRandomLearnedWords(1);
    if (words.length < 1) return;

    const word = words[0];
    const chars = splitKana(word.kana);
    const scrambled = scrambleChars(chars);

    setTargetWord(word);
    setScrambledChars(scrambled);
    setBuiltChars([]);
    setAvailableIndices(new Set(scrambled.map((_, i) => i)));
    startTimeRef.current = Date.now();
    setIsRunning(true);
  }, []);

  const handleTimerComplete = useCallback((tier: TimerTier) => {
    if (completedAt != null) return;
    setIsRunning(false);
    onComplete(tier);
  }, [completedAt, onComplete]);

  // Handle clicking a scrambled character to add it to the build
  const handleCharClick = useCallback((index: number) => {
    if (completedAt != null || !availableIndices.has(index) || !targetWord) return;

    const char = scrambledChars[index];
    const newBuilt = [...builtChars, char];
    const newAvailable = new Set(availableIndices);
    newAvailable.delete(index);

    setBuiltChars(newBuilt);
    setAvailableIndices(newAvailable);

    // Check if the word is complete
    const builtString = newBuilt.join('');
    if (builtString === targetWord.kana) {
      const elapsed = Date.now() - startTimeRef.current;
      // If timer is off, always grade as 'fast'
      const tier = timerConfig.totalMs === 0 ? 'fast' : getTierFromElapsed(elapsed, timerConfig);
      setCompletedAt(elapsed);
      setIsRunning(false);
      setIsCorrect(true);
      setTimeout(() => onComplete(tier), 500);
    }
  }, [completedAt, availableIndices, scrambledChars, builtChars, targetWord, onComplete, timerConfig]);

  // Handle clicking a built character to remove it (undo)
  const handleBuiltClick = useCallback((builtIndex: number) => {
    if (completedAt != null) return;

    const charToRemove = builtChars[builtIndex];

    // Find the original scrambled index for this character
    // We need to find which scrambled index was used for this built char
    // Walk through used indices in order to find the right one
    const usedIndices: number[] = [];
    const tempAvailable = new Set(scrambledChars.map((_, i) => i));

    for (let i = 0; i < builtChars.length; i++) {
      // Find the first available index matching this char
      for (const idx of tempAvailable) {
        if (scrambledChars[idx] === builtChars[i]) {
          usedIndices.push(idx);
          tempAvailable.delete(idx);
          break;
        }
      }
    }

    const originalIndex = usedIndices[builtIndex];
    if (originalIndex == null) return;

    // Remove the char from built and add its index back to available
    const newBuilt = [...builtChars];
    newBuilt.splice(builtIndex, 1);

    const newAvailable = new Set(availableIndices);
    newAvailable.add(originalIndex);

    setBuiltChars(newBuilt);
    setAvailableIndices(newAvailable);
  }, [completedAt, builtChars, scrambledChars, availableIndices]);

  const gamepadActive = completedAt == null && scrambledChars.length > 0;

  // Find next available index in a direction
  const findNextAvailable = useCallback((from: number, direction: 1 | -1): number => {
    const len = scrambledChars.length;
    if (availableIndices.size === 0) return from;
    let idx = from;
    for (let i = 0; i < len; i++) {
      idx = ((idx + direction) % len + len) % len;
      if (availableIndices.has(idx)) return idx;
    }
    return from;
  }, [scrambledChars.length, availableIndices]);

  useInputAction('navigate_left', () => {
    setCursorIndex((i) => findNextAvailable(i, -1));
  }, gamepadActive);

  useInputAction('navigate_right', () => {
    setCursorIndex((i) => findNextAvailable(i, 1));
  }, gamepadActive);

  useInputAction('confirm', () => {
    if (availableIndices.has(cursorIndex)) {
      handleCharClick(cursorIndex);
    }
  }, gamepadActive);

  // B button = undo last placed character
  useInputAction('cancel', () => {
    if (builtChars.length > 0) {
      handleBuiltClick(builtChars.length - 1);
    }
  }, gamepadActive);

  if (!targetWord || scrambledChars.length === 0) {
    return null;
  }

  const totalChars = scrambledChars.length;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 8,
      width: '100%',
    }}>
      <style>{SCRAMBLE_STYLES}</style>

      {/* Title */}
      <div style={{
        textAlign: 'center',
        fontFamily: UI_FONT,
        fontSize: 13,
        color: UI.textMuted,
      }}>
        Unscramble the word
      </div>

      {/* Timer (hidden when difficulty is 'off') */}
      {timerConfig.totalMs > 0 && (
        <CombatTimer
          totalMs={timerConfig.totalMs}
          onComplete={handleTimerComplete}
          isRunning={isRunning}
          completedAt={completedAt}
        />
      )}

      {/* English hint */}
      <div style={{
        textAlign: 'center',
        fontFamily: UI_FONT,
        fontSize: 22,
        fontWeight: UI_FONT_BOLD,
        color: UI.text,
      }}>
        {targetWord.meaning}
      </div>

      {/* Build area - shows selected chars + empty slots */}
      <div style={{
        display: 'flex',
        gap: 4,
        justifyContent: 'center',
        minHeight: 52,
        animation: isCorrect ? 'scramble-correct 0.5s ease-out' : undefined,
        borderRadius: 8,
        padding: '8px 12px',
      }}>
        {Array.from({ length: totalChars }).map((_, i) => {
          const char = builtChars[i];
          const isFilled = char != null;

          return (
            <div
              key={i}
              onClick={() => isFilled && !completedAt ? handleBuiltClick(i) : undefined}
              style={{
                width: 36,
                height: 40,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: UI_FONT,
                fontSize: 24,
                fontWeight: UI_FONT_BOLD,
                color: isCorrect ? '#2a8a4e' : UI.text,
                borderBottom: isFilled ? 'none' : `3px solid ${UI.textFaded}`,
                cursor: isFilled && !completedAt ? 'pointer' : 'default',
                transition: 'color 0.2s ease',
                userSelect: 'none',
              }}
            >
              {char ?? ''}
            </div>
          );
        })}
      </div>

      {/* Scrambled characters */}
      <div style={{
        display: 'flex',
        gap: 6,
        justifyContent: 'center',
        flexWrap: 'wrap',
      }}>
        {scrambledChars.map((char, index) => {
          const isAvailable = availableIndices.has(index);

          return (
            <PixelPanel
              key={index}
              borderWidth={22}
              panelOrigin={PANELS.beige}
              style={{
                cursor: isAvailable && !completedAt ? 'pointer' : 'default',
                opacity: isAvailable ? 1 : 0.3,
                transition: 'opacity 0.15s ease',
              }}
            >
              <button
                onClick={() => handleCharClick(index)}
                disabled={!isAvailable || completedAt != null}
                style={{
                  background: 'none',
                  border: '2px solid transparent',
                  borderRadius: 4,
                  width: 40,
                  height: 40,
                  cursor: isAvailable && !completedAt ? 'pointer' : 'default',
                  fontFamily: UI_FONT,
                  fontSize: 22,
                  fontWeight: UI_FONT_BOLD,
                  color: UI.text,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                  transition: 'all 0.15s ease',
                  ...(isGamepad && cursorIndex === index && availableIndices.has(index) ? GAMEPAD_FOCUS_STYLE : {}),
                }}
              >
                {char}
              </button>
            </PixelPanel>
          );
        })}
      </div>

      {/* Hint */}
      <div style={{
        textAlign: 'center',
        fontFamily: UI_FONT,
        fontSize: 11,
        color: UI.textFaded,
      }}>
        {completedAt != null
          ? ''
          : builtChars.length > 0
            ? 'Click placed characters to undo'
            : 'Click characters in order to spell the word'}
      </div>
    </div>
  );
}
