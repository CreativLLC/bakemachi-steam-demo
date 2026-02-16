import type { GameMap } from '../types';

// Train Station — 26x25 tiles (64px each = 1664x1600 pixels)
// A charming small-town JR station with character and asymmetry.
//
// Layout (top to bottom):
//   Rows 0-2:   Outdoor padding (grass, trees, approach path to entrance)
//   Rows 3-4:   Station building back wall — 2 tiles tall (exit at cols 9-15 → town)
//   Rows 5-6:   Concourse upper — food stall (west), meditation garden (east)
//   Row 7:      Concourse — ticket gates, ticket machine, ATM
//   Row 8:      Concourse — open marble walkway
//   Rows 9-10:  Station south wall — 2 tiles tall, sliding glass doors at cols 9-15
//   Row 11:     Blind footpath (outdoor, building-to-platform transition)
//   Rows 12-13: Platform — open walkways, lamp posts
//   Row 14:     Platform — vending machine cluster (5 grouped together)
//   Row 15:     Platform — trees (bigger, blocked) + stone lanterns
//   Row 16:     Platform — bench pairs (symmetric), trash cans
//   Row 17:     Platform — player spawn row
//   Row 18:     Blind footpath (platform edge warning)
//   Row 19:     Fence barrier — blocked
//   Rows 20-21: Railroad tracks — shinkansen decoration
//   Row 22:     Grass border with wildflowers on east end
//   Rows 23-24: Outdoor padding (grass, trees)

const W = 26;
const H = 25;

const row = (fill: number, w = W): number[] => Array(w).fill(fill);

// Ground tile IDs:
//   2=wall, 10=sidewalk, 11=railroad(90°), 13=railroad(270°), 14=sidewalk2,
//   15=sidewalk3, 16=sidewalk4, 17=blind-footpath, 19=grass1, 20=grass2,
//   26=fence3, 30=marble, 31=marble2, 40=grass-flowers1, 42=footpath1,
//   43=footpath2, 44=footpath3, 47=bush1, 48=bush2

// prettier-ignore
const ground: number[][] = [
  // 0: outdoor padding — grass
  [19,20,19,19,20,19,20,19,19,20,19,20,19,19,20,19,20,19,19,20,19,20,19,19,20,19],
  // 1: outdoor padding — grass
  [20,19,20,20,19,20,19,20,20,19,20,19,20,20,19,20,19,20,20,19,20,19,20,20,19,20],
  // 2: outdoor approach — grass with footpath at cols 9-15 leading to entrance
  [19,20,19,20,19,20,19,20,19, 42,43,42,43,42,43,42, 19,20,19,20,19,20,19,20,19,20],
  // 3-4: station back wall (2 tiles tall) — exit at cols 9-15
  [99,2,2,2,2,2,2,2,2, 30,31,30,31,30,31,30, 2,2,2,2,2,2,2,2,2,99],
  [99,2,2,2,2,2,2,2,2, 30,31,30,31,30,31,30, 2,2,2,2,2,2,2,2,2,99],
  // 5: concourse upper — west footpath + food stall area, east meditation garden
  [99, 42,43,42,42,42,42,43, 31,30,31,30,31,30,30,31, 30,30,31,40,47,40,47,40,40, 99],
  // 6: concourse — footpath near stall, marble center, garden hedges
  [99, 44,42,42,42,44,42,42, 30,31,30,31,30,30,31,31, 31,30,31,40,40,47,40,40,48, 99],
  // 7: concourse — ticket gates row, ticket machine, ATM, garden hedges
  [99, 42,43,42,42,42,42,43, 31,30,31,30,31,30,31,30, 30,30,30,40,47,40,48,40,40, 99],
  // 8: concourse — open marble walkway
  [99, 42,42,44,42,42,42,42, 30,31,30,31,30,31,30,31, 31,31,30,40,40,40,40,40,40, 99],
  // 9-10: station south wall (2 tiles tall) — sliding glass doors at cols 9-15
  [99, 2,2,2,2,2,2,2, 2,30,31,30,31,30,31,30, 2,2,2,2,2,2,2,2,2, 99],
  [99, 2,2,2,2,2,2,2, 2,30,31,30,31,30,31,30, 2,2,2,2,2,2,2,2,2, 99],
  // 11: blind footpath — outdoor, building-to-platform transition
  row(17),
  // 12: platform — open, fixer starts here
  [10,14,15,10,14,10,15,10,14,10,16,10,14,10,15,10,14,10,16,10,14,15,10,14,10,16],
  // 13: platform — open walkway, lamp posts at edges
  [14,10,16,10,14,15,10,14,10,15,10,14,10,16,10,14,15,10,14,15,10,16,10,15,14,10],
  // 14: platform — vending machine cluster (5 grouped at cols 10-14)
  [10,15,10,14,10,10,14,10,15,10,14,16,10,14,10,15,10,14,10,10,16,10,14,10,15,14],
  // 15: platform — cherry tree (west), green tree (east), stone lanterns
  [16,10,14,10,15,14,10,16,10,14,10,15,14,10,16,10,14,10,15,14,10,14,10,16,10,15],
  // 16: platform — bench pairs (symmetric) + trash cans
  [10,14,10,16,10,15,14,10,14,10,16,10,15,10,14,16,10,15,10,14,10,15,10,14,16,10],
  // 17: platform — player spawn row, open
  [15,10,14,10,14,10,16,14,10,15,10,14,10,14,10,15,16,10,14,16,10,14,15,10,10,16],
  // 18: blind footpath — platform edge warning
  row(17),
  // 19: fence barrier
  [26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26],
  // 20: railroad tracks — north half (270° rotation)
  row(13),
  // 21: railroad tracks — south half (90° rotation, shinkansen overlaid)
  row(11),
  // 22: grass border — wildflowers on east end
  [19,20,19,19,20,19,20,19,19,20,19,20,19,19,20,19,20,19,19,40,20,40,19,40,20,19],
  // 23: outdoor padding — grass
  [20,19,20,19,19,20,19,20,19,19,20,19,20,19,19,20,19,20,19,19,20,19,20,19,19,20],
  // 24: outdoor padding — grass
  [19,20,19,20,20,19,20,19,20,20,19,20,19,20,20,19,20,19,20,20,19,20,19,20,20,19],
];

// Objects layer — walls only, decorations use the decorations array
// prettier-ignore
const objects: number[][] = [
  row(0), // 0: outdoor padding
  row(0), // 1: outdoor padding
  row(0), // 2: outdoor approach
  [0,2,2,2,2,2,2,2,2, 0,0,0,0,0,0,0, 2,2,2,2,2,2,2,2,2,0], // 3: back wall upper
  [0,2,2,2,2,2,2,2,2, 0,0,0,0,0,0,0, 2,2,2,2,2,2,2,2,2,0], // 4: back wall lower
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],    // 5: vertical walls via decorations
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],    // 6
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],    // 7
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],    // 8
  [0,2,2,2,2,2,2,2,2, 0,0,0,0,0,0,0, 2,2,2,2,2,2,2,2,2,0],  // 9: south wall upper
  [0,2,2,2,2,2,2,2,2, 0,0,0,0,0,0,0, 2,2,2,2,2,2,2,2,2,0],  // 10: south wall lower
  row(0), // 11: blind footpath
  row(0), // 12
  row(0), // 13
  row(0), // 14
  row(0), // 15
  row(0), // 16
  row(0), // 17
  row(0), // 18
  row(0), // 19
  row(0), // 20
  row(0), // 21
  row(0), // 22
  row(0), // 23
  row(0), // 24
];

// Collision: 0=walkable, 1=blocked, 2=soft (overlap but no vertical pass-through)
// prettier-ignore
const collision: number[][] = [
  // 0-2: outdoor padding — blocked (visual only)
  row(1),
  row(1),
  row(1),
  // 3-4: station back wall — blocked (exit checked as transitions first)
  row(1),
  row(1),
  // 5: concourse — food stall (blocked), ATM + ticket machine (blocked), buddha (soft), hedges
  [1, 0,0,1,1,1,0,0, 0,0,0,0,0,0,0,0, 1,1,0,0, 1,2,1,0,0, 1],
  // 6: concourse — stone lantern (soft), food stall (blocked), plants (soft), trash (soft), hedges
  [1, 0,2,1,1,1,0,0, 0,0,0,0,0,0,0,0, 0,0,0,2,0,1,0,2,1, 1],
  // 7: concourse — food stall BLOCKED, hedges
  [1, 0,0,1,1,1,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0, 1,0,1,0,0, 1],
  // 8: concourse — open walkway
  [1, 0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0,0, 1],
  // 9-10: station south wall — row 9 walkable (walk behind wall), row 10 blocked
  [1, 0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0,0, 1],
  [1, 1,1,1,1,1,1,1, 1,0,0,0,0,0,0,0, 1,1,1,1,1,1,1,1,1, 1],
  // 11: blind footpath — outdoor, fully walkable
  row(0),
  // 12: platform — open (fixer starts here)
  row(0),
  // 13: platform — lamp posts (soft)
  [0, 2,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0,2, 0],
  // 14: platform — vending machine cluster cols 10-14 (blocked)
  [0, 0,0,0,0,0,0,0, 0,0,1,1,1,1,1,0, 0,0,0,0,0,0,0,0,0, 0],
  // 15: platform — tree bases BLOCKED, stone lanterns (soft)
  [0, 0,1,1,1,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,1,1,1,0, 0],
  // 16: platform — bench pairs + stone lanterns (soft)
  [0, 2,0,0,0,0,0,2, 0,0,0,0,0,0,0,0, 0,0,2,0,0,0,0,0,2, 0],
  // 17: platform — player spawn, fully walkable
  row(0),
  // 18: blind footpath — walkable
  row(0),
  // 19: fence — blocked
  row(1),
  // 20-24: tracks + grass + padding — blocked
  row(1),
  row(1),
  row(1),
  row(1),
  row(1),
];

export const TRAIN_STATION: GameMap = {
  id: 'ch1_train_station',
  name: '駅',
  width: W,
  height: H,
  ground,
  objects,
  collision,
  npcs: [
    // Fixer (田中さん) — starts on platform row 12, cutscene walks her to player
    { id: 'okaasan_welcome', x: 12, y: 12, sprite: 'lpc:lpc-named-tanaka-walk' },
    // Food stall interaction point (invisible — the decoration provides the visual)
    { id: 'food_stall', x: 4, y: 7, sprite: 'invisible' },
    // Vending machine interaction points (invisible — decorations provide visuals)
    { id: 'vending_machine', x: 10, y: 14, sprite: 'invisible' },
    { id: 'vending_machine', x: 11, y: 14, sprite: 'invisible' },
    { id: 'vending_machine', x: 12, y: 14, sprite: 'invisible' },
    { id: 'vending_machine', x: 13, y: 14, sprite: 'invisible' },
    { id: 'vending_machine', x: 14, y: 14, sprite: 'invisible' },
  ],
  playerSpawn: { x: 12, y: 17 },
  transitions: [
    // Station exit — right side only (left side blocked by ticket checkers)
    // Transitions on lower wall row (row 4) so player walks into them from concourse
    { x: 13, y: 4, targetMap: 'ch1_town', targetX: 34, targetY: 51, facing: 'up' },
    { x: 14, y: 4, targetMap: 'ch1_town', targetX: 34, targetY: 51, facing: 'up' },
    { x: 15, y: 4, targetMap: 'ch1_town', targetX: 35, targetY: 51, facing: 'up' },
  ],
  decorations: [
    // === OUTDOOR PADDING — trees above and below station ===
    { texture: 'obj-tree1', x: 3, y: 1, widthTiles: 2.5, heightTiles: 2.5 },
    { texture: 'obj-tree1', x: 7, y: 0, widthTiles: 2, heightTiles: 2 },
    { texture: 'obj-tree1', x: 19, y: 1, widthTiles: 2.5, heightTiles: 2.5 },
    { texture: 'obj-tree1', x: 23, y: 0, widthTiles: 2, heightTiles: 2 },
    { texture: 'obj-tree1', x: 3, y: 24, widthTiles: 2.5, heightTiles: 2.5 },
    { texture: 'obj-tree1', x: 10, y: 23, widthTiles: 2, heightTiles: 2 },
    { texture: 'obj-tree1', x: 17, y: 24, widthTiles: 2.5, heightTiles: 2.5 },
    { texture: 'obj-tree1', x: 23, y: 23, widthTiles: 2, heightTiles: 2 },

    // === NORTH WALL (rows 3-4) — wood behind food stall (2-8) & garden (19-24), concrete elsewhere ===
    { texture: 'wall-wood1', x: 1, y: 4, widthTiles: 1, heightTiles: 2 },
    { texture: 'wall-wood1', x: 2, y: 4, widthTiles: 1, heightTiles: 2 },
    { texture: 'wall-wood1', x: 3, y: 4, widthTiles: 1, heightTiles: 2 },
    { texture: 'wall-wood1', x: 4, y: 4, widthTiles: 1, heightTiles: 2 },
    { texture: 'wall-wood1', x: 5, y: 4, widthTiles: 1, heightTiles: 2 },
    { texture: 'wall-wood1', x: 6, y: 4, widthTiles: 1, heightTiles: 2 },
    { texture: 'wall-wood1', x: 7, y: 4, widthTiles: 1, heightTiles: 2 },
    { texture: 'wall-concrete1', x: 8, y: 4, widthTiles: 1, heightTiles: 2 },
    // cols 9-15: exit opening (no wall)
    { texture: 'wall-concrete4', x: 16, y: 4, widthTiles: 1, heightTiles: 2 },
    { texture: 'wall-concrete1', x: 17, y: 4, widthTiles: 1, heightTiles: 2 },
    { texture: 'wall-concrete3', x: 18, y: 4, widthTiles: 1, heightTiles: 2 },
    { texture: 'wall-wood1', x: 19, y: 4, widthTiles: 1, heightTiles: 2 },
    { texture: 'wall-wood1', x: 20, y: 4, widthTiles: 1, heightTiles: 2 },
    { texture: 'wall-wood1', x: 21, y: 4, widthTiles: 1, heightTiles: 2 },
    { texture: 'wall-wood1', x: 22, y: 4, widthTiles: 1, heightTiles: 2 },
    { texture: 'wall-wood1', x: 23, y: 4, widthTiles: 1, heightTiles: 2 },
    { texture: 'wall-wood1', x: 24, y: 4, widthTiles: 1, heightTiles: 2 },

    // === SOUTH WALL (rows 9-10) — concrete1 left section, concrete5 right section ===
    { texture: 'wall-concrete1', x: 1, y: 10, widthTiles: 1, heightTiles: 2 },
    { texture: 'wall-concrete1', x: 2, y: 10, widthTiles: 1, heightTiles: 2 },
    { texture: 'wall-concrete1', x: 3, y: 10, widthTiles: 1, heightTiles: 2 },
    { texture: 'wall-concrete2', x: 4, y: 10, widthTiles: 1, heightTiles: 2 },
    { texture: 'wall-concrete1', x: 5, y: 10, widthTiles: 1, heightTiles: 2 },
    { texture: 'wall-concrete1', x: 6, y: 10, widthTiles: 1, heightTiles: 2 },
    { texture: 'wall-concrete1', x: 7, y: 10, widthTiles: 1, heightTiles: 2 },
    { texture: 'wall-concrete8', x: 8, y: 10, widthTiles: 1, heightTiles: 2 },
    // cols 9-15: door opening (no wall)
    { texture: 'wall-concrete5', x: 16, y: 10, widthTiles: 1, heightTiles: 2 },
    { texture: 'wall-concrete7', x: 17, y: 10, widthTiles: 1, heightTiles: 2 },
    { texture: 'wall-concrete5', x: 18, y: 10, widthTiles: 1, heightTiles: 2 },
    { texture: 'wall-concrete5', x: 19, y: 10, widthTiles: 1, heightTiles: 2 },
    { texture: 'wall-concrete9', x: 20, y: 10, widthTiles: 1, heightTiles: 2 },
    { texture: 'wall-concrete5', x: 21, y: 10, widthTiles: 1, heightTiles: 2 },
    { texture: 'wall-concrete5', x: 22, y: 10, widthTiles: 1, heightTiles: 2 },
    { texture: 'wall-concrete5', x: 23, y: 10, widthTiles: 1, heightTiles: 2 },
    { texture: 'wall-concrete5', x: 24, y: 10, widthTiles: 1, heightTiles: 2 },

    // === LEFT SIDE WALL (col 0, rows 3-10) — vertical concrete on black ===
    { texture: 'wall-vertical-concrete1', x: 0, y: 3, widthTiles: 1, heightTiles: 1 },
    { texture: 'wall-vertical-concrete1', x: 0, y: 4, widthTiles: 1, heightTiles: 1 },
    { texture: 'wall-vertical-concrete1', x: 0, y: 5, widthTiles: 1, heightTiles: 1 },
    { texture: 'wall-vertical-concrete1', x: 0, y: 6, widthTiles: 1, heightTiles: 1 },
    { texture: 'wall-vertical-concrete1', x: 0, y: 7, widthTiles: 1, heightTiles: 1 },
    { texture: 'wall-vertical-concrete1', x: 0, y: 8, widthTiles: 1, heightTiles: 1 },
    { texture: 'wall-vertical-concrete1', x: 0, y: 9, widthTiles: 1, heightTiles: 1 },
    { texture: 'wall-vertical-concrete1', x: 0, y: 10, widthTiles: 1, heightTiles: 1 },

    // === RIGHT SIDE WALL (col 25, rows 3-10) — flipped vertical concrete on black ===
    { texture: 'wall-vertical-concrete1', x: 25, y: 3, widthTiles: 1, heightTiles: 1, flipX: true },
    { texture: 'wall-vertical-concrete1', x: 25, y: 4, widthTiles: 1, heightTiles: 1, flipX: true },
    { texture: 'wall-vertical-concrete1', x: 25, y: 5, widthTiles: 1, heightTiles: 1, flipX: true },
    { texture: 'wall-vertical-concrete1', x: 25, y: 6, widthTiles: 1, heightTiles: 1, flipX: true },
    { texture: 'wall-vertical-concrete1', x: 25, y: 7, widthTiles: 1, heightTiles: 1, flipX: true },
    { texture: 'wall-vertical-concrete1', x: 25, y: 8, widthTiles: 1, heightTiles: 1, flipX: true },
    { texture: 'wall-vertical-concrete1', x: 25, y: 9, widthTiles: 1, heightTiles: 1, flipX: true },
    { texture: 'wall-vertical-concrete1', x: 25, y: 10, widthTiles: 1, heightTiles: 1, flipX: true },

    // === TICKET GATE BARRIER (Row 4, cols 9-11) ===
    { texture: 'obj-ticket-checker', x: 9, y: 4, widthTiles: 1.0, heightTiles: 1.2 },
    { texture: 'obj-ticket-checker', x: 10, y: 4, widthTiles: 1.0, heightTiles: 1.2 },
    { texture: 'obj-ticket-checker', x: 11, y: 4, widthTiles: 1.0, heightTiles: 1.2 },

    // === FENCE (Col 12, rows 2-4) — separates exit from concourse ===
    { texture: 'obj-fence-vertical', x: 12, y: 2, widthTiles: 0.1, heightTiles: 1.2 },
    { texture: 'obj-fence-vertical', x: 12, y: 3, widthTiles: 0.1, heightTiles: 1.2 },
    { texture: 'obj-fence-vertical', x: 12, y: 4, widthTiles: 0.1, heightTiles: 1.2 },

    // === CONCOURSE (Rows 5-8) ===

    // Ticket machine + ATM against north wall, side by side
    { texture: 'obj-ticket-machine', x: 16, y: 5, widthTiles: 1.0, heightTiles: 1.2 },
    { texture: 'obj-atm', x: 17, y: 5, widthTiles: 1.0, heightTiles: 1.2 },

    // Yakikuri food stall — west concourse, moved down so player can't walk behind it
    { texture: 'building-food-stall', x: 4, y: 7, widthTiles: 3, heightTiles: 2.5 },
    // Stone lantern near food stall — warm glow
    { texture: 'obj-stone-lantern', x: 2, y: 6, widthTiles: 0.7, heightTiles: 1.2 },
    // Trash can — hidden in the meditation garden (rare in Japan!)
    { texture: 'obj-trash', x: 23, y: 6, widthTiles: 0.6, heightTiles: 0.7 },
    // Meditation garden — northeast nook
    { texture: 'obj-buddha1', x: 21, y: 5, widthTiles: 0.8, heightTiles: 1.0 },
    // Potted plants in garden
    { texture: 'obj-plants', x: 19, y: 6, widthTiles: 1.2, heightTiles: 1.2 },

    // === PLATFORM (Rows 12-17) ===

    // Lamp posts at platform edges
    { texture: 'obj-lamp-post', x: 1, y: 13, widthTiles: 0.6, heightTiles: 2 },
    { texture: 'obj-lamp-post', x: 24, y: 13, widthTiles: 0.6, heightTiles: 2 },

    // Vending machine cluster — 5 machines grouped together!
    { texture: 'obj-vending-machine1', x: 10, y: 14, widthTiles: 1, heightTiles: 1.5 },
    { texture: 'obj-vending-machine5', x: 11, y: 14, widthTiles: 1, heightTiles: 1.5 },
    { texture: 'obj-vending-machine6', x: 12, y: 14, widthTiles: 1, heightTiles: 1.5 },
    { texture: 'obj-vending-machine7', x: 13, y: 14, widthTiles: 1, heightTiles: 1.5 },
    { texture: 'obj-vending-machine8', x: 14, y: 14, widthTiles: 1, heightTiles: 1.5 },

    // Green tree — west platform, BIGGER (3 tiles wide), BLOCKED
    { texture: 'obj-tree1', x: 3, y: 15, widthTiles: 3, heightTiles: 3 },
    // Green tree — east platform, BIGGER (3 tiles wide), BLOCKED
    { texture: 'obj-tree1', x: 22, y: 15, widthTiles: 3, heightTiles: 3 },

    // Symmetric bench pairs + trash — south platform
    // West waiting area
    { texture: 'obj-stone-lantern', x: 1, y: 16, widthTiles: 0.7, heightTiles: 1.2 },
    { texture: 'obj-bench', x: 7, y: 16, widthTiles: 1.2, heightTiles: 0.8 },
    // East waiting area (mirrors west)
    { texture: 'obj-bench', x: 18, y: 16, widthTiles: 1.2, heightTiles: 0.8 },
    { texture: 'obj-stone-lantern', x: 24, y: 16, widthTiles: 0.7, heightTiles: 1.2 },

    // === TRACKS (Rows 20-21) ===
    // Shinkansen — stretches across the tracks
    { texture: 'obj-shinkansen', x: 13, y: 21, widthTiles: 14, heightTiles: 2 },
  ],
};
