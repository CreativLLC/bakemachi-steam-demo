import { useState, useMemo, useSyncExternalStore } from 'react';
import { useUIStore } from '../../store/uiStore';
import { useVocabularyStore } from '../../store/vocabularyStore';
import { VOCABULARY } from '../../japanese/vocabularyDB';
import { PixelPanel } from './PixelPanel';
import { UI, UI_FONT, UI_FONT_BOLD, PANELS } from '../pixelTheme';
import { useInputAction } from '../hooks/useInputAction';
import type { Word } from '../../japanese/types';

// ---------------------------------------------------------------------------
// Narrow-screen detection (same pattern as FoodMatchingGame / MenuBar)
// ---------------------------------------------------------------------------
const widthSubscribe = (cb: () => void) => { window.addEventListener('resize', cb); return () => window.removeEventListener('resize', cb); };
const getIsNarrow = () => window.innerWidth < 500;

// ---------------------------------------------------------------------------
// Category display labels keyed by vocabulary tag
// ---------------------------------------------------------------------------
const CATEGORY_LABELS: Record<string, string> = {
  'greeting':      'あいさつ — Greetings',
  'person':        'ひと — People',
  'place':         'ばしょ — Places',
  'daily-life':    'にちじょう — Daily Life',
  'verb':          'どうし — Verbs',
  'adjective':     'けいようし — Adjectives',
  'supernatural':  'ふしぎ — Supernatural',
  'combat':        'たたかい — Combat',
  'pronoun':       'だいめいし — Pronouns',
  'food':          'たべもの — Food & Drink',
  'location':      'ばしょ — Location',
};

// Display order for categories
const CATEGORY_ORDER = [
  'greeting', 'person', 'pronoun', 'place', 'location',
  'daily-life', 'food', 'verb', 'adjective', 'supernatural', 'combat',
];

type FilterType = 'all' | 'seen' | 'learning' | 'known';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function masteryToStars(mastery: string): number {
  if (mastery === 'seen') return 1;
  if (mastery === 'learning') return 2;
  if (mastery === 'known') return 3;
  return 0;
}

function renderStars(count: number): string {
  const filled = '\u2605'; // black star
  const empty = '\u2606';  // white star
  return filled.repeat(count) + empty.repeat(3 - count);
}

/** Pick the primary category tag from a word's tags array (skip chapter tags). */
function getCategoryTag(word: Word): string {
  for (const tag of word.tags) {
    if (tag.startsWith('chapter-')) continue;
    if (tag === 'drink') continue; // 'drink' words already have 'food' tag too
    if (CATEGORY_LABELS[tag]) return tag;
  }
  return 'daily-life'; // fallback
}

function jlptBadgeLabel(level: number): string {
  return `N${level}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function VocabBookScreen() {
  const activeMenu = useUIStore((s) => s.activeMenu);
  const progress = useVocabularyStore((s) => s.progress);
  const isNarrow = useSyncExternalStore(widthSubscribe, getIsNarrow);

  const [filter, setFilter] = useState<FilterType>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useInputAction('cancel', () => {
    useUIStore.getState().closeMenu();
  }, activeMenu === 'vocabbook');

  // Words that the player has actually encountered
  const encounteredWords = useMemo(
    () => VOCABULARY.filter((w) => progress[w.id]),
    [progress],
  );

  // Filtered by mastery tab
  const filteredWords = useMemo(() => {
    if (filter === 'all') return encounteredWords;
    return encounteredWords.filter((w) => {
      const p = progress[w.id];
      return p && p.mastery === filter;
    });
  }, [encounteredWords, filter, progress]);

  // Group by category
  const grouped = useMemo(() => {
    const map = new Map<string, Word[]>();
    for (const word of filteredWords) {
      const cat = getCategoryTag(word);
      const arr = map.get(cat);
      if (arr) arr.push(word);
      else map.set(cat, [word]);
    }
    // Sort by defined order
    const sorted: { category: string; label: string; words: Word[] }[] = [];
    for (const cat of CATEGORY_ORDER) {
      const words = map.get(cat);
      if (words && words.length > 0) {
        sorted.push({ category: cat, label: CATEGORY_LABELS[cat] || cat, words });
      }
    }
    // Any leftover categories not in CATEGORY_ORDER
    for (const [cat, words] of map) {
      if (!CATEGORY_ORDER.includes(cat)) {
        sorted.push({ category: cat, label: CATEGORY_LABELS[cat] || cat, words });
      }
    }
    return sorted;
  }, [filteredWords]);

  if (activeMenu !== 'vocabbook') return null;

  const panelBorder = isNarrow ? 28 : 52;
  const panelPadding = isNarrow ? '12px 14px' : '24px 28px';

  const filterTabs: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'seen', label: '\u2605' },
    { key: 'learning', label: '\u2605\u2605' },
    { key: 'known', label: '\u2605\u2605\u2605' },
  ];

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
      <PixelPanel
        borderWidth={panelBorder}
        panelOrigin={PANELS.rounded}
        style={{
          maxWidth: 560,
          width: '90%',
          maxHeight: '80vh',
          padding: panelPadding,
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Close button */}
        <div style={{ position: 'absolute', top: -8, right: -8 }}>
          <PixelPanel
            borderWidth={22}
            style={{ cursor: 'pointer' }}
          >
            <button
              onClick={() => useUIStore.getState().closeMenu()}
              style={{
                background: 'none',
                border: 'none',
                padding: '2px 8px',
                cursor: 'pointer',
                fontSize: 14,
                color: UI.text,
                fontFamily: UI_FONT,
                fontWeight: UI_FONT_BOLD,
              }}
            >
              X
            </button>
          </PixelPanel>
        </div>

        {/* Header */}
        <div style={{
          fontSize: isNarrow ? 18 : 20,
          color: UI.text,
          fontFamily: UI_FONT,
          fontWeight: UI_FONT_BOLD,
          textAlign: 'center',
          letterSpacing: '0.05em',
        }}>
          ことばのほん
        </div>
        <div style={{
          fontSize: 11,
          color: UI.textMuted,
          fontFamily: UI_FONT,
          textAlign: 'center',
          marginBottom: 4,
        }}>
          Vocab Book
        </div>

        {/* Word counter */}
        <div style={{
          fontSize: 12,
          color: UI.textFaded,
          fontFamily: UI_FONT,
          textAlign: 'center',
          marginBottom: 12,
        }}>
          {encounteredWords.length} / {VOCABULARY.length}
        </div>

        {/* Filter tabs */}
        <div style={{
          display: 'flex',
          gap: isNarrow ? 4 : 6,
          justifyContent: 'center',
          marginBottom: 12,
          flexWrap: 'wrap',
        }}>
          {filterTabs.map((tab) => {
            const isActive = filter === tab.key;
            return (
              <PixelPanel key={tab.key} borderWidth={22}>
                <button
                  onClick={() => setFilter(tab.key)}
                  style={{
                    background: isActive ? UI.gold : 'transparent',
                    border: 'none',
                    padding: isNarrow ? '3px 8px' : '4px 12px',
                    cursor: 'pointer',
                    fontSize: isNarrow ? 11 : 12,
                    color: isActive ? '#fff' : UI.textMuted,
                    fontFamily: UI_FONT,
                    fontWeight: isActive ? UI_FONT_BOLD : 'normal',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {tab.label}
                </button>
              </PixelPanel>
            );
          })}
        </div>

        {/* Scrollable word list */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          minHeight: 0,
          maxHeight: isNarrow ? '45vh' : '50vh',
        }}>
          {filteredWords.length === 0 ? (
            <div style={{
              fontSize: 14,
              color: UI.textMuted,
              fontFamily: UI_FONT,
              textAlign: 'center',
              padding: '40px 0',
            }}>
              {encounteredWords.length === 0
                ? 'まだ ことばを しらない...'
                : 'このカテゴリには ことばがない'}
            </div>
          ) : (
            grouped.map((group) => (
              <div key={group.category} style={{ marginBottom: 16 }}>
                {/* Category header */}
                <div style={{
                  fontSize: isNarrow ? 12 : 13,
                  color: UI.gold,
                  fontFamily: UI_FONT,
                  fontWeight: UI_FONT_BOLD,
                  padding: '4px 0',
                  borderBottom: `1px solid ${UI.gold}`,
                  marginBottom: 6,
                }}>
                  {group.label}
                </div>

                {/* Word entries */}
                {group.words.map((word) => {
                  const wp = progress[word.id];
                  if (!wp) return null;
                  const stars = masteryToStars(wp.mastery);
                  const isExpanded = expandedId === word.id;

                  return (
                    <div
                      key={word.id}
                      onClick={() => setExpandedId(isExpanded ? null : word.id)}
                      style={{ cursor: 'pointer', marginBottom: 2 }}
                    >
                      {/* Compact row */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: isNarrow ? 6 : 8,
                        padding: isNarrow ? '4px 2px' : '5px 4px',
                        borderRadius: 4,
                        background: isExpanded ? 'rgba(184, 150, 10, 0.08)' : 'transparent',
                      }}>
                        {/* Mastery stars */}
                        <span style={{
                          fontSize: isNarrow ? 12 : 14,
                          color: UI.gold,
                          fontFamily: UI_FONT,
                          flexShrink: 0,
                          width: isNarrow ? 36 : 42,
                          letterSpacing: '-0.05em',
                        }}>
                          {renderStars(stars)}
                        </span>

                        {/* Kanji/kana */}
                        <span style={{
                          fontSize: isNarrow ? 13 : 15,
                          color: UI.text,
                          fontFamily: UI_FONT,
                          fontWeight: UI_FONT_BOLD,
                          flexShrink: 0,
                        }}>
                          {word.kanji}
                        </span>

                        {/* Romaji (hidden on narrow) */}
                        {!isNarrow && (
                          <span style={{
                            fontSize: 12,
                            color: UI.textMuted,
                            fontFamily: UI_FONT,
                            flexShrink: 0,
                          }}>
                            ({word.romaji})
                          </span>
                        )}

                        {/* Meaning */}
                        <span style={{
                          fontSize: isNarrow ? 11 : 12,
                          color: UI.textFaded,
                          fontFamily: UI_FONT,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          flex: 1,
                          minWidth: 0,
                        }}>
                          {word.meaning}
                        </span>
                      </div>

                      {/* Expanded details */}
                      {isExpanded && (
                        <div style={{
                          padding: isNarrow ? '4px 2px 8px 40px' : '4px 4px 8px 50px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 4,
                        }}>
                          {/* Romaji on narrow (since hidden in compact row) */}
                          {isNarrow && (
                            <div style={{
                              fontSize: 11,
                              color: UI.textMuted,
                              fontFamily: UI_FONT,
                            }}>
                              {word.romaji}
                            </div>
                          )}

                          {/* Part of speech + JLPT badge */}
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                          }}>
                            <span style={{
                              fontSize: 11,
                              color: UI.textMuted,
                              fontFamily: UI_FONT,
                            }}>
                              {word.partOfSpeech}
                            </span>
                            <span style={{
                              fontSize: 10,
                              color: '#fff',
                              fontFamily: UI_FONT,
                              fontWeight: UI_FONT_BOLD,
                              background: UI.gold,
                              borderRadius: 3,
                              padding: '1px 5px',
                            }}>
                              {jlptBadgeLabel(word.jlptLevel)}
                            </span>
                          </div>

                          {/* Stats */}
                          <div style={{
                            fontSize: 11,
                            color: UI.textFaded,
                            fontFamily: UI_FONT,
                          }}>
                            Seen {wp.timesEncountered}x &middot; Tapped {wp.timesTapped}x
                          </div>

                          {/* Example sentence */}
                          {word.exampleSentence && (
                            <div style={{
                              fontSize: isNarrow ? 11 : 12,
                              color: UI.textMuted,
                              fontFamily: UI_FONT,
                              fontStyle: 'italic',
                              lineHeight: 1.5,
                            }}>
                              {word.exampleSentence.japanese}
                              <br />
                              <span style={{ color: UI.textFaded }}>
                                {word.exampleSentence.english}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </PixelPanel>
    </div>
  );
}
