import { useState, useEffect, useCallback, useRef } from 'react';
import { PixelPanel } from './PixelPanel';
import { UI, UI_FONT, UI_FONT_BOLD, PANELS } from '../pixelTheme';
import { useInputAction } from '../hooks/useInputAction';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface TutorialStep {
  /** Text to display in the callout (English) */
  text: string;
  /** Optional secondary text (smaller, below main text) */
  subtext?: string;
  /**
   * Where to position the callout: undefined/absent for no highlight (center),
   * or a data-tutorial attribute value to spotlight that element
   */
  highlight?: string;
  /** Position the callout relative to the highlight: 'above' | 'below'. Default: 'below' */
  calloutPosition?: 'above' | 'below';
}

interface TutorialOverlayProps {
  steps: TutorialStep[];
  onComplete: () => void;
}

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const TUTORIAL_STYLES = `
@keyframes tutorial-fade-in {
  0% { opacity: 0; }
  100% { opacity: 1; }
}
@keyframes tutorial-spotlight-pulse {
  0%, 100% { box-shadow: 0 0 0 9999px rgba(0,0,0,0.75), 0 0 8px 2px rgba(212,175,55,0.6); }
  50% { box-shadow: 0 0 0 9999px rgba(0,0,0,0.75), 0 0 16px 4px rgba(212,175,55,0.9); }
}
`;

const SPOTLIGHT_PAD = 8;

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function TutorialOverlay({ steps, onComplete }: TutorialOverlayProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [spotlightRect, setSpotlightRect] = useState<DOMRect | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const step = steps[currentStep];
  const isFinalStep = currentStep === steps.length - 1;

  // Find and measure the highlighted element
  const updateSpotlight = useCallback(() => {
    if (!step?.highlight) {
      setSpotlightRect(null);
      return;
    }
    const el = document.querySelector(`[data-tutorial="${step.highlight}"]`);
    if (el) {
      setSpotlightRect(el.getBoundingClientRect());
    } else {
      setSpotlightRect(null);
    }
  }, [step?.highlight]);

  // Update spotlight on step change and on resize
  useEffect(() => {
    updateSpotlight();
    window.addEventListener('resize', updateSpotlight);
    return () => window.removeEventListener('resize', updateSpotlight);
  }, [updateSpotlight]);

  // Also re-measure after a brief delay to handle layout shifts
  useEffect(() => {
    const timer = setTimeout(updateSpotlight, 50);
    return () => clearTimeout(timer);
  }, [currentStep, updateSpotlight]);

  const advance = useCallback(() => {
    if (isFinalStep) {
      onComplete();
    } else {
      setCurrentStep((s) => s + 1);
    }
  }, [isFinalStep, onComplete]);

  // Gamepad confirm to advance
  useInputAction('confirm', advance, true);

  if (!step) return null;

  const hasSpotlight = !!step.highlight && !!spotlightRect;
  const calloutPos = step.calloutPosition ?? 'below';

  // Calculate callout position relative to spotlight
  let calloutStyle: React.CSSProperties;
  if (hasSpotlight && spotlightRect) {
    const centerX = spotlightRect.left + spotlightRect.width / 2;

    if (calloutPos === 'above') {
      calloutStyle = {
        position: 'absolute',
        left: Math.max(10, Math.min(centerX - 170, window.innerWidth - 350)),
        top: Math.max(10, spotlightRect.top - SPOTLIGHT_PAD - 12),
        transform: 'translateY(-100%)',
        maxWidth: 340,
        zIndex: 202,
      };
    } else {
      calloutStyle = {
        position: 'absolute',
        left: Math.max(10, Math.min(centerX - 170, window.innerWidth - 350)),
        top: spotlightRect.bottom + SPOTLIGHT_PAD + 12,
        maxWidth: 340,
        zIndex: 202,
      };
    }
  } else {
    // Center on screen
    calloutStyle = {
      position: 'absolute',
      left: '50%',
      top: '50%',
      transform: 'translate(-50%, -50%)',
      maxWidth: 340,
      width: '85%',
      zIndex: 202,
    };
  }

  return (
    <div
      ref={overlayRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        animation: 'tutorial-fade-in 0.3s ease',
      }}
    >
      <style>{TUTORIAL_STYLES}</style>

      {/* Backdrop: either spotlight cutout or full dark overlay */}
      {hasSpotlight && spotlightRect ? (
        <div
          style={{
            position: 'absolute',
            left: spotlightRect.left - SPOTLIGHT_PAD,
            top: spotlightRect.top - SPOTLIGHT_PAD,
            width: spotlightRect.width + SPOTLIGHT_PAD * 2,
            height: spotlightRect.height + SPOTLIGHT_PAD * 2,
            borderRadius: 8,
            animation: 'tutorial-spotlight-pulse 2s ease-in-out infinite',
            zIndex: 201,
            pointerEvents: 'none',
          }}
        />
      ) : (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            zIndex: 201,
          }}
        />
      )}

      {/* When spotlight is active, we need a dark overlay that doesn't cover the spotlight.
          The spotlight element's enormous box-shadow handles the darkening. We just need a
          click-blocking layer. */}
      {hasSpotlight && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 200,
          }}
        />
      )}

      {/* Callout box */}
      <div style={calloutStyle}>
        <PixelPanel
          panelOrigin={PANELS.rounded}
          borderWidth={28}
          style={{ padding: '12px 16px' }}
        >
          {/* Main text */}
          <div style={{
            fontFamily: UI_FONT,
            fontWeight: UI_FONT_BOLD,
            fontSize: 15,
            color: UI.text,
            textAlign: 'center',
            lineHeight: 1.4,
          }}>
            {step.text}
          </div>

          {/* Subtext */}
          {step.subtext && (
            <div style={{
              fontFamily: UI_FONT,
              fontSize: 12,
              color: UI.textMuted,
              textAlign: 'center',
              marginTop: 6,
              lineHeight: 1.4,
            }}>
              {step.subtext}
            </div>
          )}

          {/* Step indicator */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 6,
            marginTop: 10,
            marginBottom: 8,
          }}>
            {steps.map((_, idx) => (
              <div
                key={idx}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: idx === currentStep ? UI.goldBright : 'rgba(0,0,0,0.2)',
                  transition: 'background 0.2s ease',
                }}
              />
            ))}
          </div>

          {/* Next / Got it! button */}
          <div style={{ textAlign: 'center' }}>
            <button
              onClick={advance}
              style={{
                fontFamily: UI_FONT,
                fontWeight: UI_FONT_BOLD,
                fontSize: 14,
                color: '#fff',
                background: UI.gold,
                border: 'none',
                borderRadius: 6,
                padding: '6px 24px',
                cursor: 'pointer',
                textShadow: '1px 1px 0 rgba(0,0,0,0.3)',
              }}
            >
              {isFinalStep ? 'Got it!' : 'Next'}
            </button>
          </div>
        </PixelPanel>
      </div>
    </div>
  );
}
