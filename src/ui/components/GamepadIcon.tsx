/** Displays a gamepad button icon extracted from the UI spritesheet */

const ICON_PATHS: Record<string, string> = {
  a: '/assets/ui/32x32/icon-gp-a.png',
  b: '/assets/ui/32x32/icon-gp-b.png',
  x: '/assets/ui/32x32/icon-gp-x.png',
  y: '/assets/ui/32x32/icon-gp-y.png',
  start: '/assets/ui/32x32/icon-gp-start.png',
  select: '/assets/ui/32x32/icon-gp-select.png',
};

interface GamepadIconProps {
  button: 'a' | 'b' | 'x' | 'y' | 'start' | 'select';
  size?: number;
}

export function GamepadIcon({ button, size = 20 }: GamepadIconProps) {
  const src = ICON_PATHS[button];
  if (!src) return null;
  return (
    <img
      src={src}
      alt={button}
      style={{ width: size, height: size, imageRendering: 'pixelated', display: 'inline-block', verticalAlign: 'middle' }}
    />
  );
}
