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

const MATCH_STYLES = `
@keyframes match-flash-green {
  0% { background: rgba(42, 138, 78, 0.4); }
  100% { background: rgba(42, 138, 78, 0.1); }
}
@keyframes match-flash-red {
  0% { background: rgba(204, 68, 68, 0.4); }
  50% { background: rgba(204, 68, 68, 0.4); }
  100% { background: transparent; }
}
`;

interface QuickMatchBattleProps {
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

const GAMEPAD_FOCUS_STYLE: React.CSSProperties = {
  border: '3px solid #d4af37',
  background: 'rgba(212, 175, 55, 0.2)',
  animation: 'gamepad-focus-pulse 1s ease-in-out infinite',
};

export function QuickMatchBattle({ onComplete }: QuickMatchBattleProps) {
  const [japaneseWords, setJapaneseWords] = useState<Word[]>([]);
  const [englishWords, setEnglishWords] = useState<Word[]>([]);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<string | null>(null);
  const [wrongFlash, setWrongFlash] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [completedAt, setCompletedAt] = useState<number | undefined>(undefined);
  const startTimeRef = useRef<number>(0);
  const wrongTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const inputMode = useUIStore((s) => s.inputMode);
  const isGamepad = inputMode === 'gamepad';
  const [cursorCol, setCursorCol] = useState(0);
  const [cursorRow, setCursorRow] = useState(0);
  const difficulty = useUIStore((s) => s.difficulty);
  const timerConfig = getGameTimer('quick_match', difficulty);

  // Initialize on mount
  useEffect(() => {
    const words = getRandomLearnedWords(2);
    if (words.length < 2) return;

    setJapaneseWords(shuffle(words));
    setEnglishWords(shuffle(words));
    startTimeRef.current = Date.now();
    setIsRunning(true);

    return () => {
      if (wrongTimerRef.current) clearTimeout(wrongTimerRef.current);
    };
  }, []);

  const handleTimerComplete = useCallback((tier: TimerTier) => {
    if (completedAt != null) return;
    setIsRunning(false);
    onComplete(tier);
  }, [completedAt, onComplete]);

  // Handle clicking a Japanese word
  const handleJapaneseClick = useCallback((wordId: string) => {
    if (completedAt != null || matched.has(wordId)) return;
    setSelected(wordId);
  }, [completedAt, matched]);

  // Handle clicking an English meaning
  const handleEnglishClick = useCallback((wordId: string) => {
    if (completedAt != null || matched.has(wordId) || !selected) return;

    if (selected === wordId) {
      // Correct match
      const newMatched = new Set(matched);
      newMatched.add(wordId);
      setMatched(newMatched);
      setSelected(null);

      // Check if all pairs matched (2 pairs)
      if (newMatched.size === 2) {
        const elapsed = Date.now() - startTimeRef.current;
        // If timer is off, always grade as 'fast'
        const tier = timerConfig.totalMs === 0 ? 'fast' : getTierFromElapsed(elapsed, timerConfig);
        setCompletedAt(elapsed);
        setIsRunning(false);
        setTimeout(() => onComplete(tier), 400);
      }
    } else {
      // Wrong match - flash red, reset selection
      setWrongFlash(true);
      setSelected(null);
      if (wrongTimerRef.current) clearTimeout(wrongTimerRef.current);
      wrongTimerRef.current = setTimeout(() => setWrongFlash(false), 400);
    }
  }, [completedAt, matched, selected, onComplete, timerConfig]);

  const gamepadActive = completedAt == null && japaneseWords.length >= 2;

  useInputAction('navigate_up', () => {
    setCursorRow((r) => Math.max(0, r - 1));
  }, gamepadActive);

  useInputAction('navigate_down', () => {
    setCursorRow((r) => Math.min(1, r + 1));
  }, gamepadActive);

  useInputAction('navigate_left', () => {
    setCursorCol(0);
  }, gamepadActive);

  useInputAction('navigate_right', () => {
    setCursorCol(1);
  }, gamepadActive);

  useInputAction('confirm', () => {
    if (cursorCol === 0) {
      // Select Japanese word
      const word = japaneseWords[cursorRow];
      if (word && !matched.has(word.id)) {
        handleJapaneseClick(word.id);
      }
    } else {
      // Select English meaning
      const word = englishWords[cursorRow];
      if (word && !matched.has(word.id) && selected) {
        handleEnglishClick(word.id);
      }
    }
  }, gamepadActive);

  if (japaneseWords.length < 2 || englishWords.length < 2) {
    return null;
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 8,
      width: '100%',
    }}>
      <style>{MATCH_STYLES}</style>

      {/* Title */}
      <div style={{
        textAlign: 'center',
        fontFamily: UI_FONT,
        fontSize: 13,
        color: UI.textMuted,
      }}>
        Match each word to its meaning
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

      {/* Matching columns */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 10,
        width: '100%',
        maxWidth: 360,
      }}>
        {/* Left column: Japanese words */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}>
          {japaneseWords.map((word, idx) => {
            const isMatched = matched.has(word.id);
            const isSelected = selected === word.id;

            return (
              <PixelPanel
                key={`jp-${word.id}`}
                borderWidth={22}
                panelOrigin={PANELS.beige}
                style={{
                  cursor: isMatched || completedAt != null ? 'default' : 'pointer',
                  opacity: isMatched ? 0.5 : 1,
                  transition: 'opacity 0.2s ease',
                }}
              >
                <button
                  onClick={() => handleJapaneseClick(word.id)}
                  disabled={isMatched || completedAt != null}
                  style={{
                    background: isMatched
                      ? 'rgba(42, 138, 78, 0.1)'
                      : isSelected
                        ? 'rgba(184, 150, 10, 0.2)'
                        : 'none',
                    border: isSelected
                      ? `2px solid ${UI.goldBright}`
                      : isMatched
                        ? '2px solid #2a8a4e'
                        : '2px solid transparent',
                    borderRadius: 4,
                    padding: '8px 6px',
                    cursor: isMatched || completedAt != null ? 'default' : 'pointer',
                    width: '100%',
                    fontFamily: UI_FONT,
                    fontSize: 18,
                    fontWeight: UI_FONT_BOLD,
                    color: isMatched ? '#2a8a4e' : UI.text,
                    textAlign: 'center',
                    transition: 'all 0.15s ease',
                    ...(isGamepad && cursorCol === 0 && cursorRow === idx && !matched.has(word.id) ? GAMEPAD_FOCUS_STYLE : {}),
                  }}
                >
                  {word.kana}
                </button>
              </PixelPanel>
            );
          })}
        </div>

        {/* Right column: English meanings */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}>
          {englishWords.map((word, idx) => {
            const isMatched = matched.has(word.id);
            const isWrongTarget = wrongFlash && !isMatched && selected === null;

            return (
              <PixelPanel
                key={`en-${word.id}`}
                borderWidth={22}
                panelOrigin={PANELS.beige}
                style={{
                  cursor: isMatched || completedAt != null || !selected ? 'default' : 'pointer',
                  opacity: isMatched ? 0.5 : 1,
                  transition: 'opacity 0.2s ease',
                  animation: isWrongTarget ? 'match-flash-red 0.4s ease-out' : undefined,
                }}
              >
                <button
                  onClick={() => handleEnglishClick(word.id)}
                  disabled={isMatched || completedAt != null || !selected}
                  style={{
                    background: isMatched
                      ? 'rgba(42, 138, 78, 0.1)'
                      : 'none',
                    border: isMatched
                      ? '2px solid #2a8a4e'
                      : '2px solid transparent',
                    borderRadius: 4,
                    padding: '8px 6px',
                    cursor: isMatched || completedAt != null || !selected ? 'default' : 'pointer',
                    width: '100%',
                    fontFamily: UI_FONT,
                    fontSize: 14,
                    fontWeight: UI_FONT_BOLD,
                    color: isMatched ? '#2a8a4e' : UI.text,
                    textAlign: 'center',
                    lineHeight: 1.3,
                    transition: 'all 0.15s ease',
                    ...(isGamepad && cursorCol === 1 && cursorRow === idx && !matched.has(word.id) ? GAMEPAD_FOCUS_STYLE : {}),
                  }}
                >
                  {word.meaning}
                </button>
              </PixelPanel>
            );
          })}
        </div>
      </div>

      {/* Hint */}
      <div style={{
        textAlign: 'center',
        fontFamily: UI_FONT,
        fontSize: 11,
        color: UI.textFaded,
      }}>
        {selected
          ? 'Now click the matching English meaning'
          : 'Click a Japanese word first'}
      </div>
    </div>
  );
}
