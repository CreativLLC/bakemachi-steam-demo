import { useUIStore } from '../../store/uiStore';
import { PixelPanel } from './PixelPanel';
import { UI, UI_FONT, UI_FONT_BOLD, PANELS } from '../pixelTheme';
import { useInputAction } from '../hooks/useInputAction';

export function SettingsScreen() {
  const activeMenu = useUIStore((s) => s.activeMenu);

  useInputAction('cancel', () => {
    useUIStore.getState().closeMenu();
  }, activeMenu === 'settings');

  if (activeMenu !== 'settings') return null;

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
        borderWidth={52}
        panelOrigin={PANELS.rounded}
        style={{
          maxWidth: 420,
          width: '90%',
          padding: '24px 28px',
          position: 'relative',
        }}
      >
        {/* Close button */}
        <button
          onClick={() => useUIStore.getState().closeMenu()}
          style={{
            position: 'absolute',
            top: 4,
            right: 8,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: 20,
            color: UI.textMuted,
            fontFamily: UI_FONT,
            fontWeight: UI_FONT_BOLD,
            padding: '2px 6px',
            lineHeight: 1,
          }}
        >
          X
        </button>

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
          せってい
        </div>
        <div style={{
          textAlign: 'center',
          fontSize: 11,
          color: UI.textMuted,
          marginBottom: 20,
          fontFamily: UI_FONT,
        }}>
          Settings
        </div>

        {/* Placeholder */}
        <div style={{
          textAlign: 'center',
          fontSize: 14,
          color: UI.textMuted,
          fontFamily: UI_FONT,
          padding: '40px 0',
        }}>
          Settings coming soon...
        </div>
      </PixelPanel>
    </div>
  );
}
