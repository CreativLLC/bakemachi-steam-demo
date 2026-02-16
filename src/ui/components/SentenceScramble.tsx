import { useState, useEffect, useCallback, useMemo, useRef, useSyncExternalStore } from 'react';
import { useUIStore } from '../../store/uiStore';
import { useGameStore } from '../../store/gameStore';
import { useVocabularyStore } from '../../store/vocabularyStore';
import { useInventoryStore } from '../../store/inventoryStore';
import { SCRAMBLE_SETS } from '../../data/scrambleData';
import { NPC_DIALOGUE } from '../../data/npcDialogue';
import { PixelPanel } from './PixelPanel';
import { TutorialOverlay } from './TutorialOverlay';
import { UI, UI_FONT, UI_FONT_BOLD, PANELS } from '../pixelTheme';
import { useInputAction } from '../hooks/useInputAction';
import type { TutorialStep } from './TutorialOverlay';

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

const SCRAMBLE_TUTORIAL_STEPS: TutorialStep[] = [
  {
    text: 'Sentence Builder',
    subtext: 'Build a Japanese sentence by arranging words in the correct order!',
  },
  {
    text: 'These are the word tiles',
    subtext: "They're scrambled -- you need to put them in the right order.",
    highlight: 'scramble-tiles',
    calloutPosition: 'below',
  },
  {
    text: 'Tap tiles to place them here in order',
    subtext: 'If you make a mistake, tap a placed tile to remove it.',
    highlight: 'scramble-answer',
    calloutPosition: 'below',
  },
  {
    text: 'Arrange all tiles correctly and you\'re done!',
    subtext: 'Complete it on the first try for a bonus!',
  },
];

/** Reactive narrow-screen check */
const widthSubscribe = (cb: () => void) => { window.addEventListener('resize', cb); return () => window.removeEventListener('resize', cb); };
const getIsNarrow = () => window.innerWidth < 500;

/** Fisher-Yates shuffle (returns a new array) */
function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Shuffle indices, ensuring the result is not the identity permutation */
function shuffleIndices(length: number): number[] {
  const indices = Array.from({ length }, (_, i) => i);
  if (length <= 1) return indices;
  let shuffled: number[];
  do {
    shuffled = shuffle(indices);
  } while (shuffled.every((v, i) => v === i));
  return shuffled;
}

export function SentenceScramble() {
  const activeScrambleGame = useUIStore((s) => s.activeScrambleGame);
  const closeScrambleGame = useUIStore((s) => s.closeScrambleGame);
  const startDialogue = useUIStore((s) => s.startDialogue);
  const inputMode = useUIStore((s) => s.inputMode);
  const setQuestState = useGameStore((s) => s.setQuestState);
  const spendYen = useGameStore((s) => s.spendYen);
  const markEncountered = useVocabularyStore((s) => s.markEncountered);

  const isNarrow = useSyncExternalStore(widthSubscribe, getIsNarrow);
  const panelBorder = isNarrow ? 28 : 52;
  const itemBorder = isNarrow ? 12 : 22;

  // Sentence phase state
  const [sentenceIndex, setSentenceIndex] = useState(0);
  const [placed, setPlaced] = useState<number[]>([]); // original tile indices placed in order
  const [shuffledIndices, setShuffledIndices] = useState<number[]>([]); // scrambled order of tile indices
  const [phase, setPhase] = useState<'sentences' | 'purchase'>('sentences');
  const [feedbackText, setFeedbackText] = useState<string | null>(null);
  const [feedbackKey, setFeedbackKey] = useState(0);
  const [hasWrongAnswer, setHasWrongAnswer] = useState(false);
  const [cursorIndex, setCursorIndex] = useState(0); // index into available (unplaced) tiles
  const [showTutorial, setShowTutorial] = useState(false);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const autoCheckTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout>>();

  // Resolve current scramble set
  const scrambleSet = activeScrambleGame ? SCRAMBLE_SETS[activeScrambleGame] : null;

  // Current sentence
  const currentSentence = scrambleSet?.sentences[sentenceIndex] ?? null;
  const tiles = currentSentence?.tiles ?? [];

  // Available tiles: shuffledIndices filtered to exclude those in placed
  const availableTiles = useMemo(() => {
    const placedSet = new Set(placed);
    return shuffledIndices.filter((idx) => !placedSet.has(idx));
  }, [shuffledIndices, placed]);

  // Initialize when a scramble game opens
  useEffect(() => {
    if (!activeScrambleGame || !scrambleSet) return;

    setSentenceIndex(0);
    setPlaced([]);
    setPhase('sentences');
    setFeedbackText(null);
    setHasWrongAnswer(false);
    setCursorIndex(0);

    const firstSentence = scrambleSet.sentences[0];
    if (firstSentence) {
      setShuffledIndices(shuffleIndices(firstSentence.tiles.length));
    }

    // Show tutorial on first play
    const tutorialDone = useGameStore.getState().questStates.tutorial_scramble_done;
    setShowTutorial(!tutorialDone);
  }, [activeScrambleGame]); // eslint-disable-line react-hooks/exhaustive-deps

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
      if (autoCheckTimerRef.current) clearTimeout(autoCheckTimerRef.current);
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    };
  }, []);

  // Show feedback text briefly, then clear
  const showFeedback = useCallback((text: string) => {
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    setFeedbackText(text);
    setFeedbackKey((k) => k + 1);
    feedbackTimerRef.current = setTimeout(() => setFeedbackText(null), 800);
  }, []);

  // Auto-check when all slots are filled
  useEffect(() => {
    if (phase !== 'sentences' || !currentSentence) return;
    if (placed.length !== tiles.length) return;

    if (autoCheckTimerRef.current) clearTimeout(autoCheckTimerRef.current);
    autoCheckTimerRef.current = setTimeout(() => {
      // Correct order is [0, 1, 2, ...]
      const isCorrect = placed.every((v, i) => v === i);

      if (isCorrect) {
        // Mark vocabulary words as encountered
        for (const tile of tiles) {
          if (tile.wordId) {
            markEncountered(tile.wordId);
          }
        }

        if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
        setFeedbackText('はい！');
        setFeedbackKey((k) => k + 1);

        // Advance after 800ms
        advanceTimerRef.current = setTimeout(() => {
          setFeedbackText(null);
          const nextIndex = sentenceIndex + 1;
          if (scrambleSet && nextIndex < scrambleSet.sentences.length) {
            // Next sentence
            setSentenceIndex(nextIndex);
            setPlaced([]);
            setCursorIndex(0);
            const nextSentence = scrambleSet.sentences[nextIndex];
            if (nextSentence) {
              setShuffledIndices(shuffleIndices(nextSentence.tiles.length));
            }
          } else {
            // All sentences complete - show completion feedback
            const alreadyPlayed = useGameStore.getState().questStates[`scramble_${activeScrambleGame}_done`];
            if (!hasWrongAnswer && !alreadyPlayed) {
              const currentYen = useGameStore.getState().yen;
              useGameStore.getState().setYen(currentYen + FIRST_TRY_BONUS);
              useUIStore.getState().showYenGain(FIRST_TRY_BONUS);
              setFeedbackText(`bonus:+¥${FIRST_TRY_BONUS}`);
              setFeedbackKey((k) => k + 1);
              setQuestState(`scramble_${activeScrambleGame}_done`, 'true');
            } else if (hasWrongAnswer && !alreadyPlayed) {
              setFeedbackText('bonus:none');
              setFeedbackKey((k) => k + 1);
              setQuestState(`scramble_${activeScrambleGame}_done`, 'true');
            } else {
              setFeedbackText('bonus:done');
              setFeedbackKey((k) => k + 1);
            }

            // Transition to purchase phase
            const purchaseTimer = setTimeout(() => {
              setFeedbackText(null);
              setPhase('purchase');
            }, 2500);
            // Store in advanceTimerRef for cleanup
            advanceTimerRef.current = purchaseTimer;
          }
        }, 800);
      } else {
        // Wrong answer
        setHasWrongAnswer(true);

        if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
        setFeedbackText('ちがう！');
        setFeedbackKey((k) => k + 1);

        // Return tiles to pool after shake animation
        feedbackTimerRef.current = setTimeout(() => {
          setFeedbackText(null);
          setPlaced([]);
          setCursorIndex(0);
          setShuffledIndices(shuffleIndices(tiles.length));
        }, 800);
      }
    }, 300);

    return () => {
      if (autoCheckTimerRef.current) clearTimeout(autoCheckTimerRef.current);
    };
  }, [placed, tiles, phase, currentSentence, sentenceIndex, scrambleSet, activeScrambleGame, hasWrongAnswer, setQuestState, markEncountered]); // eslint-disable-line react-hooks/exhaustive-deps

  // Place a tile from the pool into the answer area
  const placeTile = useCallback((originalIndex: number) => {
    if (feedbackText) return; // Don't allow placement during feedback
    setPlaced((prev) => {
      if (prev.includes(originalIndex)) return prev;
      if (prev.length >= tiles.length) return prev;
      return [...prev, originalIndex];
    });
  }, [feedbackText, tiles.length]);

  // Remove the last placed tile (undo)
  const undoLastTile = useCallback(() => {
    if (feedbackText) return;
    setPlaced((prev) => {
      if (prev.length === 0) return prev;
      return prev.slice(0, -1);
    });
  }, [feedbackText]);

  // Remove a specific placed tile by its position in the answer area
  const removePlacedTile = useCallback((positionIndex: number) => {
    if (feedbackText) return;
    setPlaced((prev) => {
      if (positionIndex >= prev.length) return prev;
      return [...prev.slice(0, positionIndex), ...prev.slice(positionIndex + 1)];
    });
  }, [feedbackText]);

  // Handle purchasing the reward item
  const handlePurchase = useCallback(() => {
    if (!scrambleSet) return;
    const reward = scrambleSet.reward;

    const success = spendYen(reward.price);
    if (!success) {
      showFeedback('お金が足りない！');
      return;
    }

    // Mark word as encountered
    if (reward.wordId) {
      markEncountered(reward.wordId);
    }

    // Add item to inventory
    useInventoryStore.getState().addItem(
      reward.itemId,
      reward.itemName,
      reward.itemImage,
    );

    // Show yen spend animation and item toast
    useUIStore.getState().showYenSpend(reward.price);
    useUIStore.getState().showItemToast(reward.itemName, reward.itemImage);

    // Set quest state from data (or fallback for backward compat)
    const questStateKey = scrambleSet.questState || 'stationOmiyageBought';
    setQuestState(questStateKey, 'true');

    // Close the scramble game
    closeScrambleGame();

    // Show follow-up dialogue
    const followUp = NPC_DIALOGUE['douzo_response'];
    if (followUp) {
      setTimeout(() => startDialogue(followUp), 200);
    }
  }, [scrambleSet, spendYen, markEncountered, setQuestState, closeScrambleGame, startDialogue, showFeedback]);

  // Tutorial completion handler
  const handleTutorialComplete = useCallback(() => {
    setShowTutorial(false);
    useGameStore.getState().setQuestState('tutorial_scramble_done', 'done');
  }, []);

  // -- Gamepad: B button --
  useInputAction('cancel', () => {
    if (phase === 'sentences' && placed.length > 0 && !feedbackText) {
      undoLastTile();
    } else {
      closeScrambleGame();
    }
  }, !!activeScrambleGame && !showTutorial);

  // -- Gamepad: Sentence phase navigation --
  const sentenceNavEnabled = !!activeScrambleGame && phase === 'sentences' && !feedbackText && !showTutorial;

  useInputAction('navigate_left', () => {
    setCursorIndex((prev) => {
      if (availableTiles.length === 0) return 0;
      return (prev - 1 + availableTiles.length) % availableTiles.length;
    });
  }, sentenceNavEnabled);

  useInputAction('navigate_right', () => {
    setCursorIndex((prev) => {
      if (availableTiles.length === 0) return 0;
      return (prev + 1) % availableTiles.length;
    });
  }, sentenceNavEnabled);

  useInputAction('confirm', () => {
    if (availableTiles.length === 0) return;
    const clampedCursor = Math.min(cursorIndex, availableTiles.length - 1);
    const originalIndex = availableTiles[clampedCursor];
    if (originalIndex !== undefined) {
      placeTile(originalIndex);
      // Adjust cursor if it would be out of bounds after placement
      const newAvailableLength = availableTiles.length - 1;
      if (clampedCursor >= newAvailableLength && newAvailableLength > 0) {
        setCursorIndex(newAvailableLength - 1);
      }
    }
  }, sentenceNavEnabled);

  // -- Gamepad: Purchase phase --
  const purchaseNavEnabled = !!activeScrambleGame && phase === 'purchase';

  useInputAction('confirm', () => {
    handlePurchase();
  }, purchaseNavEnabled);

  if (!activeScrambleGame || !scrambleSet) return null;

  const isGamepad = inputMode === 'gamepad';

  // Focus style for gamepad-highlighted items
  const focusStyle = {
    outline: '3px solid #d4af37',
    outlineOffset: '-3px',
    background: 'rgba(210, 170, 0, 0.25)',
    animation: 'gamepad-focus-pulse 1s ease-in-out infinite',
  };

  // Whether feedback is a correct/wrong state (for tile coloring)
  const isCorrectFeedback = feedbackText === 'はい！' || feedbackText?.startsWith('bonus:');
  const isWrongFeedback = feedbackText === 'ちがう！';

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
            <button onClick={() => closeScrambleGame()} style={{
              background: 'none', border: 'none', padding: '2px 8px',
              cursor: 'pointer', fontSize: 14, color: UI.text,
              fontFamily: UI_FONT, fontWeight: UI_FONT_BOLD,
            }}>X</button>
          </PixelPanel>
        </div>

        {phase === 'sentences' ? (
          /* -- Sentence Phase -- */
          <>
            {/* English hint */}
            <div style={{
              textAlign: 'center',
              fontSize: 16,
              color: UI.textMuted,
              marginBottom: isNarrow ? 12 : 20,
              fontFamily: UI_FONT,
              fontStyle: 'italic',
            }}>
              &ldquo;{currentSentence?.hint}&rdquo;
            </div>

            {/* Answer slots */}
            <div
              data-tutorial="scramble-answer"
              style={{
                display: 'flex',
                gap: isNarrow ? 4 : 8,
                justifyContent: 'center',
                flexWrap: 'wrap',
                marginBottom: isNarrow ? 16 : 24,
                minHeight: isNarrow ? 44 : 52,
              }}
            >
              {tiles.map((_, slotIndex) => {
                const placedOriginalIndex = placed[slotIndex];
                const isFilled = placedOriginalIndex !== undefined;
                const placedTile = isFilled ? tiles[placedOriginalIndex] : null;

                return (
                  <PixelPanel
                    key={slotIndex}
                    borderWidth={itemBorder}
                    panelOrigin={PANELS.rounded}
                    style={{
                      minWidth: isNarrow ? 56 : 72,
                      animation: isFilled
                        ? isCorrectFeedback
                          ? 'bounce 0.6s ease-in-out'
                          : isWrongFeedback
                            ? 'shake 0.6s ease-in-out'
                            : undefined
                        : undefined,
                    }}
                  >
                    <button
                      onClick={() => isFilled ? removePlacedTile(slotIndex) : undefined}
                      style={{
                        background: isFilled
                          ? isCorrectFeedback
                            ? 'rgba(80, 160, 80, 0.15)'
                            : isWrongFeedback
                              ? 'rgba(200, 60, 60, 0.15)'
                              : 'none'
                          : 'none',
                        border: isFilled
                          ? isCorrectFeedback
                            ? '2px solid #6a6'
                            : isWrongFeedback
                              ? '2px solid #c44'
                              : '2px solid transparent'
                          : '2px dashed ' + UI.textFaded,
                        borderRadius: 4,
                        padding: isNarrow ? '6px 10px' : '8px 14px',
                        cursor: isFilled ? 'pointer' : 'default',
                        width: '100%',
                        minHeight: isNarrow ? 36 : 42,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontFamily: UI_FONT,
                        fontSize: isNarrow ? 16 : 18,
                        fontWeight: UI_FONT_BOLD,
                        color: isFilled
                          ? isCorrectFeedback
                            ? '#6a6'
                            : isWrongFeedback
                              ? '#c44'
                              : UI.text
                          : UI.textFaded,
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {placedTile ? placedTile.text : '\u00A0'}
                    </button>
                  </PixelPanel>
                );
              })}
            </div>

            {/* Tile pool */}
            <div
              data-tutorial="scramble-tiles"
              style={{
                display: 'flex',
                gap: isNarrow ? 4 : 8,
                justifyContent: 'center',
                flexWrap: 'wrap',
                marginBottom: isNarrow ? 12 : 20,
                minHeight: isNarrow ? 44 : 52,
              }}
            >
              {availableTiles.map((originalIndex, availIdx) => {
                const tile = tiles[originalIndex];
                if (!tile) return null;

                const isParticle = !tile.wordId;
                const isFocused = isGamepad && cursorIndex === availIdx;

                return (
                  <PixelPanel
                    key={`pool-${originalIndex}`}
                    borderWidth={itemBorder}
                    panelOrigin={PANELS.rounded}
                    style={{ cursor: 'pointer' }}
                  >
                    <button
                      onClick={() => placeTile(originalIndex)}
                      style={{
                        background: 'none',
                        border: '2px solid transparent',
                        borderRadius: 4,
                        padding: isNarrow ? '6px 12px' : '8px 16px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontFamily: UI_FONT,
                        fontSize: isParticle
                          ? (isNarrow ? 14 : 16)
                          : (isNarrow ? 16 : 18),
                        fontWeight: UI_FONT_BOLD,
                        color: isParticle ? UI.textMuted : UI.text,
                        transition: 'all 0.15s ease',
                        ...(isFocused ? focusStyle : {}),
                      }}
                    >
                      {tile.text}
                    </button>
                  </PixelPanel>
                );
              })}
            </div>

            {/* Feedback text */}
            <div key={feedbackKey} style={{
              textAlign: 'center',
              marginTop: 4,
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

            {/* Progress indicator */}
            <div style={{
              textAlign: 'center',
              fontSize: 12,
              color: UI.textMuted,
              marginTop: 8,
              fontFamily: UI_FONT,
            }}>
              Sentence {sentenceIndex + 1}/{scrambleSet.sentences.length}
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
                ? 'D-Pad to move \u2022 A to place \u2022 B to undo/close'
                : 'Tap words in the right order'}
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
              おみやげ
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
                    src={scrambleSet.reward.itemImage}
                    alt={scrambleSet.reward.itemName}
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
                      {scrambleSet.reward.itemName}
                    </div>
                  </div>
                  <div style={{
                    fontSize: 16,
                    color: UI.text,
                    fontFamily: UI_FONT,
                    fontWeight: UI_FONT_BOLD,
                    whiteSpace: 'nowrap',
                  }}>
                    <img src="/assets/ui/32x32/yen-coin.png" alt="¥" style={{ width: 18, height: 18, imageRendering: 'pixelated', verticalAlign: 'middle', marginRight: 2 }} />{scrambleSet.reward.price}
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
          steps={SCRAMBLE_TUTORIAL_STEPS}
          onComplete={handleTutorialComplete}
        />
      )}
    </div>
  );
}
