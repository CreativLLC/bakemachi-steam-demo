# Train Station Map Design -- Bakemachi (化け町)

## Map Dimensions: 26 wide x 17 tall (1664 x 1088 pixels)

---

## Narrative Concept

The player awakens on the platform of a small-town JR station somewhere in rural Japan. Cherry blossoms drift from trees near the station exit. The shinkansen that brought them here hums along the tracks to the south. This is not Tokyo -- it is quieter, older, a place where stone lanterns sit beside vending machines selling drinks with alien mascots on them. A food stall selling roasted chestnuts sits to the west near the exit, its awning bright against the worn cobblestone. A small meditation garden with a buddha statue and hedges occupies a corner of the concourse. The fixer, Tanaka-san, descends from the north to greet the confused player, then leads them toward the exit.

---

## Zone Breakdown (Top to Bottom)

### ZONE A -- Station Building Wall (Row 0)
The back wall of the station building. A wide opening at columns 9-15 serves as the exit north to town. The exit is flanked by walls, with a cherry blossom tree visible just inside the eastern edge of the concourse and a food stall anchoring the western side.

### ZONE B -- Station Concourse (Rows 1-4)
An indoor-feeling area with marble and white floor tiles. This is NOT a boring empty rectangle. The layout is **asymmetric**:

- **West side (cols 1-7)**: The yakikuri food stall sits at (4, 2), its red-and-white awning visible from far away. A trash can nearby. Cobblestone path tiles lead from the platform up through the stall area toward the exit. A stone lantern sits at (2, 3) lending warmth.
- **Center (cols 8-16)**: Open marble concourse with the main walkway. The Tanaka NPC waits here after the cutscene (row 2). Two ticket gate machines sit at row 3, flanking the main path (decorative only, not blocking). A potted plant cluster sits at (15, 2).
- **East side (cols 17-24)**: A small **meditation garden nook** -- a buddha statue at (21, 1), flanked by bush tiles (collision=2), with grass-flowers ground tiles creating a peaceful resting spot. A bench faces the garden. This area rewards exploration.

### ZONE C -- Blind Footpath / Platform Transition (Row 5)
Yellow tactile warning strip runs across the full width of the platform area, transitioning from the concourse area above to the outdoor platform below. Walls continue on the far edges.

### ZONE D -- Main Platform (Rows 6-11)
The largest zone. The player spawns here (row 10). The platform uses varied sidewalk tiles (sidewalk1-4) in a non-repeating pattern. Objects are placed **asymmetrically**:

- **West cluster (cols 1-5)**: Two benches arranged in an L-shape (rows 7 and 8), a lamp post at (1, 8), vending-machine1 at (2, 7), and obj-trash at (4, 9). Creates a little waiting area.
- **Center-west (cols 6-10)**: More open space for the cutscene. The fixer walks down the center. A single vending-machine5 at (7, 7) and a bench at (9, 9) break up the space without cluttering. Player spawn at (12, 10) is slightly east-of-center.
- **Center-east (cols 11-17)**: The **quirky vending machine row** -- the rocket ship vending machine (vm6) at (13, 7), the maneki-neko vending machine (vm7) at (15, 7), and the snack machine (vm8) at (17, 7). These face south toward the player, creating a memorable visual. A lamp post at (11, 8).
- **East end (cols 18-24)**: A cherry blossom tree at (21, 7) with a stone lantern at (23, 8) beneath it. A bench at (20, 9). Grass-flowers tiles at the eastern edge. A second potted plant at (24, 9). This end of the platform feels like a transition to the outdoors.

### ZONE E -- Platform Edge (Row 12)
Yellow blind footpath strip -- the tactile warning at the platform edge. Full width.

### ZONE F -- Fence Barrier (Row 13)
Metal fence tiles (fence3) blocking access to the tracks. Full width, collision=1.

### ZONE G -- Railroad Tracks + Shinkansen (Rows 14-15)
Two rows of railroad track tiles. The shinkansen decoration stretches across, centered on the map.

### ZONE H -- Grass Border (Row 16)
Mixed grass1/grass2 with scattered grass-flowers tiles on the eastern end. Blocked (impassable, just visual border).

---

## ASCII Ground Tile Grid

Legend for 2-character abbreviations:
```
WW = wall (2)              M1 = marble1 (30)         M2 = marble2 (31)
W1 = white1 (32)           W2 = white2 (33)          S1 = sidewalk1 (10)
S2 = sidewalk2 (14)        S3 = sidewalk3 (15)       S4 = sidewalk4 (16)
BF = blind-footpath (17)   RR = railroad (11)         F3 = fence3 (26)
G1 = grass1 (19)           G2 = grass2 (20)          GF = grass-flowers1 (40)
GG = grass-flowers2 (41)   CB = cobblestone1 (42)    C2 = cobblestone2 (43)
C3 = cobblestone3 (44)     C4 = cobblestone4 (45)    C5 = cobble5 (46)
BU = bush1 (47)            B2 = bush2 (48)           DF = dirt-footpath1 (49)
D2 = dirt-footpath2 (50)   WF = wood-floor1 (51)     W3 = wood-floor2 (52)
SL = street-line (53)      BC = blind-curve (54)
```

### Row-by-row ground tile layout (26 columns x 17 rows)

```
Col:  00 01 02 03 04 05 06 07 08 09 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25

R00:  WW WW WW WW WW WW WW WW WW M1 M2 M1 M2 M1 M2 M1 WW WW WW WW WW WW WW WW WW WW
R01:  WW CB C2 CB CB CB CB C2 M2 M1 M2 M1 M2 M1 W1 W2 M1 W1 W2 GF BU GF BU GF GF WW
R02:  WW C3 CB C4 CB C3 CB CB M1 M2 M1 M2 W1 M1 M2 W2 M2 M1 W2 GF GF BU GF GF BU WW
R03:  WW CB C2 CB CB C4 CB C2 M2 M1 M2 M1 M2 M1 W2 W1 M1 W1 W1 GF BU GF BU GF GF WW
R04:  WW CB CB C3 CB CB CB CB M1 M2 M1 M2 M1 M2 M1 M2 M2 W2 W1 GF GF GF GF GF GF WW
R05:  WW BF BF BF BF BF BF BF BF BF BF BF BF BF BF BF BF BF BF BF BF BF BF BF BF WW
R06:  S1 S2 S3 S1 S2 S1 S3 S1 S2 S1 S4 S1 S2 S1 S3 S1 S2 S1 S4 S1 S2 S3 S1 S2 S1 S4
R07:  S2 S1 S4 S1 S2 S3 S1 S2 S1 S3 S1 S2 S1 S4 S1 S2 S3 S1 S2 S3 S1 S4 S1 S3 S2 S1
R08:  S1 S3 S1 S2 S1 S1 S2 S1 S3 S1 S2 S4 S1 S2 S1 S3 S1 S2 S1 S1 S4 S1 S2 S1 S3 S2
R09:  S4 S1 S2 S1 S3 S2 S1 S4 S1 S2 S1 S3 S2 S1 S4 S1 S2 S1 S3 S2 S1 S2 S1 S4 S1 S3
R10:  S1 S2 S1 S4 S1 S3 S2 S1 S2 S1 S4 S1 S3 S1 S2 S4 S1 S3 S1 S2 S1 S3 S1 S2 S4 S1
R11:  S3 S1 S2 S1 S2 S1 S4 S2 S1 S3 S1 S2 S1 S2 S1 S3 S4 S1 S2 S4 S1 S2 S3 S1 S1 S4
R12:  BF BF BF BF BF BF BF BF BF BF BF BF BF BF BF BF BF BF BF BF BF BF BF BF BF BF
R13:  F3 F3 F3 F3 F3 F3 F3 F3 F3 F3 F3 F3 F3 F3 F3 F3 F3 F3 F3 F3 F3 F3 F3 F3 F3 F3
R14:  RR RR RR RR RR RR RR RR RR RR RR RR RR RR RR RR RR RR RR RR RR RR RR RR RR RR
R15:  RR RR RR RR RR RR RR RR RR RR RR RR RR RR RR RR RR RR RR RR RR RR RR RR RR RR
R16:  G1 G2 G1 G1 G2 G1 G2 G1 G1 G2 G1 G2 G1 G1 G2 G1 G2 G1 G1 GF G2 GF G1 GF G2 G1
```

---

## New Ground Tile IDs (to add to GROUND_TEXTURES)

| ID | Key | File | Description |
|----|-----|------|-------------|
| 40 | tile-grass-flowers1 | grass-flowers1.png | Grass with wildflowers |
| 41 | tile-grass-flowers2 | gass-flowers2.png | Grass with wildflowers variant (note: typo in filename) |
| 42 | tile-cobble1 | cobble-footpath1.png | Cobblestone path 1 |
| 43 | tile-cobble2 | cobble-footpath2.png | Cobblestone path 2 |
| 44 | tile-cobble3 | cobble-footpath3.png | Cobblestone path 3 |
| 45 | tile-cobble4 | cobble-footpath4.png | Cobblestone path 4 |
| 46 | tile-cobble5 | cooble-foothpath5.png | Cobblestone rounded (note: typo in filename) |
| 47 | tile-bush1 | bush1.png | Green hedge bush |
| 48 | tile-bush2 | bush2.png | Green hedge variant |
| 49 | tile-dirt1 | dirt-foothpath1.png | Dirt path (note: typo in filename) |
| 50 | tile-dirt2 | dirt-footpath2.png | Dirt path variant |
| 51 | tile-wood-floor1 | wood-floor1.png | Wood planks 1 |
| 52 | tile-wood-floor2 | wood-floor2.png | Wood planks 2 |
| 53 | tile-street-line | street-line1.png | Asphalt with white stripe |
| 54 | tile-blind-curve | blind-footpath-curve1.png | Curved blind footpath |

---

## New Objects/Buildings to Load in BootScene

| Texture Key | File Path | Description |
|-------------|-----------|-------------|
| obj-vending-machine6 | assets/sprites/objects/vending-machine6.png | Rocket ship vending machine |
| obj-vending-machine7 | assets/sprites/objects/vending-machine7.png | Maneki-neko vending machine |
| obj-vending-machine8 | assets/sprites/objects/vending-machine8.png | Snacks vending machine |
| building-food-stall | assets/sprites/buildings/food-stall1.png | Yakikuri food stall |
| obj-ticket-checker | assets/sprites/objects/train-ticket-checker1.png | Ticket gate (front) |
| obj-ticket-checker-open | assets/sprites/objects/train-ticket-checker-side-open.png | Ticket gate (side, open) |
| obj-ticket-checker-closed | assets/sprites/objects/train-ticket-checker-side-closed.png | Ticket gate (side, closed) |

---

## Objects Layer (26x17)

The objects layer is used for wall-like blockers rendered on the tile grid. Most decorations use the `decorations` array instead.

```
Col:  00 01 02 03 04 05 06 07 08 09 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25

R00:  02 02 02 02 02 02 02 02 02 00 00 00 00 00 00 00 02 02 02 02 02 02 02 02 02 02
R01:  02 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 02
R02:  02 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 02
R03:  02 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 02
R04:  02 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 02
R05:  02 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 02
R06:  00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00
R07:  00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00
R08:  00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00
R09:  00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00
R10:  00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00
R11:  00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00
R12:  00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00
R13:  00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00
R14:  00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00
R15:  00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00
R16:  00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00
```

---

## Collision Grid (26x17)

```
0 = walkable    1 = blocked    2 = soft (overlap OK, no vertical pass-through)

Col:  00 01 02 03 04 05 06 07 08 09 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25

R00:  1  1  1  1  1  1  1  1  1  1  1  1  1  1  1  1  1  1  1  1  1  1  1  1  1  1
R01:  1  0  0  0  2  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  2  0  2  0  0  1
R02:  1  0  0  0  0  0  0  0  0  0  0  0  0  0  0  2  0  0  0  0  0  2  0  0  2  1
R03:  1  2  0  0  0  0  0  0  0  0  2  0  2  0  0  0  0  0  0  0  2  0  2  0  0  1
R04:  1  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  1
R05:  1  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  1
R06:  0  0  0  2  0  0  0  2  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0
R07:  0  2  0  0  0  0  2  0  0  0  0  2  0  2  0  2  0  2  0  0  0  2  0  2  0  0
R08:  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  2  0  0  0  0  0
R09:  0  0  0  0  2  0  0  0  0  2  0  0  0  0  0  0  0  0  0  0  2  0  0  2  0  0
R10:  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0
R11:  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0
R12:  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0
R13:  1  1  1  1  1  1  1  1  1  1  1  1  1  1  1  1  1  1  1  1  1  1  1  1  1  1
R14:  1  1  1  1  1  1  1  1  1  1  1  1  1  1  1  1  1  1  1  1  1  1  1  1  1  1
R15:  1  1  1  1  1  1  1  1  1  1  1  1  1  1  1  1  1  1  1  1  1  1  1  1  1  1
R16:  1  1  1  1  1  1  1  1  1  1  1  1  1  1  1  1  1  1  1  1  1  1  1  1  1  1
```

### Collision Notes
- **Row 0**: Entire wall is blocked. Transition tiles at cols 9-15 are checked BEFORE collision.
- **Rows 1-4 edges (col 0, col 25)**: Walls are blocked.
- **Row 1 col 4**: Food stall collision (soft=2).
- **Rows 1-3 cols 20-24**: Meditation garden -- bushes are soft collision (2), buddha is soft (2). Player can walk among the bushes but cannot pass through them vertically.
- **Row 3 cols 10, 12**: Ticket checker decorations (soft=2).
- **Row 6 cols 3, 7**: Benches on west side (soft=2).
- **Row 7**: Vending machines and cherry blossom tree bases are soft collision (2). Positions: (1) lamp, (6) vm5, (11) lamp, (13) vm6, (15) vm7, (17) vm8, (21) tree3, (23) stone lantern.
- **Row 8 col 20**: Bench (soft=2).
- **Row 9**: Benches and decorations -- (4) trash, (9) bench, (20) bench, (23) stone lantern.
- **Rows 13-16**: Fence, tracks, and grass are all hard blocked (1).

---

## Decoration Placement List

These are sprite-based decorations rendered on top of the ground tiles, using the `decorations` array in the GameMap.

### Zone B -- Concourse Decorations

| # | texture | x | y | widthTiles | heightTiles | Notes |
|---|---------|---|---|------------|-------------|-------|
| 1 | building-food-stall | 4 | 2 | 3 | 2.5 | Yakikuri stall, west concourse. Red/white awning, warm light. |
| 2 | obj-stone-lantern | 2 | 3 | 0.7 | 1.2 | Stone lantern near food stall, warm glow |
| 3 | obj-trash | 6 | 3 | 0.6 | 0.7 | Trash can near food stall |
| 4 | obj-ticket-checker | 10 | 3 | 0.8 | 1.2 | Ticket gate left (decorative) |
| 5 | obj-ticket-checker | 12 | 3 | 0.8 | 1.2 | Ticket gate right (decorative) |
| 6 | obj-plants | 15 | 2 | 1.2 | 1.2 | Potted plants, center-east concourse |
| 7 | obj-buddha1 | 21 | 1 | 0.8 | 1.0 | Buddha statue in meditation garden |
| 8 | obj-bench | 18 | 3 | 1.2 | 0.8 | Bench facing the meditation garden |

### Zone D -- Platform Decorations

| # | texture | x | y | widthTiles | heightTiles | Notes |
|---|---------|---|---|------------|-------------|-------|
| 9 | obj-bench | 3 | 6 | 1.2 | 0.8 | West waiting area bench (north-facing) |
| 10 | obj-vending-machine1 | 7 | 6 | 1 | 1.5 | Standard blue drinks machine, west side |
| 11 | obj-lamp-post | 1 | 7 | 0.6 | 2.0 | Lamp post, far west platform |
| 12 | obj-vending-machine5 | 6 | 7 | 1 | 1.5 | Standard vending machine, center-west |
| 13 | obj-lamp-post | 11 | 7 | 0.6 | 2.0 | Lamp post, center platform |
| 14 | obj-vending-machine6 | 13 | 7 | 1 | 1.5 | ROCKET SHIP vending machine! |
| 15 | obj-vending-machine7 | 15 | 7 | 1 | 1.5 | MANEKI-NEKO vending machine! |
| 16 | obj-vending-machine8 | 17 | 7 | 1 | 1.5 | SNACKS vending machine (burger on top) |
| 17 | obj-tree3 | 21 | 7 | 2 | 3.0 | CHERRY BLOSSOM tree! Pink petals falling. Landmark. |
| 18 | obj-stone-lantern | 23 | 7 | 0.7 | 1.2 | Stone lantern under cherry blossoms |
| 19 | obj-bench | 20 | 8 | 1.2 | 0.8 | Bench under cherry blossom tree |
| 20 | obj-trash | 4 | 9 | 0.6 | 0.7 | Trash can, west side |
| 21 | obj-bench | 9 | 9 | 1.2 | 0.8 | Bench, center platform |
| 22 | obj-bench | 20 | 9 | 1.2 | 0.8 | Bench, east platform near tree |
| 23 | obj-stone-lantern | 23 | 9 | 0.7 | 1.2 | Second stone lantern, east end |
| 24 | obj-plants | 24 | 9 | 1.2 | 1.2 | Potted plant, far east |

### Zone G -- Shinkansen

| # | texture | x | y | widthTiles | heightTiles | Notes |
|---|---------|---|---|------------|-------------|-------|
| 25 | obj-shinkansen | 13 | 15 | 14 | 2 | Bullet train stretching across the tracks |

---

## Decoration Summary Visual

```
CONCOURSE (Rows 1-4):

  [stone    ] [food stall ~~~~] [trash]        [ticket] . [ticket]  [plants]     [bench] .  [buddha]
  [lantern  ] [       awning  ] [     ]        [gate  ] . [gate  ]  [      ]     [     ] .  [bush bush]
                                                                                             [bush bush]
  <- cobblestone path ->          <- marble concourse ->              <- marble ->   <- meditation garden ->


PLATFORM (Rows 6-11):

  .  [bench]  .  .  [vm1]  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .
  [lamp] .  .  .  .  [vm5]  .  .  .  .  [lamp] .  [vm6] .  [vm7] .  [vm8] .  .  . [CHERRY] .  [lantern]
  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  [bench] [TREE ] .  .  .  .  .
  .  .  .  [trash] .  .  .  .  [bench]  .  .  .  .  .  .  .  .  .  .  [bench] .  .  [lantern] [plants]
  .  .  .  .  .  .  .  .  .  .  .  .  PLAYER .  .  .  .  .  .  .  .  .  .  .  .  .
  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .
```

---

## NPC Placement

| NPC | ID | Start X | Start Y | Sprite | Notes |
|-----|-----|---------|---------|--------|-------|
| Tanaka-san (Fixer) | okaasan_welcome | 12 | 6 | fixer-idle-south | Starts on platform row 6. Cutscene: walks south to row 9 (one tile north of player at row 10), has dialogue, then walks north to row 2 in concourse and waits. |

### Cutscene Walk Path (updated for new layout)
1. Fixer starts at (12, 6) facing south
2. Walks south to (12, 9) -- one tile north of player spawn
3. Faces south, dialogue triggers
4. After dialogue, walks north to (12, 2) -- in the concourse near the exit
5. Faces south, waits for player (dialogue changes to okaasan_waiting)

---

## Player Spawn

**Position: (12, 10)**

The player spawns slightly east-of-center on the main platform. This positions them:
- With the fixer visible walking toward them from the north
- Facing the interesting vending machine row and cherry blossom tree to the east
- The food stall and concourse exit visible to the north
- The shinkansen visible behind the fence to the south

---

## Transition Tiles (Station Exit)

The exit opening is at row 0, columns 9-15 (7 tiles wide, more generous than the old 4-tile opening).

| x | y | targetMap | targetX | targetY | facing |
|---|---|-----------|---------|---------|--------|
| 9 | 0 | ch1_town | 13 | 22 | up |
| 10 | 0 | ch1_town | 13 | 22 | up |
| 11 | 0 | ch1_town | 14 | 22 | up |
| 12 | 0 | ch1_town | 14 | 22 | up |
| 13 | 0 | ch1_town | 15 | 22 | up |
| 14 | 0 | ch1_town | 15 | 22 | up |
| 15 | 0 | ch1_town | 16 | 22 | up |

---

## Points of Interest Summary

### 1. The Yakikuri Food Stall (West Concourse)
**"Is that... roasted chestnuts?"**
A street food stall with a red-and-white striped awning sits in the western part of the concourse. A stone lantern glows warmly beside it. The cobblestone ground evokes a traditional shopping street squeezed into a modern station. Players who explore here first are rewarded with an interesting visual and the hint that this town mixes old and new.

### 2. The Meditation Garden (East Concourse)
**"A buddha statue... in a train station?"**
Tucked into the northeast corner of the concourse, a small garden with a seated buddha, bush hedges, and wildflower ground tiles. A bench faces the garden. This quiet corner hints at the spiritual/supernatural themes the game will explore. The bushes use soft collision -- the player can walk among them but cannot clip through vertically.

### 3. The Quirky Vending Machine Row (Center-East Platform)
**"That vending machine is shaped like a rocket ship."**
Three unusual vending machines stand in a row on the platform: a rocket ship (blue/red, alien mascot), a maneki-neko (lucky cat, gold), and a snack machine (with a burger on top). This is memorable, funny, and very Japanese -- real novelty vending machines exist at many rural stations.

### 4. The Cherry Blossom Corner (East Platform)
**"Pink petals drift across the platform..."**
A cherry blossom tree stands at the east end of the platform, its pink canopy spreading over a stone lantern and a bench. This signals springtime and beauty -- and foreshadows the supernatural: cherry blossoms are associated with transience and the spirit world in Japanese culture.

### 5. The Shinkansen
**"The bullet train stretches along the tracks, humming quietly."**
The shinkansen fills the southern horizon, a reminder of the long journey that brought the player here. It is pure set dressing -- untouchable behind the fence -- but grounds the scene in modern Japan.

### 6. The Ticket Gates (Center Concourse)
**"Automatic ticket checkers, though nobody seems to be checking."**
Two decorative ticket gate machines sit in the concourse, flanking the main path. They are soft collision (walkable around, not through vertically). They add a sense of realism to the station layout without actually blocking the player.

---

## Implementation Checklist

### BootScene changes needed:
1. Load new ground tile images (cobblestones, bushes, grass-flowers, dirt, wood-floor, street-line, blind-curve)
2. Load new object sprites (vending-machine6, vending-machine7, vending-machine8)
3. Load new building sprite (food-stall1)
4. Load ticket checker sprites (3 variants)

### types.ts changes needed:
1. Add new entries to GROUND_TEXTURES map (IDs 40-54)

### trainStation.ts changes needed:
1. Replace entire map definition with new 26x17 layout
2. Update NPC positions for cutscene compatibility
3. Update player spawn to (12, 10)
4. Update transition tiles to new exit columns (9-15)
5. Update all decorations

### OverworldScene.ts cutscene changes needed:
1. Update fixer walk target from row 7 to row 9 (one north of player at row 10)
2. Update fixer waiting position from row 2 to row 2 (same, but different x: 12 instead of 10)
3. The walkNPC method already handles straight-line movement, so horizontal + vertical pathing should work

---

## Design Rationale

**Why asymmetric?** Real Japanese stations are not symmetric. Equipment accumulates on one side. A food stall appears where foot traffic is highest. A garden fills an odd corner that nothing else would fit in. The asymmetry makes the space feel lived-in and real.

**Why 26x17?** This gives 442 total tiles vs. the old 280 (58% more space). The extra width (26 vs 20) lets the platform breathe and creates room for distinct east/west personalities. The extra height (17 vs 14) gives the concourse more depth and adds proper separation between zones.

**Why the meditation garden?** This game is about the supernatural hiding in plain sight. A buddha statue in a train station whispers that something deeper is going on. Players who notice it are being primed for the world's themes.

**Why quirky vending machines?** This is the player's FIRST impression of the game world. Novelty vending machines are one of the most recognizable and beloved aspects of Japanese culture to outsiders. Placing them front and center says: "This game knows Japan. This game has personality. You are going to have fun here."

**Why cobblestone in a station?** Many small-town Japanese stations mix traditional and modern materials. The cobblestone around the food stall creates a micro-zone that feels like a different era -- like a piece of a shotengai (shopping street) was folded into the station.
