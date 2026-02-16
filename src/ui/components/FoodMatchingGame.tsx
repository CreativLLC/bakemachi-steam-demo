import { useState, useEffect, useCallback, useMemo, useRef, useSyncExternalStore } from 'react';
import { useUIStore } from '../../store/uiStore';
import { useGameStore } from '../../store/gameStore';
import { useVocabularyStore } from '../../store/vocabularyStore';
import { useInventoryStore } from '../../store/inventoryStore';
import { FOOD_MENUS } from '../../data/foodMenuData';
import { getWord } from '../../japanese/vocabularyDB';
import { NPC_DIALOGUE } from '../../data/npcDialogue';
import { PixelPanel } from './PixelPanel';
import { TutorialOverlay } from './TutorialOverlay';
import { UI, UI_FONT, UI_FONT_BOLD, PANELS } from '../pixelTheme';
import { useInputAction } from '../hooks/useInputAction';
import { ITEM_HEALING } from '../../data/combatConfig';
import type { TutorialStep } from './TutorialOverlay';
import type { FoodMenuItem } from '../../data/foodMenuData';
import type { Word } from '../../japanese/types';

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

const MATCHING_TUTORIAL_STEPS: TutorialStep[] = [
  {
    text: 'Food Matching Game',
    subtext: 'Match Japanese words to their pictures to learn vocabulary!',
  },
  {
    text: 'On the left are Japanese words, and on the right are pictures.',
    subtext: 'Tap a word, then tap the matching picture!',
    highlight: 'matching-grid',
    calloutPosition: 'below',
  },
  {
    text: 'Match all pairs to complete the round.',
    subtext: 'Get it right on the first try for a bonus!',
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

/** Pick n random items from an array */
function pickRandom<T>(arr: T[], n: number): T[] {
  return shuffle(arr).slice(0, n);
}

interface MatchItem {
  item: FoodMenuItem;
  word: Word;
}

/** Find the next unmatched cursor index in a direction within matching grid */
function findNextUnmatched(
  cursorIndex: number,
  direction: 'up' | 'down',
  matches: Record<string, boolean>,
  shuffledWords: MatchItem[],
  shuffledImages: MatchItem[],
): number {
  const isImageColumn = cursorIndex >= 3;
  const colOffset = isImageColumn ? 3 : 0;
  const items = isImageColumn ? shuffledImages : shuffledWords;
  const localIdx = cursorIndex - colOffset;
  const step = direction === 'down' ? 1 : -1;

  for (let i = 1; i <= items.length; i++) {
    const nextLocal = ((localIdx + step * i) % items.length + items.length) % items.length;
    if (!matches[items[nextLocal].item.wordId]) {
      return nextLocal + colOffset;
    }
  }
  // All matched — stay put
  return cursorIndex;
}

/** Find the first unmatched index in a column */
function findFirstUnmatchedInColumn(
  colOffset: number,
  preferLocal: number,
  matches: Record<string, boolean>,
  items: MatchItem[],
): number {
  // Try to land on the same row first
  if (preferLocal < items.length && !matches[items[preferLocal].item.wordId]) {
    return preferLocal + colOffset;
  }
  // Otherwise find the first unmatched
  for (let i = 0; i < items.length; i++) {
    if (!matches[items[i].item.wordId]) {
      return i + colOffset;
    }
  }
  return preferLocal + colOffset;
}

export function FoodMatchingGame() {
  const activeMatchingGame = useUIStore((s) => s.activeMatchingGame);
  const closeMatchingGame = useUIStore((s) => s.closeMatchingGame);
  const startDialogue = useUIStore((s) => s.startDialogue);
  const inputMode = useUIStore((s) => s.inputMode);
  const setQuestState = useGameStore((s) => s.setQuestState);
  const spendYen = useGameStore((s) => s.spendYen);
  const markEncountered = useVocabularyStore((s) => s.markEncountered);

  const isNarrow = useSyncExternalStore(widthSubscribe, getIsNarrow);
  const panelBorder = isNarrow ? 28 : 52;
  const itemBorder = isNarrow ? 12 : 22;
  const imgSize = isNarrow ? 56 : 64;

  // Phase: 'matching' or 'purchase'
  const [phase, setPhase] = useState<'matching' | 'purchase'>('matching');
  // Selected item: { wordId, side } — can select from either word or image side
  const [selected, setSelected] = useState<{ wordId: string; side: 'word' | 'image' } | null>(null);
  // Matched pairs: wordId -> true
  const [matches, setMatches] = useState<Record<string, boolean>>({});
  // Feedback text shown briefly
  const [feedbackText, setFeedbackText] = useState<string | null>(null);
  // Track whether the player has gotten a wrong answer
  const [hasWrongAnswer, setHasWrongAnswer] = useState(false);
  // Timer ref to prevent feedback text being cleared by stale timeouts
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout>>();
  // Key counter to force feedback div remount (re-triggers CSS animations)
  const [feedbackKey, setFeedbackKey] = useState(0);
  // Briefly tracks the wordId that was just matched (for bounce animation on the pair)
  const [justMatchedId, setJustMatchedId] = useState<string | null>(null);
  const matchAnimTimerRef = useRef<ReturnType<typeof setTimeout>>();

  // Resolved items with their vocabulary words
  const [matchItems, setMatchItems] = useState<MatchItem[]>([]);
  // Shuffled orders (separate for words and images)
  const [shuffledWords, setShuffledWords] = useState<MatchItem[]>([]);
  const [shuffledImages, setShuffledImages] = useState<MatchItem[]>([]);

  // Gamepad cursor for matching phase (0-2 = word column, 3-5 = image column)
  const [cursorIndex, setCursorIndex] = useState(0);
  // Gamepad cursor for purchase phase (0 to matchItems.length-1)
  const [purchaseCursorIndex, setPurchaseCursorIndex] = useState(0);

  // Tutorial state
  const [showTutorial, setShowTutorial] = useState(false);

  // Initialize when a matching game opens
  useEffect(() => {
    if (!activeMatchingGame) return;

    const menu = FOOD_MENUS[activeMatchingGame];
    if (!menu) return;

    // Pick 3 random items
    const picked = pickRandom(menu.items, 3);
    const resolved: MatchItem[] = [];
    for (const item of picked) {
      const word = getWord(item.wordId);
      if (word) {
        resolved.push({ item, word });
      }
    }

    setMatchItems(resolved);
    setShuffledWords(shuffle(resolved));
    setShuffledImages(shuffle(resolved));
    setPhase('matching');
    setSelected(null);
    setMatches({});
    setFeedbackText(null);
    setHasWrongAnswer(false);
    setCursorIndex(0);
    setPurchaseCursorIndex(0);

    // Show tutorial on first play
    const tutorialDone = useGameStore.getState().questStates.tutorial_matching_done;
    setShowTutorial(!tutorialDone);
  }, [activeMatchingGame]);

  // Show feedback text briefly, then clear (cancels any previous timer)
  const showFeedback = useCallback((text: string) => {
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    setFeedbackText(text);
    setFeedbackKey(k => k + 1);
    feedbackTimerRef.current = setTimeout(() => setFeedbackText(null), 800);
  }, []);

  // Count matched items
  const matchCount = useMemo(
    () => Object.keys(matches).length,
    [matches],
  );

  // Transition to purchase phase after all 3 matched
  useEffect(() => {
    if (phase === 'matching' && matchCount === 3) {
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
      const alreadyPlayed = useGameStore.getState().questStates[`matching_${activeMatchingGame}_done`];
      if (!hasWrongAnswer && !alreadyPlayed) {
        // Award yen bonus for first-try perfection
        const currentYen = useGameStore.getState().yen;
        useGameStore.getState().setYen(currentYen + FIRST_TRY_BONUS);
        useUIStore.getState().showYenGain(FIRST_TRY_BONUS);
        setFeedbackText(`bonus:+¥${FIRST_TRY_BONUS}`);
        setFeedbackKey(k => k + 1);
        setQuestState(`matching_${activeMatchingGame}_done`, 'true');
      } else if (hasWrongAnswer && !alreadyPlayed) {
        setFeedbackText('bonus:none');
        setFeedbackKey(k => k + 1);
        setQuestState(`matching_${activeMatchingGame}_done`, 'true');
      } else {
        setFeedbackText('bonus:done');
        setFeedbackKey(k => k + 1);
      }
      const timer = setTimeout(() => {
        setFeedbackText(null);
        setPhase('purchase');
        setPurchaseCursorIndex(0);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [matchCount, phase, hasWrongAnswer, activeMatchingGame, setQuestState]);

  // Try to match two selections
  const attemptMatch = (wordSideId: string, imageSideId: string) => {
    if (wordSideId === imageSideId) {
      setMatches((prev) => ({ ...prev, [wordSideId]: true }));
      setSelected(null);
      // Trigger bounce animation on the matched pair
      if (matchAnimTimerRef.current) clearTimeout(matchAnimTimerRef.current);
      setJustMatchedId(wordSideId);
      matchAnimTimerRef.current = setTimeout(() => setJustMatchedId(null), 600);
      showFeedback('はい！');
    } else {
      setSelected(null);
      setMatches({});
      setJustMatchedId(null);
      const newWords = shuffle(matchItems);
      const newImages = shuffle(matchItems);
      setShuffledWords(newWords);
      setShuffledImages(newImages);
      setHasWrongAnswer(true);
      setCursorIndex(0);
      showFeedback('ちがう！');
    }
  };

  // Handle clicking a word button
  const handleWordClick = (wordId: string) => {
    if (matches[wordId]) return;
    if (selected?.side === 'image') {
      attemptMatch(wordId, selected.wordId);
    } else if (selected?.side === 'word' && selected.wordId === wordId) {
      setSelected(null);
    } else {
      setSelected({ wordId, side: 'word' });
    }
  };

  // Handle clicking an image
  const handleImageClick = (wordId: string) => {
    if (matches[wordId]) return;
    if (selected?.side === 'word') {
      attemptMatch(selected.wordId, wordId);
    } else if (selected?.side === 'image' && selected.wordId === wordId) {
      setSelected(null);
    } else {
      setSelected({ wordId, side: 'image' });
    }
  };

  // Handle purchasing an item
  const handlePurchase = (matchItem: MatchItem) => {
    const success = spendYen(matchItem.item.price);
    if (!success) {
      showFeedback('お金が足りない！');
      return;
    }

    // Mark word as encountered
    markEncountered(matchItem.item.wordId);

    // Add item to inventory
    useInventoryStore.getState().addItem(
      matchItem.item.id,
      matchItem.word.kana,
      matchItem.item.image
    );

    // Show yen spend animation and item toast
    useUIStore.getState().showYenSpend(matchItem.item.price);
    useUIStore.getState().showItemToast(matchItem.word.kana, matchItem.item.image);

    // Set quest state based on which matching game this is
    if (activeMatchingGame === 'vending_machine') {
      setQuestState('stationDrinkBought', 'true');
    } else if (activeMatchingGame === 'gift_shop') {
      setQuestState('stationSisterPresentBought', 'true');
    } else {
      setQuestState('stationFoodBought', 'true');
    }

    // Close the matching game
    closeMatchingGame();

    // Show follow-up dialogue
    const followUp = NPC_DIALOGUE['douzo_response'];
    if (followUp) {
      setTimeout(() => startDialogue(followUp), 200);
    }
  };

  // Tutorial completion handler
  const handleTutorialComplete = useCallback(() => {
    setShowTutorial(false);
    useGameStore.getState().setQuestState('tutorial_matching_done', 'done');
  }, []);

  // ── Gamepad: B button to close ──
  useInputAction('cancel', () => closeMatchingGame(), !!activeMatchingGame && !showTutorial);

  // ── Gamepad: Matching phase navigation ──
  const matchingNavEnabled = !!activeMatchingGame && phase === 'matching' && !feedbackText && !showTutorial;

  useInputAction('navigate_up', () => {
    setCursorIndex((prev) =>
      findNextUnmatched(prev, 'up', matches, shuffledWords, shuffledImages)
    );
  }, matchingNavEnabled);

  useInputAction('navigate_down', () => {
    setCursorIndex((prev) =>
      findNextUnmatched(prev, 'down', matches, shuffledWords, shuffledImages)
    );
  }, matchingNavEnabled);

  useInputAction('navigate_left', () => {
    setCursorIndex((prev) => {
      const localIdx = prev % 3;
      return findFirstUnmatchedInColumn(0, localIdx, matches, shuffledWords);
    });
  }, matchingNavEnabled);

  useInputAction('navigate_right', () => {
    setCursorIndex((prev) => {
      const localIdx = prev % 3;
      return findFirstUnmatchedInColumn(3, localIdx, matches, shuffledImages);
    });
  }, matchingNavEnabled);

  useInputAction('confirm', () => {
    if (cursorIndex < 3) {
      const mi = shuffledWords[cursorIndex];
      if (mi) handleWordClick(mi.item.wordId);
    } else {
      const mi = shuffledImages[cursorIndex - 3];
      if (mi) handleImageClick(mi.item.wordId);
    }
  }, matchingNavEnabled);

  // ── Gamepad: Purchase phase navigation ──
  const purchaseNavEnabled = !!activeMatchingGame && phase === 'purchase';

  useInputAction('navigate_up', () => {
    setPurchaseCursorIndex((prev) => Math.max(0, prev - 1));
  }, purchaseNavEnabled);

  useInputAction('navigate_down', () => {
    setPurchaseCursorIndex((prev) => Math.min(matchItems.length - 1, prev + 1));
  }, purchaseNavEnabled);

  useInputAction('confirm', () => {
    const mi = matchItems[purchaseCursorIndex];
    if (mi) handlePurchase(mi);
  }, purchaseNavEnabled);

  if (!activeMatchingGame) return null;

  const menu = FOOD_MENUS[activeMatchingGame];
  if (!menu) return null;

  const isGamepad = inputMode === 'gamepad';

  // Focus style for gamepad-highlighted items
  const focusStyle = {
    outline: '3px solid #d4af37',
    outlineOffset: '-3px',
    background: 'rgba(210, 170, 0, 0.25)',
    animation: 'gamepad-focus-pulse 1s ease-in-out infinite',
  };

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
            <button onClick={() => closeMatchingGame()} style={{
              background: 'none', border: 'none', padding: '2px 8px',
              cursor: 'pointer', fontSize: 14, color: UI.text,
              fontFamily: UI_FONT, fontWeight: UI_FONT_BOLD,
            }}>X</button>
          </PixelPanel>
        </div>

        {phase === 'matching' ? (
          /* ── Matching Phase ── */
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
              どれが どれ？
            </div>
            <div style={{
              textAlign: 'center',
              fontSize: 11,
              color: UI.textMuted,
              marginBottom: 20,
              fontFamily: UI_FONT,
            }}>
              Match each word to its food
            </div>

            {/* Matching grid: words on left, images on right — interleaved rows */}
            <div
              data-tutorial="matching-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: '7fr 3fr',
                gap: 2,
                alignItems: 'stretch',
              }}
            >
              {shuffledWords.map((mi, idx) => {
                const wordMatched = matches[mi.item.wordId];
                const wordSelected = selected?.side === 'word' && selected.wordId === mi.item.wordId;
                const wordFocused = isGamepad && cursorIndex === idx;
                const wordJustMatched = justMatchedId === mi.item.wordId;

                const imgMi = shuffledImages[idx];
                const imgMatched = matches[imgMi.item.wordId];
                const imgSelected = selected?.side === 'image' && selected.wordId === imgMi.item.wordId;
                const imgFocused = isGamepad && cursorIndex === idx + 3;
                const imgJustMatched = justMatchedId === imgMi.item.wordId;

                return [
                  <PixelPanel
                    key={`word-${mi.item.wordId}`}
                    borderWidth={itemBorder}
                    panelOrigin={PANELS.rounded}
                    style={{
                      cursor: wordMatched ? 'default' : 'pointer',
                      opacity: wordMatched && !wordJustMatched ? 0.6 : 1,
                      animation: wordJustMatched ? 'bounce 0.6s ease-in-out' : undefined,
                      display: 'flex',
                    }}
                  >
                    <button
                      onClick={() => handleWordClick(mi.item.wordId)}
                      disabled={wordMatched}
                      style={{
                        background: wordSelected
                          ? 'rgba(184, 150, 10, 0.2)'
                          : wordMatched
                            ? 'rgba(80, 160, 80, 0.15)'
                            : 'none',
                        border: wordSelected
                          ? `2px solid ${UI.goldBright}`
                          : wordMatched
                            ? '2px solid #6a6'
                            : '2px solid transparent',
                        borderRadius: 4,
                        padding: 0,
                        cursor: wordMatched ? 'default' : 'pointer',
                        width: '100%',
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontFamily: UI_FONT,
                        fontSize: isNarrow ? 16 : 18,
                        fontWeight: UI_FONT_BOLD,
                        color: wordMatched ? '#6a6' : UI.text,
                        transition: 'all 0.15s ease',
                        ...(wordFocused ? focusStyle : {}),
                      }}
                    >
                      {mi.word.kana}
                    </button>
                  </PixelPanel>,
                  <PixelPanel
                    key={`img-${imgMi.item.id}`}
                    borderWidth={itemBorder}
                    panelOrigin={PANELS.rounded}
                    style={{
                      cursor: imgMatched ? 'default' : 'pointer',
                      opacity: imgMatched && !imgJustMatched ? 0.6 : 1,
                      animation: imgJustMatched ? 'bounce 0.6s ease-in-out' : undefined,
                      display: 'flex',
                    }}
                  >
                    <button
                      onClick={() => handleImageClick(imgMi.item.wordId)}
                      disabled={imgMatched}
                      style={{
                        background: imgSelected
                          ? 'rgba(184, 150, 10, 0.2)'
                          : imgMatched
                            ? 'rgba(80, 160, 80, 0.15)'
                            : 'none',
                        border: imgSelected
                          ? `2px solid ${UI.goldBright}`
                          : imgMatched
                            ? '2px solid #6a6'
                            : '2px solid transparent',
                        borderRadius: 4,
                        padding: 4,
                        cursor: imgMatched ? 'default' : 'pointer',
                        width: '100%',
                        flex: 1,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        transition: 'all 0.15s ease',
                        ...(imgFocused ? focusStyle : {}),
                      }}
                    >
                      <img
                        src={imgMi.item.image}
                        alt={imgMi.word.meaning}
                        style={{
                          width: imgSize,
                          height: imgSize,
                          objectFit: 'contain',
                          imageRendering: 'pixelated',
                        }}
                      />
                    </button>
                  </PixelPanel>,
                ];
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
                : 'Click a word or image, then click its match'}
            </div>
          </>
        ) : (
          /* ── Purchase Phase ── */
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
              どれが ほしい？
            </div>
            <div style={{
              textAlign: 'center',
              fontSize: 11,
              color: UI.textMuted,
              marginBottom: 20,
              fontFamily: UI_FONT,
            }}>
              Which do you want?
            </div>

            {/* Purchase items */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: isNarrow ? 2 : 4,
            }}>
              {matchItems.map((mi, idx) => {
                const isFocused = isGamepad && purchaseCursorIndex === idx;

                return (
                  <PixelPanel
                    key={mi.item.id}
                    borderWidth={itemBorder}
                    panelOrigin={PANELS.rounded}
                    style={{ cursor: 'pointer' }}
                  >
                    <button
                      onClick={() => handlePurchase(mi)}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: '10px 16px',
                        cursor: 'pointer',
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 16,
                        ...(isFocused ? focusStyle : {}),
                      }}
                    >
                      <img
                        src={mi.item.image}
                        alt={mi.word.meaning}
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
                          {mi.word.kana}
                        </div>
                        {ITEM_HEALING[mi.item.id] && (
                          <div style={{
                            fontSize: 12,
                            color: '#2a8a4e',
                            fontFamily: UI_FONT,
                          }}>
                            HP+{ITEM_HEALING[mi.item.id]}
                          </div>
                        )}
                      </div>
                      <div style={{
                        fontSize: 16,
                        color: UI.text,
                        fontFamily: UI_FONT,
                        fontWeight: UI_FONT_BOLD,
                        whiteSpace: 'nowrap',
                      }}>
                        <img src="/assets/ui/32x32/yen-coin.png" alt="¥" style={{ width: 18, height: 18, imageRendering: 'pixelated', verticalAlign: 'middle', marginRight: 2 }} />{mi.item.price}
                      </div>
                    </button>
                  </PixelPanel>
                );
              })}
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
                ? 'D-Pad to move \u2022 A to buy \u2022 B to close'
                : 'Click an item to buy'}
            </div>
          </>
        )}
      </PixelPanel>

      {/* Tutorial overlay */}
      {showTutorial && (
        <TutorialOverlay
          steps={MATCHING_TUTORIAL_STEPS}
          onComplete={handleTutorialComplete}
        />
      )}
    </div>
  );
}
