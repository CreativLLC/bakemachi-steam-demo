import { useState, useMemo, useEffect, useRef, useSyncExternalStore } from 'react';
import type { CSSProperties } from 'react';
import { useUIStore } from '../../store/uiStore';
import { useGameStore } from '../../store/gameStore';
import { useInventoryStore } from '../../store/inventoryStore';
import { useVocabularyStore } from '../../store/vocabularyStore';
import { VOCABULARY } from '../../japanese/vocabularyDB';
import { PixelPanel } from './PixelPanel';
import { UI, UI_FONT, UI_FONT_BOLD, PANELS } from '../pixelTheme';
import { useInputAction } from '../hooks/useInputAction';
import { ITEM_HEALING } from '../../data/combatConfig';
import type { Word } from '../../japanese/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type MenuTab = 'status' | 'inventory' | 'vocabbook' | 'journal' | 'settings';

// ---------------------------------------------------------------------------
// Narrow-screen detection
// ---------------------------------------------------------------------------
const widthSubscribe = (cb: () => void) => { window.addEventListener('resize', cb); return () => window.removeEventListener('resize', cb); };
const getIsNarrow = () => window.innerWidth < 500;

// ---------------------------------------------------------------------------
// Tab definitions
// ---------------------------------------------------------------------------
const TABS: { key: MenuTab; label: string; icon: string; iconType: 'img' | 'text'; iconScale?: number }[] = [
  { key: 'status', label: 'ステータス', icon: '/assets/ui/portraits/main-character-male.png', iconType: 'img' },
  { key: 'inventory', label: 'もちもの', icon: '/assets/ui/32x32/icon-backpack.png', iconType: 'img', iconScale: 1.5 },
  { key: 'vocabbook', label: 'ことば', icon: '本', iconType: 'text' },
  { key: 'journal', label: 'ジャーナル', icon: '/assets/ui/32x32/checkmark.png', iconType: 'img', iconScale: 0.8 },
  { key: 'settings', label: 'せってい', icon: '/assets/ui/32x32/icon-gear.png', iconType: 'img' },
];

// ---------------------------------------------------------------------------
// Vocab Book helpers (ported from VocabBookScreen)
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

const CATEGORY_ORDER = [
  'greeting', 'person', 'pronoun', 'place', 'location',
  'daily-life', 'food', 'verb', 'adjective', 'supernatural', 'combat',
];

type FilterType = 'all' | 'seen' | 'learning' | 'known';

function masteryToStars(mastery: string): number {
  if (mastery === 'seen') return 1;
  if (mastery === 'learning') return 2;
  if (mastery === 'known') return 3;
  return 0;
}

function renderStars(count: number): string {
  const filled = '\u2605';
  const empty = '\u2606';
  return filled.repeat(count) + empty.repeat(3 - count);
}

function getCategoryTag(word: Word): string {
  for (const tag of word.tags) {
    if (tag.startsWith('chapter-')) continue;
    if (tag === 'drink') continue;
    if (CATEGORY_LABELS[tag]) return tag;
  }
  return 'daily-life';
}

function jlptBadgeLabel(level: number): string {
  return `N${level}`;
}

// ---------------------------------------------------------------------------
// Sub-components for each tab
// ---------------------------------------------------------------------------

function InventoryContent({ isNarrow, cursorIndex }: { isNarrow: boolean; cursorIndex: number }) {
  const items = useInventoryStore((s) => s.items);
  const clampedCursor = items.length > 0 ? Math.min(cursorIndex, items.length - 1) : -1;

  // Auto-scroll focused item into view
  const focusedRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (clampedCursor >= 0 && focusedRef.current) {
      focusedRef.current.scrollIntoView({ block: 'nearest' });
    }
  }, [clampedCursor]);

  if (items.length === 0) {
    return (
      <div style={{
        fontSize: 14,
        color: UI.textMuted,
        fontFamily: UI_FONT,
        textAlign: 'center',
        padding: '40px 0',
      }}>
        まだ なにも ない...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {items.map((item, idx) => {
        const isFocused = idx === clampedCursor;
        return (
          <div
            key={item.id}
            ref={isFocused ? focusedRef : undefined}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: isNarrow ? 8 : 12,
              padding: isNarrow ? '4px 2px' : '6px 4px',
              borderRadius: 4,
              background: isFocused ? 'rgba(184, 150, 10, 0.12)' : 'transparent',
              borderLeft: isFocused ? `3px solid ${UI.gold}` : '3px solid transparent',
            }}
          >
            {/* Item icon */}
            <img
              src={item.image}
              alt={item.name}
              style={{
                width: isNarrow ? 32 : 40,
                height: isNarrow ? 32 : 40,
                objectFit: 'contain',
                imageRendering: 'pixelated',
                flexShrink: 0,
              }}
            />

            {/* Item name + effect */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: isNarrow ? 13 : 15,
                color: UI.text,
                fontFamily: UI_FONT,
                fontWeight: UI_FONT_BOLD,
              }}>
                {item.name}
              </div>
              {ITEM_HEALING[item.id] && (
                <div style={{
                  fontSize: 11,
                  color: '#2a8a4e',
                  fontFamily: UI_FONT,
                }}>
                  HP+{ITEM_HEALING[item.id]}
                </div>
              )}
            </div>

            {/* Quantity (if > 1) */}
            {item.quantity > 1 && (
              <span style={{
                fontSize: 12,
                color: UI.textMuted,
                fontFamily: UI_FONT,
                flexShrink: 0,
              }}>
                x{item.quantity}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function VocabBookContent({ isNarrow, cursorIndex }: { isNarrow: boolean; cursorIndex: number }) {
  const progress = useVocabularyStore((s) => s.progress);
  const showRomaji = useUIStore((s) => s.showRomaji);
  const [filter, setFilter] = useState<FilterType>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const encounteredWords = useMemo(
    () => VOCABULARY.filter((w) => progress[w.id]),
    [progress],
  );

  const filteredWords = useMemo(() => {
    if (filter === 'all') return encounteredWords;
    return encounteredWords.filter((w) => {
      const p = progress[w.id];
      return p && p.mastery === filter;
    });
  }, [encounteredWords, filter, progress]);

  const grouped = useMemo(() => {
    const map = new Map<string, Word[]>();
    for (const word of filteredWords) {
      const cat = getCategoryTag(word);
      const arr = map.get(cat);
      if (arr) arr.push(word);
      else map.set(cat, [word]);
    }
    const sorted: { category: string; label: string; words: Word[] }[] = [];
    for (const cat of CATEGORY_ORDER) {
      const words = map.get(cat);
      if (words && words.length > 0) {
        sorted.push({ category: cat, label: CATEGORY_LABELS[cat] || cat, words });
      }
    }
    for (const [cat, words] of map) {
      if (!CATEGORY_ORDER.includes(cat)) {
        sorted.push({ category: cat, label: CATEGORY_LABELS[cat] || cat, words });
      }
    }
    return sorted;
  }, [filteredWords]);

  // Build a flat list of word IDs for cursor navigation
  const flatWordIds = useMemo(() => {
    const ids: string[] = [];
    for (const group of grouped) {
      for (const word of group.words) {
        ids.push(word.id);
      }
    }
    return ids;
  }, [grouped]);

  const clampedCursor = flatWordIds.length > 0 ? Math.min(cursorIndex, flatWordIds.length - 1) : -1;
  const focusedWordId = clampedCursor >= 0 ? flatWordIds[clampedCursor] : null;

  // Auto-scroll focused word into view
  const focusedRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (focusedWordId && focusedRef.current) {
      focusedRef.current.scrollIntoView({ block: 'nearest' });
    }
  }, [focusedWordId]);

  // A button toggles expand on the focused word
  useInputAction('confirm', () => {
    if (focusedWordId) {
      setExpandedId(prev => prev === focusedWordId ? null : focusedWordId);
    }
  }, cursorIndex >= 0);

  const filterTabs: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'seen', label: '\u2605' },
    { key: 'learning', label: '\u2605\u2605' },
    { key: 'known', label: '\u2605\u2605\u2605' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Word counter */}
      <div style={{
        fontSize: 12,
        color: UI.textFaded,
        fontFamily: UI_FONT,
        textAlign: 'center',
        marginBottom: 8,
      }}>
        {encounteredWords.length} / {VOCABULARY.length}
      </div>

      {/* Filter tabs */}
      <div style={{
        display: 'flex',
        gap: isNarrow ? 4 : 6,
        justifyContent: 'center',
        marginBottom: 10,
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

              {group.words.map((word) => {
                const wp = progress[word.id];
                if (!wp) return null;
                const stars = masteryToStars(wp.mastery);
                const isExpanded = expandedId === word.id;
                const isFocused = word.id === focusedWordId;

                return (
                  <div
                    key={word.id}
                    ref={isFocused ? focusedRef : undefined}
                    onClick={() => setExpandedId(isExpanded ? null : word.id)}
                    style={{ cursor: 'pointer', marginBottom: 2 }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: isNarrow ? 6 : 8,
                      padding: isNarrow ? '4px 2px' : '5px 4px',
                      borderRadius: 4,
                      background: isFocused ? 'rgba(184, 150, 10, 0.12)' : (isExpanded ? 'rgba(184, 150, 10, 0.08)' : 'transparent'),
                      borderLeft: isFocused ? `3px solid ${UI.gold}` : '3px solid transparent',
                    }}>
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

                      <span style={{
                        fontSize: isNarrow ? 13 : 15,
                        color: UI.text,
                        fontFamily: UI_FONT,
                        fontWeight: UI_FONT_BOLD,
                        flexShrink: 0,
                      }}>
                        {word.kanji}
                      </span>

                      {!isNarrow && showRomaji && (
                        <span style={{
                          fontSize: 12,
                          color: UI.textMuted,
                          fontFamily: UI_FONT,
                          flexShrink: 0,
                        }}>
                          ({word.romaji})
                        </span>
                      )}

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

                    {isExpanded && (
                      <div style={{
                        padding: isNarrow ? '4px 2px 8px 40px' : '4px 4px 8px 50px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 4,
                      }}>
                        {isNarrow && showRomaji && (
                          <div style={{
                            fontSize: 11,
                            color: UI.textMuted,
                            fontFamily: UI_FONT,
                          }}>
                            {word.romaji}
                          </div>
                        )}

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

                        <div style={{
                          fontSize: 11,
                          color: UI.textFaded,
                          fontFamily: UI_FONT,
                        }}>
                          Seen {wp.timesEncountered}x &middot; Tapped {wp.timesTapped}x
                        </div>

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
    </div>
  );
}

function StatusContent({ isNarrow }: { isNarrow: boolean }) {
  const level = useGameStore((s) => s.level);
  const xp = useGameStore((s) => s.xp);
  const energy = useGameStore((s) => s.energy);
  const maxEnergy = useGameStore((s) => s.maxEnergy);
  const progress = useVocabularyStore((s) => s.progress);

  const xpToNext = level * 100;
  const xpFraction = xpToNext > 0 ? xp / xpToNext : 0;
  const maxHp = 100 + (level - 1) * 10;
  const wordsDiscovered = Object.keys(progress).length;
  const energyPercent = maxEnergy > 0 ? Math.round((energy / maxEnergy) * 100) : 0;
  const energyFraction = maxEnergy > 0 ? energy / maxEnergy : 0;

  const statRow: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '6px 0',
    borderBottom: `1px solid ${UI.textFaded}30`,
  };
  const statLabel: React.CSSProperties = {
    fontSize: isNarrow ? 12 : 14,
    color: UI.textMuted,
    fontFamily: UI_FONT,
  };
  const statValue: React.CSSProperties = {
    fontSize: isNarrow ? 14 : 16,
    fontWeight: UI_FONT_BOLD,
    color: UI.text,
    fontFamily: UI_FONT,
  };

  return (
    <div style={{ padding: isNarrow ? '8px 4px' : '12px 8px', fontFamily: UI_FONT }}>
      {/* Portrait + name + level */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: isNarrow ? 10 : 16,
        marginBottom: isNarrow ? 12 : 16,
      }}>
        <PixelPanel borderWidth={isNarrow ? 22 : 34} panelOrigin={PANELS.rounded}>
          <img
            src="/assets/ui/portraits/main-character-male.png"
            alt="Player"
            style={{
              width: isNarrow ? 64 : 80,
              height: isNarrow ? 64 : 80,
              imageRendering: 'pixelated',
              display: 'block',
            }}
          />
        </PixelPanel>
        <div>
          <div style={{ fontSize: isNarrow ? 16 : 20, fontWeight: UI_FONT_BOLD, color: UI.text }}>
            あなた
          </div>
          <div style={{ fontSize: isNarrow ? 11 : 13, color: UI.textMuted, marginTop: 2 }}>
            Level {level}
          </div>
        </div>
      </div>

      {/* XP bar */}
      <div style={{ marginBottom: isNarrow ? 12 : 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 12, color: UI.textMuted }}>EXP</span>
          <span style={{ fontSize: 12, color: UI.textMuted }}>{xp} / {xpToNext}</span>
        </div>
        <div style={{
          height: 12,
          borderRadius: 6,
          background: `${UI.textFaded}30`,
          overflow: 'hidden',
          border: `1px solid ${UI.textFaded}50`,
        }}>
          <div style={{
            height: '100%',
            width: `${xpFraction * 100}%`,
            background: '#6a9fd8',
            borderRadius: 5,
            transition: 'width 0.5s ease',
          }} />
        </div>
      </div>

      {/* Stats list */}
      <div style={statRow}>
        <span style={statLabel}>HP</span>
        <span style={statValue}>{maxHp}</span>
      </div>
      <div style={statRow}>
        <span style={statLabel}>
          <img src="/assets/ui/32x32/icon-lightning.png" alt="" style={{ width: 14, height: 14, imageRendering: 'pixelated', verticalAlign: 'middle', marginRight: 4 }} />
          Energy
        </span>
        <span style={statValue}>{energyPercent}%</span>
      </div>
      {/* Energy bar */}
      <div style={{
        marginTop: 4,
        marginBottom: 6,
        position: 'relative',
        height: 10,
        borderRadius: 5,
        background: `${UI.textFaded}30`,
        overflow: 'hidden',
        border: `1px solid ${UI.textFaded}50`,
      }}>
        <div style={{
          height: '100%',
          width: `${energyFraction * 100}%`,
          background: '#4a90d9',
          borderRadius: 4,
          transition: 'width 0.5s ease',
        }} />
      </div>
      <div style={{ ...statRow, borderBottom: 'none' }}>
        <span style={statLabel}>Words Discovered</span>
        <span style={statValue}>{wordsDiscovered}</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Journal
// ---------------------------------------------------------------------------

interface JournalEntry {
  id: string;
  title: string;
  detail: string;
  /** Returns true if this journal entry should be shown (quest started or completed) */
  isVisible: (qs: Record<string, string>) => boolean;
  /** Returns true if this journal entry is completed */
  isComplete: (qs: Record<string, string>) => boolean;
}

interface JournalChapter {
  label: string;
  /** Entries listed newest-first (bottom of list = earliest quest) */
  entries: JournalEntry[];
}

const JOURNAL_CHAPTERS: JournalChapter[] = [
  {
    label: 'Chapter 1 — Bakemachi Station',
    entries: [
      // Newest first
      {
        id: 'buy_postcard',
        title: 'Got a postcard for Grandma',
        detail: 'Picked out a nice postcard for Grandma at the shop near the computers. Had to read the Japanese to pick the right one!',
        isVisible: (qs) => qs.phoneCallDone === 'true',
        isComplete: (qs) => qs.stationPostcardBought === 'true',
      },
      {
        id: 'buy_sister_present',
        title: 'Got a toy for sister',
        detail: 'Found a pocket creature toy at the souvenir shop! My younger sister will love it.',
        isVisible: (qs) => qs.phoneCallDone === 'true',
        isComplete: (qs) => qs.stationSisterPresentBought === 'true',
      },
      {
        id: 'phone_call',
        title: 'Called Mom',
        detail: 'Called Mom to let her know I arrived safely. She asked me to get a toy for my sister and a postcard for Grandma.',
        isVisible: (qs) => qs.battle_cowlick_npc_done === 'true',
        isComplete: (qs) => qs.phoneCallDone === 'true',
      },
      {
        id: 'cowlick_fight',
        title: 'Defeated the possessed NPC',
        detail: 'A glasses-wearing person turned into a monster! I had to fight them using Japanese. They don\'t remember what happened...',
        isVisible: (qs) => qs.stationOmiyageBought === 'true',
        isComplete: (qs) => qs.battle_cowlick_npc_done === 'true',
      },
      {
        id: 'buy_omiyage',
        title: 'Bought a souvenir for sensei',
        detail: 'Got an omiyage from the souvenir shop for sensei. Had to order in Japanese!',
        isVisible: (qs) => qs.stationOmiyagePrompted === 'true',
        isComplete: (qs) => qs.stationOmiyageBought === 'true',
      },
      {
        id: 'buy_drink',
        title: 'Bought a drink',
        detail: 'Got a drink from the vending machine. Tanaka-san wanted us to have something to drink too.',
        isVisible: (qs) => qs.stationArrivalPlayed === 'true',
        isComplete: (qs) => qs.stationDrinkBought === 'true',
      },
      {
        id: 'buy_food',
        title: 'Bought food at the station',
        detail: 'Got something to eat from the food stall. Tanaka-san suggested we grab food before heading home.',
        isVisible: (qs) => qs.stationArrivalPlayed === 'true',
        isComplete: (qs) => qs.stationFoodBought === 'true',
      },
      {
        id: 'arrive_station',
        title: 'Arrived at Bakemachi Station',
        detail: 'Met Tanaka-san at the train station. He welcomed me to Bakemachi!',
        isVisible: (qs) => qs.stationArrivalPlayed === 'true',
        isComplete: (qs) => qs.stationArrivalPlayed === 'true',
      },
    ],
  },
];

function JournalContent({ isNarrow, cursorIndex }: { isNarrow: boolean; cursorIndex: number }) {
  const questStates = useGameStore((s) => s.questStates);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Flatten chapters into a single list for cursor navigation, preserving chapter structure for rendering
  const chaptersWithVisible = useMemo(
    () => JOURNAL_CHAPTERS.map((ch) => ({
      ...ch,
      visible: ch.entries.filter((e) => e.isVisible(questStates)),
    })).filter((ch) => ch.visible.length > 0),
    [questStates],
  );

  const flatEntries = useMemo(
    () => chaptersWithVisible.flatMap((ch) => ch.visible),
    [chaptersWithVisible],
  );

  const clampedCursor = flatEntries.length > 0 ? Math.min(cursorIndex, flatEntries.length - 1) : -1;
  const focusedEntryId = clampedCursor >= 0 ? flatEntries[clampedCursor].id : null;

  // Auto-scroll focused entry into view
  const focusedRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (focusedEntryId && focusedRef.current) {
      focusedRef.current.scrollIntoView({ block: 'nearest' });
    }
  }, [focusedEntryId]);

  // A button toggles expand on the focused entry
  useInputAction('confirm', () => {
    if (focusedEntryId) {
      setExpandedId((prev) => (prev === focusedEntryId ? null : focusedEntryId));
    }
  }, cursorIndex >= 0);

  if (flatEntries.length === 0) {
    return (
      <div style={{
        fontSize: 14,
        color: UI.textMuted,
        fontFamily: UI_FONT,
        textAlign: 'center',
        padding: '40px 0',
      }}>
        まだ なにも ない...
      </div>
    );
  }

  let flatIdx = 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {chaptersWithVisible.map((chapter) => (
        <div key={chapter.label}>
          {/* Chapter header */}
          <div style={{
            fontSize: isNarrow ? 11 : 12,
            color: '#6b5a2e',
            fontFamily: UI_FONT,
            padding: isNarrow ? '6px 2px 2px' : '8px 4px 2px',
            borderBottom: `1px solid #6b5a2e60`,
            marginBottom: 4,
            letterSpacing: 0.5,
          }}>
            {chapter.label}
          </div>

          {/* Entries (newest first) */}
          {chapter.visible.map((entry) => {
            const idx = flatIdx++;
            const complete = entry.isComplete(questStates);
            const isExpanded = expandedId === entry.id;
            const isFocused = idx === clampedCursor;

            return (
              <div
                key={entry.id}
                ref={isFocused ? focusedRef : undefined}
                onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                style={{ cursor: 'pointer', marginBottom: 2 }}
              >
                {/* Entry row */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: isNarrow ? 6 : 10,
                  padding: isNarrow ? '5px 2px' : '6px 4px',
                  borderRadius: 4,
                  background: isFocused
                    ? 'rgba(184, 150, 10, 0.12)'
                    : isExpanded
                      ? 'rgba(184, 150, 10, 0.08)'
                      : 'transparent',
                  borderLeft: isFocused ? `3px solid ${UI.gold}` : '3px solid transparent',
                }}>
                  {/* Checkmark or open circle */}
                  {complete ? (
                    <img
                      src="/assets/ui/32x32/checkmark.png"
                      alt="Done"
                      style={{
                        width: 12,
                        height: 12,
                        imageRendering: 'pixelated',
                        flexShrink: 0,
                      }}
                    />
                  ) : (
                    <span style={{
                      width: 12,
                      height: 12,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 10,
                      color: UI.textFaded,
                      fontFamily: UI_FONT,
                      flexShrink: 0,
                    }}>
                      ○
                    </span>
                  )}

                  {/* Title */}
                  <span style={{
                    fontSize: isNarrow ? 12 : 14,
                    color: complete ? UI.text : UI.textMuted,
                    fontFamily: UI_FONT,
                    fontWeight: complete ? UI_FONT_BOLD : 'normal',
                    flex: 1,
                    minWidth: 0,
                  }}>
                    {entry.title}
                  </span>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div style={{
                    padding: isNarrow ? '4px 2px 8px 28px' : '4px 4px 8px 34px',
                    fontSize: isNarrow ? 11 : 12,
                    color: UI.textMuted,
                    fontFamily: UI_FONT,
                    lineHeight: 1.6,
                  }}>
                    {entry.detail}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

const DIFFICULTY_OPTIONS: { key: 'off' | 'easy' | 'medium' | 'hard'; label: string; labelEn: string }[] = [
  { key: 'off', label: 'タイマーなし', labelEn: 'Off' },
  { key: 'easy', label: 'やさしい', labelEn: 'Easy' },
  { key: 'medium', label: 'ふつう', labelEn: 'Normal' },
  { key: 'hard', label: 'むずかしい', labelEn: 'Hard' },
];

function SettingsContent() {
  const showRomaji = useUIStore((s) => s.showRomaji);
  const setShowRomaji = useUIStore((s) => s.setShowRomaji);
  const difficulty = useUIStore((s) => s.difficulty);
  const setDifficulty = useUIStore((s) => s.setDifficulty);

  return (
    <div style={{
      padding: '12px 8px',
      fontFamily: UI_FONT,
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 4px',
        borderBottom: `1px solid ${UI.textFaded}40`,
      }}>
        <div>
          <div style={{ fontSize: 14, color: UI.text, fontWeight: UI_FONT_BOLD }}>
            Show Romaji
          </div>
          <div style={{ fontSize: 11, color: UI.textMuted, marginTop: 2 }}>
            Display romaji readings in word definitions
          </div>
        </div>
        <button
          onClick={() => setShowRomaji(!showRomaji)}
          style={{
            background: showRomaji ? UI.gold : `${UI.textFaded}40`,
            border: 'none',
            borderRadius: 12,
            width: 44,
            height: 24,
            cursor: 'pointer',
            position: 'relative',
            transition: 'background 0.2s ease',
            flexShrink: 0,
          }}
        >
          <div style={{
            width: 18,
            height: 18,
            borderRadius: '50%',
            background: '#fff',
            position: 'absolute',
            top: 3,
            left: showRomaji ? 23 : 3,
            transition: 'left 0.2s ease',
          }} />
        </button>
      </div>

      <div style={{
        padding: '12px 4px 8px',
        borderBottom: `1px solid ${UI.textFaded}40`,
      }}>
        <div>
          <div style={{ fontSize: 14, color: UI.text, fontWeight: UI_FONT_BOLD }}>
            Combat Difficulty
          </div>
          <div style={{ fontSize: 11, color: UI.textMuted, marginTop: 2 }}>
            たたかいのむずかしさ
          </div>
          <div style={{ fontSize: 11, color: UI.textFaded, marginTop: 2 }}>
            Adjusts time limits for combat mini-games
          </div>
        </div>
        <div style={{
          display: 'flex',
          marginTop: 10,
          borderRadius: 6,
          overflow: 'hidden',
          border: `1px solid ${UI.textFaded}60`,
        }}>
          {DIFFICULTY_OPTIONS.map((opt) => {
            const isActive = difficulty === opt.key;
            return (
              <button
                key={opt.key}
                onClick={() => setDifficulty(opt.key)}
                style={{
                  flex: 1,
                  background: isActive ? UI.gold : `${UI.textFaded}20`,
                  border: 'none',
                  borderRight: opt !== DIFFICULTY_OPTIONS[DIFFICULTY_OPTIONS.length - 1] ? `1px solid ${UI.textFaded}40` : 'none',
                  padding: '6px 4px',
                  cursor: 'pointer',
                  fontFamily: UI_FONT,
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{
                  fontSize: 13,
                  color: isActive ? '#fff' : UI.textMuted,
                  fontWeight: isActive ? UI_FONT_BOLD : 'normal',
                }}>
                  {opt.label}
                </div>
                <div style={{
                  fontSize: 9,
                  color: isActive ? 'rgba(255,255,255,0.8)' : UI.textFaded,
                  marginTop: 1,
                }}>
                  {opt.labelEn}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main GameMenu component
// ---------------------------------------------------------------------------

export function GameMenu() {
  const activeMenu = useUIStore((s) => s.activeMenu);
  const isNarrow = useSyncExternalStore(widthSubscribe, getIsNarrow);

  // Determine initial tab from activeMenu value
  const initialTab: MenuTab = activeMenu === 'vocabbook' ? 'vocabbook'
    : activeMenu === 'settings' ? 'settings'
    : activeMenu === 'status' ? 'status'
    : activeMenu === 'journal' ? 'journal'
    : 'inventory';

  const [selectedTab, setSelectedTab] = useState<MenuTab>(initialTab);
  const [menuFocus, setMenuFocus] = useState<'sidebar' | 'content'>('sidebar');
  const [contentCursorIndex, setContentCursorIndex] = useState(0);

  // Sync selectedTab when activeMenu changes (e.g., V key opens to vocabbook)
  useEffect(() => {
    if (activeMenu === 'vocabbook') setSelectedTab('vocabbook');
    else if (activeMenu === 'settings') setSelectedTab('settings');
    else if (activeMenu === 'status') setSelectedTab('status');
    else if (activeMenu === 'journal') setSelectedTab('journal');
    else if (activeMenu === 'inventory') setSelectedTab('inventory');
    // 'menu' defaults to inventory (already set by initialTab)
  }, [activeMenu]);

  // Reset content cursor when tab changes
  useEffect(() => {
    setContentCursorIndex(0);
  }, [selectedTab]);

  const isOpen = activeMenu !== null;

  useInputAction('cancel', () => {
    if (menuFocus === 'content') {
      setMenuFocus('sidebar');
    } else {
      useUIStore.getState().closeMenu();
    }
  }, isOpen);

  const tabKeys = TABS.map(t => t.key);

  useInputAction('navigate_up', () => {
    if (menuFocus === 'sidebar') {
      setSelectedTab(prev => {
        const idx = tabKeys.indexOf(prev);
        return tabKeys[(idx - 1 + tabKeys.length) % tabKeys.length];
      });
    } else {
      setContentCursorIndex(prev => Math.max(0, prev - 1));
    }
  }, isOpen);

  useInputAction('navigate_down', () => {
    if (menuFocus === 'sidebar') {
      setSelectedTab(prev => {
        const idx = tabKeys.indexOf(prev);
        return tabKeys[(idx + 1) % tabKeys.length];
      });
    } else {
      setContentCursorIndex(prev => prev + 1); // Content components will clamp
    }
  }, isOpen);

  useInputAction('confirm', () => {
    if (menuFocus === 'sidebar') {
      setMenuFocus('content');
      setContentCursorIndex(0);
    }
    // When in 'content', the content components handle confirm
  }, isOpen);

  if (!isOpen) return null;

  const sidebarWidth = isNarrow ? 56 : 150;

  const panelStyle: CSSProperties = isNarrow
    ? {
        width: '100%',
        height: '100%',
        padding: '12px 10px',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        background: UI.panelBg,
      }
    : {
        width: '95%',
        maxWidth: 740,
        height: '75vh',
        padding: '20px 24px',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
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
      <PixelPanel
        borderWidth={isNarrow ? 0 : 52}
        panelOrigin={PANELS.rounded}
        style={panelStyle}
      >
        {/* Close button */}
        <div style={{ position: 'absolute', top: -8, right: -8, zIndex: 10 }}>
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
          メニュー
        </div>
        <div style={{
          fontSize: 11,
          color: UI.textMuted,
          fontFamily: UI_FONT,
          textAlign: 'center',
          marginBottom: isNarrow ? 10 : 16,
        }}>
          Menu
        </div>

        {/* Content row: sidebar + divider + main content */}
        <div style={{
          display: 'flex',
          flexDirection: 'row',
          flex: 1,
          minHeight: 0,
          gap: 0,
        }}>
          {/* LEFT: Sidebar tabs */}
          <div style={{
            width: sidebarWidth,
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 0,
            paddingRight: isNarrow ? 6 : 12,
          }}>
            {TABS.map((tab) => {
              const isActive = selectedTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => { setSelectedTab(tab.key); setMenuFocus('content'); setContentCursorIndex(0); }}
                  style={{
                    background: isActive ? 'rgba(184, 150, 10, 0.12)' : 'transparent',
                    border: 'none',
                    borderLeft: isActive ? `3px solid ${UI.gold}` : '3px solid transparent',
                    cursor: 'pointer',
                    padding: isNarrow ? '8px 4px' : '8px 10px',
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: isNarrow ? 4 : 8,
                    width: '100%',
                    borderBottom: `1px solid ${UI.textFaded}30`,
                    opacity: menuFocus === 'content' ? 0.6 : 1,
                    transition: 'opacity 0.15s',
                  }}
                >
                  {/* Icon */}
                  {tab.iconType === 'img' ? (
                    <div style={{
                      width: isNarrow ? 22 : 24,
                      height: isNarrow ? 22 : 24,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      overflow: 'visible',
                    }}>
                      <img
                        src={tab.icon}
                        alt=""
                        style={{
                          width: (isNarrow ? 22 : 24) * (tab.iconScale ?? 1),
                          height: (isNarrow ? 22 : 24) * (tab.iconScale ?? 1),
                          imageRendering: 'pixelated',
                          marginLeft: tab.iconScale && tab.iconScale > 1 ? -5 : undefined,
                        }}
                      />
                    </div>
                  ) : (
                    <span style={{
                      fontSize: isNarrow ? 18 : 20,
                      lineHeight: 1,
                      color: isActive ? UI.gold : UI.text,
                      fontFamily: UI_FONT,
                      flexShrink: 0,
                    }}>
                      {tab.icon}
                    </span>
                  )}

                  {/* Label (hidden on narrow) */}
                  {!isNarrow && (
                    <span style={{
                      fontSize: 14,
                      color: isActive ? UI.gold : UI.textMuted,
                      fontFamily: UI_FONT,
                      fontWeight: isActive ? UI_FONT_BOLD : 'normal',
                    }}>
                      {tab.label}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Vertical divider */}
          <div style={{
            width: 1,
            background: UI.textFaded,
            marginTop: 4,
            marginBottom: 4,
            flexShrink: 0,
          }} />

          {/* RIGHT: Content area */}
          <div style={{
            flex: 1,
            minWidth: 0,
            paddingLeft: isNarrow ? 8 : 16,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
          }}>
            {selectedTab === 'status' && <StatusContent isNarrow={isNarrow} />}
            {selectedTab === 'inventory' && <InventoryContent isNarrow={isNarrow} cursorIndex={menuFocus === 'content' ? contentCursorIndex : -1} />}
            {selectedTab === 'vocabbook' && <VocabBookContent isNarrow={isNarrow} cursorIndex={menuFocus === 'content' ? contentCursorIndex : -1} />}
            {selectedTab === 'journal' && <JournalContent isNarrow={isNarrow} cursorIndex={menuFocus === 'content' ? contentCursorIndex : -1} />}
            {selectedTab === 'settings' && <SettingsContent />}
          </div>
        </div>
      </PixelPanel>
    </div>
  );
}
