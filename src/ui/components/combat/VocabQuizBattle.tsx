import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { getGameTimer } from '../../../data/combatConfig';
import { UI, UI_FONT, UI_FONT_BOLD, PANELS } from '../../pixelTheme';
import { PixelPanel } from '../PixelPanel';
import { CombatTimer, getTierFromElapsed } from './CombatTimer';
import { getRandomLearnedWords } from './getLearnedWords';
import { useInputAction } from '../../hooks/useInputAction';
import { useUIStore } from '../../../store/uiStore';
import type { TimerTier } from '../../../store/combatStore';
import type { Word } from '../../../japanese/types';

interface VocabQuizBattleProps {
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

export function VocabQuizBattle({ onComplete }: VocabQuizBattleProps) {
  const [questionWord, setQuestionWord] = useState<Word | null>(null);
  const [answers, setAnswers] = useState<Word[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [completedAt, setCompletedAt] = useState<number | undefined>(undefined);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const startTimeRef = useRef<number>(0);
  const inputMode = useUIStore((s) => s.inputMode);
  const isGamepad = inputMode === 'gamepad';
  const [cursorIndex, setCursorIndex] = useState(0);
  const difficulty = useUIStore((s) => s.difficulty);
  const timerConfig = getGameTimer('vocab_quiz', difficulty);

  // Initialize on mount
  useEffect(() => {
    const words = getRandomLearnedWords(4);
    if (words.length < 4) return;

    setQuestionWord(words[0]);
    setAnswers(shuffle(words));
    startTimeRef.current = Date.now();
    setIsRunning(true);
  }, []);

  // Memoize the onComplete callback for the timer to avoid re-creating the effect
  const handleTimerComplete = useCallback((tier: TimerTier) => {
    if (completedAt != null) return; // Already completed
    setIsRunning(false);
    onComplete(tier);
  }, [completedAt, onComplete]);

  const handleAnswer = useCallback((word: Word) => {
    if (completedAt != null || !questionWord) return;

    const elapsed = Date.now() - startTimeRef.current;
    setSelectedAnswer(word.id);
    setCompletedAt(elapsed);
    setIsRunning(false);

    if (word.id === questionWord.id) {
      // Correct answer — if timer is off, always grade as 'fast'
      const tier = timerConfig.totalMs === 0 ? 'fast' : getTierFromElapsed(elapsed, timerConfig);
      setTimeout(() => onComplete(tier), 400);
    } else {
      // Wrong answer = miss
      setTimeout(() => onComplete('miss'), 400);
    }
  }, [completedAt, questionWord, onComplete, timerConfig]);

  const gamepadActive = isRunning && completedAt == null;

  useInputAction('navigate_up', () => {
    setCursorIndex((i) => (i >= 2 ? i - 2 : i));
  }, gamepadActive);

  useInputAction('navigate_down', () => {
    setCursorIndex((i) => (i <= 1 ? i + 2 : i));
  }, gamepadActive);

  useInputAction('navigate_left', () => {
    setCursorIndex((i) => (i % 2 === 1 ? i - 1 : i));
  }, gamepadActive);

  useInputAction('navigate_right', () => {
    setCursorIndex((i) => (i % 2 === 0 ? i + 1 : i));
  }, gamepadActive);

  useInputAction('confirm', () => {
    if (answers[cursorIndex]) {
      handleAnswer(answers[cursorIndex]);
    }
  }, gamepadActive);

  // Determine correct/wrong styling after selection
  const getAnswerStyle = useCallback((word: Word) => {
    if (!selectedAnswer || !questionWord) return {};

    if (word.id === selectedAnswer && word.id === questionWord.id) {
      // Selected and correct
      return {
        background: 'rgba(42, 138, 78, 0.25)',
        border: '2px solid #2a8a4e',
      };
    }
    if (word.id === selectedAnswer && word.id !== questionWord.id) {
      // Selected and wrong
      return {
        background: 'rgba(204, 68, 68, 0.25)',
        border: '2px solid #c44',
      };
    }
    if (word.id === questionWord.id && selectedAnswer) {
      // Show the correct answer highlighted after a wrong selection
      return {
        background: 'rgba(42, 138, 78, 0.15)',
        border: '2px solid #2a8a4e',
      };
    }
    return {};
  }, [selectedAnswer, questionWord]);

  if (!questionWord || answers.length < 4) {
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
      {/* Title */}
      <div style={{
        textAlign: 'center',
        fontFamily: UI_FONT,
        fontSize: 13,
        color: UI.textMuted,
      }}>
        What does this word mean?
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

      {/* Question word */}
      <div style={{
        textAlign: 'center',
      }}>
        <div style={{
          fontFamily: UI_FONT,
          fontSize: 36,
          fontWeight: UI_FONT_BOLD,
          color: UI.text,
          lineHeight: 1.2,
        }}>
          {questionWord.kanji}
        </div>
        {questionWord.kanji !== questionWord.kana && (
          <div style={{
            fontFamily: UI_FONT,
            fontSize: 15,
            color: UI.textMuted,
            marginTop: 4,
          }}>
            {questionWord.kana}
          </div>
        )}
      </div>

      {/* Answer grid - 2x2 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 6,
        width: '100%',
        maxWidth: 360,
      }}>
        {answers.map((word, idx) => {
          const overrideStyle = getAnswerStyle(word);
          const isDisabled = completedAt != null;

          return (
            <PixelPanel
              key={word.id}
              borderWidth={22}
              panelOrigin={PANELS.beige}
              style={{
                cursor: isDisabled ? 'default' : 'pointer',
                opacity: isDisabled && word.id !== selectedAnswer && word.id !== questionWord.id ? 0.5 : 1,
                transition: 'opacity 0.2s ease',
              }}
            >
              <button
                onClick={() => handleAnswer(word)}
                disabled={isDisabled}
                style={{
                  background: 'none',
                  border: '2px solid transparent',
                  borderRadius: 4,
                  padding: '6px 6px',
                  cursor: isDisabled ? 'default' : 'pointer',
                  width: '100%',
                  fontFamily: UI_FONT,
                  fontSize: 16,
                  fontWeight: UI_FONT_BOLD,
                  color: UI.text,
                  textAlign: 'center',
                  lineHeight: 1.3,
                  transition: 'all 0.15s ease',
                  ...overrideStyle,
                  ...(isGamepad && cursorIndex === idx && !completedAt ? GAMEPAD_FOCUS_STYLE : {}),
                }}
              >
                {word.meaning}
              </button>
            </PixelPanel>
          );
        })}
      </div>
    </div>
  );
}
