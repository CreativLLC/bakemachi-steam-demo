import Phaser from 'phaser';

const TILE_SIZE = 64;

/** Data-driven NPC sprite registry */
export const LPC_NPC_REGISTRY: { prefix: string; path: string; sheets: string[] }[] = [
  // Named characters
  { prefix: 'lpc-named-tanaka', path: 'assets/sprites/NPCs/named/tanaka', sheets: ['walk', 'sit', 'hurt'] },
  // Vendors
  { prefix: 'lpc-vendor-1', path: 'assets/sprites/NPCs/vendors/NPC1', sheets: ['walk'] },
  { prefix: 'lpc-vendor-2', path: 'assets/sprites/NPCs/vendors/NPC2', sheets: ['walk'] },
  { prefix: 'lpc-vendor-3', path: 'assets/sprites/NPCs/vendors/NPC3', sheets: ['walk'] },
  // Generic — cowlick cutscene NPC (needs walk + sit + hurt)
  { prefix: 'lpc-generic-4', path: 'assets/sprites/NPCs/generic/NPC4', sheets: ['walk', 'sit', 'hurt'] },
  // Generic — sitting background NPCs (sit sheet only)
  { prefix: 'lpc-generic-5', path: 'assets/sprites/NPCs/generic/NPC5', sheets: ['sit'] },
  { prefix: 'lpc-generic-6', path: 'assets/sprites/NPCs/generic/NPC6', sheets: ['sit'] },
  { prefix: 'lpc-generic-7', path: 'assets/sprites/NPCs/generic/NPC7', sheets: ['sit'] },
  { prefix: 'lpc-generic-8', path: 'assets/sprites/NPCs/generic/NPC8', sheets: ['sit'] },
  { prefix: 'lpc-generic-9', path: 'assets/sprites/NPCs/generic/NPC9', sheets: ['sit'] },
  { prefix: 'lpc-generic-10', path: 'assets/sprites/NPCs/generic/NPC10', sheets: ['sit'] },
  { prefix: 'lpc-generic-11', path: 'assets/sprites/NPCs/generic/NPC11', sheets: ['sit'] },
  { prefix: 'lpc-generic-12', path: 'assets/sprites/NPCs/generic/NPC12', sheets: ['sit'] },
  { prefix: 'lpc-generic-13', path: 'assets/sprites/NPCs/generic/NPC13', sheets: ['sit'] },
  { prefix: 'lpc-generic-14', path: 'assets/sprites/NPCs/generic/NPC14', sheets: ['sit'] },
  { prefix: 'lpc-generic-15', path: 'assets/sprites/NPCs/generic/NPC15', sheets: ['sit'] },
  // Generic — standing/patrol background NPCs (walk sheet only)
  { prefix: 'lpc-generic-16', path: 'assets/sprites/NPCs/generic/NPC16', sheets: ['walk'] },
  { prefix: 'lpc-generic-17', path: 'assets/sprites/NPCs/generic/NPC17', sheets: ['walk'] },
  { prefix: 'lpc-generic-18', path: 'assets/sprites/NPCs/generic/NPC18', sheets: ['walk'] },
  { prefix: 'lpc-generic-19', path: 'assets/sprites/NPCs/generic/NPC19', sheets: ['walk'] },
  { prefix: 'lpc-generic-20', path: 'assets/sprites/NPCs/generic/NPC20', sheets: ['walk'] },
  { prefix: 'lpc-generic-21', path: 'assets/sprites/NPCs/generic/NPC21', sheets: ['walk'] },
  { prefix: 'lpc-generic-22', path: 'assets/sprites/NPCs/generic/NPC22', sheets: ['walk'] },
  { prefix: 'lpc-generic-23', path: 'assets/sprites/NPCs/generic/NPC23', sheets: ['walk'] },
  { prefix: 'lpc-generic-24', path: 'assets/sprites/NPCs/generic/NPC24', sheets: ['walk'] },
  { prefix: 'lpc-generic-25', path: 'assets/sprites/NPCs/generic/NPC25', sheets: ['walk'] },
  { prefix: 'lpc-generic-26', path: 'assets/sprites/NPCs/generic/NPC26', sheets: ['walk'] },
  { prefix: 'lpc-generic-27', path: 'assets/sprites/NPCs/generic/NPC27', sheets: ['walk'] },
  { prefix: 'lpc-generic-28', path: 'assets/sprites/NPCs/generic/NPC28', sheets: ['walk'] },
  { prefix: 'lpc-generic-29', path: 'assets/sprites/NPCs/generic/NPC29', sheets: ['walk'] },
];

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    // -- Player character sprites (LPC spritesheet) --
    this.load.spritesheet('lpc-walk',
      'assets/sprites/new-main-character-lpc/standard/walk.png',
      { frameWidth: 64, frameHeight: 64 }
    );

    // -- LPC NPC spritesheets (data-driven from registry) --
    for (const npc of LPC_NPC_REGISTRY) {
      for (const sheet of npc.sheets) {
        this.load.spritesheet(`${npc.prefix}-${sheet}`,
          `${npc.path}/standard/${sheet}.png`,
          { frameWidth: 64, frameHeight: 64 }
        );
      }
    }

    // Enemy combat sprite (for transformation effects in overworld cutscenes)
    this.load.spritesheet('enemy-goblin2-combat',
      'assets/sprites/NPCs/enemies/goblin2/standard/combat.png',
      { frameWidth: 64, frameHeight: 64 }
    );

    // -- Composite map images --
    this.load.image('map-tiled-train-station', 'assets/maps/train-station.png');
    this.load.image('map-tiled-train-station-overlay', 'assets/maps/train-station-overlay.png');

    // -- Backgrounds --
    this.load.image('bg-title', 'assets/backgrounds/title-screen1.png');
    this.load.image('bg-train', 'assets/backgrounds/train-background2.png');

    // -- NPC placeholder --
    this.generateTexture('npc', 0xff6633);

    // -- Invisible interaction point (1x1 transparent) --
    const invGfx = this.add.graphics();
    invGfx.generateTexture('invisible', 1, 1);
    invGfx.destroy();

    // -- Fallback ground/object tiles (used by per-tile renderer when no groundImage) --
    this.generateTexture('tile-black', 0x000000);
    this.generateTexture('tile-grass', 0x4a8c3f);
    this.generateTexture('tile-path', 0xc4a882);
    this.generateTexture('tile-wall', 0x666666);
    this.generateTexture('tile-wood-floor', 0x8b6914);
    this.generateTexture('tile-tatami', 0x7a9a5a);
    this.generateTexture('tile-door', 0x5c3a1e);
    this.generateTexture('tile-counter', 0x4a4a4a);
    this.generateTexture('tile-shelf', 0x6b4226);

    this.generateDoorIndicator();
    this.generateQuestArrow();
    this.generateShadow();
  }

  create(): void {
    // Player walk animations (LPC 4-direction spritesheet)
    const LPC_COLS = 13;
    const LPC_ROW: Record<string, number> = { up: 0, left: 1, down: 2, right: 3 };
    for (const dir of ['up', 'left', 'down', 'right']) {
      const row = LPC_ROW[dir];
      this.anims.create({
        key: `player-walk-${dir}`,
        frames: Array.from({ length: 8 }, (_, i) => ({
          key: 'lpc-walk',
          frame: row * LPC_COLS + (i + 1), // cols 1-8
        })),
        frameRate: 10,
        repeat: -1,
      });
    }

    // LPC NPC idle + walk animations (built from registry)
    const LPC_NPC_PREFIXES = LPC_NPC_REGISTRY.filter(n => n.sheets.includes('walk')).map(n => n.prefix);
    for (const prefix of LPC_NPC_PREFIXES) {
      for (const dir of ['up', 'left', 'down', 'right']) {
        const row = LPC_ROW[dir];
        // Walk animation (cols 1-8 of walk sheet)
        this.anims.create({
          key: `${prefix}-walk-${dir}`,
          frames: Array.from({ length: 8 }, (_, i) => ({
            key: `${prefix}-walk`,
            frame: row * LPC_COLS + (i + 1),
          })),
          frameRate: 10,
          repeat: -1,
        });
        // Idle = standing frame from walk sheet (col 0)
        this.anims.create({
          key: `${prefix}-idle-${dir}`,
          frames: [{ key: `${prefix}-walk`, frame: row * LPC_COLS }],
          frameRate: 1,
          repeat: 0,
        });
      }
    }

    // LPC NPC sit animations (static pose — col 2 = chair-sit / bottom-right)
    const LPC_SIT_PREFIXES = LPC_NPC_REGISTRY.filter(n => n.sheets.includes('sit')).map(n => n.prefix);
    const SIT_COL = 2; // col 2 = chair-sit (bottom-right of sitting poses)
    for (const prefix of LPC_SIT_PREFIXES) {
      for (const dir of ['up', 'left', 'down', 'right']) {
        const row = LPC_ROW[dir];
        this.anims.create({
          key: `${prefix}-sit-${dir}`,
          frames: [{ key: `${prefix}-sit`, frame: row * LPC_COLS + SIT_COL }],
          frameRate: 1,
          repeat: 0,
        });
      }
    }

    // LPC NPC hurt animations (for cutscene effects)
    // Hurt spritesheets are a single row (832x64 = 13 cols x 1 row),
    // so all direction variants use row 0 frames.
    const LPC_HURT_PREFIXES = LPC_NPC_REGISTRY.filter(n => n.sheets.includes('hurt')).map(n => n.prefix);
    for (const prefix of LPC_HURT_PREFIXES) {
      for (const dir of ['up', 'left', 'down', 'right']) {
        this.anims.create({
          key: `${prefix}-hurt-${dir}`,
          frames: Array.from({ length: 6 }, (_, i) => ({
            key: `${prefix}-hurt`,
            frame: i,
          })),
          frameRate: 8,
          repeat: 0,
        });
      }
    }

    this.scene.start('TitleScene');
  }

  private generateTexture(key: string, color: number): void {
    const gfx = this.add.graphics();
    gfx.fillStyle(color);
    gfx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    gfx.generateTexture(key, TILE_SIZE, TILE_SIZE);
    gfx.destroy();
  }

  private generateDoorIndicator(): void {
    const gfx = this.add.graphics();
    const w = 24;
    const h = 16;
    gfx.fillStyle(0x44ff44, 0.9);
    gfx.fillTriangle(w / 2, h, 0, 0, w, 0);
    gfx.fillStyle(0xffffff, 0.4);
    gfx.fillTriangle(w / 2, h - 4, 4, 2, w - 4, 2);
    gfx.generateTexture('door-indicator', w, h);
    gfx.destroy();
  }

  private generateShadow(): void {
    const gfx = this.add.graphics();
    const w = 64;
    const h = 32;
    const cx = w / 2;
    const cy = h / 2;
    const steps = 8;
    for (let i = steps; i > 0; i--) {
      const ratio = i / steps;
      const alpha = 0.12 * (1 - ratio); // stronger toward center
      gfx.fillStyle(0x000000, alpha);
      gfx.fillEllipse(cx, cy, w * ratio, h * ratio);
    }
    gfx.generateTexture('char-shadow', w, h);
    gfx.destroy();
  }

  private generateQuestArrow(): void {
    const gfx = this.add.graphics();
    const w = 40;
    const h = 28;
    // Drop shadow
    gfx.fillStyle(0x000000, 0.3);
    gfx.fillTriangle(w / 2 + 2, h + 2, 2, 2, w + 2, 2);
    // White border
    gfx.fillStyle(0xffffff, 1);
    gfx.fillTriangle(w / 2, h + 3, -3, -3, w + 3, -3);
    // Green fill
    gfx.fillStyle(0x00ff66, 0.95);
    gfx.fillTriangle(w / 2, h, 2, 2, w - 2, 2);
    // Inner highlight
    gfx.fillStyle(0xffffff, 0.45);
    gfx.fillTriangle(w / 2, h - 6, 7, 5, w - 7, 5);
    gfx.generateTexture('quest-arrow', w + 5, h + 5);
    gfx.destroy();
  }
}
