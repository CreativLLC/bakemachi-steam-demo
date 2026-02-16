import type { GameMap } from '../types';

// Tanaka family house interior — 12x10 tiles
// Layout:
//   Row 0: back wall
//   Row 1-3: kitchen / living area (tatami)
//   Row 4-5: hallway
//   Row 6-7: player's room (left), Yuu's room (right)
//   Row 8: genkan (entryway)
//   Row 9: entrance (door at bottom)

const W = 12;
const H = 10;

// Ground: 3=wood-floor, 4=tatami, 5=door
// prettier-ignore
const ground: number[][] = [
  [4,4,4,4,4,4,4,4,4,4,4,4], // 0: back wall
  [4,4,4,4,4,4,4,4,4,4,4,4], // 1: kitchen/living
  [4,4,4,4,4,4,4,4,4,4,4,4], // 2: living area
  [4,4,4,4,4,4,4,4,4,4,4,4], // 3: living area
  [3,3,3,3,3,3,3,3,3,3,3,3], // 4: hallway
  [3,3,3,3,3,3,3,3,3,3,3,3], // 5: hallway
  [4,4,4,4,4,3,3,4,4,4,4,4], // 6: rooms
  [4,4,4,4,4,3,3,4,4,4,4,4], // 7: rooms
  [3,3,3,3,3,3,3,3,3,3,3,3], // 8: genkan
  [3,3,3,3,3,5,5,3,3,3,3,3], // 9: entrance
];

// Objects: 2=wall, 6=counter (kitchen counter), 7=shelf (furniture)
// prettier-ignore
const objects: number[][] = [
  [2,2,2,2,2,2,2,2,2,2,2,2], // 0: back wall
  [0,0,6,6,0,0,0,0,0,7,0,0], // 1: kitchen counter + bookshelf
  [0,0,0,0,0,0,0,0,0,0,0,0], // 2
  [0,7,0,0,0,0,0,0,0,0,7,0], // 3: furniture
  [0,0,0,0,0,0,0,0,0,0,0,0], // 4: hallway
  [2,2,2,2,0,0,0,0,2,2,2,2], // 5: room dividers (with gaps)
  [0,7,0,0,0,0,0,0,0,7,0,0], // 6: room furniture
  [0,0,0,0,0,0,0,0,0,0,0,0], // 7
  [0,0,0,0,0,0,0,0,0,0,0,0], // 8: genkan
  [2,2,2,2,2,0,0,2,2,2,2,2], // 9: wall with door gap
];

// Collision
// prettier-ignore
const collision: number[][] = [
  [1,1,1,1,1,1,1,1,1,1,1,1], // 0: back wall
  [1,0,1,1,0,0,0,0,0,1,0,1], // 1: kitchen counter blocks
  [1,0,0,0,0,0,0,0,0,0,0,1], // 2
  [1,1,0,0,0,0,0,0,0,0,1,1], // 3: furniture
  [1,0,0,0,0,0,0,0,0,0,0,1], // 4: hallway
  [1,1,1,1,0,0,0,0,1,1,1,1], // 5: room walls with gaps
  [1,1,0,0,0,0,0,0,0,1,0,1], // 6: furniture
  [1,0,0,0,0,0,0,0,0,0,0,1], // 7
  [1,0,0,0,0,0,0,0,0,0,0,1], // 8: genkan
  [1,1,1,1,1,0,0,1,1,1,1,1], // 9: wall with door gap
];

export const TANAKA_HOUSE: GameMap = {
  id: 'ch1_tanaka_house',
  name: '田中家',
  width: W,
  height: H,
  ground,
  objects,
  collision,
  npcs: [
    { id: 'elder', x: 5, y: 2, sprite: 'npc' }, // Okaasan in living room (reusing elder NPC for now)
  ],
  playerSpawn: { x: 5, y: 8 },
  transitions: [
    // Exit door → back to town, in front of Tanaka house (building base at row 26, walk on row 27)
    { x: 5, y: 9, targetMap: 'ch1_town', targetX: 7, targetY: 27, facing: 'down' as const },
    { x: 6, y: 9, targetMap: 'ch1_town', targetX: 7, targetY: 27, facing: 'down' as const },
  ],
};
