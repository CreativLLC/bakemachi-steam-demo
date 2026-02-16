import { useEffect, useRef, useState } from 'react';
import { TIMER_CONFIG, TIER_INFO } from '../../../data/combatConfig';
import { UI, UI_FONT, UI_FONT_BOLD } from '../../pixelTheme';
import type { TimerTier } from '../../../store/combatStore';

const TIMER_STYLES = `
@keyframes timer-pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.4); opacity: 0.7; }
}
`;

interface CombatTimerProps {
  totalMs: number;
  onComplete: (tier: TimerTier) => void;
  isRunning: boolean;
  completedAt?: number;
}

function getTierFromElapsed(elapsedMs: number, thresholds?: { fastThreshold: number; mediumThreshold: number; slowThreshold: number }): TimerTier {
  const t = thresholds ?? TIMER_CONFIG;
  if (elapsedMs <= t.fastThreshold) return 'fast';
  if (elapsedMs <= t.mediumThreshold) return 'medium';
  if (elapsedMs <= t.slowThreshold) return 'slow';
  return 'miss';
}

function getBarColor(fraction: number): string {
  if (fraction <= 0.30) return '#2a8a4e';  // green
  if (fraction <= 0.65) return '#d4af37';  // gold
  if (fraction <= 0.90) return '#c08a00';  // orange
  return '#c44';                            // red
}

export function CombatTimer({ totalMs, onComplete, isRunning, completedAt }: CombatTimerProps) {
  const [elapsed, setElapsed] = useState(0);
  const startTimeRef = useRef<number>(0);
  const rafRef = useRef<number>(0);
  const completedRef = useRef(false);

  // Start/stop the animation loop
  useEffect(() => {
    if (!isRunning) return;

    completedRef.current = false;
    startTimeRef.current = performance.now();
    setElapsed(0);

    const tick = (now: number) => {
      if (completedRef.current) return;

      const ms = now - startTimeRef.current;
      setElapsed(ms);

      if (ms >= totalMs) {
        completedRef.current = true;
        setElapsed(totalMs);
        onComplete('miss');
        return;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [isRunning, totalMs, onComplete]);

  // Freeze at completedAt position
  useEffect(() => {
    if (completedAt != null) {
      completedRef.current = true;
      cancelAnimationFrame(rafRef.current);
      setElapsed(completedAt);
    }
  }, [completedAt]);

  const displayElapsed = completedAt != null ? completedAt : elapsed;
  const fraction = Math.min(displayElapsed / totalMs, 1);
  const barColor = getBarColor(fraction);
  const isFrozen = completedAt != null;
  const tier = isFrozen ? getTierFromElapsed(completedAt) : null;
  const tierInfo = tier ? TIER_INFO[tier] : null;

  // Format elapsed as seconds with 1 decimal
  const seconds = (displayElapsed / 1000).toFixed(1);

  return (
    <div style={{ width: '100%', maxWidth: 300, margin: '0 auto' }}>
      <style>{TIMER_STYLES}</style>

      {/* Timer bar container */}
      <div style={{
        position: 'relative',
        width: '100%',
        height: 20,
        borderRadius: 10,
        background: 'rgba(0, 0, 0, 0.2)',
        overflow: 'hidden',
        border: `2px solid ${UI.textMuted}`,
      }}>
        {/* Zone markers */}
        <div style={{
          position: 'absolute',
          left: '30%',
          top: 0,
          bottom: 0,
          width: 1,
          background: 'rgba(0, 0, 0, 0.15)',
        }} />
        <div style={{
          position: 'absolute',
          left: '65%',
          top: 0,
          bottom: 0,
          width: 1,
          background: 'rgba(0, 0, 0, 0.15)',
        }} />
        <div style={{
          position: 'absolute',
          left: '90%',
          top: 0,
          bottom: 0,
          width: 1,
          background: 'rgba(0, 0, 0, 0.15)',
        }} />

        {/* Filled bar */}
        <div style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: `${fraction * 100}%`,
          background: barColor,
          borderRadius: 8,
          transition: isFrozen ? 'none' : 'background 0.3s ease',
        }} />

        {/* Pulsing indicator at current position */}
        {!isFrozen && isRunning && (
          <div style={{
            position: 'absolute',
            left: `${fraction * 100}%`,
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: '#fff',
            boxShadow: `0 0 6px ${barColor}`,
            animation: 'timer-pulse 0.8s ease-in-out infinite',
          }} />
        )}
      </div>

      {/* Time display and tier label */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 6,
        fontFamily: UI_FONT,
        fontSize: 13,
      }}>
        <span style={{
          color: UI.textMuted,
        }}>
          {seconds}s / {(totalMs / 1000).toFixed(0)}s
        </span>

        {tierInfo && (
          <span style={{
            color: tierInfo.color,
            fontWeight: UI_FONT_BOLD,
            fontSize: 15,
          }}>
            {tierInfo.label}
          </span>
        )}
      </div>
    </div>
  );
}

export { getTierFromElapsed };
