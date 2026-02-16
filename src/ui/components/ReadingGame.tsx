import { useState, useEffect, useCallback, useRef, useSyncExternalStore } from 'react';
import { useUIStore } from '../../store/uiStore';
import { useGameStore } from '../../store/gameStore';
import { useInventoryStore } from '../../store/inventoryStore';
import { READING_CHALLENGES } from '../../data/readingData';
import { NPC_DIALOGUE } from '../../data/npcDialogue';
import { PixelPanel } from './PixelPanel';
import { TutorialOverlay } from './TutorialOverlay';
import { UI, UI_FONT, UI_FONT_BOLD, PANELS } from '../pixelTheme';
import { useInputAction } from '../hooks/useInputAction';
import type { TutorialStep } from './TutorialOverlay';
import type { ReadingPassage } from '../../data/readingData';

const ANIM_STYLES = `
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-8px); }
  20%, 40%, 60%, 80% { transform: translateX(8px); }
}
@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  30% { transform: translateY(-16px); }
  50% { transform: translateY(-8px); }
  70% { transform: translateY(-12px); }
}
@keyframes gamepad-focus-pulse {
  0%, 100% { box-shadow: 0 0 0 2px rgba(212, 175, 55, 0.6); }
  50% { box-shadow: 0 0 12px 4px rgba(212, 175, 55, 0.9); }
}
`;

const FIRST_TRY_BONUS = 100;

const READING_TUTORIAL_STEPS: TutorialStep[] = [
  {
    text: 'Reading Challenge',
    subtext: 'Read the Japanese text and pick the correct answer!',
  },
  {
    text: 'Each card has Japanese text on it',
    subtext: 'Try to read and understand what it says.',
    highlight: 'reading-cards',
    calloutPosition: 'below',
  },
  {
    text: 'Tap the card that matches what you\'re looking for!',
    subtext: 'Get it right on the first try for a bonus!',
  },
];

/** Reactive narrow-screen check */
const widthSubscribe = (cb: () => void) => { window.addEventListener('resize', cb); return () => window.removeEventListener('resize', cb); };
const getIsNarrow = () => window.innerWidth < 500;

export function ReadingGame() {
  const activeReadingGame = useUIStore((s) => s.activeReadingGame);
  const closeReadingGame = useUIStore((s) => s.closeReadingGame);
  const startDialogue = useUIStore((s) => s.startDialogue);
  const inputMode = useUIStore((s) => s.inputMode);
  const setQuestState = useGameStore((s) => s.setQuestState);
  const spendYen = useGameStore((s) => s.spendYen);

  const isNarrow = useSyncExternalStore(widthSubscribe, getIsNarrow);
  const panelBorder = isNarrow ? 28 : 52;
  const itemBorder = isNarrow ? 12 : 22;

  // Phase: 'reading' -> 'complete' -> 'purchase'
  const [phase, setPhase] = useState<'reading' | 'complete' | 'purchase'>('reading');
  // The index of the card the player selected (correct answer)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  // Feedback text shown briefly
  const [feedbackText, setFeedbackText] = useState<string | null>(null);
  // Key counter to force feedback div remount (re-triggers CSS animations)
  const [feedbackKey, setFeedbackKey] = useState(0);
  // Track number of wrong attempts for first-try bonus
  const [wrongAttempts, setWrongAttempts] = useState(0);
  // Index of a card that was just answered wrong (for shake animation)
  const [shakeIndex, setShakeIndex] = useState<number | null>(null);
  // Timer ref to prevent feedback text being cleared by stale timeouts
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const shakeTimerRef = useRef<ReturnType<typeof setTimeout>>();

  // Gamepad cursor (0 to passages.length - 1)
  const [cursorIndex, setCursorIndex] = useState(0);

  // Tutorial state
  const [showTutorial, setShowTutorial] = useState(false);

  // Resolve challenge data
  const challenge = activeReadingGame ? READING_CHALLENGES[activeReadingGame] : null;
  const passages: ReadingPassage[] = challenge?.passages ?? [];

  // Initialize when a reading game opens
  useEffect(() => {
    if (!activeReadingGame || !challenge) return;

    setPhase('reading');
    setSelectedIndex(null);
    setFeedbackText(null);
    setWrongAttempts(0);
    setShakeIndex(null);
    setCursorIndex(0);

    // Show tutorial on first play
    const tutorialDone = useGameStore.getState().questStates.tutorial_reading_done;
    setShowTutorial(!tutorialDone);
  }, [activeReadingGame]); // eslint-disable-line react-hooks/exhaustive-deps

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
      if (shakeTimerRef.current) clearTimeout(shakeTimerRef.current);
    };
  }, []);

  // Show feedback text briefly, then clear
  const showFeedback = useCallback((text: string) => {
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    setFeedbackText(text);
    setFeedbackKey((k) => k + 1);
    feedbackTimerRef.current = setTimeout(() => setFeedbackText(null), 800);
  }, []);

  // Handle selecting a card
  const handleCardClick = useCallback((index: number) => {
    if (phase !== 'reading') return;
    if (selectedIndex !== null) return; // already picked correct

    const passage = passages[index];
    if (!passage) return;

    if (passage.isCorrect) {
      // Correct answer
      setSelectedIndex(index);

      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);

      // Show completion feedback
      const alreadyPlayed = useGameStore.getState().questStates[`reading_${activeReadingGame}_done`];
      if (wrongAttempts === 0 && !alreadyPlayed) {
        // Award yen bonus for first-try
        const currentYen = useGameStore.getState().yen;
        useGameStore.getState().setYen(currentYen + FIRST_TRY_BONUS);
        useUIStore.getState().showYenGain(FIRST_TRY_BONUS);
        setFeedbackText(`bonus:+¥${FIRST_TRY_BONUS}`);
        setFeedbackKey((k) => k + 1);
        setQuestState(`reading_${activeReadingGame}_done`, 'true');
      } else if (wrongAttempts > 0 && !alreadyPlayed) {
        setFeedbackText('bonus:none');
        setFeedbackKey((k) => k + 1);
        setQuestState(`reading_${activeReadingGame}_done`, 'true');
      } else {
        setFeedbackText('bonus:done');
        setFeedbackKey((k) => k + 1);
      }

      // Transition to complete phase after feedback
      const timer = setTimeout(() => {
        setFeedbackText(null);
        setPhase('complete');
      }, 2500);
      return () => clearTimeout(timer);
    } else {
      // Wrong answer
      setWrongAttempts((prev) => prev + 1);

      // Trigger shake animation on this card
      if (shakeTimerRef.current) clearTimeout(shakeTimerRef.current);
      setShakeIndex(index);
      shakeTimerRef.current = setTimeout(() => setShakeIndex(null), 600);

      showFeedback('ちがう！');
    }
  }, [phase, selectedIndex, passages, wrongAttempts, activeReadingGame, setQuestState, showFeedback]);

  // Handle purchasing the reward item
  const handlePurchase = useCallback(() => {
    if (!challenge) return;
    const reward = challenge.reward;

    const success = spendYen(reward.cost);
    if (!success) {
      showFeedback('お金が足りない！');
      return;
    }

    // Add item to inventory
    useInventoryStore.getState().addItem(
      reward.item,
      reward.itemName,
      reward.itemImage,
    );

    // Show yen spend animation and item toast
    useUIStore.getState().showYenSpend(reward.cost);
    useUIStore.getState().showItemToast(reward.itemName, reward.itemImage);

    // Set quest state
    setQuestState(`reading_${activeReadingGame}_purchased`, 'true');

    // Set specific quest states for quest gating
    if (activeReadingGame === 'postcard_grandma') {
      setQuestState('stationPostcardBought', 'true');
    }

    // Close the reading game
    closeReadingGame();

    // Show follow-up dialogue
    const followUp = NPC_DIALOGUE['douzo_response'];
    if (followUp) {
      setTimeout(() => startDialogue(followUp), 200);
    }
  }, [challenge, spendYen, setQuestState, activeReadingGame, closeReadingGame, startDialogue, showFeedback]);

  // Tutorial completion handler
  const handleTutorialComplete = useCallback(() => {
    setShowTutorial(false);
    useGameStore.getState().setQuestState('tutorial_reading_done', 'done');
  }, []);

  // -- Gamepad: B button to close --
  useInputAction('cancel', () => closeReadingGame(), !!activeReadingGame && !showTutorial);

  // -- Gamepad: Reading phase navigation --
  const readingNavEnabled = !!activeReadingGame && phase === 'reading' && !feedbackText && selectedIndex === null && !showTutorial;

  useInputAction('navigate_up', () => {
    setCursorIndex((prev) => (prev - 1 + passages.length) % passages.length);
  }, readingNavEnabled);

  useInputAction('navigate_down', () => {
    setCursorIndex((prev) => (prev + 1) % passages.length);
  }, readingNavEnabled);

  useInputAction('confirm', () => {
    handleCardClick(cursorIndex);
  }, readingNavEnabled);

  // -- Gamepad: Complete phase --
  const completeNavEnabled = !!activeReadingGame && phase === 'complete' && !showTutorial;

  useInputAction('confirm', () => {
    setPhase('purchase');
  }, completeNavEnabled);

  // -- Gamepad: Purchase phase --
  const purchaseNavEnabled = !!activeReadingGame && phase === 'purchase';

  useInputAction('confirm', () => {
    handlePurchase();
  }, purchaseNavEnabled);

  if (!activeReadingGame || !challenge) return null;

  const isGamepad = inputMode === 'gamepad';

  // Focus style for gamepad-highlighted items
  const focusStyle = {
    outline: '3px solid #d4af37',
    outlineOffset: '-3px',
    background: 'rgba(210, 170, 0, 0.25)',
    animation: 'gamepad-focus-pulse 1s ease-in-out infinite',
  };

  // Find the correct passage for the complete phase
  const correctPassage = passages.find((p) => p.isCorrect);

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      background: UI.overlay,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 150,
    }}>
      <style>{ANIM_STYLES}</style>
      <PixelPanel
        panelOrigin={PANELS.rounded}
        borderWidth={panelBorder}
        style={{
          padding: isNarrow ? '8px 10px' : '24px 32px',
          maxWidth: 520,
          width: isNarrow ? '99%' : '90%',
          position: 'relative',
        }}
      >
        {/* Close button */}
        <div style={{ position: 'absolute', top: -8, right: -8 }}>
          <PixelPanel borderWidth={22} style={{ cursor: 'pointer' }}>
            <button onClick={() => closeReadingGame()} style={{
              background: 'none', border: 'none', padding: '2px 8px',
              cursor: 'pointer', fontSize: 14, color: UI.text,
              fontFamily: UI_FONT, fontWeight: UI_FONT_BOLD,
            }}>X</button>
          </PixelPanel>
        </div>

        {phase === 'reading' ? (
          /* -- Reading Phase -- */
          <>
            {/* Prompt */}
            <div style={{
              textAlign: 'center',
              fontSize: 15,
              color: UI.text,
              marginBottom: 20,
              fontFamily: UI_FONT,
              fontWeight: UI_FONT_BOLD,
              lineHeight: 1.4,
            }}>
              {challenge.prompt}
            </div>

            {/* Reading cards */}
            <div
              data-tutorial="reading-cards"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: isNarrow ? 4 : 8,
              }}
            >
              {passages.map((passage, idx) => {
                const isShaking = shakeIndex === idx;
                const isCorrectSelected = selectedIndex === idx && passage.isCorrect;
                const isFocused = isGamepad && cursorIndex === idx;

                return (
                  <PixelPanel
                    key={idx}
                    borderWidth={itemBorder}
                    panelOrigin={PANELS.rounded}
                    style={{
                      cursor: selectedIndex !== null ? 'default' : 'pointer',
                      animation: isShaking
                        ? 'shake 0.6s ease-in-out'
                        : isCorrectSelected
                          ? 'bounce 0.6s ease-in-out'
                          : undefined,
                    }}
                  >
                    <button
                      onClick={() => handleCardClick(idx)}
                      disabled={selectedIndex !== null}
                      style={{
                        background: isCorrectSelected
                          ? 'rgba(80, 160, 80, 0.15)'
                          : 'none',
                        border: isCorrectSelected
                          ? '2px solid #6a6'
                          : '2px solid transparent',
                        borderRadius: 4,
                        padding: isNarrow ? '10px 12px' : '14px 18px',
                        cursor: selectedIndex !== null ? 'default' : 'pointer',
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontFamily: UI_FONT,
                        fontSize: isNarrow ? 16 : 18,
                        fontWeight: UI_FONT_BOLD,
                        color: isCorrectSelected ? '#6a6' : UI.text,
                        transition: 'all 0.15s ease',
                        textAlign: 'center',
                        lineHeight: 1.5,
                        ...(isFocused ? focusStyle : {}),
                      }}
                    >
                      {passage.japanese}
                    </button>
                  </PixelPanel>
                );
              })}
            </div>

            {/* Feedback text */}
            <div key={feedbackKey} style={{
              textAlign: 'center',
              marginTop: 16,
              minHeight: 36,
              opacity: feedbackText ? 1 : 0,
              animation: feedbackText?.startsWith('ちがう')
                ? 'shake 0.6s ease-in-out'
                : (feedbackText?.startsWith('bonus:') || feedbackText === 'はい！')
                  ? 'bounce 0.6s ease-in-out'
                  : 'none',
            }}>
              {feedbackText?.startsWith('bonus:') ? (
                <div>
                  <div style={{
                    fontSize: 24,
                    fontFamily: UI_FONT,
                    fontWeight: UI_FONT_BOLD,
                    color: '#2a8a4e',
                  }}>
                    {feedbackText === 'bonus:none' || feedbackText === 'bonus:done' ? (
                      'すごい！'
                    ) : (
                      <>
                        すごい！ +<img src="/assets/ui/32x32/yen-coin.png" alt="¥" style={{ width: 22, height: 22, imageRendering: 'pixelated', verticalAlign: 'middle', margin: '0 2px' }} />{FIRST_TRY_BONUS}
                      </>
                    )}
                  </div>
                  {feedbackText === 'bonus:none' && (
                    <div style={{
                      fontSize: 11,
                      fontFamily: UI_FONT,
                      color: UI.textMuted,
                      marginTop: 4,
                    }}>
                      No yen reward this time!
                    </div>
                  )}
                </div>
              ) : (
                <div style={{
                  fontSize: 24,
                  fontFamily: UI_FONT,
                  fontWeight: UI_FONT_BOLD,
                  color: feedbackText?.startsWith('ちがう') ? '#c44' : '#6a6',
                }}>
                  {feedbackText ?? '\u00A0'}
                </div>
              )}
            </div>

            {/* Hint */}
            <div style={{
              textAlign: 'center',
              fontSize: 11,
              color: UI.textFaded,
              marginTop: 4,
              fontFamily: UI_FONT,
            }}>
              {isGamepad
                ? 'D-Pad to move \u2022 A to select \u2022 B to close'
                : 'Read the Japanese and pick the right card'}
            </div>
          </>
        ) : phase === 'complete' ? (
          /* -- Complete Phase -- */
          <>
            {/* Title */}
            <div style={{
              textAlign: 'center',
              fontSize: 20,
              color: UI.text,
              marginBottom: 4,
              fontFamily: UI_FONT,
              fontWeight: UI_FONT_BOLD,
              letterSpacing: '0.05em',
            }}>
              せいかい！
            </div>
            <div style={{
              textAlign: 'center',
              fontSize: 11,
              color: UI.textMuted,
              marginBottom: 20,
              fontFamily: UI_FONT,
            }}>
              Correct!
            </div>

            {/* Show the correct card with translation */}
            {correctPassage && (
              <PixelPanel
                borderWidth={itemBorder}
                panelOrigin={PANELS.rounded}
                style={{ marginBottom: 16 }}
              >
                <div style={{
                  padding: isNarrow ? '12px 14px' : '16px 20px',
                  textAlign: 'center',
                }}>
                  <div style={{
                    fontSize: isNarrow ? 18 : 20,
                    fontFamily: UI_FONT,
                    fontWeight: UI_FONT_BOLD,
                    color: '#2a8a4e',
                    marginBottom: 8,
                    lineHeight: 1.5,
                  }}>
                    {correctPassage.japanese}
                  </div>
                  <div style={{
                    fontSize: isNarrow ? 13 : 14,
                    fontFamily: UI_FONT,
                    color: UI.textMuted,
                    fontStyle: 'italic',
                    lineHeight: 1.4,
                  }}>
                    {correctPassage.english}
                  </div>
                </div>
              </PixelPanel>
            )}

            {/* Next button */}
            <div style={{ textAlign: 'center' }}>
              <PixelPanel
                borderWidth={itemBorder}
                panelOrigin={PANELS.rounded}
                style={{ display: 'inline-block', cursor: 'pointer' }}
              >
                <button
                  onClick={() => setPhase('purchase')}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: '8px 32px',
                    cursor: 'pointer',
                    fontFamily: UI_FONT,
                    fontWeight: UI_FONT_BOLD,
                    fontSize: 16,
                    color: UI.text,
                    ...(isGamepad ? focusStyle : {}),
                  }}
                >
                  つぎへ
                </button>
              </PixelPanel>
            </div>

            {/* Hint */}
            <div style={{
              textAlign: 'center',
              fontSize: 11,
              color: UI.textFaded,
              marginTop: 16,
              fontFamily: UI_FONT,
            }}>
              {isGamepad
                ? 'A to continue \u2022 B to close'
                : 'Tap to continue'}
            </div>
          </>
        ) : (
          /* -- Purchase Phase -- */
          <>
            {/* Title */}
            <div style={{
              textAlign: 'center',
              fontSize: 20,
              color: UI.text,
              marginBottom: 4,
              fontFamily: UI_FONT,
              fontWeight: UI_FONT_BOLD,
              letterSpacing: '0.05em',
            }}>
              おかいもの
            </div>
            <div style={{
              textAlign: 'center',
              fontSize: 11,
              color: UI.textMuted,
              marginBottom: 20,
              fontFamily: UI_FONT,
            }}>
              Your reward!
            </div>

            {/* Reward item */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: isNarrow ? 2 : 4,
            }}>
              <PixelPanel
                borderWidth={itemBorder}
                panelOrigin={PANELS.rounded}
                style={{ cursor: 'pointer' }}
              >
                <button
                  onClick={() => handlePurchase()}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: '10px 16px',
                    cursor: 'pointer',
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    ...(isGamepad ? focusStyle : {}),
                  }}
                >
                  <img
                    src={challenge.reward.itemImage}
                    alt={challenge.reward.itemName}
                    style={{
                      width: 48,
                      height: 48,
                      objectFit: 'contain',
                      imageRendering: 'pixelated',
                    }}
                  />
                  <div style={{
                    flex: 1,
                    textAlign: 'left',
                  }}>
                    <div style={{
                      fontSize: 18,
                      color: UI.text,
                      fontFamily: UI_FONT,
                      fontWeight: UI_FONT_BOLD,
                    }}>
                      {challenge.reward.itemName}
                    </div>
                  </div>
                  <div style={{
                    fontSize: 16,
                    color: UI.text,
                    fontFamily: UI_FONT,
                    fontWeight: UI_FONT_BOLD,
                    whiteSpace: 'nowrap',
                  }}>
                    <img src="/assets/ui/32x32/yen-coin.png" alt="¥" style={{ width: 18, height: 18, imageRendering: 'pixelated', verticalAlign: 'middle', marginRight: 2 }} />{challenge.reward.cost}
                  </div>
                </button>
              </PixelPanel>
            </div>

            {/* Feedback text (for insufficient funds) */}
            {feedbackText && (
              <div style={{
                textAlign: 'center',
                fontSize: 14,
                fontFamily: UI_FONT,
                fontWeight: UI_FONT_BOLD,
                color: '#c44',
                marginTop: 12,
              }}>
                {feedbackText}
              </div>
            )}

            {/* Hint */}
            <div style={{
              textAlign: 'center',
              fontSize: 11,
              color: UI.textFaded,
              marginTop: 16,
              fontFamily: UI_FONT,
            }}>
              {isGamepad
                ? 'A to buy \u2022 B to close'
                : 'Click to buy'}
            </div>
          </>
        )}
      </PixelPanel>

      {/* Tutorial overlay */}
      {showTutorial && (
        <TutorialOverlay
          steps={READING_TUTORIAL_STEPS}
          onComplete={handleTutorialComplete}
        />
      )}
    </div>
  );
}
