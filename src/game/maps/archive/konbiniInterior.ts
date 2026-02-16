import type { GameMap } from '../types';

// Konbini (convenience store) interior — 12x10 tiles
// Upgraded with real assets: white floor, konbini-cooler walls, real NPC sprites
//
// Layout:
//   Row 0: back wall (cooler decorations)
//   Row 1: counter area (clerk behind counter)
//   Row 2: counter front / walkway
//   Row 3-5: shelving aisles (3 rows)
//   Row 6-7: open floor area
//   Row 8: near entrance
//   Row 9: entrance wall with door gap

const W = 12;
const H = 10;

// Ground: 32=white-floor, 33=white-floor2
// prettier-ignore
const ground: number[][] = [
  [32,33,32,33,32,33,32,33,32,33,32,33], // 0
  [33,32,33,32,33,32,33,32,33,32,33,32], // 1
  [32,33,32,33,32,33,32,33,32,33,32,33], // 2
  [33,32,33,32,33,32,33,32,33,32,33,32], // 3
  [32,33,32,33,32,33,32,33,32,33,32,33], // 4
  [33,32,33,32,33,32,33,32,33,32,33,32], // 5
  [32,33,32,33,32,33,32,33,32,33,32,33], // 6
  [33,32,33,32,33,32,33,32,33,32,33,32], // 7
  [32,33,32,33,32,33,32,33,32,33,32,33], // 8
  [33,32,33,32,33, 5, 5,33,32,33,32,33], // 9: door
];

// Objects: 2=wall, 6=counter, 7=shelf
// prettier-ignore
const objects: number[][] = [
  [2,2,2,2,2,2,2,2,2,2,2,2], // 0: back wall
  [0,0,0,6,6,6,6,6,6,0,0,0], // 1: counter
  [0,0,0,0,0,0,0,0,0,0,0,0], // 2
  [0,7,7,0,0,7,7,0,0,7,7,0], // 3: shelves
  [0,7,7,0,0,7,7,0,0,7,7,0], // 4: shelves
  [0,7,7,0,0,0,0,0,0,7,7,0], // 5: shelves (center open)
  [0,0,0,0,0,0,0,0,0,0,0,0], // 6
  [0,0,0,0,0,0,0,0,0,0,0,0], // 7
  [0,0,0,0,0,0,0,0,0,0,0,0], // 8
  [2,2,2,2,2,0,0,2,2,2,2,2], // 9: wall with door
];

// Collision: 0=walkable, 1=blocked
// prettier-ignore
const collision: number[][] = [
  [1,1,1,1,1,1,1,1,1,1,1,1], // 0: back wall
  [1,0,0,1,1,1,1,1,1,0,0,1], // 1: counter blocks
  [1,0,0,0,0,0,0,0,0,0,0,1], // 2
  [1,1,1,0,0,1,1,0,0,1,1,1], // 3: shelf blocks
  [1,1,1,0,0,1,1,0,0,1,1,1], // 4
  [1,1,1,0,0,0,0,0,0,1,1,1], // 5
  [1,0,0,0,0,0,0,0,0,0,0,1], // 6
  [1,0,0,0,0,0,0,0,0,0,0,1], // 7
  [1,0,0,0,0,0,0,0,0,0,0,1], // 8
  [1,1,1,1,1,0,0,1,1,1,1,1], // 9: wall with door gap
];

export const KONBINI_INTERIOR: GameMap = {
  id: 'ch1_konbini',
  name: 'コンビニ',
  width: W,
  height: H,
  ground,
  objects,
  collision,
  npcs: [
    { id: 'shopkeeper', x: 6, y: 1, sprite: 'lpc:lpc-vendor-1-walk', facing: 'down' },
    { id: 'suspicious_clerk', x: 2, y: 1, sprite: 'lpc:lpc-vendor-2-walk', facing: 'down' },
  ],
  playerSpawn: { x: 5, y: 8 },
  transitions: [
    // Exit door → back to town, in front of konbini (building base at row 20, walk on row 21)
    { x: 5, y: 9, targetMap: 'ch1_town', targetX: 38, targetY: 21, facing: 'down' as const },
    { x: 6, y: 9, targetMap: 'ch1_town', targetX: 38, targetY: 21, facing: 'down' as const },
  ],
  decorations: [
    // Back wall cooler decorations (row 0)
    { texture: 'wall-konbini-cooler1', x: 1, y: 0, widthTiles: 1, heightTiles: 2 },
    { texture: 'wall-konbini-cooler2', x: 2, y: 0, widthTiles: 1, heightTiles: 2 },
    { texture: 'wall-konbini-cooler3', x: 3, y: 0, widthTiles: 1, heightTiles: 2 },
    { texture: 'wall-konbini-open1', x: 4, y: 0, widthTiles: 1, heightTiles: 2 },
    { texture: 'wall-konbini-open2', x: 5, y: 0, widthTiles: 1, heightTiles: 2 },
    { texture: 'wall-konbini-open3', x: 6, y: 0, widthTiles: 1, heightTiles: 2 },
    { texture: 'wall-konbini-open4', x: 7, y: 0, widthTiles: 1, heightTiles: 2 },
    { texture: 'wall-konbini-cooler1', x: 8, y: 0, widthTiles: 1, heightTiles: 2 },
    { texture: 'wall-konbini-cooler2', x: 9, y: 0, widthTiles: 1, heightTiles: 2 },
    { texture: 'wall-konbini-cooler3', x: 10, y: 0, widthTiles: 1, heightTiles: 2 },
    // Entrance walls
    { texture: 'wall-concrete1', x: 0, y: 9, widthTiles: 1, heightTiles: 2 },
    { texture: 'wall-concrete1', x: 11, y: 9, widthTiles: 1, heightTiles: 2 },
  ],
};
