import React, { useRef, useState, useCallback } from 'react';
import { useUIStore } from '../../store/uiStore';
import { useCombatStore } from '../../store/combatStore';
import { useGameStore } from '../../store/gameStore';
import { UI_FONT } from '../pixelTheme';

/** 8-direction mapping from angle sectors */
type Direction = 'up' | 'up-right' | 'right' | 'down-right' | 'down' | 'down-left' | 'left' | 'up-left' | null;

const DPAD_SIZE = 140;
const DPAD_RADIUS = DPAD_SIZE / 2;
const DEAD_ZONE = DPAD_RADIUS * 0.15;
const BUTTON_SIZE = 60;

/** Map an angle (radians) to one of 8 directions. 0 = right, PI/2 = down. */
function angleToDirection(angle: number): Direction {
  // Normalize to 0..2PI
  const a = ((angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  // Each sector is 45 degrees (PI/4). Offset by half a sector so "right" is centered on 0.
  const sector = Math.floor((a + Math.PI / 8) / (Math.PI / 4)) % 8;
  const directions: Direction[] = ['right', 'down-right', 'down', 'down-left', 'left', 'up-left', 'up', 'up-right'];
  return directions[sector];
}

/** Map direction to (dx, dy) for setTouchDirection */
function directionToDelta(dir: Direction): { dx: number; dy: number } {
  switch (dir) {
    case 'up':         return { dx: 0,  dy: -1 };
    case 'up-right':   return { dx: 1,  dy: -1 };
    case 'right':      return { dx: 1,  dy: 0  };
    case 'down-right': return { dx: 1,  dy: 1  };
    case 'down':       return { dx: 0,  dy: 1  };
    case 'down-left':  return { dx: -1, dy: 1  };
    case 'left':       return { dx: -1, dy: 0  };
    case 'up-left':    return { dx: -1, dy: -1 };
    default:           return { dx: 0,  dy: 0  };
  }
}

export function VirtualDPad() {
  const inputMode = useUIStore((s) => s.inputMode);
  const isDialogueActive = useUIStore((s) => s.isDialogueActive);
  const activeMenu = useUIStore((s) => s.activeMenu);
  const activeMatchingGame = useUIStore((s) => s.activeMatchingGame);
  const activeScrambleGame = useUIStore((s) => s.activeScrambleGame);
  const activeReadingGame = useUIStore((s) => s.activeReadingGame);
  const setTouchDirection = useUIStore((s) => s.setTouchDirection);
  const pressTouchConfirm = useUIStore((s) => s.pressTouchConfirm);
  const setInputMode = useUIStore((s) => s.setInputMode);
  const combatActive = useCombatStore((s) => s.isActive);
  const currentScene = useGameStore((s) => s.currentScene);

  const dpadRef = useRef<HTMLDivElement>(null);
  const [activeDir, setActiveDir] = useState<Direction>(null);

  const computeDirection = useCallback(
    (clientX: number, clientY: number) => {
      const el = dpadRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = clientX - cx;
      const dy = clientY - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < DEAD_ZONE) {
        setActiveDir(null);
        setTouchDirection(0, 0);
        return;
      }

      const angle = Math.atan2(dy, dx);
      const dir = angleToDirection(angle);
      const delta = directionToDelta(dir);
      setActiveDir(dir);
      setTouchDirection(delta.dx, delta.dy);
    },
    [setTouchDirection],
  );

  const handleDPadTouchStart = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      if (inputMode !== 'touch') setInputMode('touch');
      const touch = e.touches[0];
      computeDirection(touch.clientX, touch.clientY);
    },
    [computeDirection, inputMode, setInputMode],
  );

  const handleDPadTouchMove = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      computeDirection(touch.clientX, touch.clientY);
    },
    [computeDirection],
  );

  const handleDPadTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      setActiveDir(null);
      setTouchDirection(0, 0);
    },
    [setTouchDirection],
  );

  const handleButtonTouchStart = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      pressTouchConfirm();
    },
    [pressTouchConfirm],
  );

  // Determine visibility -- hooks are all called above
  const visible =
    inputMode === 'touch' &&
    currentScene === 'Overworld' &&
    !isDialogueActive &&
    !combatActive &&
    !activeMenu &&
    !activeMatchingGame &&
    !activeScrambleGame &&
    !activeReadingGame;

  if (!visible) return null;

  const arrowOpacity = (dirs: Direction[]) => (dirs.includes(activeDir) ? 1 : 0.3);
  const arrowStyle: React.CSSProperties = {
    position: 'absolute',
    color: 'rgba(255,255,255,0.7)',
    fontSize: 20,
    fontFamily: UI_FONT,
    lineHeight: 1,
    pointerEvents: 'none',
    userSelect: 'none',
    transition: 'opacity 0.05s',
  };

  return (
    <>
      {/* D-Pad */}
      <div
        ref={dpadRef}
        onTouchStart={handleDPadTouchStart}
        onTouchMove={handleDPadTouchMove}
        onTouchEnd={handleDPadTouchEnd}
        onTouchCancel={handleDPadTouchEnd}
        style={{
          position: 'absolute',
          bottom: 20,
          left: 20,
          width: DPAD_SIZE,
          height: DPAD_SIZE,
          borderRadius: '50%',
          background: 'rgba(0,0,0,0.25)',
          border: '2px solid rgba(255,255,255,0.15)',
          touchAction: 'none',
          zIndex: 60,
          userSelect: 'none',
          WebkitUserSelect: 'none',
        }}
      >
        {/* Up arrow */}
        <span
          style={{
            ...arrowStyle,
            top: 8,
            left: '50%',
            transform: 'translateX(-50%)',
            opacity: arrowOpacity(['up', 'up-left', 'up-right']),
          }}
        >
          ▲
        </span>
        {/* Down arrow */}
        <span
          style={{
            ...arrowStyle,
            bottom: 8,
            left: '50%',
            transform: 'translateX(-50%)',
            opacity: arrowOpacity(['down', 'down-left', 'down-right']),
          }}
        >
          ▼
        </span>
        {/* Left arrow */}
        <span
          style={{
            ...arrowStyle,
            left: 10,
            top: '50%',
            transform: 'translateY(-50%)',
            opacity: arrowOpacity(['left', 'up-left', 'down-left']),
          }}
        >
          ◄
        </span>
        {/* Right arrow */}
        <span
          style={{
            ...arrowStyle,
            right: 10,
            top: '50%',
            transform: 'translateY(-50%)',
            opacity: arrowOpacity(['right', 'up-right', 'down-right']),
          }}
        >
          ►
        </span>
      </div>

      {/* Interact "A" Button */}
      <div
        onTouchStart={handleButtonTouchStart}
        style={{
          position: 'absolute',
          bottom: 80,
          right: 20,
          width: BUTTON_SIZE,
          height: BUTTON_SIZE,
          borderRadius: '50%',
          background: 'rgba(0,0,0,0.25)',
          border: '2px solid rgba(255,255,255,0.15)',
          touchAction: 'none',
          zIndex: 60,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          userSelect: 'none',
          WebkitUserSelect: 'none',
        }}
      >
        <span
          style={{
            fontFamily: UI_FONT,
            fontSize: 22,
            color: 'rgba(255,255,255,0.7)',
            lineHeight: 1,
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          A
        </span>
      </div>
    </>
  );
}
