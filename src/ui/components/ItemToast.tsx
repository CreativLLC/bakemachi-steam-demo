import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useUIStore } from '../../store/uiStore';
import { useGameStore } from '../../store/gameStore';
import { PixelPanel } from './PixelPanel';
import { UI, UI_FONT, UI_FONT_BOLD, PANELS } from '../pixelTheme';

const mobileSubscribe = (cb: () => void) => { window.addEventListener('resize', cb); return () => window.removeEventListener('resize', cb); };
const getIsMobile = () => window.innerWidth <= 768;

type Phase = 'entering' | 'visible' | 'exiting' | null;

export function ItemToast() {
  const itemToast = useUIStore((s) => s.itemToast);
  const clearItemToast = useUIStore((s) => s.clearItemToast);
  const currentScene = useGameStore((s) => s.currentScene);

  const [phase, setPhase] = useState<Phase>(null);
  const [displayed, setDisplayed] = useState<{ name: string; image: string } | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Start animation cycle when a new toast arrives
  useEffect(() => {
    if (!itemToast) return;

    // Capture the toast data so it persists through the animation
    setDisplayed(itemToast);
    setPhase('entering');

    // Clear any existing timer
    if (timerRef.current) clearTimeout(timerRef.current);

    // entering -> visible after 300ms
    timerRef.current = setTimeout(() => {
      setPhase('visible');

      // visible -> exiting after 2500ms
      timerRef.current = setTimeout(() => {
        setPhase('exiting');

        // exiting -> done after 500ms
        timerRef.current = setTimeout(() => {
          setPhase(null);
          setDisplayed(null);
          clearItemToast();
        }, 500);
      }, 2500);
    }, 300);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [itemToast, clearItemToast]);

  const isMobile = useSyncExternalStore(mobileSubscribe, getIsMobile);

  if (currentScene !== 'Overworld') return null;
  if (!phase || !displayed) return null;

  return (
    <>
      <style>{`
        @keyframes itemToastEnter {
          from { opacity: 0; transform: translateY(-10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes itemToastExit {
          from { opacity: 1; transform: translateY(0); }
          to   { opacity: 0; transform: translateY(-10px); }
        }
      `}</style>
      <PixelPanel
        borderWidth={isMobile ? 28 : 44}
        panelOrigin={PANELS.rounded}
        style={{
          position: 'absolute',
          top: isMobile ? 84 : 160,
          left: isMobile ? 0 : 12,
          zIndex: 50,
          padding: '4px 12px',
          animation: phase === 'entering'
            ? 'itemToastEnter 0.3s ease-out forwards'
            : phase === 'exiting'
              ? 'itemToastExit 0.5s ease-in forwards'
              : undefined,
          opacity: phase === 'visible' ? 1 : undefined,
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <span style={{
            fontFamily: UI_FONT,
            fontWeight: UI_FONT_BOLD,
            fontSize: 18,
            color: '#2a8a4e',
            lineHeight: 1,
          }}>
            +
          </span>
          <img
            src={displayed.image}
            alt={displayed.name}
            style={{
              width: 36,
              height: 36,
              objectFit: 'contain',
              imageRendering: 'pixelated',
              display: 'block',
            }}
          />
          <span style={{
            fontFamily: UI_FONT,
            fontWeight: UI_FONT_BOLD,
            fontSize: 14,
            color: UI.text,
            whiteSpace: 'nowrap',
          }}>
            {displayed.name}
          </span>
        </div>
      </PixelPanel>
    </>
  );
}
