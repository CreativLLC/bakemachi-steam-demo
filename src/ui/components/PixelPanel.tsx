import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { UI_SPRITESHEET, UI_TILE, PANELS, UI } from '../pixelTheme';

/** Scale factor for extracting the 9-slice source — 3x for crisp pixel art */
const SCALE = 3;
/** Source region size: 3x3 tiles */
const SRC_SIZE = UI_TILE * 3;
/** Slice value in the extracted image (each tile = UI_TILE * SCALE) */
const SLICE = UI_TILE * SCALE;

// Cache extracted panel data URLs (persists across renders/mounts)
const panelCache: Record<string, string> = {};
const panelPromises: Record<string, Promise<string>> = {};

/**
 * Extract a 3x3 tile region from the spritesheet and scale it up,
 * returning a data URL suitable for CSS border-image.
 */
function extractPanel(sx: number, sy: number): Promise<string> {
  const key = `${sx},${sy}`;
  if (panelCache[key]) return Promise.resolve(panelCache[key]);
  if (panelPromises[key]) return panelPromises[key];

  panelPromises[key] = new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const dst = SRC_SIZE * SCALE;
      const canvas = document.createElement('canvas');
      canvas.width = dst;
      canvas.height = dst;
      const ctx = canvas.getContext('2d')!;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, sx, sy, SRC_SIZE, SRC_SIZE, 0, 0, dst, dst);
      panelCache[key] = canvas.toDataURL();
      resolve(panelCache[key]);
    };
    img.src = UI_SPRITESHEET;
  });

  return panelPromises[key];
}

interface PixelPanelProps {
  children: ReactNode;
  style?: CSSProperties;
  /** Border display width in CSS pixels (default: 36) */
  borderWidth?: number;
  /** Panel style origin from PANELS (default: beige) */
  panelOrigin?: { x: number; y: number };
}

export function PixelPanel({
  children,
  style,
  borderWidth = 44,
  panelOrigin = PANELS.beige,
}: PixelPanelProps) {
  const cacheKey = `${panelOrigin.x},${panelOrigin.y}`;
  const [url, setUrl] = useState(panelCache[cacheKey] || '');

  useEffect(() => {
    extractPanel(panelOrigin.x, panelOrigin.y).then(setUrl);
  }, [panelOrigin.x, panelOrigin.y]);

  return (
    <div style={{
      borderStyle: 'solid',
      borderWidth,
      borderColor: 'transparent',
      borderImage: url
        ? `url(${url}) ${SLICE} fill / ${borderWidth}px / 0 round`
        : undefined,
      background: url ? undefined : UI.panelBg,
      imageRendering: 'pixelated',
      ...style,
    }}>
      {children}
    </div>
  );
}
