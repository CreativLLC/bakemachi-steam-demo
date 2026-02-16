export type Direction = 'up' | 'down' | 'left' | 'right';

export interface MapTransition {
  /** Tile position of the door/exit */
  x: number;
  y: number;
  /** Map ID to transition to */
  targetMap: string;
  /** Spawn position in the target map */
  targetX: number;
  targetY: number;
  /** Player facing direction after transition */
  facing?: Direction;
}

export interface MapNPC {
  id: string;
  x: number;
  y: number;
  sprite: string;
  /** Initial facing direction for LPC NPCs (default: 'down') */
  facing?: 'up' | 'down' | 'left' | 'right';
  /** Patrol path for walking NPCs. Walks to each waypoint in sequence, pauses, then loops.
   *  Omit for static NPCs. */
  patrol?: {
    waypoints: Array<{ x: number; y: number; wait?: number }>;
    speed?: number;
  };
}

export interface MapDecoration {
  /** Phaser texture key (loaded in BootScene) */
  texture: string;
  /** Tile X of the decoration's center-bottom (where the door/base is) */
  x: number;
  /** Tile Y of the decoration's base */
  y: number;
  /** Display width in tiles */
  widthTiles: number;
  /** Display height in tiles */
  heightTiles: number;
  /** Flip the texture horizontally */
  flipX?: boolean;
}

export interface InteractionZone {
  /** Tile X of the zone top-left corner */
  x: number;
  /** Tile Y of the zone top-left corner */
  y: number;
  /** Zone width in tiles */
  width: number;
  /** Zone height in tiles */
  height: number;
  /** NPC dialogue ID to trigger when player interacts with any tile in the zone */
  npcId: string;
}

export interface GameMap {
  id: string;
  name: string;
  width: number;
  height: number;
  /** Ground tile layer: 0=grass, 1=path, 2=wall, 3=wood-floor, 4=tatami, 5=door */
  ground: number[][];
  /** Object layer rendered on top: 0=none, 2=wall, 6=counter, 7=shelf */
  objects: number[][];
  /** Collision layer: 0=walkable, 1=blocked */
  collision: number[][];
  npcs: MapNPC[];
  playerSpawn: { x: number; y: number };
  transitions: MapTransition[];
  decorations?: MapDecoration[];
  /** Pre-rendered ground image texture key (replaces tile-by-tile ground rendering) */
  groundImage?: string;
  /** Pre-rendered foreground image texture key (rendered above characters for overlap) */
  foregroundImage?: string;
  /** Native tile size of the ground image in pixels (default: 64). Used to scale composite maps (e.g., 32 for PixelLab exports). */
  groundImageTileSize?: number;
  /** Rectangular zones that trigger NPC dialogue on interaction */
  interactionZones?: InteractionZone[];
}

/** Ground tile ID to texture key mapping */
export const GROUND_TEXTURES: Record<number, string> = {
  // Placeholder tiles
  0: 'tile-grass',
  1: 'tile-path',
  2: 'tile-wall',
  3: 'tile-wood-floor',
  4: 'tile-tatami',
  5: 'tile-door',
  // Outdoor tilesets
  10: 'tile-sidewalk',
  11: 'tile-railroad-track',
  12: 'tile-fence-sidewalk',
  13: 'tile-railroad-track', // rotated 270° variant (south half of track)
  14: 'tile-sidewalk2',
  15: 'tile-sidewalk3',
  16: 'tile-sidewalk4',
  17: 'tile-blind-footpath',
  18: 'tile-asphalt',
  19: 'tile-grass1',
  20: 'tile-grass2',
  25: 'tile-fence2-sidewalk',
  26: 'tile-fence3-sidewalk',
  27: 'tile-curb1',
  28: 'tile-curb2',
  // Interior tilesets
  30: 'tile-marble-floor',
  31: 'tile-marble-floor2',
  32: 'tile-white-floor',
  33: 'tile-white-floor2',
  // New outdoor tilesets
  40: 'tile-grass-flowers1',
  41: 'tile-grass-flowers2',
  42: 'tile-footpath1',
  43: 'tile-footpath2',
  44: 'tile-footpath3',
  47: 'tile-bush1',
  48: 'tile-bush2',
  // Town tilesets
  50: 'tile-cobble1',
  51: 'tile-cobble2',
  52: 'tile-dirt1',
  53: 'tile-dirt2',
  54: 'tile-blind-curve',
  55: 'tile-street-line',
  // Real interior floors
  56: 'tile-wood-floor1',
  57: 'tile-wood-floor2',
  // Rotated curb tiles (180° — road ABOVE sidewalk)
  60: 'tile-curb1',
  61: 'tile-curb2',
  99: 'tile-black',
};

/** Ground tile rotation in degrees (applied after texture) */
export const GROUND_ROTATIONS: Record<number, number> = {
  11: 90,   // railroad track — south half (rotated 90°)
  13: 270,  // railroad track — north half (rotated 270°)
  60: 180,  // curb rotated 180° (road above sidewalk)
  61: 180,  // curb rotated 180° (road above sidewalk)
};

/** Object tile ID to texture key mapping */
export const OBJECT_TEXTURES: Record<number, string> = {
  2: 'tile-wall',
  6: 'tile-counter',
  7: 'tile-shelf',
};
