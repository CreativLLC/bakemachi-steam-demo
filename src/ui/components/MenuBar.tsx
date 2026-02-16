import { useSyncExternalStore } from 'react';
import { useGameStore } from '../../store/gameStore';
import { useUIStore } from '../../store/uiStore';
import { PixelPanel } from './PixelPanel';
import { UI, UI_FONT, UI_FONT_BOLD, PANELS } from '../pixelTheme';
import { GamepadIcon } from './GamepadIcon';

/** Reactive narrow-screen check */
const widthSubscribe = (cb: () => void) => { window.addEventListener('resize', cb); return () => window.removeEventListener('resize', cb); };
const getIsNarrow = () => window.innerWidth < 500;

const mobileSubscribe = (cb: () => void) => { window.addEventListener('resize', cb); return () => window.removeEventListener('resize', cb); };
const getIsMobile = () => window.innerWidth <= 768;

export function MenuBar() {
  const currentScene = useGameStore((s) => s.currentScene);
  const isDialogueActive = useUIStore((s) => s.isDialogueActive);
  const activeMatchingGame = useUIStore((s) => s.activeMatchingGame);
  const activeMenu = useUIStore((s) => s.activeMenu);
  const isNarrow = useSyncExternalStore(widthSubscribe, getIsNarrow);
  const isMobile = useSyncExternalStore(mobileSubscribe, getIsMobile);
  const inputMode = useUIStore((s) => s.inputMode);

  // Only show in overworld, hide during dialogue/matching/menu overlays
  if (currentScene !== 'Overworld') return null;
  if (isDialogueActive || activeMatchingGame || activeMenu) return null;

  return (
    <div style={{
      position: 'absolute',
      ...(isMobile
        ? { top: 4, right: 4 }
        : { bottom: 12, right: 12 }),
      zIndex: 50,
      display: 'flex',
      flexDirection: 'row',
      gap: 8,
    }}>
      <PixelPanel borderWidth={22} panelOrigin={PANELS.rounded}>
        <button
          onClick={() => useUIStore.getState().openMenu('menu')}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px 10px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <img
            src="/assets/ui/32x32/icon-backpack.png"
            alt=""
            style={{ width: 40, height: 40, imageRendering: 'pixelated' }}
          />
          <div style={{
            fontSize: 11,
            color: UI.text,
            fontFamily: UI_FONT,
            fontWeight: UI_FONT_BOLD,
          }}>
            メニュー
          </div>
          {!isNarrow && (
            inputMode === 'gamepad'
              ? <GamepadIcon button="y" size={18} />
              : <div style={{
                  fontSize: 10,
                  color: UI.textMuted,
                  fontFamily: UI_FONT,
                }}>
                  [I]
                </div>
          )}
        </button>
      </PixelPanel>
    </div>
  );
}
