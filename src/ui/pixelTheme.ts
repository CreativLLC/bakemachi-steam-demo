/** Shared pixel-art UI theme constants (Limezu Modern UI Style 1) */

/** Path to the UI spritesheet */
export const UI_SPRITESHEET = '/assets/ui/32x32/Modern_UI_Style_1_32x32.png';

/** Tile size in the spritesheet */
export const UI_TILE = 32;

/** 9-slice panel origins (pixel coordinates in the spritesheet) */
export const PANELS = {
  /** Simple beige panel — menus, buttons, small badges */
  beige: { x: 0, y: 0 },
  /** Rounded panel — dialogue boxes, HUD, main panels */
  rounded: { x: 0, y: 576 },
} as const;

/** UI color palette — sampled from the Limezu pack and reference screenshot */
export const UI = {
  /** Dark brown — primary text */
  text: '#4E3524',
  /** Medium brown — secondary/muted text */
  textMuted: '#7A6040',
  /** Faded brown — hint text, disabled */
  textFaded: '#9A8060',
  /** Gold accent for highlights, new words */
  gold: '#B8960A',
  /** Bright gold for emphasis */
  goldBright: '#D4A800',
  /** Fallback panel background color */
  panelBg: '#D4C4A0',
  /** Dark overlay for modals */
  overlay: 'rgba(0, 0, 0, 0.6)',
} as const;

/** Font family */
export const UI_FONT = "'DotGothic16', 'Noto Sans JP', sans-serif";
export const UI_FONT_BOLD = '700';
