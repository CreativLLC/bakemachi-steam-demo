import type { GameMap, MapDecoration } from '../types';

// ═══════════════════════════════════════════════════════════════════════════
// Bakemachi Town — 70x55 tile outdoor map (DENSE Japanese town)
//
// Design: A network of roads with buildings filling every block between them.
// Main roads have sidewalks + curb transitions. Side streets are narrow
// (2-tile asphalt, no sidewalk). Buildings packed into every block.
// Blocked areas use GRASS (yards) with FENCES at walkable boundaries.
//
// ORDER OF OPERATIONS:
//   1. Default: grass ground everywhere, collision=1 everywhere
//   2. pG()  — paint non-walkable ground (map-edge bush borders)
//   3. path() — paint walkable paths (ground + collision=0)
//   4. walk() — make areas walkable without changing ground
//   5. Fence boundary: blocked grass tiles adjacent to roads → fence tiles
//   6. Tree base fix: restore grass under tree sprites
//   7. Specific collision overrides
// ═══════════════════════════════════════════════════════════════════════════

const W = 70;
const H = 55;

// ── Tile helpers ─────────────────────────────────────────────
const grass = (c: number, r: number) => ((c + r) % 3 === 0 ? 20 : 19);
const bush  = (c: number, r: number) => ((c + r) % 2 === 0 ? 47 : 48);
const sw    = (c: number, r: number) => [10, 14, 15, 16][(c * 3 + r * 7) % 4];
const fp    = (c: number, r: number) => [42, 43, 44][(c + r) % 3];
const curb  = (c: number, r: number) => (c + r) % 2 === 0 ? 27 : 28;
const curbR = (c: number, r: number) => (c + r) % 2 === 0 ? 60 : 61; // rotated 180°
const asph  = () => 18;
const dirt  = (c: number, r: number) => (c + r) % 2 === 0 ? 52 : 53;

// ── Build layers — ALL collision=1 by default ────────────────
const ground: number[][] = Array.from({ length: H }, (_, r) =>
  Array.from({ length: W }, (_, c) => grass(c, r))
);
const collision: number[][] = Array.from({ length: H }, () =>
  Array.from({ length: W }, () => 1)
);
const objects: number[][] = Array.from({ length: H }, () =>
  Array.from({ length: W }, () => 0)
);

// ── Painting helpers ─────────────────────────────────────────
/** Paint ground tiles only (no collision change) */
function pG(r1: number, r2: number, c1: number, c2: number, fn: (c: number, r: number) => number) {
  for (let r = r1; r <= r2; r++)
    for (let c = c1; c <= c2; c++)
      ground[r][c] = fn(c, r);
}

/** Paint ground AND set collision=0 (walkable) */
function path(r1: number, r2: number, c1: number, c2: number, fn: (c: number, r: number) => number) {
  for (let r = r1; r <= r2; r++)
    for (let c = c1; c <= c2; c++) {
      ground[r][c] = fn(c, r);
      collision[r][c] = 0;
    }
}

/** Set collision=0 without changing ground */
function walk(r1: number, r2: number, c1: number, c2: number) {
  for (let r = r1; r <= r2; r++)
    for (let c = c1; c <= c2; c++)
      collision[r][c] = 0;
}


// ═══════════════════════════════════════════════════════════════════════════
// STEP 2: pG() — Paint non-walkable ground areas
// ═══════════════════════════════════════════════════════════════════════════

// ── DENSE BUSH BORDERS (ground only — collision stays 1) ──
pG(0, 3, 0, 69, bush);     // top border
pG(51, 54, 0, 69, bush);   // bottom border
pG(0, 54, 0, 2, bush);     // left border
pG(0, 54, 67, 69, bush);   // right border

// Station approach flanking: left as default grass (yards behind fences)
// Buildings and fences will define the boundaries naturally

// ── SMALL PARK flower ground (cols 24-29, rows 5-8) ──
for (let r = 5; r <= 8; r++)
  for (let c = 24; c <= 29; c++)
    if (!((c === 26 || c === 27) || r === 6))
      ground[r][c] = (c + r) % 2 === 0 ? 40 : 41;
// Park footpaths (visual only)
pG(5, 8, 26, 27, fp);   // N-S path through park
pG(6, 6, 24, 29, fp);   // E-W path through park


// ═══════════════════════════════════════════════════════════════════════════
// STEP 3: path() — Carve walkable paths (ground + collision=0)
// ═══════════════════════════════════════════════════════════════════════════

// ── MAIN E-W ROADS ──

// North Main Road (rows 10-15, cols 4-66)
path(10, 10, 4, 66, sw);      // sidewalk north
path(11, 11, 4, 66, curb);    // curb (sidewalk above, road below)
path(12, 13, 4, 66, asph);    // asphalt
path(14, 14, 4, 66, curbR);   // curb ROTATED (road above, sidewalk below)
path(15, 15, 4, 66, sw);      // sidewalk south

// South Main Road (rows 33-38, cols 4-66)
path(33, 33, 4, 66, sw);      // sidewalk north
path(34, 34, 4, 66, curb);    // curb
path(35, 36, 4, 66, asph);    // asphalt
path(37, 37, 4, 66, curbR);   // curb ROTATED
path(38, 38, 4, 66, sw);      // sidewalk south

// ── MAIN N-S ROAD (cols 31-34, rows 4-50) ──
path(4, 50, 31, 31, sw);      // sidewalk west
path(4, 50, 32, 33, asph);    // asphalt center
path(4, 50, 34, 34, sw);      // sidewalk east

// ── E-W SIDE STREETS (no sidewalk, 2-tile asphalt) ──

// Side street 1 (rows 21-22)
path(21, 22, 4, 30, asph);    // west of main N-S
path(21, 22, 35, 66, asph);   // east of main N-S

// Side street 2 (rows 27-28) — PARTIAL
path(27, 28, 4, 10, asph);    // short west stub (near Tanaka house)
path(27, 28, 46, 66, asph);   // east portion only

// Side street 3 (rows 44-45)
path(44, 45, 4, 30, asph);    // west
path(44, 45, 35, 66, asph);   // east

// ── N-S SIDE STREETS (no sidewalk, 2-tile asphalt) ──

// Street A (cols 11-12)
path(4, 9, 11, 12, asph);       // upper zone
path(16, 32, 11, 12, asph);     // shopping to residential

// Street B (cols 21-22)
path(4, 9, 21, 22, asph);       // upper zone
path(16, 44, 21, 22, asph);     // long street

// Street C (cols 43-44)
path(16, 32, 43, 44, asph);     // shopping area only

// Street D (cols 53-54)
path(4, 9, 53, 54, asph);       // upper zone
path(16, 44, 53, 54, asph);     // long street

// Street E (cols 62-63)
path(16, 38, 62, 63, asph);     // medium length

// ── STATION APPROACH (rows 39-52) ──
path(39, 50, 31, 34, sw);       // continues main N-S road south
path(46, 50, 29, 36, sw);       // widens near station
path(49, 50, 28, 37, sw);       // wider still
path(51, 52, 32, 37, sw);       // station entrance gap

// ── TEMPLE AREA (accessible from roads) ──
path(7, 9, 5, 10, dirt);        // temple grounds walkable

// ── SCHOOL YARD ──
path(7, 9, 46, 52, sw);         // school yard

// ── SMALL PARK (walkable grass area) ──
walk(5, 8, 24, 29);             // small green park area
pG(6, 6, 25, 28, fp);           // footpath through park
pG(5, 8, 26, 27, fp);           // cross path


// ═══════════════════════════════════════════════════════════════════════════
// INTERSECTION FIXES: Where roads cross, replace sidewalk/curb with asphalt
// ═══════════════════════════════════════════════════════════════════════════

// Helper: at an intersection, ALL tiles become asphalt
function fixIntersection(rows: number[], cols: number[]) {
  for (const r of rows) {
    for (const c of cols) {
      ground[r][c] = asph();
      // collision stays 0 (already set by path())
    }
  }
}

// North E-W main road (rows 10-15) crossed by N-S streets
const northRoadRows = [10, 11, 12, 13, 14, 15];
fixIntersection(northRoadRows, [11, 12]);       // Street A
fixIntersection(northRoadRows, [21, 22]);       // Street B
fixIntersection(northRoadRows, [31, 32, 33, 34]); // Main N-S road
fixIntersection(northRoadRows, [53, 54]);       // Street D

// South E-W main road (rows 33-38) crossed by N-S streets
const southRoadRows = [33, 34, 35, 36, 37, 38];
fixIntersection(southRoadRows, [21, 22]);       // Street B
fixIntersection(southRoadRows, [31, 32, 33, 34]); // Main N-S road
fixIntersection(southRoadRows, [53, 54]);       // Street D
fixIntersection(southRoadRows, [62, 63]);       // Street E

// Main N-S road (cols 31-34) crossed by E-W side streets
// Side street 1 (rows 21-22)
fixIntersection([21, 22], [31, 32, 33, 34]);
// Side street 3 (rows 44-45)
fixIntersection([44, 45], [31, 32, 33, 34]);


// ═══════════════════════════════════════════════════════════════════════════
// FENCE BOUNDARY: Blocked grass tiles adjacent to walkable tiles get fence.
// Interior blocked grass stays as grass (yards behind fences).
// Border areas already painted as bush by pG() above — left untouched.
// ═══════════════════════════════════════════════════════════════════════════
const fence = (c: number, r: number) => [12, 25, 26][(c + r) % 3];

for (let r = 0; r < H; r++) {
  for (let c = 0; c < W; c++) {
    if (collision[r][c] !== 1) continue;
    const g = ground[r][c];
    if (g !== 19 && g !== 20) continue; // only convert grass tiles

    // Check if any orthogonal neighbor is walkable (collision === 0)
    const hasWalkableNeighbor =
      (r > 0 && collision[r - 1][c] === 0) ||
      (r < H - 1 && collision[r + 1][c] === 0) ||
      (c > 0 && collision[r][c - 1] === 0) ||
      (c < W - 1 && collision[r][c + 1] === 0);

    if (hasWalkableNeighbor) {
      ground[r][c] = fence(c, r);
    }
  }
}


// ═══════════════════════════════════════════════════════════════════════════
// BUILDING DECORATIONS — PROGRAMMATIC FILL
// ═══════════════════════════════════════════════════════════════════════════

type BlockDef = { c1: number; c2: number; baseRow: number };

const HOUSE_TEXTURES = [
  'placeholder-house', 'placeholder-house-blue', 'placeholder-house-red',
  'placeholder-house-white', 'placeholder-house-yellow', 'placeholder-house-small',
];
const SHOP_TEXTURES = [
  'placeholder-shop', 'placeholder-shop-orange', 'placeholder-shop-blue', 'placeholder-pharmacy',
];
const TALL_TEXTURES = ['placeholder-apartment', 'placeholder-building-tall'];

/** Deterministically fill a block with buildings */
function fillBlock(block: BlockDef, isCommercial: boolean): MapDecoration[] {
  const decos: MapDecoration[] = [];
  let x = block.c1 + 1;
  let idx = 0;
  while (x <= block.c2 - 1) {
    // Deterministic "random" based on position
    const seed = (x * 7 + block.baseRow * 13 + idx * 3) % 17;
    const bw = seed % 5 === 0 ? 4 : (seed % 3 === 0 ? 3 : 2);

    if (x + bw > block.c2 + 1) break; // don't overflow block

    let texture: string;
    if (seed % 7 === 0 && bw >= 3) {
      texture = TALL_TEXTURES[seed % TALL_TEXTURES.length];
    } else if (isCommercial) {
      texture = SHOP_TEXTURES[seed % SHOP_TEXTURES.length];
    } else {
      texture = HOUSE_TEXTURES[seed % HOUSE_TEXTURES.length];
    }

    decos.push({
      texture,
      x: x + Math.floor(bw / 2),
      y: block.baseRow,
      widthTiles: bw,
      heightTiles: bw + 1, // taller than wide
    });

    x += bw + 1; // 1-tile gap between buildings
    idx++;
  }
  return decos;
}

const blocks: (BlockDef & { commercial?: boolean })[] = [
  // UPPER ZONE (rows 4-9, base row 9)
  // A1: Temple — handled manually
  { c1: 13, c2: 20, baseRow: 9 },                    // A2
  // A3: Park area — skip (no block entry)
  { c1: 35, c2: 42, baseRow: 9 },                    // A4
  // A5: School — handled manually
  { c1: 55, c2: 61, baseRow: 9 },                    // A6
  { c1: 64, c2: 66, baseRow: 9 },                    // A7 tiny

  // SHOPPING ZONE 1 (rows 16-20, base row 20)
  { c1: 4, c2: 10, baseRow: 20, commercial: true },   // B1
  { c1: 13, c2: 20, baseRow: 20, commercial: true },  // B2
  { c1: 23, c2: 30, baseRow: 20, commercial: true },  // B3
  // B4 (konbini) — handled manually
  { c1: 45, c2: 52, baseRow: 20, commercial: true },  // B5
  { c1: 55, c2: 61, baseRow: 20, commercial: true },  // B6
  { c1: 64, c2: 66, baseRow: 20, commercial: true },  // B7

  // MID ZONE (rows 23-26, base row 26)
  // C1 (Tanaka house) — handled manually
  { c1: 13, c2: 20, baseRow: 26 },                   // C2
  { c1: 23, c2: 30, baseRow: 26 },                   // C3
  { c1: 35, c2: 42, baseRow: 26 },                   // C4
  { c1: 45, c2: 52, baseRow: 26 },                   // C5
  { c1: 55, c2: 61, baseRow: 26 },                   // C6
  { c1: 64, c2: 66, baseRow: 26 },                   // C7

  // LOWER MID (rows 29-32, base row 32)
  { c1: 4, c2: 10, baseRow: 32 },                    // D1
  { c1: 13, c2: 20, baseRow: 32 },                   // D2
  { c1: 23, c2: 30, baseRow: 32 },                   // D3
  { c1: 35, c2: 42, baseRow: 32 },                   // D4
  { c1: 45, c2: 52, baseRow: 32 },                   // D5
  { c1: 55, c2: 66, baseRow: 32 },                   // D6

  // SOUTH RESIDENTIAL (rows 39-43, base row 43)
  { c1: 4, c2: 10, baseRow: 43 },                    // E1
  { c1: 13, c2: 20, baseRow: 43 },                   // E2
  { c1: 23, c2: 30, baseRow: 43 },                   // E3
  { c1: 35, c2: 42, baseRow: 43 },                   // E4
  { c1: 45, c2: 52, baseRow: 43 },                   // E5
  { c1: 55, c2: 66, baseRow: 43 },                   // E6
];

// Generate all block buildings
const blockBuildings: MapDecoration[] = [];
for (const block of blocks) {
  blockBuildings.push(...fillBlock(block, block.commercial ?? false));
}


// ═══════════════════════════════════════════════════════════════════════════
// MANUAL SPECIAL BUILDINGS
// ═══════════════════════════════════════════════════════════════════════════

const manualBuildings: MapDecoration[] = [
  // TEMPLE (upper zone A1)
  { texture: 'building-temple', x: 7, y: 9, widthTiles: 5, heightTiles: 5 },
  { texture: 'obj-stone-lantern', x: 5, y: 9, widthTiles: 0.7, heightTiles: 1.2 },
  { texture: 'obj-stone-lantern', x: 10, y: 9, widthTiles: 0.7, heightTiles: 1.2 },
  { texture: 'placeholder-torii', x: 8, y: 10, widthTiles: 3, heightTiles: 3 },

  // SCHOOL (upper zone A5)
  { texture: 'building-school', x: 49, y: 9, widthTiles: 8, heightTiles: 5 },
  { texture: 'obj-fence-horizontal', x: 46, y: 9, widthTiles: 2, heightTiles: 0.5 },
  { texture: 'obj-fence-horizontal', x: 52, y: 9, widthTiles: 2, heightTiles: 0.5 },

  // KONBINI (shopping zone B4, cols 35-42)
  { texture: 'building-konbini', x: 38, y: 20, widthTiles: 6, heightTiles: 5 },

  // TANAKA HOUSE (mid zone C1, cols 4-10)
  { texture: 'placeholder-apartment', x: 7, y: 26, widthTiles: 4, heightTiles: 5 },

  // FOOD STALL (on north main road south sidewalk)
  { texture: 'building-food-stall', x: 8, y: 15, widthTiles: 3, heightTiles: 2.5 },
];

// ═══════════════════════════════════════════════════════════════════════════
// TREES
// ═══════════════════════════════════════════════════════════════════════════

const trees: MapDecoration[] = [
  // Trees along main roads and at intersections
  { texture: 'obj-tree1', x: 15, y: 10, widthTiles: 2.5, heightTiles: 2.5 },
  { texture: 'obj-tree3', x: 26, y: 10, widthTiles: 2, heightTiles: 2 },
  { texture: 'obj-tree2', x: 40, y: 10, widthTiles: 2.5, heightTiles: 2.5 },
  { texture: 'obj-tree4', x: 58, y: 10, widthTiles: 2, heightTiles: 2 },
  { texture: 'obj-tree1', x: 15, y: 33, widthTiles: 2.5, heightTiles: 2.5 },
  { texture: 'obj-tree5', x: 40, y: 33, widthTiles: 2.5, heightTiles: 2.5 },
  { texture: 'obj-tree2', x: 58, y: 33, widthTiles: 2.5, heightTiles: 2.5 },
  { texture: 'obj-tree3', x: 8, y: 38, widthTiles: 2, heightTiles: 2 },
  { texture: 'obj-tree4', x: 50, y: 38, widthTiles: 2, heightTiles: 2 },
  // Park trees
  { texture: 'obj-tree1', x: 25, y: 5, widthTiles: 2.5, heightTiles: 2.5 },
  { texture: 'obj-tree5', x: 29, y: 8, widthTiles: 2.5, heightTiles: 2.5 },
  // Station approach trees
  { texture: 'obj-tree1', x: 28, y: 47, widthTiles: 3, heightTiles: 3 },
  { texture: 'obj-tree3', x: 37, y: 47, widthTiles: 2.5, heightTiles: 2.5 },
  { texture: 'obj-tree2', x: 26, y: 50, widthTiles: 2.5, heightTiles: 2.5 },
  { texture: 'obj-tree4', x: 39, y: 50, widthTiles: 2, heightTiles: 2 },

  // Border trees (sparse — bush tiles fill borders)
  // Top border
  { texture: 'obj-tree1', x: 6, y: 3, widthTiles: 2.5, heightTiles: 2.5 },
  { texture: 'obj-tree3', x: 18, y: 2, widthTiles: 2, heightTiles: 2 },
  { texture: 'obj-tree2', x: 30, y: 3, widthTiles: 2.5, heightTiles: 2.5 },
  { texture: 'obj-tree4', x: 45, y: 2, widthTiles: 2, heightTiles: 2 },
  { texture: 'obj-tree1', x: 58, y: 3, widthTiles: 2.5, heightTiles: 2.5 },
  // Bottom border
  { texture: 'obj-tree2', x: 8, y: 53, widthTiles: 2.5, heightTiles: 2.5 },
  { texture: 'obj-tree3', x: 20, y: 54, widthTiles: 2, heightTiles: 2 },
  { texture: 'obj-tree1', x: 46, y: 53, widthTiles: 2.5, heightTiles: 2.5 },
  { texture: 'obj-tree4', x: 60, y: 54, widthTiles: 2, heightTiles: 2 },
  // Left border
  { texture: 'obj-tree1', x: 1, y: 15, widthTiles: 2, heightTiles: 2 },
  { texture: 'obj-tree3', x: 1, y: 30, widthTiles: 2, heightTiles: 2 },
  { texture: 'obj-tree2', x: 1, y: 45, widthTiles: 2, heightTiles: 2 },
  // Right border
  { texture: 'obj-tree1', x: 68, y: 15, widthTiles: 2, heightTiles: 2 },
  { texture: 'obj-tree3', x: 68, y: 30, widthTiles: 2, heightTiles: 2 },
  { texture: 'obj-tree4', x: 68, y: 45, widthTiles: 2, heightTiles: 2 },
];


// ═══════════════════════════════════════════════════════════════════════════
// OBJECTS (scattered along streets for density)
// ═══════════════════════════════════════════════════════════════════════════

const streetObjects: MapDecoration[] = [
  // Lamp posts
  { texture: 'obj-lamp-post', x: 8, y: 10, widthTiles: 0.6, heightTiles: 2 },
  { texture: 'obj-lamp-post', x: 20, y: 10, widthTiles: 0.6, heightTiles: 2 },
  { texture: 'obj-lamp-post', x: 40, y: 15, widthTiles: 0.6, heightTiles: 2 },
  { texture: 'obj-lamp-post', x: 55, y: 15, widthTiles: 0.6, heightTiles: 2 },
  { texture: 'obj-lamp-post', x: 31, y: 24, widthTiles: 0.6, heightTiles: 2 },
  { texture: 'obj-lamp-post', x: 34, y: 28, widthTiles: 0.6, heightTiles: 2 },
  { texture: 'obj-lamp-post', x: 31, y: 40, widthTiles: 0.6, heightTiles: 2 },
  { texture: 'obj-lamp-post', x: 34, y: 46, widthTiles: 0.6, heightTiles: 2 },
  // More lamp posts along roads
  { texture: 'obj-lamp-post', x: 31, y: 17, widthTiles: 0.6, heightTiles: 2 },
  { texture: 'obj-lamp-post', x: 50, y: 10, widthTiles: 0.6, heightTiles: 2 },
  { texture: 'obj-lamp-post', x: 15, y: 38, widthTiles: 0.6, heightTiles: 2 },
  { texture: 'obj-lamp-post', x: 45, y: 33, widthTiles: 0.6, heightTiles: 2 },
  { texture: 'obj-lamp-post', x: 60, y: 38, widthTiles: 0.6, heightTiles: 2 },
  // Vending machines
  { texture: 'obj-vending-machine1', x: 24, y: 15, widthTiles: 1, heightTiles: 1.5 },
  { texture: 'obj-vending-machine3', x: 50, y: 15, widthTiles: 1, heightTiles: 1.5 },
  { texture: 'obj-vending-machine5', x: 30, y: 44, widthTiles: 1, heightTiles: 1.5 },
  // Benches
  { texture: 'obj-bench', x: 18, y: 10, widthTiles: 1.2, heightTiles: 0.8 },
  { texture: 'obj-bench', x: 45, y: 10, widthTiles: 1.2, heightTiles: 0.8 },
  { texture: 'obj-bench', x: 25, y: 38, widthTiles: 1.2, heightTiles: 0.8 },
  // Placeholder objects along streets
  { texture: 'placeholder-mailbox', x: 9, y: 22, widthTiles: 0.4, heightTiles: 0.6 },
  { texture: 'placeholder-mailbox', x: 48, y: 22, widthTiles: 0.4, heightTiles: 0.6 },
  { texture: 'placeholder-mailbox', x: 35, y: 38, widthTiles: 0.4, heightTiles: 0.6 },
  { texture: 'placeholder-phonebooth', x: 15, y: 15, widthTiles: 0.6, heightTiles: 1 },
  { texture: 'placeholder-phonebooth', x: 60, y: 33, widthTiles: 0.6, heightTiles: 1 },
  { texture: 'placeholder-bikerack', x: 6, y: 22, widthTiles: 1, heightTiles: 0.5 },
  { texture: 'placeholder-bikerack', x: 56, y: 22, widthTiles: 1, heightTiles: 0.5 },
  { texture: 'placeholder-bikerack', x: 20, y: 44, widthTiles: 1, heightTiles: 0.5 },
  { texture: 'placeholder-sign', x: 29, y: 10, widthTiles: 0.3, heightTiles: 0.9 },
  { texture: 'placeholder-sign', x: 36, y: 38, widthTiles: 0.3, heightTiles: 0.9 },
  { texture: 'placeholder-sign', x: 11, y: 44, widthTiles: 0.3, heightTiles: 0.9 },
  { texture: 'placeholder-pole', x: 44, y: 10, widthTiles: 0.25, heightTiles: 1.1 },
  { texture: 'placeholder-pole', x: 11, y: 33, widthTiles: 0.25, heightTiles: 1.1 },
  { texture: 'placeholder-pole', x: 56, y: 38, widthTiles: 0.25, heightTiles: 1.1 },
  { texture: 'placeholder-planter', x: 36, y: 15, widthTiles: 0.6, heightTiles: 0.5 },
  { texture: 'placeholder-planter', x: 46, y: 15, widthTiles: 0.6, heightTiles: 0.5 },
  { texture: 'placeholder-planter', x: 16, y: 33, widthTiles: 0.6, heightTiles: 0.5 },
  { texture: 'placeholder-planter', x: 50, y: 33, widthTiles: 0.6, heightTiles: 0.5 },
  { texture: 'placeholder-barrel', x: 5, y: 15, widthTiles: 0.5, heightTiles: 0.5 },
  { texture: 'placeholder-barrel', x: 65, y: 15, widthTiles: 0.5, heightTiles: 0.5 },
  { texture: 'placeholder-crate', x: 42, y: 22, widthTiles: 0.6, heightTiles: 0.6 },
  { texture: 'placeholder-crate', x: 14, y: 28, widthTiles: 0.6, heightTiles: 0.6 },
  { texture: 'placeholder-ac-unit', x: 10, y: 16, widthTiles: 0.7, heightTiles: 0.6 },
  { texture: 'placeholder-ac-unit', x: 62, y: 16, widthTiles: 0.7, heightTiles: 0.6 },
  { texture: 'placeholder-bin', x: 30, y: 15, widthTiles: 0.4, heightTiles: 0.6 },
  { texture: 'placeholder-bin', x: 52, y: 33, widthTiles: 0.4, heightTiles: 0.6 },
  { texture: 'obj-trash', x: 23, y: 15, widthTiles: 0.6, heightTiles: 0.7 },
  { texture: 'obj-plants', x: 28, y: 5, widthTiles: 1.2, heightTiles: 1.2 },
  { texture: 'obj-plants', x: 42, y: 38, widthTiles: 1.2, heightTiles: 1.2 },
  { texture: 'obj-buddha1', x: 6, y: 8, widthTiles: 0.8, heightTiles: 1.0 },
  // Parked cars along E-W main roads (horizontal orientation)
  { texture: 'placeholder-car-white-h', x: 17, y: 12, widthTiles: 2, heightTiles: 1.2 },
  { texture: 'placeholder-car-red-h', x: 25, y: 13, widthTiles: 2, heightTiles: 1.2 },
  { texture: 'placeholder-car-blue-h', x: 45, y: 12, widthTiles: 2, heightTiles: 1.2 },
  { texture: 'placeholder-car-black-h', x: 58, y: 13, widthTiles: 2, heightTiles: 1.2 },
  { texture: 'placeholder-car-white-h', x: 10, y: 35, widthTiles: 2, heightTiles: 1.2 },
  { texture: 'placeholder-car-silver-h', x: 38, y: 36, widthTiles: 2, heightTiles: 1.2 },
  { texture: 'placeholder-car-red-h', x: 55, y: 35, widthTiles: 2, heightTiles: 1.2 },
  // Parked on N-S side streets (vertical orientation)
  { texture: 'placeholder-car-blue', x: 12, y: 18, widthTiles: 1.2, heightTiles: 2 },
  { texture: 'placeholder-car-black', x: 22, y: 25, widthTiles: 1.2, heightTiles: 2 },
  { texture: 'placeholder-car-silver', x: 54, y: 30, widthTiles: 1.2, heightTiles: 2 },
  { texture: 'placeholder-car-white', x: 44, y: 19, widthTiles: 1.2, heightTiles: 2 },
  { texture: 'placeholder-truck-white', x: 63, y: 22, widthTiles: 1.5, heightTiles: 2.5 },
  { texture: 'placeholder-van-blue', x: 8, y: 44, widthTiles: 1.4, heightTiles: 2.2 },
];


// ═══════════════════════════════════════════════════════════════════════════
// COMBINE ALL DECORATIONS
// ═══════════════════════════════════════════════════════════════════════════

const decorations: MapDecoration[] = [
  ...blockBuildings,
  ...manualBuildings,
  ...trees,
  ...streetObjects,
];


// ═══════════════════════════════════════════════════════════════════════════
// TREE BASE FIX: Restore grass under tree sprites (if base tile is bush from borders)
// ═══════════════════════════════════════════════════════════════════════════
for (const deco of decorations) {
  if (deco.texture.startsWith('obj-tree')) {
    const tx = Math.round(deco.x);
    const ty = Math.round(deco.y);
    if (tx >= 0 && tx < W && ty >= 0 && ty < H) {
      // Only restore grass if the tile is bush — don't overwrite sidewalk/asphalt/etc.
      const g = ground[ty][tx];
      if (g === 47 || g === 48) {
        ground[ty][tx] = grass(tx, ty);
      }
    }
  }
}


// ═══════════════════════════════════════════════════════════════════════════
// COLLISION OVERRIDES (for objects on walkable tiles)
// ═══════════════════════════════════════════════════════════════════════════

// Food stall area (on sidewalk row 15)
collision[14][7] = 1; collision[14][8] = 1; collision[14][9] = 1;
collision[15][7] = 1; collision[15][8] = 1; collision[15][9] = 1;
// Vending machines
collision[15][24] = 1;
collision[15][50] = 1;
collision[44][30] = 1;
// Benches (soft collision)
collision[10][18] = 2;
collision[10][45] = 2;
collision[38][25] = 2;
// Mailboxes
collision[22][9] = 1;
collision[22][48] = 1;
collision[38][35] = 1;
// Phone booths
collision[15][15] = 1;
collision[33][60] = 1;
// Bike racks (soft)
collision[22][6] = 2;
collision[22][56] = 2;
collision[44][20] = 2;
// Signs
collision[10][29] = 1;
collision[38][36] = 1;
collision[44][11] = 1;
// Poles
collision[10][44] = 1;
collision[33][11] = 1;
collision[38][56] = 1;
// Stone lanterns (soft)
collision[9][5] = 2;
collision[9][10] = 2;
// Parked car collisions (E-W road cars block 2 tiles wide)
collision[12][17] = 1; collision[12][18] = 1;
collision[13][25] = 1; collision[13][26] = 1;
collision[12][45] = 1; collision[12][46] = 1;
collision[13][58] = 1; collision[13][59] = 1;
collision[35][10] = 1; collision[35][11] = 1;
collision[36][38] = 1; collision[36][39] = 1;
collision[35][55] = 1; collision[35][56] = 1;
// N-S side street cars
collision[18][12] = 1;
collision[25][22] = 1;
collision[30][54] = 1;
collision[19][44] = 1;
collision[22][63] = 1;
collision[44][8] = 1;


// ═══════════════════════════════════════════════════════════════════════════
// NPCs
// ═══════════════════════════════════════════════════════════════════════════

const npcs = [
  { id: 'food_stall',        x: 8,  y: 13, sprite: 'invisible' },
  { id: 'vending_machine',   x: 24, y: 14, sprite: 'invisible' },  // moved from y:15 to y:14 (not blocked by vending machine)
  { id: 'vending_machine',   x: 50, y: 14, sprite: 'invisible' },  // same
];


// ═══════════════════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════════════════

export const TOWN_OUTDOOR: GameMap = {
  id: 'ch1_town',
  name: '化け町',
  width: W,
  height: H,
  ground,
  objects,
  collision,
  npcs,
  playerSpawn: { x: 34, y: 51 },
  transitions: [
    // Station entrance (south border)
    { x: 33, y: 52, targetMap: 'ch1_train_station', targetX: 11, targetY: 5, facing: 'down' as const },
    { x: 34, y: 52, targetMap: 'ch1_train_station', targetX: 12, targetY: 5, facing: 'down' as const },
    { x: 35, y: 52, targetMap: 'ch1_train_station', targetX: 13, targetY: 5, facing: 'down' as const },
    { x: 36, y: 52, targetMap: 'ch1_train_station', targetX: 14, targetY: 5, facing: 'down' as const },
    // Konbini door (building base at row 20, player walks from row 21)
    { x: 38, y: 20, targetMap: 'ch1_konbini', targetX: 5, targetY: 8, facing: 'up' as const },
    // Tanaka house door (building base at row 26, player walks from row 27)
    { x: 7, y: 26, targetMap: 'ch1_tanaka_house', targetX: 5, targetY: 8, facing: 'up' as const },
    // Test map (PixelLab) — east edge of north road
    { x: 66, y: 10, targetMap: 'test_pixellab', targetX: 0, targetY: 6, facing: 'right' as const },
    // Tiled train station — north edge of main N-S road
    { x: 34, y: 4, targetMap: 'tiled_train_station', targetX: 28, targetY: 38, facing: 'up' as const },
  ],
  decorations,
};
