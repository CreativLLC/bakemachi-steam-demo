import { useEffect, useRef } from 'react';
import { useUIStore } from '../../store/uiStore';
import { useVocabularyStore } from '../../store/vocabularyStore';
import { PixelPanel } from './PixelPanel';
import { UI, UI_FONT, UI_FONT_BOLD } from '../pixelTheme';

const JLPT_COLORS: Record<number, string> = {
  5: '#4caf50',
  4: '#2196f3',
  3: '#ff9800',
  2: '#f44336',
  1: '#9c27b0',
};

export function WordPopup() {
  const { wordPopup, hideWordPopup } = useUIStore();
  const showRomaji = useUIStore((s) => s.showRomaji);
  const popupRef = useRef<HTMLDivElement>(null);

  // Close when user releases / taps elsewhere
  useEffect(() => {
    if (!wordPopup) return;

    const handlePointerUp = () => {
      hideWordPopup();
    };

    // Small delay so the triggering pointer-up doesn't immediately close it
    const timer = setTimeout(() => {
      window.addEventListener('pointerup', handlePointerUp);
    }, 50);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [wordPopup, hideWordPopup]);

  if (!wordPopup) return null;

  const { word, x, y } = wordPopup;
  const progress = useVocabularyStore.getState().getProgress(word.id);
  const jlptColor = JLPT_COLORS[word.jlptLevel] ?? '#888';

  return (
    <div ref={popupRef}>
      <PixelPanel
        borderWidth={28}
        style={{
          position: 'fixed',
          left: Math.min(Math.max(x - 140, 8), window.innerWidth - 288),
          top: Math.max(y - 200, 8),
          width: 280,
          padding: '14px 16px',
          zIndex: 200,
          pointerEvents: 'auto',
        }}
      >
        {/* Kanji display */}
        <div style={{
          fontSize: 28,
          textAlign: 'center',
          marginBottom: 8,
          letterSpacing: '0.1em',
          color: UI.text,
          fontFamily: UI_FONT,
          fontWeight: UI_FONT_BOLD,
        }}>
          {word.kanji}
        </div>

        {/* Reading */}
        <div style={{
          fontSize: 16,
          textAlign: 'center',
          color: UI.gold,
          marginBottom: 4,
          fontFamily: UI_FONT,
        }}>
          {word.kana}{showRomaji && ` (${word.romaji})`}
        </div>

        {/* Meaning */}
        <div style={{
          fontSize: 14,
          textAlign: 'center',
          color: UI.textMuted,
          marginBottom: 10,
          borderBottom: `1px solid ${UI.textFaded}40`,
          paddingBottom: 10,
          fontFamily: UI_FONT,
        }}>
          {word.meaning}
        </div>

        {/* Stats row */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 11,
          color: UI.textMuted,
          fontFamily: UI_FONT,
        }}>
          <span style={{
            background: jlptColor,
            color: '#fff',
            borderRadius: 3,
            padding: '1px 6px',
            fontSize: 10,
            fontWeight: UI_FONT_BOLD,
          }}>
            JLPT N{word.jlptLevel}
          </span>
          <span>
            {progress ? `Seen ${progress.timesEncountered}x` : 'New word'}
          </span>
        </div>
      </PixelPanel>
    </div>
  );
}
