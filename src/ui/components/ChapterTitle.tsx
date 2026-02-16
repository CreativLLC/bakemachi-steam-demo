import { useEffect, useState } from 'react';
import { useUIStore } from '../../store/uiStore';
import { UI_FONT, UI_FONT_BOLD } from '../pixelTheme';

/**
 * Full-screen chapter title card.
 * Shows "Chapter N" in large text with a subtitle below, over a semi-transparent black overlay.
 * Fades in, holds, then fades out automatically.
 */
export function ChapterTitle() {
  const chapterTitle = useUIStore((s) => s.chapterTitle);
  const [phase, setPhase] = useState<'hidden' | 'fade-in' | 'hold' | 'fade-out'>('hidden');

  useEffect(() => {
    if (!chapterTitle) {
      setPhase('hidden');
      return;
    }

    // Start fade-in
    setPhase('fade-in');

    // After fade-in (600ms), hold for 1.5s, then fade-out
    const fadeInTimer = setTimeout(() => setPhase('hold'), 600);
    const holdTimer = setTimeout(() => setPhase('fade-out'), 2100);
    const doneTimer = setTimeout(() => {
      useUIStore.getState().hideChapterTitle();
    }, 2900);

    return () => {
      clearTimeout(fadeInTimer);
      clearTimeout(holdTimer);
      clearTimeout(doneTimer);
    };
  }, [chapterTitle]);

  if (!chapterTitle || phase === 'hidden') return null;

  const opacity =
    phase === 'fade-in' ? 1 :
    phase === 'hold' ? 1 :
    phase === 'fade-out' ? 0 : 0;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.80)',
        zIndex: 180,
        opacity,
        transition: phase === 'fade-in'
          ? 'opacity 0.6s ease-in'
          : phase === 'fade-out'
            ? 'opacity 0.8s ease-out'
            : undefined,
        pointerEvents: 'none',
      }}
    >
      {/* Chapter number */}
      <div style={{
        fontFamily: UI_FONT,
        fontWeight: UI_FONT_BOLD,
        fontSize: 42,
        color: '#ffffff',
        letterSpacing: 4,
        textShadow: '0 2px 8px rgba(0,0,0,0.6)',
        imageRendering: 'pixelated',
        marginBottom: 12,
      }}>
        {chapterTitle.chapter}
      </div>

      {/* Decorative line */}
      <div style={{
        width: 120,
        height: 2,
        background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.7), transparent)',
        marginBottom: 16,
      }} />

      {/* Subtitle */}
      <div style={{
        fontFamily: UI_FONT,
        fontSize: 22,
        color: 'rgba(255, 255, 255, 0.85)',
        letterSpacing: 2,
        textShadow: '0 1px 4px rgba(0,0,0,0.5)',
      }}>
        {chapterTitle.subtitle}
      </div>
    </div>
  );
}
