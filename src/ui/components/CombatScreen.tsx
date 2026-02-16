import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useCombatStore } from '../../store/combatStore';
import { useGameStore } from '../../store/gameStore';
import { useUIStore } from '../../store/uiStore';
import { useInventoryStore } from '../../store/inventoryStore';
import { ITEM_HEALING, TIER_INFO, MINI_GAME_LABELS, PLAYER_SPRITE_BASE } from '../../data/combatConfig';
import { PixelPanel } from './PixelPanel';
import { TutorialOverlay } from './TutorialOverlay';
import { UI, UI_FONT, UI_FONT_BOLD, PANELS } from '../pixelTheme';
import { VocabQuizBattle } from './combat/VocabQuizBattle';
import { QuickMatchBattle } from './combat/QuickMatchBattle';
import { WordScrambleBattle } from './combat/WordScrambleBattle';
import { useInputAction } from '../hooks/useInputAction';
import { NPC_DIALOGUE } from '../../data/npcDialogue';
import type { TutorialStep } from './TutorialOverlay';
import type { TimerTier, MiniGameType, CombatEnemy } from '../../store/combatStore';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

/** All LPC spritesheets are 13 columns × 4 rows (832×256), except hurt = 13×1 (832×64) */
const SHEET_COLS = 13;
const SHEET_ROWS = 4;
const FRAME_SRC = 64;
const SPRITE_SCALE = 3;
const FRAME_DST = FRAME_SRC * SPRITE_SCALE; // 192

/** LPC directional rows */
const ROW_SOUTH = 0;
const ROW_WEST = 1;
const ROW_NORTH = 2;
const ROW_EAST = 3;

/** Frame counts per spritesheet */
const IDLE_FRAMES = 2;
const SLASH_FRAMES = 8;
const HURT_FRAMES = 6;

/** Narrow screen detection */
const narrowSubscribe = (cb: () => void) => { window.addEventListener('resize', cb); return () => window.removeEventListener('resize', cb); };
const getIsNarrow = () => window.innerWidth < 500;

/** Action grid: indices 0-2 are mini-games, index 3 is items */
const ACTION_GRID_GAMES: MiniGameType[] = ['vocab_quiz', 'quick_match', 'word_scramble'];

/** Timing (ms) */
const IDLE_FRAME_MS = 500;
const SLASH_FRAME_MS = 80;
const SLIDE_MS = 300;
const SLIDE_PX = 80;
const IMPACT_FRAME = 4;
const WHITE_FLASH_MS = 200;
const INTRO_TEXT_MS = 2000;

/** Transition grid */
const TRANSITION_COLS = 6;
const TRANSITION_ROWS = 4;
const TRANSITION_DURATION_MS = 1000;

/* ------------------------------------------------------------------ */
/*  Combat Tutorial Steps                                              */
/* ------------------------------------------------------------------ */

const COMBAT_TUTORIAL_STEPS: TutorialStep[] = [
  {
    text: 'Combat!',
    subtext: 'Defeat the enemy by playing Japanese mini-games!',
  },
  {
    text: 'Choose your attack!',
    subtext: 'Each button is a different Japanese mini-game. Pick one to deal damage!',
    highlight: 'combat-actions',
    calloutPosition: 'above',
  },
  {
    text: 'Look for the weakness!',
    subtext: 'Each round, the enemy is weak to one attack type (marked with a star). Using it deals extra damage!',
  },
  {
    text: 'You can also use items to heal during battle.',
    subtext: 'Food and drinks restore HP. Use them wisely!',
  },
  {
    text: 'Speed matters!',
    subtext: 'Each mini-game has a timer. Answer quickly for maximum damage!',
  },
  {
    text: 'GREAT = most damage, GOOD = normal, SLOW = less',
    subtext: "If the timer runs out, you miss! No damage dealt. Ready? Let's go!",
  },
];

/* ------------------------------------------------------------------ */
/*  CSS Keyframes                                                      */
/* ------------------------------------------------------------------ */

const COMBAT_STYLES = `
@keyframes combat-shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-6px); }
  20%, 40%, 60%, 80% { transform: translateX(6px); }
}
@keyframes combat-flash-red {
  0% { background: rgba(200, 40, 40, 0.4); }
  100% { background: rgba(200, 40, 40, 0); }
}
@keyframes hp-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
@keyframes combat-fade-in {
  0% { opacity: 0; }
  100% { opacity: 1; }
}
@keyframes combat-victory-bounce {
  0%, 100% { transform: translateY(0); }
  30% { transform: translateY(-12px); }
  50% { transform: translateY(-6px); }
  70% { transform: translateY(-10px); }
}
@keyframes damage-float {
  0%   { opacity: 1; transform: translate(-50%, 0); }
  100% { opacity: 0; transform: translate(-50%, -50px); }
}
@keyframes transition-flash {
  0%   { opacity: 0; }
  30%  { opacity: 1; }
  70%  { opacity: 1; }
  100% { opacity: 0; }
}
@keyframes shard-fly {
  0%   { opacity: 1; transform: translate(0, 0) rotate(0deg) scale(1); }
  100% { opacity: 0; transform: var(--shard-end) rotate(var(--shard-rot)) scale(0.3); }
}
@keyframes gamepad-focus-pulse {
  0%, 100% { box-shadow: 0 0 0 2px rgba(212, 175, 55, 0.6); }
  50% { box-shadow: 0 0 12px 4px rgba(212, 175, 55, 0.9); }
}
`;

/* ------------------------------------------------------------------ */
/*  Gamepad focus style                                                */
/* ------------------------------------------------------------------ */

const GAMEPAD_FOCUS_STYLE: React.CSSProperties = {
  border: '3px solid #d4af37',
  background: 'rgba(212, 175, 55, 0.2)',
  animation: 'gamepad-focus-pulse 1s ease-in-out infinite',
};

/* ------------------------------------------------------------------ */
/*  Utility                                                            */
/* ------------------------------------------------------------------ */

function hpBarColor(fraction: number): string {
  if (fraction > 0.5) return '#2a8a4e';
  if (fraction > 0.25) return '#c08a00';
  return '#c44';
}

/* ------------------------------------------------------------------ */
/*  BattleSprite                                                       */
/* ------------------------------------------------------------------ */

interface BattleSpriteProps {
  spriteBase: string;
  sheet: 'idle' | 'combat' | '1h_slash' | 'hurt' | 'emote' | 'jump';
  frame: number;
  /** LPC row: 0=south, 1=west, 2=north, 3=east. hurt uses 0 always. */
  row: number;
  flashWhite?: boolean;
}

function BattleSprite({ spriteBase, sheet, frame, row, flashWhite }: BattleSpriteProps) {
  const src = `${spriteBase}/${sheet}.png`;
  const isHurt = sheet === 'hurt';
  const cols = SHEET_COLS;
  const rows = isHurt ? 1 : SHEET_ROWS;
  const effectiveRow = isHurt ? 0 : row;

  return (
    <div
      style={{
        width: FRAME_DST,
        height: FRAME_DST,
        backgroundImage: `url(${src})`,
        backgroundSize: `${cols * FRAME_DST}px ${rows * FRAME_DST}px`,
        backgroundPosition: `-${frame * FRAME_DST}px -${effectiveRow * FRAME_DST}px`,
        backgroundRepeat: 'no-repeat',
        imageRendering: 'pixelated',
        filter: flashWhite ? 'brightness(5)' : undefined,
        transition: flashWhite ? 'none' : 'filter 0.1s',
      }}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  HPBar                                                              */
/* ------------------------------------------------------------------ */

function HPBar({ current, max, label }: { current: number; max: number; label: string }) {
  const fraction = max > 0 ? current / max : 0;
  const color = hpBarColor(fraction);
  const isLow = fraction <= 0.25 && fraction > 0;

  return (
    <div style={{ width: '100%', maxWidth: 200 }}>
      <div style={{
        fontFamily: UI_FONT,
        fontSize: 12,
        color: '#ccc',
        marginBottom: 4,
      }}>
        {label}: {current}/{max}
      </div>
      <div style={{
        position: 'relative',
        width: '100%',
        height: 14,
        borderRadius: 7,
        background: 'rgba(0, 0, 0, 0.4)',
        overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.2)',
      }}>
        <div style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: `${fraction * 100}%`,
          background: color,
          borderRadius: 6,
          transition: 'width 0.5s ease, background 0.3s ease',
          animation: isLow ? 'hp-pulse 1s ease-in-out infinite' : undefined,
        }} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  HUDBar (big bar for CombatHUD)                                     */
/* ------------------------------------------------------------------ */

const HP_SCALE = 2;

function HUDBar({ current, max }: { current: number; max: number }) {
  const fraction = max > 0 ? current / max : 0;
  const isLow = fraction <= 0.25 && fraction > 0;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      height: 30 * HP_SCALE,
      animation: isLow ? 'hp-pulse 1s ease-in-out infinite' : undefined,
    }}>
      {/* Left cap with heart icon overlay */}
      <div style={{
        position: 'relative',
        width: 36 * HP_SCALE,
        height: 30 * HP_SCALE,
        flexShrink: 0,
      }}>
        <img
          src="/assets/ui/32x32/bar-hp-background-left.png"
          alt=""
          style={{
            width: '100%', height: '100%',
            imageRendering: 'pixelated',
            display: 'block',
          }}
        />
        <img
          src="/assets/ui/32x32/icon-heart.png"
          alt=""
          style={{
            position: 'absolute',
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 24 * HP_SCALE,
            height: 24 * HP_SCALE,
            imageRendering: 'pixelated',
          }}
        />
      </div>

      {/* Middle repeating section with red fill overlay + HP numbers */}
      <div style={{
        flex: 1,
        height: 26 * HP_SCALE,
        position: 'relative',
        overflow: 'hidden',
        backgroundImage: 'url(/assets/ui/32x32/bar-hp-background-middle.png)',
        backgroundRepeat: 'repeat-x',
        backgroundSize: `${6 * HP_SCALE}px ${26 * HP_SCALE}px`,
        imageRendering: 'pixelated' as const,
      }}>
        {/* Red overlay fill */}
        <div style={{
          position: 'absolute',
          left: 0,
          top: '50%',
          transform: 'translateY(-50%)',
          width: `${fraction * 100}%`,
          height: 16 * HP_SCALE,
          backgroundImage: 'url(/assets/ui/32x32/bar-hp-red-overlay.png)',
          backgroundRepeat: 'repeat-x',
          backgroundSize: `${4 * HP_SCALE}px ${16 * HP_SCALE}px`,
          imageRendering: 'pixelated' as const,
          transition: 'width 0.5s ease',
        }} />
        {/* HP numbers overlaid on bar */}
        <div style={{
          position: 'absolute',
          left: 4,
          top: 'calc(50% - 3px)',
          transform: 'translateY(-50%)',
          fontFamily: UI_FONT,
          fontWeight: UI_FONT_BOLD,
          fontSize: 15,
          color: '#fff',
          textShadow: '1px 1px 2px rgba(0,0,0,0.8), -1px -1px 0 rgba(0,0,0,0.5), 1px -1px 0 rgba(0,0,0,0.5), -1px 1px 0 rgba(0,0,0,0.5)',
          whiteSpace: 'nowrap',
          zIndex: 2,
          pointerEvents: 'none',
        }}>
          {current}/{max}
        </div>
      </div>

      {/* Right cap */}
      <img
        src="/assets/ui/32x32/bar-hp-background-right.png"
        alt=""
        style={{
          width: 9 * HP_SCALE,
          height: 26 * HP_SCALE,
          imageRendering: 'pixelated',
          flexShrink: 0,
          display: 'block',
        }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  ActionButton                                                       */
/* ------------------------------------------------------------------ */

function ActionButton({
  type,
  isWeak,
  focused,
  narrow,
  onClick,
}: {
  type: MiniGameType;
  isWeak: boolean;
  focused?: boolean;
  narrow?: boolean;
  onClick: () => void;
}) {
  const label = MINI_GAME_LABELS[type];

  return (
    <PixelPanel borderWidth={narrow ? 14 : 16} panelOrigin={PANELS.rounded} style={{ flex: 1 }}>
      <button
        onClick={onClick}
        style={{
          width: '100%',
          background: 'none',
          border: isWeak ? '2px solid #d4af37' : '2px solid transparent',
          borderRadius: 4,
          padding: '3px 4px',
          cursor: 'pointer',
          fontFamily: UI_FONT,
          textAlign: 'center',
          position: 'relative',
          ...(focused ? GAMEPAD_FOCUS_STYLE : {}),
        }}
      >
        <div style={{
          fontSize: 15,
          fontWeight: UI_FONT_BOLD,
          color: UI.text,
          marginBottom: 1,
        }}>
          {label.jp}
        </div>
        <div style={{
          fontSize: 9,
          color: UI.textMuted,
        }}>
          {label.en}
        </div>
        {isWeak && (
          <div style={{
            position: 'absolute',
            top: -8,
            right: -8,
            background: '#d4af37',
            color: '#fff',
            fontSize: 11,
            fontWeight: UI_FONT_BOLD,
            fontFamily: UI_FONT,
            padding: '2px 6px',
            borderRadius: 4,
            whiteSpace: 'nowrap',
          }}>
            ★
          </div>
        )}
      </button>
    </PixelPanel>
  );
}

/* ------------------------------------------------------------------ */
/*  ItemSubmenu                                                        */
/* ------------------------------------------------------------------ */

function ItemSubmenu({ onBack, itemCursorIndex, isGamepad }: {
  onBack: () => void;
  itemCursorIndex: number;
  isGamepad: boolean;
}) {
  const items = useInventoryStore((s) => s.items);
  const playerHp = useCombatStore((s) => s.playerHp);
  const playerMaxHp = useCombatStore((s) => s.playerMaxHp);

  const healableItems = items.filter((item) => ITEM_HEALING[item.id] != null);

  const handleUseItem = (itemId: string, itemName: string) => {
    const healAmount = ITEM_HEALING[itemId] ?? 0;
    useCombatStore.getState().useItem(healAmount, itemName);
    useInventoryStore.getState().removeItem(itemId);
  };

  return (
    <div style={{ padding: '4px 8px' }}>
      <div style={{
        fontFamily: UI_FONT,
        fontWeight: UI_FONT_BOLD,
        fontSize: 14,
        color: UI.text,
        marginBottom: 6,
      }}>
        アイテム
      </div>

      {healableItems.length === 0 ? (
        <div style={{
          fontFamily: UI_FONT,
          fontSize: 14,
          color: UI.textMuted,
          textAlign: 'center',
          padding: '12px 0',
        }}>
          アイテムがない
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {healableItems.map((item, idx) => {
            const healAmount = ITEM_HEALING[item.id] ?? 0;
            const atFullHp = playerHp >= playerMaxHp;
            const focused = isGamepad && itemCursorIndex === idx;
            return (
              <button
                key={item.id}
                onClick={() => handleUseItem(item.id, item.name)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  background: focused ? 'rgba(184, 150, 10, 0.12)' : 'transparent',
                  border: 'none',
                  borderLeft: focused ? `3px solid ${UI.gold}` : '3px solid transparent',
                  borderRadius: 4,
                  padding: '4px 4px',
                  cursor: 'pointer',
                  fontFamily: UI_FONT,
                  width: '100%',
                }}
              >
                <img
                  src={item.image}
                  alt={item.name}
                  style={{
                    width: 32,
                    height: 32,
                    objectFit: 'contain',
                    imageRendering: 'pixelated',
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
                  <div style={{
                    fontSize: 14,
                    fontWeight: UI_FONT_BOLD,
                    color: UI.text,
                  }}>
                    {item.name}
                  </div>
                  <div style={{
                    fontSize: 11,
                    color: '#2a8a4e',
                  }}>
                    HP+{healAmount}
                    {atFullHp && (
                      <span style={{ color: UI.textMuted, marginLeft: 6, fontSize: 10 }}>
                        (HP満タン)
                      </span>
                    )}
                  </div>
                </div>
                {item.quantity > 1 && (
                  <span style={{
                    fontSize: 12,
                    color: UI.textMuted,
                    flexShrink: 0,
                  }}>
                    x{item.quantity}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      <div style={{ marginTop: 10, textAlign: 'center' }}>
        <PixelPanel borderWidth={22} panelOrigin={PANELS.rounded} style={{ display: 'inline-block' }}>
          <button
            onClick={onBack}
            style={{
              background: 'none',
              border: '2px solid transparent',
              borderRadius: 4,
              padding: '6px 20px',
              cursor: 'pointer',
              fontFamily: UI_FONT,
              fontWeight: UI_FONT_BOLD,
              fontSize: 14,
              color: UI.text,
              ...(isGamepad && itemCursorIndex === healableItems.length ? GAMEPAD_FOCUS_STYLE : {}),
            }}
          >
            もどる
          </button>
        </PixelPanel>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  CombatTransition                                                   */
/* ------------------------------------------------------------------ */

function CombatTransition({ onComplete }: { onComplete: () => void }) {
  const calledRef = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!calledRef.current) {
        calledRef.current = true;
        onComplete();
      }
    }, TRANSITION_DURATION_MS);
    return () => clearTimeout(timer);
  }, [onComplete]);

  const shards: Array<{ col: number; row: number; delay: number; tx: number; ty: number; rot: number }> = [];
  for (let r = 0; r < TRANSITION_ROWS; r++) {
    for (let c = 0; c < TRANSITION_COLS; c++) {
      // Distance from center determines delay
      const cx = (c - TRANSITION_COLS / 2 + 0.5) / (TRANSITION_COLS / 2);
      const cy = (r - TRANSITION_ROWS / 2 + 0.5) / (TRANSITION_ROWS / 2);
      const dist = Math.sqrt(cx * cx + cy * cy);
      const delay = dist * 200; // stagger from center outward
      const angle = Math.atan2(cy, cx);
      const flyDist = 300 + Math.random() * 200;
      const tx = Math.cos(angle) * flyDist;
      const ty = Math.sin(angle) * flyDist;
      const rot = (Math.random() - 0.5) * 720;
      shards.push({ col: c, row: r, delay, tx, ty, rot });
    }
  }

  const shardW = 100 / TRANSITION_COLS;
  const shardH = 100 / TRANSITION_ROWS;

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      zIndex: 300,
      pointerEvents: 'none',
      overflow: 'hidden',
    }}>
      {/* White flash */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: '#fff',
        animation: `transition-flash ${TRANSITION_DURATION_MS * 0.4}ms ease forwards`,
        zIndex: 301,
      }} />

      {/* Shattering shards */}
      {shards.map((s, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${s.col * shardW}%`,
            top: `${s.row * shardH}%`,
            width: `${shardW}%`,
            height: `${shardH}%`,
            background: '#fff',
            border: '1px solid rgba(200, 200, 255, 0.6)',
            animationName: 'shard-fly',
            animationDuration: `${TRANSITION_DURATION_MS * 0.6}ms`,
            animationDelay: `${s.delay}ms`,
            animationFillMode: 'forwards',
            animationTimingFunction: 'ease-in',
            ['--shard-end' as string]: `translate(${s.tx}px, ${s.ty}px)`,
            ['--shard-rot' as string]: `${s.rot}deg`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  FloatingDamage                                                     */
/* ------------------------------------------------------------------ */

function FloatingDamage({ amount, color, id }: { amount: number; color: string; id: number }) {
  return (
    <div
      key={id}
      style={{
        position: 'absolute',
        top: -10,
        left: '50%',
        fontSize: 28,
        fontWeight: UI_FONT_BOLD,
        fontFamily: UI_FONT,
        color,
        textShadow: '2px 2px 0 #000, -1px -1px 0 #000',
        animation: 'damage-float 1.5s ease-out forwards',
        pointerEvents: 'none',
        whiteSpace: 'nowrap',
        zIndex: 10,
      }}
    >
      {amount}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  CombatHUD                                                          */
/* ------------------------------------------------------------------ */

const HUD_TEXT_STYLE: React.CSSProperties = {
  fontFamily: UI_FONT,
  fontWeight: UI_FONT_BOLD,
  fontSize: 14,
  color: '#fff',
  textShadow: '1px 1px 2px rgba(0,0,0,0.8), -1px -1px 0 rgba(0,0,0,0.5), 1px -1px 0 rgba(0,0,0,0.5), -1px 1px 0 rgba(0,0,0,0.5)',
  WebkitTextStroke: '0.5px rgba(255,255,255,0.3)',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};

function CombatHUD({ enemy, isNarrow }: { enemy: CombatEnemy; isNarrow: boolean }) {
  const enemyHp = useCombatStore((s) => s.enemyHp);
  const enemyMaxHp = useCombatStore((s) => s.enemyMaxHp);
  const playerHp = useCombatStore((s) => s.playerHp);
  const playerMaxHp = useCombatStore((s) => s.playerMaxHp);

  return (
    <div style={{
      position: 'absolute',
      top: isNarrow ? 15 : 30,
      left: 4,
      right: 4,
      display: 'flex',
      zIndex: 15,
      pointerEvents: 'none',
      gap: 8,
    }}>
      {/* Enemy HP */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ ...HUD_TEXT_STYLE, marginBottom: 2, paddingLeft: 8 }}>
          {enemy.name}
        </div>
        <HUDBar current={enemyHp} max={enemyMaxHp} />
      </div>

      {/* Player HP */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ ...HUD_TEXT_STYLE, marginBottom: 2, paddingLeft: 8 }}>
          あなた
        </div>
        <HUDBar current={playerHp} max={playerMaxHp} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Animation Sequencer Hook                                           */
/* ------------------------------------------------------------------ */

type SpriteAnim =
  | { sheet: 'idle'; frame: number }
  | { sheet: 'combat'; frame: number }
  | { sheet: '1h_slash'; frame: number }
  | { sheet: 'hurt'; frame: number }
  | { sheet: 'emote'; frame: number }
  | { sheet: 'jump'; frame: number };

interface AnimState {
  playerAnim: SpriteAnim;
  enemyAnim: SpriteAnim;
  playerSlide: number;   // translateX pixels
  enemySlide: number;    // translateX pixels
  playerFlash: boolean;
  enemyFlash: boolean;
  screenShake: boolean;
  redFlash: boolean;
  playerDamage: { amount: number; id: number } | null;
  enemyDamage: { amount: number; id: number } | null;
  sliding: boolean;      // true during slide transitions
}

const IDLE_STATE: AnimState = {
  playerAnim: { sheet: 'combat', frame: 0 },
  enemyAnim: { sheet: 'combat', frame: 0 },
  playerSlide: 0,
  enemySlide: 0,
  playerFlash: false,
  enemyFlash: false,
  screenShake: false,
  redFlash: false,
  playerDamage: null,
  enemyDamage: null,
  sliding: false,
};

function useAnimSequencer() {
  const [state, setState] = useState<AnimState>({ ...IDLE_STATE });
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const damageIdRef = useRef(0);

  const clearTimers = useCallback(() => {
    for (const t of timersRef.current) clearTimeout(t);
    timersRef.current = [];
  }, []);

  const schedule = useCallback((fn: () => void, ms: number) => {
    const t = setTimeout(fn, ms);
    timersRef.current.push(t);
    return t;
  }, []);

  const resetToIdle = useCallback(() => {
    clearTimers();
    setState({ ...IDLE_STATE });
  }, [clearTimers]);

  /** Play idle animation loop for both sprites */
  const startIdle = useCallback(() => {
    // Idle loop handled in a separate effect via frame counter
    setState(s => ({
      ...s,
      playerAnim: { sheet: 'combat', frame: 0 },
      enemyAnim: { sheet: 'combat', frame: 0 },
      playerSlide: 0,
      enemySlide: 0,
      playerFlash: false,
      enemyFlash: false,
      screenShake: false,
      redFlash: false,
      playerDamage: null,
      enemyDamage: null,
      sliding: false,
    }));
  }, []);

  /**
   * Player attack sequence.
   * Returns a promise that resolves when the full animation is done.
   */
  const playPlayerAttack = useCallback((damageDealt: number, onComplete: () => void) => {
    clearTimers();
    let elapsed = 0;

    // 1. Slide toward enemy (left)
    setState(s => ({
      ...s,
      playerAnim: { sheet: 'combat', frame: 0 },
      playerSlide: -SLIDE_PX,
      sliding: true,
      enemyDamage: null,
    }));
    elapsed += SLIDE_MS;

    // 2. Slash frames 0-7
    for (let f = 0; f < SLASH_FRAMES; f++) {
      const frameTime = elapsed + f * SLASH_FRAME_MS;
      schedule(() => {
        setState(s => ({
          ...s,
          playerAnim: { sheet: '1h_slash', frame: f },
          sliding: false,
        }));
      }, frameTime);

      // At impact frame: flash enemy, show damage
      if (f === IMPACT_FRAME) {
        schedule(() => {
          const dmgId = ++damageIdRef.current;
          setState(s => ({
            ...s,
            enemyFlash: true,
            enemyDamage: damageDealt > 0 ? { amount: damageDealt, id: dmgId } : null,
          }));
        }, frameTime);

        schedule(() => {
          setState(s => ({ ...s, enemyFlash: false }));
        }, frameTime + WHITE_FLASH_MS);
      }
    }
    elapsed += SLASH_FRAMES * SLASH_FRAME_MS;

    // 3. Slide back
    schedule(() => {
      setState(s => ({
        ...s,
        playerAnim: { sheet: 'combat', frame: 0 },
        playerSlide: 0,
        sliding: true,
      }));
    }, elapsed);
    elapsed += SLIDE_MS;

    // 4. Return to idle and call completion
    schedule(() => {
      setState(s => ({
        ...s,
        playerAnim: { sheet: 'combat', frame: 0 },
        sliding: false,
      }));
      onComplete();
    }, elapsed);
  }, [clearTimers, schedule]);

  /**
   * Enemy attack sequence.
   * Delays startEnemyTurn until impact frame so heals are visible first.
   */
  const playEnemyAttack = useCallback((
    startEnemyTurn: () => void,
    getDamageTaken: () => number,
    onComplete: () => void,
  ) => {
    clearTimers();

    let elapsed = 300; // brief pause before enemy moves

    // 1. Slide toward player (right)
    schedule(() => {
      setState(s => ({
        ...s,
        enemyAnim: { sheet: 'combat', frame: 0 },
        enemySlide: SLIDE_PX,
        sliding: true,
        playerDamage: null,
      }));
    }, elapsed);
    elapsed += SLIDE_MS;

    // 2. Slash frames 0-7
    for (let f = 0; f < SLASH_FRAMES; f++) {
      const frameTime = elapsed + f * SLASH_FRAME_MS;
      schedule(() => {
        setState(s => ({
          ...s,
          enemyAnim: { sheet: '1h_slash', frame: f },
          sliding: false,
        }));
      }, frameTime);

      // At impact frame: calculate damage NOW, then show effects
      if (f === IMPACT_FRAME) {
        schedule(() => {
          // Calculate enemy damage at impact moment (so item heals are visible first)
          startEnemyTurn();
          const dmg = getDamageTaken();
          const dmgId = ++damageIdRef.current;
          setState(s => ({
            ...s,
            playerFlash: true,
            screenShake: true,
            redFlash: true,
            playerDamage: dmg > 0 ? { amount: dmg, id: dmgId } : null,
          }));
        }, frameTime);

        schedule(() => {
          setState(s => ({ ...s, playerFlash: false }));
        }, frameTime + WHITE_FLASH_MS);

        schedule(() => {
          setState(s => ({ ...s, redFlash: false }));
        }, frameTime + 400);

        schedule(() => {
          setState(s => ({ ...s, screenShake: false }));
        }, frameTime + 500);
      }
    }
    elapsed += SLASH_FRAMES * SLASH_FRAME_MS;

    // 3. Slide back
    schedule(() => {
      setState(s => ({
        ...s,
        enemyAnim: { sheet: 'combat', frame: 0 },
        enemySlide: 0,
        sliding: true,
      }));
    }, elapsed);
    elapsed += SLIDE_MS;

    // 4. Return to idle and call completion
    schedule(() => {
      setState(s => ({
        ...s,
        enemyAnim: { sheet: 'combat', frame: 0 },
        sliding: false,
      }));
      onComplete();
    }, elapsed);
  }, [clearTimers, schedule]);

  // Cleanup on unmount
  useEffect(() => {
    return () => clearTimers();
  }, [clearTimers]);

  return { state, resetToIdle, startIdle, playPlayerAttack, playEnemyAttack, setState };
}

/* ------------------------------------------------------------------ */
/*  Idle frame ticker                                                  */
/* ------------------------------------------------------------------ */

function useIdleTick(
  phase: string,
  animState: AnimState,
  setAnimState: React.Dispatch<React.SetStateAction<AnimState>>,
) {
  useEffect(() => {
    // Only tick idle when both sprites are on their resting sheet and no sliding
    const isIdle =
      animState.playerAnim.sheet === 'combat' &&
      animState.enemyAnim.sheet === 'combat' &&
      !animState.sliding;

    if (!isIdle) return;

    // Don't idle during intro transition or victory/defeat
    if (phase === 'intro' || phase === 'victory' || phase === 'defeat') return;

    const interval = setInterval(() => {
      setAnimState(s => ({
        ...s,
        playerAnim: { sheet: 'combat', frame: (s.playerAnim.frame + 1) % IDLE_FRAMES },
        enemyAnim: { sheet: 'combat', frame: (s.enemyAnim.frame + 1) % IDLE_FRAMES },
      }));
    }, IDLE_FRAME_MS);

    return () => clearInterval(interval);
  }, [
    phase,
    animState.playerAnim.sheet,
    animState.enemyAnim.sheet,
    animState.sliding,
    setAnimState,
  ]);
}

/* ------------------------------------------------------------------ */
/*  Main CombatScreen                                                  */
/* ------------------------------------------------------------------ */

export function CombatScreen() {
  const isActive = useCombatStore((s) => s.isActive);
  const phase = useCombatStore((s) => s.phase);
  const enemy = useCombatStore((s) => s.enemy);
  const enemyHp = useCombatStore((s) => s.enemyHp);
  const enemyMaxHp = useCombatStore((s) => s.enemyMaxHp);
  const playerHp = useCombatStore((s) => s.playerHp);
  const playerMaxHp = useCombatStore((s) => s.playerMaxHp);
  const currentWeakness = useCombatStore((s) => s.currentWeakness);
  const selectedMiniGame = useCombatStore((s) => s.selectedMiniGame);
  const lastTier = useCombatStore((s) => s.lastTier);
  const lastDamageDealt = useCombatStore((s) => s.lastDamageDealt);
  const lastDamageTaken = useCombatStore((s) => s.lastDamageTaken);
  // Combat log removed — not useful

  const finishIntro = useCombatStore((s) => s.finishIntro);
  const selectMiniGame = useCombatStore((s) => s.selectMiniGame);
  const completeMiniGame = useCombatStore((s) => s.completeMiniGame);
  const startEnemyTurn = useCombatStore((s) => s.startEnemyTurn);
  const finishEnemyTurn = useCombatStore((s) => s.finishEnemyTurn);
  const finishPlayerResult = useCombatStore((s) => s.finishPlayerResult);
  const endCombat = useCombatStore((s) => s.endCombat);

  const inputMode = useUIStore((s) => s.inputMode);
  const isGamepad = inputMode === 'gamepad';

  const isNarrow = useSyncExternalStore(narrowSubscribe, getIsNarrow);

  const [showItemMenu, setShowItemMenu] = useState(false);
  const [transitionDone, setTransitionDone] = useState(false);
  const [introTextDone, setIntroTextDone] = useState(false);
  const [victoryNpcSpriteBase, setVictoryNpcSpriteBase] = useState<string | null>(null);

  // Gamepad cursor states
  const [actionCursorIndex, setActionCursorIndex] = useState(0);
  const [itemCursorIndex, setItemCursorIndex] = useState(0);
  const [defeatCursorIndex, setDefeatCursorIndex] = useState(0);

  // Combat tutorial state
  const [showCombatTutorial, setShowCombatTutorial] = useState(false);
  const combatTutorialCheckedRef = useRef(false);

  // Animation sequencer
  const anim = useAnimSequencer();
  useIdleTick(phase, anim.state, anim.setState);

  // Refs to read latest store values inside animation callbacks
  const lastDamageTakenRef = useRef(0);
  useEffect(() => { lastDamageTakenRef.current = lastDamageTaken; }, [lastDamageTaken]);

  // Track which phase we already handled to avoid re-triggering
  const handledPhaseRef = useRef<string | null>(null);

  // Reset state when combat starts
  useEffect(() => {
    if (isActive) {
      setTransitionDone(false);
      setIntroTextDone(false);
      setShowItemMenu(false);
      setVictoryNpcSpriteBase(null);
      setShowCombatTutorial(false);
      combatTutorialCheckedRef.current = false;
      anim.resetToIdle();
      handledPhaseRef.current = null;
    }
  }, [isActive, anim.resetToIdle]);

  // Reset item menu when phase changes away from action-select
  useEffect(() => {
    if (phase !== 'action-select') {
      setShowItemMenu(false);
    }
  }, [phase]);

  // Transition complete -> show intro text for 2s -> finishIntro
  const handleTransitionComplete = useCallback(() => {
    setTransitionDone(true);
  }, []);

  useEffect(() => {
    if (!transitionDone || phase !== 'intro') return;
    const timer = setTimeout(() => {
      setIntroTextDone(true);
      finishIntro();
    }, INTRO_TEXT_MS);
    return () => clearTimeout(timer);
  }, [transitionDone, phase, finishIntro]);

  // Start idle animation when entering action-select
  useEffect(() => {
    if (phase === 'action-select') {
      anim.startIdle();
    }
  }, [phase, anim.startIdle]);

  // Show combat tutorial when first entering action-select
  useEffect(() => {
    if (phase === 'action-select' && !combatTutorialCheckedRef.current) {
      combatTutorialCheckedRef.current = true;
      const tutorialDone = useGameStore.getState().questStates.tutorial_combat_done;
      if (!tutorialDone) {
        setShowCombatTutorial(true);
      }
    }
  }, [phase]);

  // Combat tutorial completion handler
  const handleCombatTutorialComplete = useCallback(() => {
    setShowCombatTutorial(false);
    useGameStore.getState().setQuestState('tutorial_combat_done', 'done');
  }, []);

  // Player attack animation (triggered when phase becomes player-result)
  useEffect(() => {
    if (phase !== 'player-result') return;
    if (handledPhaseRef.current === 'player-result-' + lastDamageDealt) return;
    handledPhaseRef.current = 'player-result-' + lastDamageDealt;

    anim.playPlayerAttack(lastDamageDealt, () => {
      finishPlayerResult();
    });
  }, [phase, lastDamageDealt, anim.playPlayerAttack, finishPlayerResult]);

  // Enemy attack animation (triggered when phase becomes enemy-turn)
  useEffect(() => {
    if (phase !== 'enemy-turn') return;
    if (handledPhaseRef.current === 'enemy-turn') return;
    handledPhaseRef.current = 'enemy-turn';

    anim.playEnemyAttack(
      startEnemyTurn,
      () => useCombatStore.getState().lastDamageTaken,
      () => {
        finishEnemyTurn();
      },
    );
  }, [phase, anim.playEnemyAttack, startEnemyTurn, finishEnemyTurn]);

  // Victory animations — enemy collapses, player celebrates
  const victoryAnimPlayed = useRef(false);
  const victoryEmoteInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (phase === 'intro') {
      victoryAnimPlayed.current = false;
      if (victoryEmoteInterval.current) {
        clearInterval(victoryEmoteInterval.current);
        victoryEmoteInterval.current = null;
      }
    }
    if (phase !== 'victory') return;
    if (victoryAnimPlayed.current) return;
    victoryAnimPlayed.current = true;

    const { setState: setAnim } = anim;
    // Enemy hurt collapse (6 frames)
    const HURT_FRAMES = 6;
    const HURT_FRAME_MS = 100;
    for (let f = 0; f < HURT_FRAMES; f++) {
      setTimeout(() => {
        setAnim(s => ({ ...s, enemyAnim: { sheet: 'hurt', frame: f } }));
      }, f * HURT_FRAME_MS);
    }
    // Player jump celebration — loops continuously with pause between each
    const JUMP_FRAMES = 5;
    const JUMP_FRAME_MS = 120;
    const JUMP_PAUSE_MS = 500;
    const JUMP_CYCLE = JUMP_FRAMES * JUMP_FRAME_MS + JUMP_PAUSE_MS;
    const jumpStart = HURT_FRAMES * HURT_FRAME_MS;

    const playJumpCycle = () => {
      for (let f = 0; f < JUMP_FRAMES; f++) {
        setTimeout(() => {
          setAnim(s => ({ ...s, playerAnim: { sheet: 'jump', frame: f } }));
        }, f * JUMP_FRAME_MS);
      }
      // Return to standing pose during pause
      setTimeout(() => {
        setAnim(s => ({ ...s, playerAnim: { sheet: 'idle', frame: 0 } }));
      }, JUMP_FRAMES * JUMP_FRAME_MS);
    };

    // First cycle after enemy falls
    setTimeout(playJumpCycle, jumpStart);
    // Repeat indefinitely
    setTimeout(() => {
      victoryEmoteInterval.current = setInterval(playJumpCycle, JUMP_CYCLE);
    }, jumpStart + JUMP_CYCLE);

    // Post-victory NPC transform flicker
    if (enemy?.npcSpriteBase) {
      const flickerStart = HURT_FRAMES * HURT_FRAME_MS + 400;
      const flickerPattern = [200, 150, 120, 100, 80, 60, 40, 40];
      let flickerTime = flickerStart;
      let showNpc = false;
      for (const duration of flickerPattern) {
        const isNpc = (showNpc = !showNpc);
        const t = flickerTime;
        setTimeout(() => {
          setVictoryNpcSpriteBase(isNpc ? enemy.npcSpriteBase! : null);
        }, t);
        flickerTime += duration;
      }
      // End on NPC sprite
      setTimeout(() => {
        setVictoryNpcSpriteBase(enemy.npcSpriteBase!);
      }, flickerTime);
    }
  }, [phase, anim, enemy]);

  // Reset handled phase on transition to action-select (new round)
  useEffect(() => {
    if (phase === 'action-select' || phase === 'mini-game') {
      handledPhaseRef.current = null;
    }
  }, [phase]);

  // Mini-game completion handler
  const handleMiniGameComplete = useCallback((tier: TimerTier) => {
    completeMiniGame(tier);
  }, [completeMiniGame]);

  // Victory handler
  const isRandomEncounter = useCombatStore((s) => s.isRandomEncounter);
  const handleVictory = useCallback(() => {
    if (!enemy) return;
    const reward = enemy.yenReward;
    useGameStore.getState().setYen(useGameStore.getState().yen + reward);
    useGameStore.getState().addXp(enemy.xpReward);
    useGameStore.getState().setQuestState(`battle_${enemy.id}_done`, 'true');
    endCombat();
    // Auto-trigger post-battle dialogue only for scripted encounters
    // (random encounters handle post-combat dialogue in OverworldScene)
    if (!isRandomEncounter) {
      const postBattleKey = `post_battle_${enemy.id}`;
      if (NPC_DIALOGUE[postBattleKey]) {
        setTimeout(() => {
          useUIStore.getState().startDialogue(NPC_DIALOGUE[postBattleKey]);
        }, 500);
      }
    }
  }, [enemy, endCombat, isRandomEncounter]);

  // Defeat: retry
  const handleRetry = useCallback(() => {
    if (!enemy) return;
    useCombatStore.getState().startCombat(enemy);
  }, [enemy]);

  // Defeat: give up
  const handleGiveUp = useCallback(() => {
    endCombat();
  }, [endCombat]);

  // Healable items count for item cursor bounds
  const items = useInventoryStore((s) => s.items);
  const healableItemCount = items.filter((item) => ITEM_HEALING[item.id] != null).length;

  // Reset action cursor when entering action-select
  useEffect(() => {
    if (phase === 'action-select') {
      setActionCursorIndex(0);
    }
  }, [phase]);

  // Reset item cursor when opening item menu
  useEffect(() => {
    if (showItemMenu) {
      setItemCursorIndex(0);
    }
  }, [showItemMenu]);

  // Reset defeat cursor when entering defeat phase
  useEffect(() => {
    if (phase === 'defeat') {
      setDefeatCursorIndex(0);
    }
  }, [phase]);

  /* ---- Gamepad: Action Select (2x2 grid) ---- */
  const actionSelectActive = isActive && phase === 'action-select' && !showItemMenu && !showCombatTutorial;

  useInputAction('navigate_up', () => {
    setActionCursorIndex((i) => (i >= 2 ? i - 2 : i));
  }, actionSelectActive);

  useInputAction('navigate_down', () => {
    setActionCursorIndex((i) => (i <= 1 ? i + 2 : i));
  }, actionSelectActive);

  useInputAction('navigate_left', () => {
    setActionCursorIndex((i) => (i % 2 === 1 ? i - 1 : i));
  }, actionSelectActive);

  useInputAction('navigate_right', () => {
    setActionCursorIndex((i) => (i % 2 === 0 ? i + 1 : i));
  }, actionSelectActive);

  useInputAction('confirm', () => {
    if (actionCursorIndex <= 2) {
      selectMiniGame(ACTION_GRID_GAMES[actionCursorIndex]);
    } else {
      setShowItemMenu(true);
    }
  }, actionSelectActive);

  /* ---- Gamepad: Item Submenu ---- */
  const itemMenuActive = isActive && phase === 'action-select' && showItemMenu;
  // Max index = healableItemCount (last slot is the "back" button)
  const itemMaxIndex = healableItemCount; // 0..healableItemCount where last = back

  useInputAction('navigate_up', () => {
    setItemCursorIndex((i) => Math.max(0, i - 1));
  }, itemMenuActive);

  useInputAction('navigate_down', () => {
    setItemCursorIndex((i) => Math.min(itemMaxIndex, i + 1));
  }, itemMenuActive);

  useInputAction('confirm', () => {
    if (itemCursorIndex >= healableItemCount) {
      // Back button
      setShowItemMenu(false);
    } else {
      // Use the item at cursor index
      const healableItems = items.filter((item) => ITEM_HEALING[item.id] != null);
      const item = healableItems[itemCursorIndex];
      if (item) {
        const healAmount = ITEM_HEALING[item.id] ?? 0;
        useCombatStore.getState().useItem(healAmount, item.name);
        useInventoryStore.getState().removeItem(item.id);
      }
    }
  }, itemMenuActive);

  useInputAction('cancel', () => {
    setShowItemMenu(false);
  }, itemMenuActive);

  /* ---- Gamepad: Victory Phase ---- */
  useInputAction('confirm', handleVictory, isActive && phase === 'victory');

  /* ---- Gamepad: Defeat Phase ---- */
  const defeatActive = isActive && phase === 'defeat';

  useInputAction('navigate_left', () => {
    setDefeatCursorIndex(0);
  }, defeatActive);

  useInputAction('navigate_right', () => {
    setDefeatCursorIndex(1);
  }, defeatActive);

  useInputAction('confirm', () => {
    if (defeatCursorIndex === 0) {
      handleRetry();
    } else {
      handleGiveUp();
    }
  }, defeatActive);

  if (!isActive || !enemy) return null;

  const {
    playerAnim, enemyAnim,
    playerSlide, enemySlide,
    playerFlash, enemyFlash,
    screenShake, redFlash,
    playerDamage, enemyDamage,
    sliding,
  } = anim.state;

  const showArena = transitionDone;

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      background: '#000 url(/assets/backgrounds/train-station-battle-background1.jpg) center / cover no-repeat',
      imageRendering: 'pixelated',
      zIndex: 200,
      display: 'flex',
      flexDirection: 'column',
    }}>
      <style>{COMBAT_STYLES}</style>

      {/* Combat entry transition */}
      {!transitionDone && (
        <CombatTransition onComplete={handleTransitionComplete} />
      )}

      {/* Red flash overlay for enemy attacks */}
      {redFlash && (
        <div style={{
          position: 'absolute',
          inset: 0,
          animation: 'combat-flash-red 0.4s ease forwards',
          pointerEvents: 'none',
          zIndex: 210,
        }} />
      )}

      {showArena && (
        <>
          {/* HP HUD at top — positioned in full screen */}
          {phase !== 'intro' && <CombatHUD enemy={enemy} isNarrow={isNarrow} />}

          {/* Battlefield — outer: positioning + scale, inner: shake + layout */}
          <div style={{
            position: 'absolute',
            top: '35%',
            left: '-27%',
            right: '-27%',
            zIndex: 5,
            transform: 'scale(0.65)',
            transformOrigin: 'center bottom',
          }}>
          <div style={{
            position: 'relative',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            maxWidth: isNarrow ? undefined : 1400,
            margin: '0 auto',
            padding: isNarrow ? '0 0' : '0 24px',
            gap: isNarrow ? 0 : 24,
            animation: screenShake ? 'combat-shake 0.5s ease' : undefined,
          }}>
              {/* ---- Enemy Side (LEFT, facing right = row 3/east) ---- */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
              }}>
                {/* Enemy sprite container */}
                <div style={{
                  position: 'relative',
                  marginTop: 8,
                  transform: `translateX(${enemySlide}px)`,
                  transition: sliding ? `transform ${SLIDE_MS}ms ease-in-out` : undefined,
                }}>
                  <BattleSprite
                    spriteBase={victoryNpcSpriteBase ?? enemy.spriteBase}
                    sheet={enemyAnim.sheet}
                    frame={enemyAnim.frame}
                    row={enemyAnim.sheet === 'hurt' ? 0 : ROW_EAST}
                    flashWhite={enemyFlash}
                  />
                  {/* Floating damage over enemy */}
                  {enemyDamage && (
                    <FloatingDamage
                      amount={enemyDamage.amount}
                      color="#2a8a4e"
                      id={enemyDamage.id}
                    />
                  )}
                </div>
              </div>

              {/* ---- Center area: tier/result display ---- */}
              <div style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: UI_FONT,
                textAlign: 'center',
                pointerEvents: 'none',
                zIndex: 5,
              }}>
                {phase === 'player-result' && lastTier && (
                  <div style={{ animation: 'combat-fade-in 0.3s ease' }}>
                    <div style={{
                      fontSize: 22,
                      fontWeight: UI_FONT_BOLD,
                      color: TIER_INFO[lastTier].color,
                      textShadow: '1px 1px 0 #000',
                    }}>
                      {TIER_INFO[lastTier].jp}
                    </div>
                  </div>
                )}

                {phase === 'victory' && (
                  <div style={{ animation: 'combat-victory-bounce 0.6s ease' }}>
                    <PixelPanel borderWidth={28} panelOrigin={PANELS.rounded} style={{
                      padding: '20px 40px',
                      textAlign: 'center',
                    }}>
                      <div style={{
                        fontSize: 36,
                        fontWeight: UI_FONT_BOLD,
                        fontFamily: UI_FONT,
                        color: '#fff',
                        textShadow: '2px 2px 0 rgba(0,0,0,0.3)',
                        marginBottom: 4,
                      }}>
                        やった！
                      </div>
                      <div style={{
                        fontSize: 14,
                        fontFamily: UI_FONT,
                        color: UI.textMuted,
                        marginBottom: 10,
                      }}>
                        Victory!
                      </div>
                      <div style={{
                        fontSize: 24,
                        fontWeight: UI_FONT_BOLD,
                        fontFamily: UI_FONT,
                        color: '#6a9fd8',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 4,
                        marginBottom: 4,
                      }}>
                        +{enemy.xpReward} XP
                      </div>
                      <div style={{
                        fontSize: 24,
                        fontWeight: UI_FONT_BOLD,
                        fontFamily: UI_FONT,
                        color: '#2a8a4e',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 4,
                      }}>
                        +<img
                          src="/assets/ui/32x32/yen-coin.png"
                          alt="yen"
                          style={{ width: 28, height: 28, imageRendering: 'pixelated', verticalAlign: 'middle' }}
                        />{enemy.yenReward}
                      </div>
                    </PixelPanel>
                  </div>
                )}

                {phase === 'defeat' && (
                  <div style={{ animation: 'combat-fade-in 0.3s ease' }}>
                    <PixelPanel borderWidth={28} panelOrigin={PANELS.rounded} style={{
                      padding: '12px 24px',
                      textAlign: 'center',
                    }}>
                      <div style={{
                        fontSize: 28,
                        fontWeight: UI_FONT_BOLD,
                        fontFamily: UI_FONT,
                        color: '#c44',
                      }}>
                        Defeated...!
                      </div>
                    </PixelPanel>
                  </div>
                )}
              </div>

              {/* ---- Player Side (RIGHT, facing left = row 1/west) ---- */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
              }}>
                {/* Player sprite container */}
                <div style={{
                  position: 'relative',
                  marginTop: 8,
                  transform: `translateX(${playerSlide}px)`,
                  transition: sliding ? `transform ${SLIDE_MS}ms ease-in-out` : undefined,
                }}>
                  <BattleSprite
                    spriteBase={PLAYER_SPRITE_BASE}
                    sheet={playerAnim.sheet}
                    frame={playerAnim.frame}
                    row={playerAnim.sheet === 'hurt' ? 0 : ROW_WEST}
                    flashWhite={playerFlash}
                  />
                  {/* Floating damage over player */}
                  {playerDamage && (
                    <FloatingDamage
                      amount={playerDamage.amount}
                      color="#c44"
                      id={playerDamage.id}
                    />
                  )}
                </div>
              </div>
          </div>
          </div>

          {/* ---- ARENA (just for intro text) ---- */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              position: 'relative',
              overflow: 'hidden',
              paddingTop: 0,
            }}
          >
            {/* Intro text overlay */}
            {phase === 'intro' && transitionDone && !introTextDone && (
              <div style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 20,
                animation: 'combat-fade-in 0.5s ease',
              }}>
                <div style={{
                  fontSize: 28,
                  fontWeight: UI_FONT_BOLD,
                  fontFamily: UI_FONT,
                  color: '#fff',
                  textShadow: '2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000',
                }}>
                  {enemy.name}が現れた!
                </div>
              </div>
            )}
          </div>

          {/* ---- BOTTOM PANEL: actions, mini-games, log ---- */}
          <div style={{
            flexShrink: 0,
            position: 'relative',
            zIndex: 10,
          }}>
            <PixelPanel
              borderWidth={isNarrow ? 18 : 22}
              panelOrigin={PANELS.rounded}
              style={{
                borderBottomLeftRadius: 0,
                borderBottomRightRadius: 0,
              }}
            >
              {/* Action / mini-game content */}
              <div style={{ minHeight: 60 }}>
                {/* Action select phase */}
                {phase === 'action-select' && !showItemMenu && (
                  <div
                    data-tutorial="combat-actions"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: isNarrow ? 2 : 4,
                      padding: isNarrow ? '2px 2px' : '2px 4px',
                      animation: 'combat-fade-in 0.3s ease',
                    }}
                  >
                    <ActionButton
                      type="vocab_quiz"
                      isWeak={currentWeakness === 'vocab_quiz'}
                      focused={isGamepad && actionCursorIndex === 0}
                      narrow={isNarrow}
                      onClick={() => selectMiniGame('vocab_quiz')}
                    />
                    <ActionButton
                      type="quick_match"
                      isWeak={currentWeakness === 'quick_match'}
                      focused={isGamepad && actionCursorIndex === 1}
                      narrow={isNarrow}
                      onClick={() => selectMiniGame('quick_match')}
                    />
                    <ActionButton
                      type="word_scramble"
                      isWeak={currentWeakness === 'word_scramble'}
                      focused={isGamepad && actionCursorIndex === 2}
                      narrow={isNarrow}
                      onClick={() => selectMiniGame('word_scramble')}
                    />
                    <PixelPanel borderWidth={isNarrow ? 14 : 16} panelOrigin={PANELS.rounded} style={{ flex: 1 }}>
                      <button
                        onClick={() => setShowItemMenu(true)}
                        style={{
                          width: '100%',
                          background: 'none',
                          border: '2px solid transparent',
                          borderRadius: 4,
                          padding: '3px 4px',
                          cursor: 'pointer',
                          fontFamily: UI_FONT,
                          textAlign: 'center',
                          ...(isGamepad && actionCursorIndex === 3 ? GAMEPAD_FOCUS_STYLE : {}),
                        }}
                      >
                        <div style={{
                          fontSize: 15,
                          fontWeight: UI_FONT_BOLD,
                          color: UI.text,
                          marginBottom: 1,
                        }}>
                          アイテム
                        </div>
                        <div style={{
                          fontSize: 9,
                          color: UI.textMuted,
                        }}>
                          Items
                        </div>
                      </button>
                    </PixelPanel>
                  </div>
                )}

                {/* Item submenu */}
                {phase === 'action-select' && showItemMenu && (
                  <ItemSubmenu
                    onBack={() => setShowItemMenu(false)}
                    itemCursorIndex={itemCursorIndex}
                    isGamepad={isGamepad}
                  />
                )}

                {/* Mini-game phase */}
                {phase === 'mini-game' && selectedMiniGame === 'vocab_quiz' && (
                  <VocabQuizBattle onComplete={handleMiniGameComplete} />
                )}
                {phase === 'mini-game' && selectedMiniGame === 'quick_match' && (
                  <QuickMatchBattle onComplete={handleMiniGameComplete} />
                )}
                {phase === 'mini-game' && selectedMiniGame === 'word_scramble' && (
                  <WordScrambleBattle onComplete={handleMiniGameComplete} />
                )}

                {/* Player result phase — tier label shown in arena center, just wait here */}
                {phase === 'player-result' && (
                  <div style={{
                    padding: '4px 0',
                    textAlign: 'center',
                    fontFamily: UI_FONT,
                    fontSize: 14,
                    color: UI.textMuted,
                  }}>
                    攻撃中...
                  </div>
                )}

                {/* Enemy turn phase — wait for animation */}
                {phase === 'enemy-turn' && (
                  <div style={{
                    padding: '4px 0',
                    textAlign: 'center',
                    fontFamily: UI_FONT,
                    fontSize: 14,
                    color: UI.textMuted,
                  }}>
                    {enemy.name}のターン...
                  </div>
                )}

                {/* Victory buttons */}
                {phase === 'victory' && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    padding: '4px 0',
                    animation: 'combat-fade-in 0.5s ease',
                  }}>
                    <PixelPanel borderWidth={22} panelOrigin={PANELS.rounded}>
                      <button
                        onClick={handleVictory}
                        style={{
                          background: 'none',
                          border: '2px solid transparent',
                          borderRadius: 4,
                          padding: '6px 24px',
                          cursor: 'pointer',
                          fontFamily: UI_FONT,
                          fontWeight: UI_FONT_BOLD,
                          fontSize: 18,
                          color: UI.text,
                          ...(isGamepad ? GAMEPAD_FOCUS_STYLE : {}),
                        }}
                      >
                        つづく
                        <span style={{ fontSize: 12, color: UI.textMuted, marginLeft: 8 }}>
                          (Continue)
                        </span>
                      </button>
                    </PixelPanel>
                  </div>
                )}

                {/* Defeat buttons */}
                {phase === 'defeat' && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: 8,
                    padding: '4px 0',
                    animation: 'combat-fade-in 0.5s ease',
                  }}>
                    <PixelPanel borderWidth={22} panelOrigin={PANELS.rounded}>
                      <button
                        onClick={handleRetry}
                        style={{
                          background: 'none',
                          border: '2px solid transparent',
                          borderRadius: 4,
                          padding: '6px 16px',
                          cursor: 'pointer',
                          fontFamily: UI_FONT,
                          fontWeight: UI_FONT_BOLD,
                          fontSize: 16,
                          color: UI.text,
                          ...(isGamepad && defeatCursorIndex === 0 ? GAMEPAD_FOCUS_STYLE : {}),
                        }}
                      >
                        もう一回
                        <span style={{ fontSize: 11, color: UI.textMuted, marginLeft: 6 }}>
                          (Try Again)
                        </span>
                      </button>
                    </PixelPanel>
                    <PixelPanel borderWidth={22} panelOrigin={PANELS.rounded}>
                      <button
                        onClick={handleGiveUp}
                        style={{
                          background: 'none',
                          border: '2px solid transparent',
                          borderRadius: 4,
                          padding: '6px 16px',
                          cursor: 'pointer',
                          fontFamily: UI_FONT,
                          fontSize: 16,
                          color: UI.textMuted,
                          ...(isGamepad && defeatCursorIndex === 1 ? GAMEPAD_FOCUS_STYLE : {}),
                        }}
                      >
                        にげる
                        <span style={{ fontSize: 11, color: UI.textFaded, marginLeft: 6 }}>
                          (Give Up)
                        </span>
                      </button>
                    </PixelPanel>
                  </div>
                )}

                {/* Intro phase — nothing in the bottom panel */}
                {phase === 'intro' && (
                  <div style={{ padding: '4px 0', textAlign: 'center' }} />
                )}
              </div>

            </PixelPanel>
          </div>
        </>
      )}

      {/* Combat tutorial overlay */}
      {showCombatTutorial && (
        <TutorialOverlay
          steps={COMBAT_TUTORIAL_STEPS}
          onComplete={handleCombatTutorialComplete}
        />
      )}
    </div>
  );
}
