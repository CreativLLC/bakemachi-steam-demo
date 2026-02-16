import type { GameMap, InteractionZone } from '../types';

// Tiled-exported Train Station — 56x40 tiles at 32px (1792x1280px composite image)
// Collision rectangles exported from Tiled object layer in pixel coordinates.

const W = 56;
const H = 40;

// Ground/objects arrays not used for rendering (composite image handles it)
const ground: number[][] = Array.from({ length: H }, () => Array(W).fill(0));
const objects: number[][] = Array.from({ length: H }, () => Array(W).fill(0));

// ── Collision generation from Tiled rectangle data ─────────────────────────

interface CollisionRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Tiled collision rectangles in pixel coordinates (32px per tile) */
const COLLISION_RECTS: CollisionRect[] = [
  { x: 1504.0, y: 14.7, w: 258.7, h: 76.7 },
  { x: 575.3, y: 16.7, w: 862.0, h: 76.7 },
  { x: 205.3, y: 11.3, w: 368.0, h: 81.3 },
  { x: -80.0, y: -24.0, w: 292.7, h: 1508.0 },
  { x: 350.0, y: 1255.3, w: 1556.0, h: 204.7 },
  { x: 192.0, y: 1256.0, w: 188.0, h: 206.0 },
  { x: 1093.0, y: 58.0, w: 119.0, h: 63.0 },
  { x: 1583.3, y: 44.7, w: 33.3, h: 73.3 },
  { x: 464.0, y: 236.7, w: 192.0, h: 249.3 },
  { x: 1594.7, y: 592.7, w: 152.0, h: 157.3 },
  { x: 458.7, y: 903.3, w: 365.3, h: 168.0 },
  { x: 833.3, y: 882.7, w: 284.7, h: 156.7 },
  { x: 1008.0, y: 1047.3, w: 102.0, h: 24.7 },
  { x: 810.7, y: 1040.0, w: 42.0, h: 26.0 },
  { x: 468.0, y: 520.0, w: 196.7, h: 9.3 },
  { x: 427.3, y: 271.3, w: 17.3, h: 188.7 },
  { x: 1588.0, y: 810.0, w: 156.7, h: 164.0 },
  { x: 1582.7, y: 1038.7, w: 162.7, h: 166.0 },
  { x: 490.0, y: 870.7, w: 618.0, h: 20.0 },
  { x: 462.7, y: 678.0, w: 708.0, h: 45.3 },
  { x: 491.3, y: 101.3, w: 31.3, h: 12.0 },
  { x: 716.7, y: 80.7, w: 298.7, h: 33.3 },
  { x: 1228.0, y: 58.0, w: 74.0, h: 60.7 },
  { x: 1548.0, y: 50.0, w: 74.7, h: 66.0 },
  { x: 1702.7, y: 104.7, w: 0.7, h: 0.0 },
  { x: 1680.0, y: 54.0, w: 36.7, h: 58.0 },
  { x: 1740.0, y: 364.7, w: 8.7, h: 136.0 },
  { x: 1421.3, y: 1006.0, w: 98.7, h: 35.3 },
  { x: 1422.7, y: 778.7, w: 100.0, h: 39.3 },
  { x: 1424.7, y: 674.7, w: 104.0, h: 23.3 },
  { x: 688.0, y: 433.0, w: 139.3, h: 69.0 },
  { x: 905.3, y: 435.2, w: 138.0, h: 66.2 },
  { x: 1092.0, y: 198.0, w: 11.3, h: 298.7 },
  { x: 1128.7, y: 206.7, w: 8.0, h: 99.3 },
  { x: 1050.3, y: 449.3, w: 29.0, h: 50.7 },
  { x: 1129.3, y: 361.0, w: 112.7, h: 145.8 },
  { x: 1258.0, y: 460.2, w: 15.5, h: 43.5 },
  { x: 1382.0, y: 450.7, w: 18.0, h: 23.3 },
  { x: 1571.3, y: 452.7, w: 20.0, h: 18.7 },
  { x: 1737.3, y: 362.0, w: 11.3, h: 138.7 },
  { x: 881.3, y: 247.3, w: 164.0, h: 130.7 },
  { x: 682.7, y: 261.3, w: 165.3, h: 113.3 },
  { x: 666.0, y: 194.0, w: 423.3, h: 55.3 },
  { x: 844.7, y: 262.7, w: 35.3, h: 104.0 },
  { x: 1058.7, y: 260.0, w: 8.7, h: 106.7 },
  { x: 1636.0, y: 196.0, w: 41.3, h: 116.0 },
  { x: 1642.7, y: 190.7, w: 110.0, h: 26.0 },
  { x: 1642.7, y: 199.0, w: 112.0, h: 23.0 },
  { x: 1761.0, y: 11.0, w: 22.0, h: 1268.0 },
  { x: 426.0, y: 931.0, w: 10.0, h: 115.0 },
];

const TILE_PX = 32;

/**
 * Build the collision grid from Tiled rectangle data.
 * For each rectangle, compute which tiles it overlaps (divide pixel coords by
 * tile size, floor for start, ceil for end), then mark those tiles as blocked.
 * All values are clamped to map bounds.
 */
function buildCollisionGrid(rects: CollisionRect[], width: number, height: number): number[][] {
  // Start with all tiles walkable
  const grid: number[][] = Array.from({ length: height }, () => Array(width).fill(0));

  for (const rect of rects) {
    const startCol = Math.max(0, Math.floor(rect.x / TILE_PX));
    const endCol = Math.min(width - 1, Math.ceil((rect.x + rect.w) / TILE_PX) - 1);
    const startRow = Math.max(0, Math.floor(rect.y / TILE_PX));
    const endRow = Math.min(height - 1, Math.ceil((rect.y + rect.h) / TILE_PX) - 1);

    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        grid[r][c] = 1;
      }
    }
  }

  return grid;
}

const collision = buildCollisionGrid(COLLISION_RECTS, W, H);

// ── Interaction Zones ─────────────────────────────────────────────────────

const interactionZones: InteractionZone[] = [
  // Food stalls (6x6 each, bottom-left coords given, so top-left y = bottomY - 5)
  { x: 49, y: 18, width: 6, height: 6, npcId: 'food_stall' },
  { x: 49, y: 25, width: 6, height: 6, npcId: 'food_stall' },
  { x: 49, y: 32, width: 6, height: 6, npcId: 'food_stall' },
  // Horizontal vending machines (2 wide, 1 tall)
  { x: 27, y: 32, width: 2, height: 1, npcId: 'vending_machine' },
  { x: 29, y: 32, width: 2, height: 1, npcId: 'vending_machine' },
  { x: 40, y: 19, width: 2, height: 1, npcId: 'vending_machine' },
  { x: 42, y: 19, width: 2, height: 1, npcId: 'vending_machine' },
  { x: 49, y: 3, width: 2, height: 1, npcId: 'vending_machine' },
  // Vertical vending machines (1 wide, 2 tall)
  { x: 13, y: 13, width: 1, height: 2, npcId: 'vending_machine' },
  { x: 13, y: 9, width: 1, height: 2, npcId: 'vending_machine' },
  { x: 26, y: 32, width: 1, height: 2, npcId: 'vending_machine' },
  { x: 31, y: 32, width: 1, height: 2, npcId: 'vending_machine' },
  // New vending machines near omiyage shops (2 wide, 1 tall)
  { x: 21, y: 15, width: 2, height: 1, npcId: 'vending_machine' },
  { x: 31, y: 15, width: 2, height: 1, npcId: 'vending_machine' },
  // Omiyage shops — full counter front (gated in tryInteract)
  { x: 21, y: 11, width: 12, height: 1, npcId: 'omiyage_vendor' },
  // Postcard shop (near computer desk area top right)
  { x: 51, y: 6, width: 4, height: 4, npcId: 'postcard_shop' },
];

// ── Transitions ────────────────────────────────────────────────────────────

const transitions: { x: number; y: number; targetMap: string; targetX: number; targetY: number; facing: 'down' }[] = [];

// Stairs exit (42-43, row 2) → town
transitions.push(
  { x: 42, y: 2, targetMap: 'ch1_town', targetX: 34, targetY: 3, facing: 'down' as const },
  { x: 43, y: 2, targetMap: 'ch1_town', targetX: 34, targetY: 3, facing: 'down' as const },
);
// Elevator exit (45-46, row 2) → town
transitions.push(
  { x: 45, y: 2, targetMap: 'ch1_town', targetX: 34, targetY: 3, facing: 'down' as const },
  { x: 46, y: 2, targetMap: 'ch1_town', targetX: 34, targetY: 3, facing: 'down' as const },
);

// ── Export ──────────────────────────────────────────────────────────────────

export const TILED_TRAIN_STATION: GameMap = {
  id: 'tiled_train_station',
  name: 'Train Station (Tiled)',
  width: W,
  height: H,
  ground,
  objects,
  collision,
  npcs: [
    // Quest NPCs
    { id: 'okaasan_welcome', x: 23, y: 20, sprite: 'lpc:lpc-named-tanaka-walk' },
    { id: 'food_stall', x: 51, y: 21, sprite: 'lpc:lpc-vendor-1-walk', facing: 'left' },
    { id: 'food_stall', x: 51, y: 27.5, sprite: 'lpc:lpc-vendor-2-walk', facing: 'left' },
    { id: 'food_stall', x: 51, y: 34.5, sprite: 'lpc:lpc-vendor-3-walk', facing: 'left' },
    // Omiyage vendors
    { id: 'omiyage_vendor', x: 23, y: 9, sprite: 'lpc:lpc-vendor-1-walk', facing: 'down' },
    { id: 'omiyage_vendor', x: 29, y: 9, sprite: 'lpc:lpc-vendor-2-walk', facing: 'down' },
    // Sitting NPCs — each uses a unique generic NPC sprite (sit sheet only)
    { id: 'bg_npc', x: 16, y: 22.25, sprite: 'lpc:lpc-generic-5-sit', facing: 'down' },
    { id: 'bg_npc', x: 19, y: 22.25, sprite: 'lpc:lpc-generic-6-sit', facing: 'down' },
    { id: 'bg_npc', x: 20, y: 22.25, sprite: 'lpc:lpc-generic-7-sit', facing: 'down' },
    { id: 'bg_npc', x: 32, y: 22.25, sprite: 'lpc:lpc-generic-8-sit', facing: 'down' },
    { id: 'bg_npc', x: 33, y: 22.25, sprite: 'lpc:lpc-generic-9-sit', facing: 'down' },
    { id: 'bg_npc', x: 22, y: 3.25, sprite: 'lpc:lpc-generic-10-sit', facing: 'down' },
    { id: 'bg_npc', x: 24, y: 3.25, sprite: 'lpc:lpc-generic-11-sit', facing: 'down' },
    { id: 'bg_npc', x: 31, y: 3.25, sprite: 'lpc:lpc-generic-12-sit', facing: 'down' },
    // Sitting NPCs — facing sideways (shifted half tile up)
    { id: 'bg_npc', x: 44, y: 24.75, sprite: 'lpc:lpc-generic-13-sit', facing: 'right' },
    { id: 'bg_npc', x: 44, y: 31.75, sprite: 'lpc:lpc-generic-14-sit', facing: 'right' },
    { id: 'bg_npc', x: 47, y: 31.75, sprite: 'lpc:lpc-generic-15-sit', facing: 'left' },
    // Standing NPCs — each uses a unique generic NPC sprite (walk sheet only)
    { id: 'postcard_shop', x: 53, y: 8, sprite: 'lpc:lpc-vendor-3-walk', facing: 'left' },
    { id: 'bg_npc', x: 24, y: 16, sprite: 'lpc:lpc-generic-17-walk', facing: 'up' },
    { id: 'bg_npc', x: 31, y: 12, sprite: 'lpc:lpc-generic-18-walk', facing: 'up' },
    { id: 'bg_npc', x: 36, y: 16, sprite: 'lpc:lpc-generic-19-walk', facing: 'up' },
    { id: 'bg_npc', x: 38, y: 5, sprite: 'lpc:lpc-generic-20-walk', facing: 'left' },
    { id: 'bg_npc', x: 12, y: 34, sprite: 'lpc:lpc-generic-21-walk', facing: 'right' },
    { id: 'bg_npc', x: 28, y: 4, sprite: 'lpc:lpc-generic-22-walk', facing: 'down' },
    { id: 'bg_npc', x: 42, y: 38, sprite: 'lpc:lpc-generic-23-walk', facing: 'up' },
    // Patrol NPCs — each uses a unique generic NPC sprite (walk sheet only)
    { id: 'bg_npc', x: 15, y: 35, sprite: 'lpc:lpc-generic-24-walk', facing: 'right',
      patrol: { waypoints: [{ x: 30, y: 35 }, { x: 15, y: 35 }] } },
    { id: 'bg_npc', x: 10, y: 5, sprite: 'lpc:lpc-generic-25-walk', facing: 'right',
      patrol: { waypoints: [{ x: 25, y: 5 }, { x: 10, y: 5 }] } },
    { id: 'bg_npc', x: 8, y: 15, sprite: 'lpc:lpc-generic-26-walk', facing: 'up',
      patrol: { waypoints: [{ x: 8, y: 5 }, { x: 8, y: 15 }] } },
    { id: 'bg_npc', x: 40, y: 34, sprite: 'lpc:lpc-generic-27-walk', facing: 'up',
      patrol: { waypoints: [{ x: 40, y: 26 }, { x: 40, y: 34 }] } },
    { id: 'bg_npc', x: 25, y: 17, sprite: 'lpc:lpc-generic-28-walk', facing: 'right',
      patrol: { waypoints: [{ x: 38, y: 17 }, { x: 25, y: 17 }] } },
    { id: 'bg_npc', x: 10, y: 24, sprite: 'lpc:lpc-generic-29-walk', facing: 'down',
      patrol: { waypoints: [{ x: 10, y: 30 }, { x: 10, y: 24 }] } },
  ],
  playerSpawn: { x: 9, y: 20 },
  transitions,
  decorations: [],
  groundImage: 'map-tiled-train-station',
  groundImageTileSize: 32,
  foregroundImage: 'map-tiled-train-station-overlay',
  interactionZones,
};
