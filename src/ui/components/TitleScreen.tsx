import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { useSettingsStore } from '../../store/settingsStore';
import { PixelPanel } from './PixelPanel';
import { PANELS, UI, UI_FONT, UI_FONT_BOLD } from '../pixelTheme';
import { useInputAction } from '../hooks/useInputAction';

const menuItems = [
  { label: 'New Game', enabled: true },
  { label: 'Load Game', enabled: false },
  { label: 'Options', enabled: false },
  { label: 'Exit', enabled: false },
] as const;

// ---------------------------------------------------------------------------
// Kana prerequisite modal
// ---------------------------------------------------------------------------

function KanaModal({ onDismiss }: { onDismiss: () => void }) {
  const hideKanaModal = useSettingsStore((s) => s.hideKanaModal);
  const setHideKanaModal = useSettingsStore((s) => s.setHideKanaModal);

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(0,0,0,0.6)',
      zIndex: 200,
    }}>
      <PixelPanel
        panelOrigin={PANELS.rounded}
        borderWidth={44}
        style={{ maxWidth: 420, width: '90%' }}
      >
        <div style={{
          padding: '16px 20px',
          fontFamily: UI_FONT,
          color: UI.text,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}>
          {/* Title */}
          <div style={{
            fontSize: 16,
            fontWeight: UI_FONT_BOLD,
            textAlign: 'center',
            lineHeight: 1.4,
          }}>
            Before You Play
          </div>

          {/* Body */}
          <div style={{ fontSize: 13, lineHeight: 1.6 }}>
            Bakemachi expects you to know <strong>Hiragana & Katakana</strong> (Kana)
            to fully enjoy the experience. The game text is primarily in Japanese kana.
          </div>

          <div style={{ fontSize: 13, lineHeight: 1.6 }}>
            If you don't know kana yet, here are some great free resources:
          </div>

          {/* Resource links */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            padding: '4px 0',
          }}>
            <a
              href="https://www.tofugu.com/japanese/learn-hiragana/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: '#5b9bd5',
                fontSize: 13,
                fontFamily: UI_FONT,
                textDecoration: 'underline',
              }}
            >
              Tofugu — Learn Hiragana
            </a>
            <a
              href="https://www.tofugu.com/japanese/learn-katakana/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: '#5b9bd5',
                fontSize: 13,
                fontFamily: UI_FONT,
                textDecoration: 'underline',
              }}
            >
              Tofugu — Learn Katakana
            </a>
            <a
              href="https://realkana.com/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: '#5b9bd5',
                fontSize: 13,
                fontFamily: UI_FONT,
                textDecoration: 'underline',
              }}
            >
              RealKana — Kana Practice Tool
            </a>
          </div>

          {/* Checkbox */}
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 12,
            color: UI.textMuted,
            cursor: 'pointer',
          }}>
            <input
              type="checkbox"
              checked={hideKanaModal}
              onChange={(e) => setHideKanaModal(e.target.checked)}
              style={{ cursor: 'pointer', accentColor: UI.gold }}
            />
            Don't show this again
          </label>

          {/* Dismiss button */}
          <PixelPanel
            panelOrigin={PANELS.rounded}
            borderWidth={22}
            style={{ cursor: 'pointer', alignSelf: 'center' }}
          >
            <button
              onClick={onDismiss}
              style={{
                display: 'block',
                padding: '6px 32px',
                fontSize: 14,
                fontFamily: UI_FONT,
                fontWeight: UI_FONT_BOLD,
                color: UI.text,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Got it!
            </button>
          </PixelPanel>
        </div>
      </PixelPanel>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Title screen
// ---------------------------------------------------------------------------

export function TitleScreen() {
  const currentScene = useGameStore((s) => s.currentScene);
  const clickNewGame = useGameStore((s) => s.clickTitleNewGame);
  const hideKanaModal = useSettingsStore((s) => s.hideKanaModal);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [modalDismissed, setModalDismissed] = useState(false);
  const isActive = currentScene === 'Title';
  const showModal = isActive && !hideKanaModal && !modalDismissed;

  // Find indices of enabled menu items for navigation bounds
  const enabledIndices = menuItems.reduce<number[]>((acc, item, i) => {
    if (item.enabled) acc.push(i);
    return acc;
  }, []);

  useInputAction('navigate_up', () => {
    setSelectedIndex(i => {
      const currentPos = enabledIndices.indexOf(i);
      if (currentPos > 0) return enabledIndices[currentPos - 1];
      const above = enabledIndices.filter(idx => idx < i);
      return above.length > 0 ? above[above.length - 1] : i;
    });
  }, isActive && !showModal);

  useInputAction('navigate_down', () => {
    setSelectedIndex(i => {
      const currentPos = enabledIndices.indexOf(i);
      if (currentPos >= 0 && currentPos < enabledIndices.length - 1) return enabledIndices[currentPos + 1];
      const below = enabledIndices.filter(idx => idx > i);
      return below.length > 0 ? below[0] : i;
    });
  }, isActive && !showModal);

  useInputAction('confirm', () => {
    if (showModal) {
      setModalDismissed(true);
      return;
    }
    const item = menuItems[selectedIndex];
    if (item?.enabled) {
      clickNewGame();
    }
  }, isActive);

  if (!isActive) return null;

  return (
    <>
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: '6%',
        paddingBottom: '80px',
      }}>
        {/* Logo */}
        <img
          src="/assets/backgrounds/bakemachi-logo.png"
          alt="Bakemachi"
          style={{
            maxWidth: '80%',
            width: 400,
            height: 'auto',
            imageRendering: 'auto',
            pointerEvents: 'none',
          }}
        />

        {/* Menu buttons */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          minWidth: '240px',
        }}>
          {menuItems.map((item, index) => (
            <PixelPanel
              key={item.label}
              panelOrigin={PANELS.rounded}
              borderWidth={28}
              style={{
                cursor: item.enabled ? 'pointer' : 'default',
                opacity: item.enabled ? 1 : 0.5,
                transition: 'opacity 0.15s',
                outline: index === selectedIndex ? '2px solid #d4af37' : '2px solid transparent',
                outlineOffset: -2,
                borderRadius: 4,
              }}
            >
              <button
                disabled={!item.enabled}
                onClick={item.enabled ? clickNewGame : undefined}
                onPointerEnter={() => { if (item.enabled) setSelectedIndex(index); }}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '8px 24px',
                  fontSize: '16px',
                  fontFamily: UI_FONT,
                  fontWeight: UI_FONT_BOLD,
                  color: item.enabled ? UI.text : UI.textFaded,
                  background: 'none',
                  border: 'none',
                  cursor: item.enabled ? 'pointer' : 'default',
                  letterSpacing: '1px',
                  textAlign: 'center',
                }}
              >
                {item.label}
              </button>
            </PixelPanel>
          ))}
        </div>
      </div>

      {/* Kana modal overlay */}
      {showModal && <KanaModal onDismiss={() => setModalDismissed(true)} />}
    </>
  );
}
