import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { useUIStore } from '../../store/uiStore';
import { useGameStore } from '../../store/gameStore';
import { useVocabularyStore } from '../../store/vocabularyStore';
import { getWord } from '../../japanese/vocabularyDB';
import { NPC_DIALOGUE } from '../../data/npcDialogue';
import { PixelPanel } from './PixelPanel';
import { UI, UI_FONT, UI_FONT_BOLD, PANELS } from '../pixelTheme';
import { useInputAction } from '../hooks/useInputAction';
import { GamepadIcon } from './GamepadIcon';
import type { TextSegment, DialogueChoice } from '../../japanese/types';

/** Reactive mobile check (768px) */
const mobileSubscribe = (cb: () => void) => { window.addEventListener('resize', cb); return () => window.removeEventListener('resize', cb); };
const getIsMobile = () => window.innerWidth <= 768;

const HOLD_DELAY_MS = 300;

const QUIZ_ANIM_STYLES = `
@keyframes quiz-shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-8px); }
  20%, 40%, 60%, 80% { transform: translateX(8px); }
}
@keyframes quiz-bounce {
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

/** Map speaker names to portrait image paths */
const SPEAKER_PORTRAITS: Record<string, string> = {
  '田中さん': '/assets/ui/portraits/fixer.png',
  'あなた': '/assets/ui/portraits/main-character-male.png',
  'You': '/assets/ui/portraits/main-character-male-on-phone.png',
  'Mom': '/assets/ui/portraits/mother-on-phone.png',
};

// --- Unified spatial navigation types ---
interface FocusableItem {
  id: string;          // "word:0", "choice:1", etc.
  type: 'word' | 'choice';
  index: number;       // index in interactiveSegments or choices array
  row: number;         // approximate row for spatial nav
  col: number;         // approximate column for spatial nav
}

function findBestItem(
  items: FocusableItem[],
  currentId: string | null,
  direction: 'up' | 'down' | 'left' | 'right',
): string | null {
  if (items.length === 0) return null;
  if (currentId === null) return items[0].id;

  const current = items.find(i => i.id === currentId);
  if (!current) return items[0].id;

  let candidates: FocusableItem[];
  switch (direction) {
    case 'right':
      candidates = items.filter(i => i.col > current.col || (i.col === current.col && i.row > current.row));
      break;
    case 'left':
      candidates = items.filter(i => i.col < current.col || (i.col === current.col && i.row < current.row));
      break;
    case 'down':
      candidates = items.filter(i => i.row > current.row);
      break;
    case 'up':
      candidates = items.filter(i => i.row < current.row);
      break;
  }

  if (candidates.length === 0) return currentId; // Stay put

  // Sort by distance (Manhattan-ish, preferring the primary axis)
  candidates.sort((a, b) => {
    const distA = Math.abs(a.row - current.row) * 2 + Math.abs(a.col - current.col);
    const distB = Math.abs(b.row - current.row) * 2 + Math.abs(b.col - current.col);
    return distA - distB;
  });

  return candidates[0].id;
}

export function DialogueBox() {
  const { activeDialogue, currentLineIndex, isDialogueActive, advanceLine, dialogueFocusActive } = useUIStore();
  const setQuestState = useGameStore((s) => s.setQuestState);
  const [translationState, setTranslationState] = useState<'hidden' | 'confirming' | 'shown'>('hidden');
  const [quizFeedback, setQuizFeedback] = useState<string | null>(null);
  const [quizSelectedIndex, setQuizSelectedIndex] = useState<number | null>(null);
  const [hasWrongAnswer, setHasWrongAnswer] = useState(false);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const inputMode = useUIStore((s) => s.inputMode);
  const isMobile = useSyncExternalStore(mobileSubscribe, getIsMobile);

  // --- Unified focus state ---
  const [focusedItemId, setFocusedItemId] = useState<string | null>(null);
  const prevFocusRef = useRef<string | null>(null);
  const wordElRefs = useRef<Map<number, HTMLSpanElement>>(new Map());

  // Reset translation state and quiz feedback when line changes
  useEffect(() => {
    setTranslationState('hidden');
    setQuizFeedback(null);
  }, [currentLineIndex]);

  // Reset quiz feedback when dialogue node changes
  useEffect(() => {
    setQuizFeedback(null);
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
  }, [activeDialogue?.id]);

  // Reset hasWrongAnswer when the quiz changes
  const quizId = activeDialogue?.quizId;
  useEffect(() => {
    setHasWrongAnswer(false);
  }, [quizId]);

  // Reset focusedItemId when line changes, dialogue changes, or leaving gamepad mode
  useEffect(() => {
    setFocusedItemId(null);
  }, [currentLineIndex, activeDialogue]);

  useEffect(() => {
    if (inputMode !== 'gamepad') {
      setFocusedItemId(null);
    }
  }, [inputMode]);

  // Compute interactive segment indices for word navigation
  const currentLine = activeDialogue?.lines[currentLineIndex];
  const interactiveSegments = useMemo(() => {
    if (!currentLine) return [];
    const indices: number[] = [];
    currentLine.segments.forEach((seg, i) => {
      if (seg.type === 'word' && seg.wordId) {
        indices.push(i);
      }
    });
    return indices;
  }, [currentLine]);

  const showChoicesComputed = activeDialogue &&
    currentLineIndex >= (activeDialogue.lines.length - 1) &&
    activeDialogue.choices && activeDialogue.choices.length > 0;

  // Build focusable items array
  const focusableItems = useMemo(() => {
    const items: FocusableItem[] = [];

    // Words: row 0, sequential columns
    interactiveSegments.forEach((_, idx) => {
      items.push({
        id: `word:${idx}`,
        type: 'word',
        index: idx,
        row: 0,
        col: idx,
      });
    });

    // Choices: row 1, sequential columns (only when choices are visible)
    if (showChoicesComputed && activeDialogue?.choices) {
      activeDialogue.choices.forEach((_, idx) => {
        items.push({
          id: `choice:${idx}`,
          type: 'choice',
          index: idx,
          row: 1,
          col: idx,
        });
      });
    }

    return items;
  }, [interactiveSegments, showChoicesComputed, activeDialogue?.choices]);

  // Sync dialogueFocusActive flag to uiStore
  useEffect(() => {
    useUIStore.getState().setDialogueFocusActive(focusedItemId !== null);
  }, [focusedItemId]);

  // Clear dialogueFocusActive on unmount
  useEffect(() => {
    return () => {
      useUIStore.getState().setDialogueFocusActive(false);
    };
  }, []);

  // Dismiss word popup when navigating away from a word
  useEffect(() => {
    if (prevFocusRef.current?.startsWith('word:') && focusedItemId !== prevFocusRef.current) {
      useUIStore.getState().hideWordPopup();
    }
    prevFocusRef.current = focusedItemId;
  }, [focusedItemId]);

  // --- Unified navigation hooks ---
  const navEnabled = isDialogueActive && inputMode === 'gamepad' && focusableItems.length > 0 && !quizFeedback;

  useInputAction('navigate_right', () => {
    setFocusedItemId(prev => findBestItem(focusableItems, prev, 'right'));
  }, navEnabled);

  useInputAction('navigate_left', () => {
    setFocusedItemId(prev => findBestItem(focusableItems, prev, 'left'));
  }, navEnabled);

  useInputAction('navigate_down', () => {
    setFocusedItemId(prev => findBestItem(focusableItems, prev, 'down'));
  }, navEnabled);

  useInputAction('navigate_up', () => {
    setFocusedItemId(prev => findBestItem(focusableItems, prev, 'up'));
  }, navEnabled);

  // --- A button: confirm on focused item ---
  useInputAction('confirm', () => {
    if (!focusedItemId) return;

    const item = focusableItems.find(i => i.id === focusedItemId);
    if (!item) return;

    if (item.type === 'word') {
      const segIndex = interactiveSegments[item.index];
      const seg = currentLine?.segments[segIndex];
      if (seg?.wordId) {
        const word = getWord(seg.wordId);
        if (word) {
          useVocabularyStore.getState().markTapped(seg.wordId);
          // Position popup relative to the word element
          const el = wordElRefs.current.get(item.index);
          let px = window.innerWidth / 2;
          let py = window.innerHeight / 2;
          if (el) {
            const rect = el.getBoundingClientRect();
            px = rect.left + rect.width / 2;
            py = rect.top;
          }
          useUIStore.getState().showWordPopup(word, px, py);
        }
      }
    } else if (item.type === 'choice' && activeDialogue?.choices) {
      handleChoice(activeDialogue.choices[item.index]);
    }
  }, navEnabled && focusedItemId !== null);

  // --- B button: dismiss popup ---
  useInputAction('cancel', () => {
    if (focusedItemId?.startsWith('word:')) {
      useUIStore.getState().hideWordPopup();
      setFocusedItemId(null);
    }
  }, isDialogueActive && focusedItemId !== null);

  // --- X button (gamepad): toggle English translation directly ---
  useInputAction('toggle_translation', () => {
    setTranslationState(prev => prev === 'shown' ? 'hidden' : 'shown');
  }, isDialogueActive && !showChoicesComputed);

  if (!isDialogueActive || !activeDialogue) return null;

  const line = activeDialogue.lines[currentLineIndex];
  const isLastLine = currentLineIndex === activeDialogue.lines.length - 1;
  const showChoices = isLastLine && activeDialogue.choices && activeDialogue.choices.length > 0;
  const portrait = activeDialogue.speakerPortrait ?? SPEAKER_PORTRAITS[activeDialogue.speaker];

  const handleChoice = (choice: DialogueChoice) => {
    const isQuiz = choice.isCorrect !== undefined && activeDialogue.quizId;

    if (isQuiz) {
      // Track which button was selected for animation
      const choiceIdx = activeDialogue.choices?.indexOf(choice) ?? null;
      setQuizSelectedIndex(choiceIdx);

      // Cancel any pending feedback timer
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);

      if (choice.isCorrect) {
        // Correct answer
        const questKey = `quiz_${activeDialogue.quizId}_done`;
        const alreadyDone = useGameStore.getState().questStates[questKey];
        const bonus = activeDialogue.quizBonus ?? 0;

        if (!hasWrongAnswer && !alreadyDone && bonus > 0) {
          // First-try bonus
          const currentYen = useGameStore.getState().yen;
          useGameStore.getState().setYen(currentYen + bonus);
          useUIStore.getState().showYenGain(bonus);
          setQuizFeedback(`bonus:+¥${bonus}`);
          setQuestState(questKey, 'true');
        } else if (hasWrongAnswer && !alreadyDone) {
          setQuizFeedback('bonus:none');
          setQuestState(questKey, 'true');
        } else {
          setQuizFeedback('correct');
        }

        feedbackTimerRef.current = setTimeout(() => {
          setQuizFeedback(null);
          setQuizSelectedIndex(null);
          // Continue to next dialogue node
          const nextNode = NPC_DIALOGUE[choice.leadsTo];
          if (nextNode) {
            useUIStore.getState().startDialogue(nextNode);
          } else {
            useUIStore.getState().closeDialogue();
          }
        }, 1500);
      } else {
        // Wrong answer
        setHasWrongAnswer(true);
        setQuizFeedback('wrong');

        feedbackTimerRef.current = setTimeout(() => {
          setQuizFeedback(null);
          setQuizSelectedIndex(null);
          // Re-start the same dialogue to loop the question
          if (activeDialogue) {
            useUIStore.getState().startDialogue(activeDialogue);
          }
        }, 1500);
      }
      return;
    }

    // Normal (non-quiz) choice handling
    const nextNode = NPC_DIALOGUE[choice.leadsTo];
    if (nextNode) {
      useUIStore.getState().startDialogue(nextNode);
    } else {
      useUIStore.getState().closeDialogue();
    }
  };

  const handleDialogueTap = (e: React.MouseEvent<HTMLDivElement>) => {
    // Don't advance if clicking a button or interactive element
    if ((e.target as HTMLElement).closest('button')) return;
    // Don't advance if gamepad focus is active (user is navigating words/choices)
    if (dialogueFocusActive) return;
    // Don't advance if choices are showing on the last line
    if (activeDialogue.choices && activeDialogue.choices.length > 0 &&
        currentLineIndex >= activeDialogue.lines.length - 1) return;
    advanceLine();
  };

  return (
    <div onClick={handleDialogueTap} style={{ cursor: 'pointer' }}>
    <PixelPanel
      panelOrigin={PANELS.rounded}
      borderWidth={isMobile ? 32 : 52}
      style={{
        position: 'absolute',
        bottom: isMobile ? 8 : 8,
        left: '50%',
        transform: 'translateX(-50%)',
        width: isMobile ? 'min(99%, 700px)' : 'min(95%, 900px)',
        padding: isMobile ? '6px 10px 4px' : '14px 20px 10px',
        zIndex: 100,
      }}
    >
      {/* Speaker nameplate — always in the same position */}
      {activeDialogue.speaker && (
        <PixelPanel
          borderWidth={isMobile ? 14 : 22}
          panelOrigin={PANELS.rounded}
          style={{
            position: 'absolute',
            left: 10,
            top: isMobile ? -36 : -50,
            padding: isMobile ? '1px 8px' : '2px 14px',
            zIndex: 2,
          }}
        >
          {activeDialogue.speakerWordId ? (
            <SpeakerNameplate
              name={activeDialogue.speaker}
              wordId={activeDialogue.speakerWordId}
            />
          ) : (
            <span style={{
              fontSize: 14,
              color: UI.text,
              fontFamily: UI_FONT,
              fontWeight: UI_FONT_BOLD,
              whiteSpace: 'nowrap',
            }}>
              {activeDialogue.speaker}
            </span>
          )}
        </PixelPanel>
      )}

      {/* Portrait — sits above the dialogue panel */}
      {portrait && (
        <PixelPanel
          borderWidth={isMobile ? 28 : 52}
          panelOrigin={PANELS.rounded}
          style={{
            position: 'absolute',
            left: isMobile ? -28 : -52,
            top: isMobile ? 12 : 24,
            transform: 'translateY(-100%)',
            padding: 0,
            zIndex: 1,
          }}
        >
          <img
            src={portrait}
            alt={activeDialogue.speaker}
            style={{
              width: isMobile ? 90 : 140,
              height: isMobile ? 90 : 140,
              imageRendering: 'pixelated',
              display: 'block',
              marginBottom: -4,
            }}
          />
        </PixelPanel>
      )}

      {/* Japanese text with tappable segments */}
      <div style={{
        fontSize: isMobile ? 16 : 22,
        lineHeight: isMobile ? 1.5 : 1.8,
        marginTop: isMobile ? 4 : 8,
        marginBottom: isMobile ? 4 : 8,
        letterSpacing: '0.05em',
        fontFamily: UI_FONT,
        fontWeight: UI_FONT_BOLD,
      }}>
        {line.segments.map((segment, i) => {
          const interactiveIdx = interactiveSegments.indexOf(i);
          const isFocused = focusedItemId === `word:${interactiveIdx}`;
          return (
            <WordSegment
              key={`${currentLineIndex}-${i}`}
              segment={segment}
              isFocused={isFocused}
              elRef={interactiveIdx >= 0 ? (el: HTMLSpanElement | null) => {
                if (el) wordElRefs.current.set(interactiveIdx, el);
                else wordElRefs.current.delete(interactiveIdx);
              } : undefined}
            />
          );
        })}
      </div>

      {/* Inject quiz animation styles */}
      <style>{QUIZ_ANIM_STYLES}</style>

      {/* Choice buttons — always visible, animate in place during quiz feedback */}
      {showChoices && (
        <>
          <div style={{
            display: 'flex',
            gap: isMobile ? 6 : 10,
            justifyContent: 'center',
            margin: isMobile ? '4px 0 6px' : '8px 0 12px',
          }}>
            {activeDialogue.choices!.map((choice, index) => {
              const isChoiceFocused = focusedItemId === `choice:${index}`;
              const isQuizSelected = quizSelectedIndex === index && quizFeedback !== null;
              const isCorrectFeedback = isQuizSelected && quizFeedback !== 'wrong';
              const isWrongFeedback = isQuizSelected && quizFeedback === 'wrong';

              // During feedback, highlight the correct answer green (even if not selected)
              const isCorrectAnswer = quizFeedback !== null && choice.isCorrect === true;

              let btnBackground = 'none';
              let btnBorder = '3px solid transparent';
              let btnColor = UI.text;
              let btnAnimation = 'none';
              let btnTransform = 'none';

              if (isWrongFeedback) {
                // Selected wrong answer: red + shake
                btnBackground = 'rgba(200, 60, 60, 0.25)';
                btnBorder = '3px solid #c44';
                btnColor = '#c44';
                btnAnimation = 'quiz-shake 0.6s ease-in-out';
              } else if (isCorrectFeedback || isCorrectAnswer) {
                // Correct answer: green + bounce
                btnBackground = 'rgba(40, 160, 80, 0.25)';
                btnBorder = '3px solid #2a8a4e';
                btnColor = '#2a8a4e';
                btnAnimation = isCorrectFeedback ? 'quiz-bounce 0.6s ease-in-out' : 'none';
              } else if (quizFeedback !== null) {
                // Other buttons during feedback: dim
                btnColor = UI.textFaded;
              } else if (isChoiceFocused) {
                // Gamepad focus (no feedback active)
                btnBackground = 'rgba(210, 170, 0, 0.25)';
                btnBorder = '3px solid #d4af37';
                btnAnimation = 'gamepad-focus-pulse 1s ease-in-out infinite';
                btnTransform = 'scale(1.05)';
              }

              return (
                <PixelPanel
                  key={choice.leadsTo}
                  borderWidth={isMobile ? 12 : 22}
                  style={{ cursor: quizFeedback ? 'default' : 'pointer' }}
                >
                  <button
                    onClick={() => { if (!quizFeedback) handleChoice(choice); }}
                    onPointerEnter={() => { if (!quizFeedback) setFocusedItemId(`choice:${index}`); }}
                    disabled={!!quizFeedback}
                    style={{
                      background: btnBackground,
                      border: btnBorder,
                      borderRadius: 4,
                      color: btnColor,
                      fontSize: isMobile ? 14 : 18,
                      padding: isMobile ? '2px 8px' : '4px 16px',
                      cursor: quizFeedback ? 'default' : 'pointer',
                      fontFamily: UI_FONT,
                      fontWeight: UI_FONT_BOLD,
                      transform: btnTransform,
                      animation: btnAnimation,
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {choice.japanese}
                    {choice.isCorrect === undefined && (
                      <span style={{ fontSize: 12, color: UI.textMuted, marginLeft: 6 }}>
                        ({choice.english})
                      </span>
                    )}
                  </button>
                </PixelPanel>
              );
            })}
          </div>

          {/* Bonus/feedback text below buttons */}
          {quizFeedback && quizFeedback.startsWith('bonus:') && (
            <div style={{ textAlign: 'center', marginBottom: 4 }}>
              {quizFeedback === 'bonus:none' ? (
                <div style={{ fontSize: 11, fontFamily: UI_FONT, color: UI.textMuted }}>
                  No yen reward this time!
                </div>
              ) : quizFeedback !== 'bonus:done' && (
                <div style={{
                  fontSize: 16,
                  fontFamily: UI_FONT,
                  fontWeight: UI_FONT_BOLD,
                  color: '#2a8a4e',
                  animation: 'quiz-bounce 0.6s ease-in-out',
                }}>
                  +<img src="/assets/ui/32x32/yen-coin.png" alt="¥" style={{ width: 18, height: 18, imageRendering: 'pixelated', verticalAlign: 'middle', margin: '0 2px' }} />{activeDialogue.quizBonus ?? 0}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* English translation area */}
      <div style={{
        borderTop: `1px solid ${UI.textFaded}40`,
        paddingTop: isMobile ? 4 : 8,
        marginBottom: isMobile ? 2 : 4,
        minHeight: isMobile ? 18 : 24,
      }}>
        {translationState === 'hidden' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {inputMode === 'gamepad' && <GamepadIcon button="x" size={22} />}
            <button
              onClick={() => {
                if (inputMode === 'gamepad') {
                  setTranslationState('shown');
                } else {
                  setTranslationState('confirming');
                }
              }}
              style={{
                background: 'none',
                border: `1px solid ${UI.textFaded}80`,
                borderRadius: 4,
                color: UI.textFaded,
                fontSize: 11,
                padding: '2px 10px',
                cursor: 'pointer',
                fontFamily: UI_FONT,
              }}
            >
              Show English?
            </button>
          </div>
        )}
        {translationState === 'confirming' && (
          <div style={{ fontSize: 12, color: UI.textMuted, fontFamily: UI_FONT }}>
            <span style={{ marginRight: 8 }}>Are you sure?</span>
            <button
              onClick={() => setTranslationState('shown')}
              style={{
                background: 'none',
                border: `1px solid ${UI.gold}`,
                borderRadius: 4,
                color: UI.gold,
                fontSize: 11,
                padding: '2px 10px',
                cursor: 'pointer',
                marginRight: 6,
                fontFamily: UI_FONT,
              }}
            >
              Yes
            </button>
            <button
              onClick={() => setTranslationState('hidden')}
              style={{
                background: 'none',
                border: `1px solid ${UI.textFaded}80`,
                borderRadius: 4,
                color: UI.textFaded,
                fontSize: 11,
                padding: '2px 10px',
                cursor: 'pointer',
                fontFamily: UI_FONT,
              }}
            >
              No
            </button>
          </div>
        )}
        {translationState === 'shown' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {inputMode === 'gamepad' && <GamepadIcon button="x" size={22} />}
            <div style={{ fontSize: 13, color: UI.textMuted, fontFamily: UI_FONT }}>
              {line.english}
            </div>
          </div>
        )}
      </div>

      {/* Input hints — dynamic based on input mode */}
      <div style={{
        fontSize: 10,
        color: UI.textFaded,
        fontFamily: UI_FONT,
        lineHeight: 1.6,
        opacity: 0.7,
      }}>
        {inputMode === 'gamepad' ? (
          <div>D-pad to select words, <GamepadIcon button="a" size={12} /> show definition, <GamepadIcon button="b" size={12} /> deselect</div>
        ) : (
          <div>Hold underlined words for definition</div>
        )}
      </div>

      {/* Advance hint — absolute top-right */}
      <div style={{
        position: 'absolute',
        top: isMobile ? 4 : 8,
        right: isMobile ? 6 : 12,
        fontSize: isMobile ? 10 : 11,
        color: UI.textFaded,
        fontFamily: UI_FONT,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        opacity: 0.7,
        pointerEvents: 'none',
      }}>
        {showChoices && quizFeedback ? null : showChoices ? (
          inputMode === 'gamepad'
            ? <><GamepadIcon button="a" size={14} /></>
            : null
        ) : (
          <>
            {inputMode === 'gamepad'
              ? <GamepadIcon button="a" size={14} />
              : inputMode === 'touch'
                ? <span>tap</span>
                : <span>[Space]</span>
            }
            <img src="/assets/ui/32x32/chevron-right.png" alt=">" style={{ height: 12, imageRendering: 'pixelated' }} />
          </>
        )}
      </div>
    </PixelPanel>
    </div>
  );
}

/** Tappable speaker nameplate — hold to see word definition */
function SpeakerNameplate({ name, wordId }: { name: string; wordId: string }) {
  const [holdTimer, setHoldTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const showWordPopup = useUIStore((s) => s.showWordPopup);
  const markTapped = useVocabularyStore((s) => s.markTapped);
  const markEncountered = useVocabularyStore((s) => s.markEncountered);
  const lastMarkedRef = useRef<string | null>(null);

  useEffect(() => {
    if (wordId !== lastMarkedRef.current) {
      lastMarkedRef.current = wordId;
      markEncountered(wordId);
    }
  }, [wordId, markEncountered]);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    const timer = setTimeout(() => {
      const word = getWord(wordId);
      if (word) {
        markTapped(wordId);
        const rect = (e.target as HTMLElement).getBoundingClientRect();
        showWordPopup(word, rect.left + rect.width / 2, rect.top);
      }
    }, HOLD_DELAY_MS);
    setHoldTimer(timer);
  };

  const handlePointerUp = () => {
    if (holdTimer) { clearTimeout(holdTimer); setHoldTimer(null); }
  };

  return (
    <span
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      style={{
        fontSize: 14,
        color: UI.text,
        fontFamily: UI_FONT,
        fontWeight: UI_FONT_BOLD,
        whiteSpace: 'nowrap',
        cursor: 'pointer',
        borderBottom: '1px dotted rgba(60, 120, 200, 0.6)',
      }}
    >
      {name}
    </span>
  );
}

function WordSegment({ segment, isFocused, elRef }: { segment: TextSegment; isFocused?: boolean; elRef?: (el: HTMLSpanElement | null) => void }) {
  const [holdTimer, setHoldTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const showWordPopup = useUIStore((s) => s.showWordPopup);
  const markEncountered = useVocabularyStore((s) => s.markEncountered);
  const markTapped = useVocabularyStore((s) => s.markTapped);
  const progress = useVocabularyStore((s) =>
    segment.wordId ? s.progress[segment.wordId] : undefined
  );

  const isFirstEncounterRef = useRef(!progress);
  const lastMarkedRef = useRef<string | null>(null);
  const isInteractive = segment.type === 'word' && segment.wordId;

  // Mark word as encountered once per mount (guard against strict mode double-fire)
  useEffect(() => {
    if (segment.wordId && segment.wordId !== lastMarkedRef.current) {
      lastMarkedRef.current = segment.wordId;
      markEncountered(segment.wordId);
    }
  }, [segment.wordId, markEncountered]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!isInteractive || !segment.wordId) return;
    e.preventDefault();
    const timer = setTimeout(() => {
      const word = getWord(segment.wordId!);
      if (word) {
        markTapped(segment.wordId!);
        const rect = (e.target as HTMLElement).getBoundingClientRect();
        showWordPopup(word, rect.left + rect.width / 2, rect.top);
      }
    }, HOLD_DELAY_MS);
    setHoldTimer(timer);
  };

  const handlePointerUp = () => {
    if (holdTimer) { clearTimeout(holdTimer); setHoldTimer(null); }
  };

  const handlePointerLeave = () => {
    if (holdTimer) { clearTimeout(holdTimer); setHoldTimer(null); }
  };

  const word = segment.wordId ? getWord(segment.wordId) : undefined;
  const displayText = word?.kanji ?? segment.text;

  if (!isInteractive) {
    return <span style={{ color: UI.text }}>{displayText}</span>;
  }

  const isNew = isFirstEncounterRef.current;
  const mastery = progress?.mastery;
  const isKnown = mastery === 'known';

  const style: React.CSSProperties = {
    color: UI.text,
    cursor: 'pointer',
    userSelect: 'none',
    WebkitUserSelect: 'none',
    touchAction: 'none',
  };

  if (isNew) {
    style.background = 'rgba(210, 140, 0, 0.4)';
    style.borderBottom = '3px solid #C08A00';
    style.borderRadius = '3px';
    style.padding = '1px 4px';
    style.color = '#3A2010';
  } else if (!isKnown) {
    style.borderBottom = '1px dotted rgba(60, 120, 200, 0.6)';
  }

  // Gamepad D-pad focus highlight
  if (isFocused) {
    style.outline = '3px solid #d4af37';
    style.background = 'rgba(210, 170, 0, 0.35)';
    style.borderRadius = '4px';
    style.animation = 'gamepad-focus-pulse 1s ease-in-out infinite';
  }

  return (
    <span
      ref={elRef}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      style={style}
    >
      {displayText}
      {isNew && word && (
        <span style={{
          fontSize: '0.6em',
          color: '#8A6A10',
          marginLeft: 2,
          fontStyle: 'italic',
        }}>
          ({word.meaning})
        </span>
      )}
    </span>
  );
}
