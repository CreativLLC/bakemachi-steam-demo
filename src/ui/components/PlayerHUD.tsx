import { useEffect, useState, useRef, useSyncExternalStore } from 'react';
import { useGameStore } from '../../store/gameStore';
import { useUIStore } from '../../store/uiStore';
import { PixelPanel } from './PixelPanel';
import { UI, UI_FONT, UI_FONT_BOLD, PANELS } from '../pixelTheme';

const mobileSubscribe = (cb: () => void) => { window.addEventListener('resize', cb); return () => window.removeEventListener('resize', cb); };
const getIsMobile = () => window.innerWidth <= 768;

export function PlayerHUD() {
  const yen = useGameStore((s) => s.yen);
  const currentScene = useGameStore((s) => s.currentScene);
  const yenSpend = useUIStore((s) => s.yenSpend);
  const clearYenSpend = useUIStore((s) => s.clearYenSpend);
  const energy = useGameStore((s) => s.energy);
  const maxEnergy = useGameStore((s) => s.maxEnergy);
  const yenGain = useUIStore((s) => s.yenGain);
  const clearYenGain = useUIStore((s) => s.clearYenGain);

  const [floatKey, setFloatKey] = useState(0);
  const [floatAmount, setFloatAmount] = useState<number | null>(null);
  const [floatType, setFloatType] = useState<'spend' | 'gain'>('spend');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Spend animation
  useEffect(() => {
    if (yenSpend === null) return;
    if (timerRef.current) clearTimeout(timerRef.current);

    setFloatAmount(yenSpend);
    setFloatType('spend');
    setFloatKey((k) => k + 1);

    timerRef.current = setTimeout(() => {
      setFloatAmount(null);
      clearYenSpend();
      timerRef.current = null;
    }, 1500);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [yenSpend, clearYenSpend]);

  // Gain animation
  useEffect(() => {
    if (yenGain === null) return;
    if (timerRef.current) clearTimeout(timerRef.current);

    setFloatAmount(yenGain);
    setFloatType('gain');
    setFloatKey((k) => k + 1);

    timerRef.current = setTimeout(() => {
      setFloatAmount(null);
      clearYenGain();
      timerRef.current = null;
    }, 1500);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [yenGain, clearYenGain]);

  const isMobile = useSyncExternalStore(mobileSubscribe, getIsMobile);

  // Only show during overworld gameplay
  if (currentScene !== 'Overworld') return null;

  return (
    <PixelPanel
      borderWidth={isMobile ? 34 : 44}
      panelOrigin={PANELS.rounded}
      style={{
        position: 'absolute',
        top: isMobile ? 0 : 12,
        left: isMobile ? 0 : 12,
        display: 'flex',
        alignItems: 'center',
        gap: isMobile ? 8 : 12,
        padding: isMobile ? '6px 10px 6px 6px' : '8px 16px 8px 8px',
        zIndex: 50,
      }}
    >
      <style>{`
        @keyframes yen-float-up {
          0% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-30px); }
        }
        @keyframes yen-float-down {
          0% { opacity: 0; transform: translateY(-30px); }
          50% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(0); }
        }
      `}</style>

      {/* Character portrait */}
      <img
        src="/assets/ui/portraits/main-character-male.png"
        alt="Player"
        style={{
          width: isMobile ? 68 : 96,
          height: isMobile ? 68 : 96,
          imageRendering: 'pixelated',
          display: 'block',
          marginBottom: isMobile ? -6 : -11,
        }}
      />

      {/* Stats column: yen + energy */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: isMobile ? 4 : 6,
      }}>
        {/* Yen display */}
        <div style={{
          position: 'relative',
          fontFamily: UI_FONT,
          fontWeight: UI_FONT_BOLD,
          fontSize: isMobile ? 16 : 18,
          color: UI.text,
          whiteSpace: 'nowrap',
        }}>
          <img src="/assets/ui/32x32/yen-coin.png" alt="¥" style={{ width: isMobile ? 18 : 20, height: isMobile ? 18 : 20, imageRendering: 'pixelated', verticalAlign: 'middle', marginRight: isMobile ? 4 : 6, marginTop: -4 }} />
          {yen.toLocaleString()}

          {/* Floating spend/gain animation */}
          {floatAmount !== null && (
            <div
              key={floatKey}
              style={{
                position: 'absolute',
                left: 0,
                bottom: '100%',
                fontFamily: UI_FONT,
                fontWeight: UI_FONT_BOLD,
                fontSize: 14,
                color: floatType === 'spend' ? '#c44' : '#2a8a4e',
                whiteSpace: 'nowrap',
                pointerEvents: 'none',
                animation: floatType === 'spend'
                  ? 'yen-float-up 1.5s ease-out forwards'
                  : 'yen-float-down 1.5s ease-out forwards',
              }}
            >
              {floatType === 'spend' ? '-' : '+'}
              <img src="/assets/ui/32x32/yen-coin.png" alt="¥" style={{ width: 14, height: 14, imageRendering: 'pixelated', verticalAlign: 'middle', marginRight: 2, marginTop: -2 }} />
              {floatAmount.toLocaleString()}
            </div>
          )}
        </div>

        {/* Energy bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: isMobile ? 1 : 2,
        }}>
          <img src="/assets/ui/32x32/icon-lightning.png" alt="" style={{ width: isMobile ? 20 : 24, height: isMobile ? 20 : 24, imageRendering: 'pixelated', flexShrink: 0 }} />
          <div style={{
            position: 'relative',
            width: isMobile ? 48 : 40 * 1.25,
            height: isMobile ? 18 : 16 * 1.25,
          }}>
            {/* Full blue bar base */}
            <img
              src="/assets/ui/32x32/bar-energy-blue.png"
              alt=""
              style={{
                width: '100%', height: '100%',
                imageRendering: 'pixelated',
                display: 'block',
              }}
            />
            {/* Empty section overlays — each covers 25% of bar, stacked right to left */}
            {(() => {
              const fraction = maxEnergy > 0 ? energy / maxEnergy : 1;
              const emptySections = fraction <= 0 ? 4 : fraction <= 0.25 ? 3 : fraction <= 0.5 ? 2 : fraction <= 0.75 ? 1 : 0;
              const barW = isMobile ? 48 : 40 * 1.25;
              const barH = isMobile ? 18 : 16 * 1.25;
              const sectionW = (barW - 11) / 4; // 4px padding left + right
              return Array.from({ length: emptySections }, (_, i) => (
                <img
                  key={i}
                  src="/assets/ui/32x32/bar-energy-empty-section.png"
                  alt=""
                  style={{
                    position: 'absolute',
                    top: 0,
                    right: 3 + i * sectionW,
                    width: sectionW,
                    height: barH - 3,
                    imageRendering: 'pixelated',
                  }}
                />
              ));
            })()}
          </div>
        </div>
      </div>
    </PixelPanel>
  );
}
