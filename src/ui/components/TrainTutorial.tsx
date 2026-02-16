import { useState, useCallback, useEffect, useRef } from 'react';
import { useGameStore } from '../../store/gameStore';
import { useUIStore } from '../../store/uiStore';
import { useVocabularyStore } from '../../store/vocabularyStore';
import { useInputAction } from '../hooks/useInputAction';
import { GamepadIcon } from './GamepadIcon';
import { PixelPanel } from './PixelPanel';
import { PANELS, UI, UI_FONT, UI_FONT_BOLD } from '../pixelTheme';

const FOCUS_PULSE_STYLES = `
@keyframes gamepad-focus-pulse {
  0%, 100% { box-shadow: 0 0 0 2px rgba(212, 175, 55, 0.6); }
  50% { box-shadow: 0 0 12px 4px rgba(212, 175, 55, 0.9); }
}
`;

const TUTORIAL_WORDS = [
  { id: 'w_konnichiwa', kana: 'こんにちは', meaning: 'hello' },
  { id: 'w_hai', kana: 'はい', meaning: 'yes' },
  { id: 'w_iie', kana: 'いいえ', meaning: 'no' },
  { id: 'w_arigatou', kana: 'ありがとう', meaning: 'thank you' },
  { id: 'w_sumimasen', kana: 'すみません', meaning: 'excuse me' },
  { id: 'w_daijoubu', kana: 'だいじょうぶ', meaning: 'okay; all right' },
  { id: 'w_sayounara', kana: 'さようなら', meaning: 'goodbye' },
] as const;

type Phase = 'intro' | 'quiz' | 'done';

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function getDistractors(correctIndex: number): string[] {
  const allMeanings = TUTORIAL_WORDS.map((w) => w.meaning);
  const others = allMeanings.filter((_, i) => i !== correctIndex);
  const shuffled = shuffleArray(others);
  return shuffled.slice(0, 3);
}

export function TrainTutorial() {
  const currentScene = useGameStore((s) => s.currentScene);
  const completeTutorial = useUIStore((s) => s.completeTutorial);
  const markEncountered = useVocabularyStore((s) => s.markEncountered);

  const [phase, setPhase] = useState<Phase>('intro');
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [options, setOptions] = useState<string[]>(() => generateOptions(0));
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

  // Overlay fade: 0 = invisible, 1 = fully visible
  const [overlayOpacity, setOverlayOpacity] = useState(0);
  // Content fade for phase transitions
  const [contentOpacity, setContentOpacity] = useState(0);
  // Track whether we're dismissed (don't render after fade-out)
  const [dismissed, setDismissed] = useState(false);

  const fadeTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  function generateOptions(wordIndex: number): string[] {
    const correct = TUTORIAL_WORDS[wordIndex].meaning;
    const distractors = getDistractors(wordIndex);
    return shuffleArray([correct, ...distractors]);
  }

  // Fade overlay in on mount
  useEffect(() => {
    if (currentScene === 'TrainRide' && !dismissed) {
      // Trigger fade-in on next frame so the transition fires
      requestAnimationFrame(() => {
        setOverlayOpacity(1);
        setContentOpacity(1);
      });
    }
  }, [currentScene, dismissed]);

  // Fade out the entire overlay, then call completeTutorial
  const fadeOutAndComplete = useCallback(() => {
    setContentOpacity(0);
    setOverlayOpacity(0);
    // Wait for CSS transition to finish, then trigger Phaser scene change
    fadeTimeoutRef.current = setTimeout(() => {
      setDismissed(true);
      completeTutorial();
    }, 800);
  }, [completeTutorial]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);
    };
  }, []);

  // Helper: cross-fade to a new phase
  const transitionToPhase = useCallback((newPhase: Phase) => {
    setContentOpacity(0);
    setTimeout(() => {
      setPhase(newPhase);
      // Let React render the new phase, then fade it in
      requestAnimationFrame(() => setContentOpacity(1));
    }, 300);
  }, []);

  const handleSkip = useCallback(() => {
    for (const word of TUTORIAL_WORDS) {
      markEncountered(word.id);
    }
    fadeOutAndComplete();
  }, [fadeOutAndComplete, markEncountered]);

  const handleStartQuiz = useCallback(() => {
    setCurrentWordIndex(0);
    setOptions(generateOptions(0));
    transitionToPhase('quiz');
  }, [transitionToPhase]);

  const handleAnswer = useCallback(
    (answer: string) => {
      if (feedback !== null) return;

      const correct = TUTORIAL_WORDS[currentWordIndex].meaning;
      setSelectedAnswer(answer);

      if (answer === correct) {
        setFeedback('correct');
        markEncountered(TUTORIAL_WORDS[currentWordIndex].id);

        setTimeout(() => {
          const nextIndex = currentWordIndex + 1;
          if (nextIndex >= TUTORIAL_WORDS.length) {
            // Cross-fade to done phase, then auto-dismiss
            transitionToPhase('done');
            setTimeout(() => {
              fadeOutAndComplete();
            }, 1500);
          } else {
            setCurrentWordIndex(nextIndex);
            setOptions(generateOptions(nextIndex));
            setFeedback(null);
            setSelectedAnswer(null);
          }
        }, 800);
      } else {
        setFeedback('wrong');
        setTimeout(() => {
          setFeedback(null);
          setSelectedAnswer(null);
        }, 1500);
      }
    },
    [feedback, currentWordIndex, markEncountered, transitionToPhase, fadeOutAndComplete]
  );

  if (currentScene !== 'TrainRide' || dismissed) return null;

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 200,
      opacity: overlayOpacity,
      transition: 'opacity 0.8s ease',
    }}>
      <style>{FOCUS_PULSE_STYLES}</style>
      <PixelPanel panelOrigin={PANELS.rounded} borderWidth={52} style={{
        width: 'min(90%, 500px)',
        padding: '32px 28px',
        opacity: contentOpacity,
        transition: 'opacity 0.3s ease',
      }}>
        {phase === 'intro' && <IntroPhase onStudy={handleStartQuiz} onSkip={handleSkip} />}
        {phase === 'quiz' && (
          <QuizPhase
            wordIndex={currentWordIndex}
            options={options}
            feedback={feedback}
            selectedAnswer={selectedAnswer}
            onAnswer={handleAnswer}
          />
        )}
        {phase === 'done' && <DonePhase />}
      </PixelPanel>
    </div>
  );
}

function IntroPhase({ onStudy, onSkip }: { onStudy: () => void; onSkip: () => void }) {
  const inputMode = useUIStore((s) => s.inputMode);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Gamepad navigation: up/down to switch, confirm to select
  useInputAction('navigate_up', () => setSelectedIndex(0));
  useInputAction('navigate_down', () => setSelectedIndex(1));
  useInputAction('confirm', () => {
    if (selectedIndex === 0) onStudy();
    else onSkip();
  });

  const isGamepad = inputMode === 'gamepad';

  return (
    <>
      <p style={{
        fontSize: 15, color: UI.text, lineHeight: 1.7, marginBottom: 20,
        fontFamily: UI_FONT, fontWeight: UI_FONT_BOLD,
      }}>
        You're on the shinkansen heading to a small town called{' '}
        <span style={{ color: UI.gold }}>化け町</span> (Bakemachi).
      </p>
      <p style={{
        fontSize: 15, color: UI.text, lineHeight: 1.7, marginBottom: 20,
        fontFamily: UI_FONT, fontWeight: UI_FONT_BOLD,
      }}>
        Your host family will be meeting you at the station. Maybe you should
        review some essential phrases from your phrasebook...
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center', marginTop: 24 }}>
        <PixelPanel
          panelOrigin={PANELS.rounded}
          borderWidth={22}
          style={{
            cursor: 'pointer',
            ...(isGamepad && selectedIndex === 0 ? {
              animation: 'gamepad-focus-pulse 1s ease-in-out infinite',
              borderRadius: 6,
            } : {}),
          }}
        >
          <button
            onClick={onStudy}
            onPointerEnter={() => setSelectedIndex(0)}
            style={btnStyle(false)}
          >
            {isGamepad && selectedIndex === 0 && (
              <span style={{ marginRight: 6 }}><GamepadIcon button="a" size={18} /></span>
            )}
            Study phrasebook
          </button>
        </PixelPanel>
        <PixelPanel
          panelOrigin={PANELS.rounded}
          borderWidth={22}
          style={{
            cursor: 'pointer',
            opacity: isGamepad && selectedIndex === 1 ? 1 : 0.7,
            ...(isGamepad && selectedIndex === 1 ? {
              animation: 'gamepad-focus-pulse 1s ease-in-out infinite',
              borderRadius: 6,
            } : {}),
          }}
        >
          <button
            onClick={onSkip}
            onPointerEnter={() => setSelectedIndex(1)}
            style={btnStyle(selectedIndex === 1 && isGamepad ? false : true)}
          >
            {isGamepad && selectedIndex === 1 && (
              <span style={{ marginRight: 6 }}><GamepadIcon button="a" size={18} /></span>
            )}
            Skip — I know some Japanese
          </button>
        </PixelPanel>
      </div>
      {isGamepad && (
        <p style={{
          textAlign: 'center', marginTop: 16, fontSize: 12,
          color: UI.textFaded, fontFamily: UI_FONT,
        }}>
          D-pad / stick to navigate, <GamepadIcon button="a" size={14} /> to select
        </p>
      )}
    </>
  );
}

function QuizPhase({
  wordIndex,
  options,
  feedback,
  selectedAnswer,
  onAnswer,
}: {
  wordIndex: number;
  options: string[];
  feedback: 'correct' | 'wrong' | null;
  selectedAnswer: string | null;
  onAnswer: (answer: string) => void;
}) {
  const inputMode = useUIStore((s) => s.inputMode);
  const word = TUTORIAL_WORDS[wordIndex];
  const correctMeaning = word.meaning;

  const [selectedIndex, setSelectedIndex] = useState(0);

  // Reset selection when options change (new word)
  useEffect(() => {
    setSelectedIndex(0);
  }, [options]);

  // 2x2 grid navigation:
  //   0  1
  //   2  3
  const isDisabled = feedback !== null;

  useInputAction('navigate_left', () => {
    if (isDisabled) return;
    setSelectedIndex((i) => (i % 2 === 1) ? i - 1 : i);
  });
  useInputAction('navigate_right', () => {
    if (isDisabled) return;
    setSelectedIndex((i) => (i % 2 === 0) ? i + 1 : i);
  });
  useInputAction('navigate_up', () => {
    if (isDisabled) return;
    setSelectedIndex((i) => (i >= 2) ? i - 2 : i);
  });
  useInputAction('navigate_down', () => {
    if (isDisabled) return;
    setSelectedIndex((i) => (i <= 1) ? i + 2 : i);
  });
  useInputAction('confirm', () => {
    if (isDisabled) return;
    onAnswer(options[selectedIndex]);
  });

  const isGamepad = inputMode === 'gamepad';

  return (
    <>
      {/* Kana display */}
      <div style={{
        textAlign: 'center',
        fontSize: 36,
        marginBottom: 28,
        letterSpacing: '0.1em',
        color: UI.text,
        fontFamily: UI_FONT,
        fontWeight: UI_FONT_BOLD,
      }}>
        {word.kana}
      </div>

      {/* Answer grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 10,
        marginBottom: 24,
      }}>
        {options.map((option, idx) => {
          let extraStyle: React.CSSProperties = {};
          if (feedback !== null && selectedAnswer !== null) {
            if (option === correctMeaning) {
              extraStyle = { background: 'rgba(40, 160, 80, 0.25)', borderColor: '#2d8a4e' };
            } else if (option === selectedAnswer && feedback === 'wrong') {
              extraStyle = { background: 'rgba(200, 60, 60, 0.2)', borderColor: '#c44' };
            }
          }

          const isFocused = isGamepad && idx === selectedIndex && feedback === null;

          return (
            <button
              key={option}
              onClick={() => onAnswer(option)}
              onPointerEnter={() => { if (!isDisabled) setSelectedIndex(idx); }}
              disabled={feedback !== null}
              style={{
                background: 'none',
                border: `2px solid ${UI.textFaded}60`,
                borderRadius: 6,
                color: UI.text,
                fontSize: 15,
                padding: '12px 8px',
                cursor: feedback !== null ? 'default' : 'pointer',
                fontFamily: UI_FONT,
                fontWeight: UI_FONT_BOLD,
                transition: 'background 0.15s, border-color 0.15s',
                ...extraStyle,
                ...(isFocused ? {
                  borderColor: UI.goldBright,
                  background: 'rgba(210, 170, 0, 0.15)',
                  animation: 'gamepad-focus-pulse 1s ease-in-out infinite',
                } : {}),
              }}
            >
              {option}
            </button>
          );
        })}
      </div>

      {/* Progress dots */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
          {TUTORIAL_WORDS.map((_, i) => (
            <div
              key={i}
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: i < wordIndex ? '#2a6' : i === wordIndex ? UI.gold : `${UI.textFaded}40`,
                transition: 'background 0.2s',
              }}
            />
          ))}
          <span style={{ marginLeft: 8, fontSize: 13, color: UI.textMuted, fontFamily: UI_FONT }}>
            {wordIndex + 1}/{TUTORIAL_WORDS.length}
          </span>
        </div>
      </div>
    </>
  );
}

function DonePhase() {
  return (
    <div style={{ textAlign: 'center' }}>
      <p style={{
        fontSize: 18, color: '#2a8a4e', marginBottom: 12,
        fontFamily: UI_FONT, fontWeight: UI_FONT_BOLD,
      }}>
        You feel more prepared!
      </p>
      <p style={{ fontSize: 13, color: UI.textMuted, fontFamily: UI_FONT }}>
        Arriving at Bakemachi Station...
      </p>
    </div>
  );
}

function btnStyle(muted: boolean): React.CSSProperties {
  return {
    background: 'none',
    border: 'none',
    color: muted ? UI.textMuted : UI.text,
    fontSize: 15,
    padding: '6px 16px',
    cursor: 'pointer',
    fontFamily: UI_FONT,
    fontWeight: UI_FONT_BOLD,
    whiteSpace: 'nowrap',
  };
}
