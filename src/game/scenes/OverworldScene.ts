import Phaser from 'phaser';
import { useUIStore } from '../../store/uiStore';
import { useGameStore } from '../../store/gameStore';
import { useCombatStore } from '../../store/combatStore';
import { COMBAT_ENEMIES, MAP_ENCOUNTERS } from '../../data/combatConfig';
import type { EncounterConfig } from '../../data/combatConfig';
import { NPC_DIALOGUE, RANDOM_ENCOUNTER_PRE_COMBAT, RANDOM_ENCOUNTER_POST_COMBAT } from '../../data/npcDialogue';
import type { DialogueNode } from '../../japanese/types';
import type { CombatEnemy } from '../../store/combatStore';
import { getMap, getStartingMap } from '../maps/mapRegistry';
import { GROUND_TEXTURES, GROUND_ROTATIONS, OBJECT_TEXTURES } from '../maps/types';
import { inputBus } from '../inputBus';
import type { GameMap, MapTransition, InteractionZone } from '../maps/types';

const TILE_SIZE = 64;
const MOVE_DURATION = 150;
const FADE_DURATION = 300;
const PLAYER_W = 128;
const PLAYER_H = 128;
const NPC_W = 96;
const NPC_H = 96;


const LPC_COLS = 13;
const LPC_ROW: Record<string, number> = { up: 0, left: 1, down: 2, right: 3 };

/** Map 8-direction movement to 4-direction LPC sprite name */
function lpcDirection(dx: number, dy: number): string {
  if (dx > 0) return 'right';
  if (dx < 0) return 'left';
  if (dy < 0) return 'up';
  return 'down';
}

export class OverworldScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<string, Phaser.Input.Keyboard.Key>;
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private keyI!: Phaser.Input.Keyboard.Key;
  private keyV!: Phaser.Input.Keyboard.Key;
  private keyEsc!: Phaser.Input.Keyboard.Key;
  private isMoving = false;
  private isTransitioning = false;
  private isCutsceneActive = false;
  private facingDirection = { dx: 0, dy: 1 };
  private npcSprites: Phaser.GameObjects.Sprite[] = [];
  private doorIndicators: Phaser.GameObjects.Sprite[] = [];
  private questArrows: Phaser.GameObjects.Sprite[] = [];
  private shadowSprites: Phaser.GameObjects.Sprite[] = [];
  private tileSprites: Phaser.GameObjects.GameObject[] = [];
  private currentMap!: GameMap;
  private lastLoggedTile = { x: -1, y: -1 };
  private gamepadPrevButtons: boolean[] = new Array(20).fill(false);
  private stickNavPrev = { x: 0, y: 0 }; // -1, 0, or 1 for each axis
  private readonly STICK_DEADZONE = 0.4;
  private encounterSteps = 0;
  private encounterThreshold = 0;
  private encounterCooldown = 0;
  private encounterNpcSprite: Phaser.GameObjects.Sprite | null = null;
  private encounterNpcPrefix = '';
  private isEncounterSequenceActive = false;
  private wasDialogueActive = false;

  constructor() {
    super({ key: 'OverworldScene' });
  }

  create(): void {
    useGameStore.getState().setCurrentScene('Overworld');
    const startMap = getStartingMap();
    const needsCutscene =
      startMap.id === 'tiled_train_station' &&
      useGameStore.getState().questStates.stationArrivalPlayed !== 'true';

    // If cutscene, start with black screen
    if (needsCutscene) {
      this.cameras.main.setAlpha(0);
    }

    this.buildMap(startMap, startMap.playerSpawn.x, startMap.playerSpawn.y);

    // Input
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.wasd = {
        up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      };
      this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
      this.keyI = this.input.keyboard.addKey('I');
      this.keyV = this.input.keyboard.addKey('V');
      this.keyEsc = this.input.keyboard.addKey('ESC');
    }

    if (this.input.gamepad) {
      this.input.gamepad.on('connected', () => {
        useUIStore.getState().setInputMode('gamepad');
      });
      this.input.gamepad.on('disconnected', () => {
        useUIStore.getState().setInputMode('keyboard');
      });
    }

    if (needsCutscene) {
      this.playStationArrivalCutscene();
    }

    // Keep camera sized to viewport when window resizes (RESIZE scale mode)
    const onResize = (gameSize: Phaser.Structs.Size) => {
      if (!this.cameras?.main) return;
      this.cameras.main.setSize(gameSize.width, gameSize.height);
      // Re-apply camera bounds so edge scrolling works at any viewport size
      this.cameras.main.setBounds(
        0, 0,
        this.currentMap.width * TILE_SIZE,
        this.currentMap.height * TILE_SIZE,
      );
    };
    this.scale.on('resize', onResize);
    this.events.once('shutdown', () => this.scale.off('resize', onResize));
  }

  // ---------------------------------------------------------------------------
  // Station arrival cutscene
  // ---------------------------------------------------------------------------

  private async playStationArrivalCutscene(): Promise<void> {
    this.isCutsceneActive = true;
    this.isMoving = true;

    const fixerSprite = this.npcSprites.find(
      (s) => s.getData('npcId') === 'okaasan_welcome'
    );
    if (!fixerSprite) {
      this.isCutsceneActive = false;
      this.isMoving = false;
      return;
    }

    // Fade in from black
    this.cameras.main.setAlpha(1);
    this.cameras.main.fadeIn(1000, 0, 0, 0);
    await this.waitForEvent(this.cameras.main, 'camerafadeincomplete');

    // Chapter title card
    useUIStore.getState().showChapterTitle('Chapter 1', 'Bakemachi Station');
    await this.delay(3200); // Wait for title to fade in, hold, and fade out

    // Short pause
    await this.delay(400);

    // Fixer walks west from (23, 20) to player at (9, 20)
    await this.walkNPC(fixerSprite, 'lpc-named-tanaka', 10, 20);

    // Face player (left, since player is at 9 and fixer stopped at 10)
    fixerSprite.play('lpc-named-tanaka-idle-left');
    fixerSprite.setDisplaySize(PLAYER_W, PLAYER_H);

    // Short pause before dialogue
    await this.delay(200);

    // Trigger dialogue
    useUIStore.getState().startDialogue(NPC_DIALOGUE.okaasan_welcome);

    // Wait for dialogue to fully close (including choice branches)
    await this.waitForDialogueEnd();

    // Internal monologue: player is hungry/thirsty
    useUIStore.getState().startDialogue(NPC_DIALOGUE.player_hungry);
    await this.waitForDialogueEnd();

    // Fixer tells player to get food and drink
    useUIStore.getState().startDialogue(NPC_DIALOGUE.fixer_food_prompt);
    await this.waitForDialogueEnd();

    // Release player control immediately after dialogue
    useGameStore.getState().setQuestState('stationArrivalPlayed', 'true');
    this.isCutsceneActive = false;
    this.isMoving = false;
    this.refreshQuestArrows();

    // Fixer walks to (42, 6) in the background — player can move freely
    fixerSprite.setData('npcId', 'fixer_food_reminder');
    this.walkNPC(fixerSprite, 'lpc-named-tanaka', 42, 20).then(() =>
      this.walkNPC(fixerSprite, 'lpc-named-tanaka', 42, 6).then(() => {
        fixerSprite.play('lpc-named-tanaka-idle-down');
        fixerSprite.setDisplaySize(PLAYER_W, PLAYER_H);
      })
    );
  }

  /** Walk an NPC sprite to a target tile in a straight line.
   *  prefix: LPC 4-direction prefix (e.g. 'lpc-named-tanaka') */
  private async walkNPC(
    sprite: Phaser.GameObjects.Sprite,
    prefix: string,
    targetTileX: number,
    targetTileY: number
  ): Promise<void> {
    const startTileX = Math.round(sprite.x / TILE_SIZE - 0.5);
    const startTileY = Math.round(sprite.y / TILE_SIZE - 0.5);
    const dx = Math.sign(targetTileX - startTileX);
    const dy = Math.sign(targetTileY - startTileY);
    const isLpc = prefix.startsWith('lpc-');
    const npcSize = isLpc ? PLAYER_W : NPC_W;

    // Walk horizontally first, then vertically
    if (dx !== 0 && startTileX !== targetTileX) {
      const dir = isLpc ? (dx > 0 ? 'right' : 'left') : (dx > 0 ? 'east' : 'west');
      sprite.play(`${prefix}-walk-${dir}`);
      sprite.setDisplaySize(npcSize, npcSize);
      await this.tweenPromise({
        targets: sprite,
        x: targetTileX * TILE_SIZE + TILE_SIZE / 2,
        duration: Math.abs(targetTileX - startTileX) * MOVE_DURATION * 2,
        ease: 'Linear',
      });
    }

    if (dy !== 0 && startTileY !== targetTileY) {
      const dir = isLpc ? (dy > 0 ? 'down' : 'up') : (dy > 0 ? 'south' : 'north');
      sprite.play(`${prefix}-walk-${dir}`);
      sprite.setDisplaySize(npcSize, npcSize);
      const currentTileY = Math.round(sprite.y / TILE_SIZE - 0.5);
      await this.tweenPromise({
        targets: sprite,
        y: targetTileY * TILE_SIZE + TILE_SIZE / 2,
        duration: Math.abs(targetTileY - currentTileY) * MOVE_DURATION * 2,
        ease: 'Linear',
      });
    }

    sprite.stop();
  }

  /** Promise wrapper for a Phaser tween */
  private tweenPromise(
    config: Phaser.Types.Tweens.TweenBuilderConfig
  ): Promise<void> {
    return new Promise((resolve) => {
      this.tweens.add({ ...config, onComplete: () => resolve() });
    });
  }

  /** Promise wrapper for a time delay */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => {
      this.time.delayedCall(ms, resolve);
    });
  }

  /** Promise wrapper for a Phaser event */
  private waitForEvent(
    emitter: Phaser.Events.EventEmitter,
    event: string
  ): Promise<void> {
    return new Promise((resolve) => {
      emitter.once(event, () => resolve());
    });
  }

  /** Wait for dialogue to close (handles branching via choices) */
  private waitForDialogueEnd(): Promise<void> {
    return new Promise((resolve) => {
      // Poll until dialogue is no longer active
      // (choices open new dialogues, so we wait until fully done)
      const check = () => {
        if (!useUIStore.getState().isDialogueActive) {
          resolve();
        } else {
          this.time.delayedCall(100, check);
        }
      };
      // Start checking after a small delay so the dialogue has time to open
      this.time.delayedCall(200, check);
    });
  }

  // ---------------------------------------------------------------------------
  // NPC patrol system
  // ---------------------------------------------------------------------------

  /** Run a continuous patrol loop for a background NPC.
   *  The NPC walks to each waypoint in sequence, pauses, then loops. */
  private async startNPCPatrol(
    npc: Phaser.GameObjects.Sprite,
    prefix: string,
    patrol: { waypoints: Array<{ x: number; y: number; wait?: number }>; speed?: number }
  ): Promise<void> {
    // Small random delay so NPCs don't all start moving at the exact same time
    await this.delay(Math.random() * 2000);

    while (npc.active) {
      for (const wp of patrol.waypoints) {
        if (!npc.active) return;

        // Determine walking direction for animation
        const startX = Math.round(npc.x / TILE_SIZE - 0.5);
        const startY = Math.round(npc.y / TILE_SIZE - 0.5);

        // Walk to waypoint
        await this.walkNPC(npc, prefix, wp.x, wp.y);
        if (!npc.active) return;

        // Update depth for correct Y-sorting
        npc.setDepth(npc.y + TILE_SIZE / 2 - 1);

        // Determine facing after walking
        const dx = wp.x - startX;
        const dy = wp.y - startY;
        let facing: string;
        if (Math.abs(dy) > 0) {
          facing = dy > 0 ? 'down' : 'up';
        } else {
          facing = dx > 0 ? 'right' : 'left';
        }

        // Show idle animation
        npc.play(`${prefix}-idle-${facing}`);
        npc.setDisplaySize(PLAYER_W, PLAYER_H);

        // Wait at waypoint (default 2000ms + random variance)
        const waitTime = wp.wait ?? (2000 + Math.random() * 1500);
        await this.delay(waitTime);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Cowlick encounter cutscene
  // ---------------------------------------------------------------------------

  private async playCowlickEncounterCutscene(): Promise<void> {
    this.isCutsceneActive = true;
    this.isMoving = true;

    // Wait for the "let's go home" dialogue to finish first
    await this.waitForDialogueEnd();

    // Short pause before the action
    await this.delay(500);

    // Find fixer/Tanaka sprite and walk him UP through the stairs to leave
    const fixerSprite = this.npcSprites.find(
      (s) => s.getData('npcId') === 'fixer_food_reminder' || s.getData('npcId') === 'okaasan_welcome'
    );
    if (fixerSprite) {
      // Tanaka walks to stairs (42, 2) and exits (non-blocking, runs in parallel)
      this.walkNPC(fixerSprite, 'lpc-named-tanaka', 42, 2).then(() => {
        fixerSprite.setVisible(false);
        const idx = this.npcSprites.indexOf(fixerSprite);
        if (idx >= 0) this.npcSprites.splice(idx, 1);
        fixerSprite.destroy();
      });
    }

    // 1. Spawn cowlick NPC at stairs (tiles 42-43, row 3 — just south of stairs exit)
    const spawnX = 42;
    const spawnY = 3;
    const cowlickPrefix = 'lpc-generic-4';
    const cowlickSprite = this.add.sprite(
      spawnX * TILE_SIZE + TILE_SIZE / 2,
      spawnY * TILE_SIZE + TILE_SIZE / 2,
      `${cowlickPrefix}-walk`,
      LPC_ROW['down'] * LPC_COLS
    );
    cowlickSprite.setDisplaySize(PLAYER_W, PLAYER_H);
    cowlickSprite.setOrigin(0.5, 0.8);
    cowlickSprite.setDepth(cowlickSprite.y + TILE_SIZE / 2 - 1);
    this.npcSprites.push(cowlickSprite);
    this.addCharShadow(cowlickSprite);

    // 2. Walk cowlick DIRECTLY in front of the player (one tile above)
    const playerTileX = Math.floor(this.player.x / TILE_SIZE);
    const playerTileY = Math.floor(this.player.y / TILE_SIZE);
    const targetTile = { x: playerTileX, y: playerTileY - 1 };
    await this.walkNPC(cowlickSprite, cowlickPrefix, targetTile.x, targetTile.y);

    // 3. Face each other — cowlick faces down, player faces up
    cowlickSprite.play(`${cowlickPrefix}-idle-down`);
    cowlickSprite.setDisplaySize(PLAYER_W, PLAYER_H);
    this.facingDirection = { dx: 0, dy: -1 };
    this.showIdleSprite();

    await this.delay(200);

    // 4. Bump effect — screen shake + white flash + cowlick hurt animation
    this.cameras.main.shake(300, 0.01);
    this.cameras.main.flash(200, 255, 255, 255);
    cowlickSprite.play(`${cowlickPrefix}-hurt-down`);
    cowlickSprite.setDisplaySize(PLAYER_W, PLAYER_H);
    await this.delay(800);

    // Return to idle pose after hurt
    cowlickSprite.play(`${cowlickPrefix}-idle-down`);
    cowlickSprite.setDisplaySize(PLAYER_W, PLAYER_H);
    await this.delay(300);

    // 5. Cowlick transformation dialogue (no combatTrigger — we start combat manually)
    useUIStore.getState().startDialogue(NPC_DIALOGUE.cowlick_cutscene_transform);
    await this.waitForDialogueEnd();

    // 5b. Flickering transformation — flash between NPC and monster sprite
    const monsterSprite = this.add.sprite(
      cowlickSprite.x, cowlickSprite.y,
      'enemy-goblin2-combat',
      2 * 13 + 0 // row 2 (facing down) * 13 cols + frame 0
    );
    monsterSprite.setDisplaySize(PLAYER_W, PLAYER_H);
    monsterSprite.setOrigin(0.5, 0.8);
    monsterSprite.setDepth(cowlickSprite.depth + 1);
    monsterSprite.setVisible(false);

    // Flicker sequence: alternating visibility, getting faster
    const flickerPattern = [200, 150, 120, 100, 80, 60, 60, 40, 40, 40];
    let showMonster = false;
    for (const duration of flickerPattern) {
      showMonster = !showMonster;
      cowlickSprite.setVisible(!showMonster);
      monsterSprite.setVisible(showMonster);
      if (showMonster) {
        this.cameras.main.flash(50, 200, 100, 255, true);
      }
      await this.delay(duration);
    }

    // End on monster — final flash
    cowlickSprite.setVisible(false);
    monsterSprite.setVisible(true);
    this.cameras.main.shake(200, 0.015);
    this.cameras.main.flash(150, 255, 255, 255);
    await this.delay(500);

    // 6. Start combat — keep monster sprite visible until combat UI covers screen
    useCombatStore.getState().startCombat(COMBAT_ENEMIES.cowlick_npc, true);
    await this.delay(600); // wait for combat transition to cover the scene
    monsterSprite.destroy();

    // 7. Wait for combat to end
    await this.waitForCombatEnd();

    // 8. Post-combat: cowlick NPC reappears (transform already happened in combat screen)
    cowlickSprite.setVisible(true);
    cowlickSprite.play(`${cowlickPrefix}-idle-down`);
    cowlickSprite.setDisplaySize(PLAYER_W, PLAYER_H);
    await this.delay(300);
    useUIStore.getState().startDialogue(NPC_DIALOGUE.post_battle_cowlick_npc);
    await this.waitForDialogueEnd();

    // 9. Player reaction: "What was that?"
    useUIStore.getState().startDialogue(NPC_DIALOGUE.player_what_was_that);
    await this.waitForDialogueEnd();

    // 10. Walk cowlick off toward the elevator and destroy
    const exitX = spawnX;
    const exitY = spawnY;
    await this.walkNPC(cowlickSprite, cowlickPrefix, exitX, exitY);
    const idx = this.npcSprites.indexOf(cowlickSprite);
    if (idx >= 0) this.npcSprites.splice(idx, 1);
    cowlickSprite.destroy();

    // 11. Mark cutscene as played — this unblocks the exit gates
    useGameStore.getState().setQuestState('cowlickCutscenePlayed', 'true');

    // 12. Release player control
    this.isCutsceneActive = false;
    this.isMoving = false;
  }

  // ---------------------------------------------------------------------------
  // Random encounters
  // ---------------------------------------------------------------------------

  private rollEncounterThreshold(): void {
    const config = MAP_ENCOUNTERS[this.currentMap.id];
    if (!config?.enabled) {
      this.encounterThreshold = Infinity;
      return;
    }
    this.encounterThreshold = config.minSteps + Math.floor(Math.random() * (config.maxSteps - config.minSteps + 1));
  }

  /** Start a full random encounter: NPC spawns, walks to player, dialogue, combat, post-combat, walk off */
  private async startRandomEncounterSequence(enemy: CombatEnemy, config: EncounterConfig): Promise<void> {
    if (this.isEncounterSequenceActive) return;
    this.isEncounterSequenceActive = true;
    this.isMoving = true; // Block player movement

    // 1. Pick random NPC sprite from pool
    const npcPrefix = config.npcSprites[Math.floor(Math.random() * config.npcSprites.length)];
    this.encounterNpcPrefix = npcPrefix;

    // 2. Calculate spawn position (edge of camera viewport, walkable tile)
    const spawnTile = this.findEncounterSpawnTile();

    // 3. Create temporary NPC sprite at spawn tile
    this.encounterNpcSprite = this.add.sprite(
      spawnTile.x * TILE_SIZE + TILE_SIZE / 2,
      spawnTile.y * TILE_SIZE + TILE_SIZE / 2,
      `${npcPrefix}-walk`,
      LPC_ROW['down'] * LPC_COLS
    );
    this.encounterNpcSprite.setDisplaySize(PLAYER_W, PLAYER_H);
    this.encounterNpcSprite.setOrigin(0.5, 0.8);
    this.encounterNpcSprite.setDepth(this.encounterNpcSprite.y + TILE_SIZE / 2 - 1);
    this.npcSprites.push(this.encounterNpcSprite);
    this.addCharShadow(this.encounterNpcSprite);

    // 4. Calculate adjacent tile to player
    const playerTileX = Math.floor(this.player.x / TILE_SIZE);
    const playerTileY = Math.floor(this.player.y / TILE_SIZE);
    const adjacentTile = this.findAdjacentWalkableTile(playerTileX, playerTileY, spawnTile);

    // 5. Walk NPC to adjacent tile
    await this.walkNPC(this.encounterNpcSprite, npcPrefix, adjacentTile.x, adjacentTile.y);

    // 6. NPC faces player
    const npcFacing = this.calcFacingDirection(adjacentTile, { x: playerTileX, y: playerTileY });
    this.encounterNpcSprite.play(`${npcPrefix}-idle-${npcFacing}`);
    this.encounterNpcSprite.setDisplaySize(PLAYER_W, PLAYER_H);

    // 7. Player faces NPC
    const playerFacing = this.calcFacingDirection({ x: playerTileX, y: playerTileY }, adjacentTile);
    this.facingDirection = this.dirToVector(playerFacing);
    this.showIdleSprite();

    // Short pause
    await this.delay(300);

    // 8. Pick random pre-combat dialogue (no combatTrigger — we start combat manually)
    const preCombatDialogue = this.pickRandomDialogue(RANDOM_ENCOUNTER_PRE_COMBAT);
    useUIStore.getState().startDialogue(preCombatDialogue);
    await this.waitForDialogueEnd();

    // 9. Start combat directly with random encounter flag
    await this.delay(300);
    useCombatStore.getState().startCombat(enemy, true);

    // 10. Wait for combat to end
    await this.waitForCombatEnd();

    // 11. Post-combat dialogue
    await this.delay(300);
    const postCombatDialogue = this.pickRandomDialogue(RANDOM_ENCOUNTER_POST_COMBAT);
    useUIStore.getState().startDialogue(postCombatDialogue);
    await this.waitForDialogueEnd();

    // 12. Walk NPC off-screen and destroy
    if (this.encounterNpcSprite) {
      const exitTile = this.findEncounterExitTile(adjacentTile);
      await this.walkNPC(this.encounterNpcSprite, npcPrefix, exitTile.x, exitTile.y);

      const idx = this.npcSprites.indexOf(this.encounterNpcSprite);
      if (idx >= 0) this.npcSprites.splice(idx, 1);
      this.encounterNpcSprite.destroy();
      this.encounterNpcSprite = null;
    }

    this.isEncounterSequenceActive = false;
    this.isMoving = false;
  }

  /** Wait for combat to finish (isActive goes false) */
  private waitForCombatEnd(): Promise<void> {
    return new Promise((resolve) => {
      const check = () => {
        if (!useCombatStore.getState().isActive) {
          resolve();
        } else {
          this.time.delayedCall(100, check);
        }
      };
      this.time.delayedCall(200, check);
    });
  }

  /** Pick a random dialogue from an array (deep clone so the original isn't mutated) */
  private pickRandomDialogue(pool: DialogueNode[]): DialogueNode {
    const template = pool[Math.floor(Math.random() * pool.length)];
    return JSON.parse(JSON.stringify(template)) as DialogueNode;
  }

  /** Find a walkable tile at the edge of the camera viewport for NPC spawn */
  private findEncounterSpawnTile(): { x: number; y: number } {
    const cam = this.cameras.main;
    const zoom = cam.zoom;

    // Camera viewport in tile coordinates
    const camLeft = Math.floor(cam.scrollX / TILE_SIZE);
    const camRight = Math.floor((cam.scrollX + cam.width / zoom) / TILE_SIZE);
    const camTop = Math.floor(cam.scrollY / TILE_SIZE);
    const camBottom = Math.floor((cam.scrollY + cam.height / zoom) / TILE_SIZE);

    // Try each edge in random order
    const edges = ['left', 'right', 'top', 'bottom'];
    for (let i = edges.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [edges[i], edges[j]] = [edges[j], edges[i]];
    }

    for (const edge of edges) {
      const candidates: { x: number; y: number }[] = [];
      if (edge === 'left') {
        const x = Math.max(0, camLeft - 1);
        for (let y = camTop; y <= camBottom; y++) {
          if (this.isSpawnableTile(x, y)) candidates.push({ x, y });
        }
      } else if (edge === 'right') {
        const x = Math.min(this.currentMap.width - 1, camRight + 1);
        for (let y = camTop; y <= camBottom; y++) {
          if (this.isSpawnableTile(x, y)) candidates.push({ x, y });
        }
      } else if (edge === 'top') {
        const y = Math.max(0, camTop - 1);
        for (let x = camLeft; x <= camRight; x++) {
          if (this.isSpawnableTile(x, y)) candidates.push({ x, y });
        }
      } else {
        const y = Math.min(this.currentMap.height - 1, camBottom + 1);
        for (let x = camLeft; x <= camRight; x++) {
          if (this.isSpawnableTile(x, y)) candidates.push({ x, y });
        }
      }

      if (candidates.length > 0) {
        return candidates[Math.floor(Math.random() * candidates.length)];
      }
    }

    // Fallback: a few tiles away from player
    const playerTileX = Math.floor(this.player.x / TILE_SIZE);
    const playerTileY = Math.floor(this.player.y / TILE_SIZE);
    return { x: Math.max(0, playerTileX - 5), y: playerTileY };
  }

  /** Check if a tile is walkable and not occupied by another NPC */
  private isSpawnableTile(x: number, y: number): boolean {
    if (x < 0 || x >= this.currentMap.width || y < 0 || y >= this.currentMap.height) return false;
    if (this.currentMap.collision[y][x] !== 0) return false;
    // Don't spawn on top of existing NPCs
    for (const npc of this.npcSprites) {
      const npcTileX = Math.floor(npc.x / TILE_SIZE);
      const npcTileY = Math.floor(npc.y / TILE_SIZE);
      if (npcTileX === x && npcTileY === y) return false;
    }
    return true;
  }

  /** Find a walkable tile adjacent to the player, preferring the side closest to spawn */
  private findAdjacentWalkableTile(
    playerX: number, playerY: number,
    spawnTile: { x: number; y: number }
  ): { x: number; y: number } {
    const dx = Math.sign(playerX - spawnTile.x);
    const dy = Math.sign(playerY - spawnTile.y);

    // Try the direction the NPC arrives from first, then all cardinal directions
    const candidates = [
      { x: playerX - (dx || 1), y: playerY - (dy || 0) }, // Direction NPC comes from
      { x: playerX + 1, y: playerY },
      { x: playerX - 1, y: playerY },
      { x: playerX, y: playerY + 1 },
      { x: playerX, y: playerY - 1 },
    ];

    for (const c of candidates) {
      if (this.isSpawnableTile(c.x, c.y)) return c;
    }

    // Fallback
    return { x: playerX + 1, y: playerY };
  }

  /** Find an exit tile at the camera edge for the NPC to walk off-screen */
  private findEncounterExitTile(npcTile: { x: number; y: number }): { x: number; y: number } {
    const cam = this.cameras.main;
    const zoom = cam.zoom;
    const camLeft = Math.floor(cam.scrollX / TILE_SIZE);
    const camRight = Math.floor((cam.scrollX + cam.width / zoom) / TILE_SIZE);
    const camTop = Math.floor(cam.scrollY / TILE_SIZE);
    const camBottom = Math.floor((cam.scrollY + cam.height / zoom) / TILE_SIZE);

    // Walk toward the nearest edge
    const distLeft = npcTile.x - camLeft;
    const distRight = camRight - npcTile.x;
    const distTop = npcTile.y - camTop;
    const distBottom = camBottom - npcTile.y;

    const minDist = Math.min(distLeft, distRight, distTop, distBottom);

    if (minDist === distLeft) return { x: Math.max(0, camLeft - 2), y: npcTile.y };
    if (minDist === distRight) return { x: Math.min(this.currentMap.width - 1, camRight + 2), y: npcTile.y };
    if (minDist === distTop) return { x: npcTile.x, y: Math.max(0, camTop - 2) };
    return { x: npcTile.x, y: Math.min(this.currentMap.height - 1, camBottom + 2) };
  }

  /** Calculate which direction "from" should face to look at "to" */
  private calcFacingDirection(
    from: { x: number; y: number },
    to: { x: number; y: number }
  ): string {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    if (Math.abs(dx) > Math.abs(dy)) {
      return dx > 0 ? 'right' : 'left';
    }
    return dy > 0 ? 'down' : 'up';
  }

  /** Convert a direction string to a dx/dy vector */
  private dirToVector(dir: string): { dx: number; dy: number } {
    switch (dir) {
      case 'up': return { dx: 0, dy: -1 };
      case 'down': return { dx: 0, dy: 1 };
      case 'left': return { dx: -1, dy: 0 };
      case 'right': return { dx: 1, dy: 0 };
      default: return { dx: 0, dy: 1 };
    }
  }

  // ---------------------------------------------------------------------------
  // Character shadows
  // ---------------------------------------------------------------------------

  /** Add a drop shadow sprite beneath a character sprite and track it */
  private addCharShadow(parent: Phaser.GameObjects.Sprite): Phaser.GameObjects.Sprite {
    const shadow = this.add.sprite(parent.x, parent.y + 20, 'char-shadow');
    shadow.setOrigin(0.5, 0.5);
    shadow.setDisplaySize(80, 32);
    shadow.setDepth(parent.depth - 0.5);
    shadow.setData('shadowParent', parent);
    this.shadowSprites.push(shadow);
    return shadow;
  }

  // ---------------------------------------------------------------------------
  // Map building
  // ---------------------------------------------------------------------------

  /** Build (or rebuild) the visual map from a GameMap definition */
  private buildMap(map: GameMap, spawnX: number, spawnY: number): void {
    // Clear existing sprites
    for (const s of this.tileSprites) s.destroy();
    for (const s of this.npcSprites) s.destroy();
    for (const s of this.doorIndicators) s.destroy();
    for (const s of this.questArrows) s.destroy();
    for (const s of this.shadowSprites) s.destroy();
    // Clean up any active random encounter NPC
    if (this.encounterNpcSprite) {
      this.encounterNpcSprite.destroy();
      this.encounterNpcSprite = null;
      this.isEncounterSequenceActive = false;
    }
    this.tileSprites = [];
    this.npcSprites = [];
    this.doorIndicators = [];
    this.questArrows = [];
    this.shadowSprites = [];
    if (this.player) this.player.destroy();

    this.currentMap = map;
    this.encounterSteps = 0;
    this.rollEncounterThreshold();
    useGameStore.getState().setCurrentMap(map.id);

    // Render ground layer
    if (map.groundImage) {
      // Composite image ground — scale from source tile size to TILE_SIZE
      const scale = TILE_SIZE / (map.groundImageTileSize ?? TILE_SIZE);
      const img = this.add.image(0, 0, map.groundImage);
      img.setOrigin(0, 0);
      img.setScale(scale);
      this.tileSprites.push(img);

      // Foreground layer — rendered above characters for overlap (counter fronts, signs, etc.)
      if (map.foregroundImage) {
        const fg = this.add.image(0, 0, map.foregroundImage);
        fg.setOrigin(0, 0);
        fg.setScale(scale);
        fg.setDepth(999998); // Above all characters, below UI indicators
        this.tileSprites.push(fg);
      }
    } else {
      for (let y = 0; y < map.height; y++) {
        for (let x = 0; x < map.width; x++) {
          const tileId = map.ground[y][x];
          const textureKey = GROUND_TEXTURES[tileId] ?? 'tile-grass';
          const sprite = this.add.sprite(
            x * TILE_SIZE + TILE_SIZE / 2,
            y * TILE_SIZE + TILE_SIZE / 2,
            textureKey
          );
          const rotation = GROUND_ROTATIONS[tileId];
          if (rotation !== undefined) {
            sprite.setAngle(rotation);
          }
          this.tileSprites.push(sprite);
        }
      }
    }

    // Render object layer on top
    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        const tileId = map.objects[y][x];
        if (tileId > 0) {
          const textureKey = OBJECT_TEXTURES[tileId];
          if (textureKey) {
            const sprite = this.add.sprite(
              x * TILE_SIZE + TILE_SIZE / 2,
              y * TILE_SIZE + TILE_SIZE / 2,
              textureKey
            );
            sprite.setDepth(1);
            this.tileSprites.push(sprite);
          }
        }
      }
    }

    // Place decorations (large building sprites, etc.)
    if (map.decorations) {
      for (const deco of map.decorations) {
        const displayW = deco.widthTiles * TILE_SIZE;
        // Preserve aspect ratio — calculate height from source image
        const sourceImg = this.textures.get(deco.texture).getSourceImage();
        const aspect = sourceImg.height / sourceImg.width;
        const displayH = displayW * aspect;
        // Position: center-bottom of sprite sits at the base tile center
        const posX = deco.x * TILE_SIZE + TILE_SIZE / 2;
        const posY = deco.y * TILE_SIZE + TILE_SIZE;
        const sprite = this.add.sprite(posX, posY, deco.texture);
        sprite.setDisplaySize(displayW, displayH);
        sprite.setOrigin(0.5, 1); // anchor at bottom-center
        if (deco.flipX) sprite.setFlipX(true);
        sprite.setDepth(posY); // y-based depth for correct overlap
        this.tileSprites.push(sprite);
      }
    }

    // Place NPCs
    for (const npcData of map.npcs) {
      // Skip cowlick NPC — cutscene spawns it dynamically, and after battle it's gone
      if (npcData.id === 'npc_cowlick_glasses') {
        continue;
      }

      let npc: Phaser.GameObjects.Sprite;

      if (npcData.sprite.startsWith('lpc:')) {
        // LPC spritesheet NPC — show standing/sitting frame in facing direction
        const sheetKey = npcData.sprite.slice(4); // e.g. 'lpc-named-tanaka-walk'
        const isSit = sheetKey.endsWith('-sit');
        const npcPrefix = sheetKey.replace(/-(walk|sit)$/, ''); // e.g. 'lpc-named-tanaka'
        const facing = npcData.facing ?? 'down';
        npc = this.add.sprite(
          npcData.x * TILE_SIZE + TILE_SIZE / 2,
          npcData.y * TILE_SIZE + TILE_SIZE / 2,
          sheetKey, LPC_ROW[facing] * LPC_COLS
        );
        npc.setDisplaySize(PLAYER_W, PLAYER_H);
        npc.setOrigin(0.5, 0.8);
        if (isSit) {
          npc.play(`${npcPrefix}-sit-${facing}`);
        } else {
          npc.play(`${npcPrefix}-idle-${facing}`);
          npc.setData('lpcPrefix', npcPrefix);

          // Start patrol loop for walking NPCs
          if (npcData.patrol) {
            this.startNPCPatrol(npc, npcPrefix, npcData.patrol);
          }
        }
      } else {
        npc = this.add.sprite(
          npcData.x * TILE_SIZE + TILE_SIZE / 2,
          npcData.y * TILE_SIZE + TILE_SIZE / 2,
          npcData.sprite
        );
        // Character sprites (with idle rotations) need proper sizing
        if (npcData.sprite.includes('-idle-')) {
          npc.setDisplaySize(NPC_W, NPC_H);
          npc.setOrigin(0.5, 0.8);
        }
      }

      npc.setData('npcId', npcData.id);
      npc.setDepth(npc.y + TILE_SIZE / 2 - 1);
      this.npcSprites.push(npc);
      this.addCharShadow(npc);
    }

    // Place door entry indicators (animated bouncing arrows above enterable doors)
    for (const transition of map.transitions) {
      // Only show for building entries (doors), not for border exits like the station
      // Heuristic: border transitions are at map edges (row >= height-4 or row <= 3)
      if (transition.y >= map.height - 4 || transition.y <= 3) continue;

      const indicator = this.add.sprite(
        transition.x * TILE_SIZE + TILE_SIZE / 2,
        transition.y * TILE_SIZE - 8, // Position above the door tile
        'door-indicator'
      );
      indicator.setOrigin(0.5, 1);
      indicator.setDepth(999999); // Always on top

      // Bobbing animation
      this.tweens.add({
        targets: indicator,
        y: indicator.y - 10,
        duration: 800,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1,
      });

      // Subtle alpha pulse
      this.tweens.add({
        targets: indicator,
        alpha: 0.5,
        duration: 1200,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1,
      });

      this.doorIndicators.push(indicator);
    }

    // Place player with real character sprite
    const dir = lpcDirection(this.facingDirection.dx, this.facingDirection.dy);
    this.player = this.add.sprite(
      spawnX * TILE_SIZE + TILE_SIZE / 2,
      spawnY * TILE_SIZE + TILE_SIZE / 2,
      'lpc-walk', LPC_ROW[dir] * LPC_COLS
    );
    this.player.setDisplaySize(PLAYER_W, PLAYER_H);
    this.player.setOrigin(0.5, 0.8);
    this.player.setDepth(this.player.y + TILE_SIZE / 2 - 1);
    this.addCharShadow(this.player);

    // Camera setup — slight zoom-in for closer feel; adjust for 32px-tile maps
    const baseZoom = 1.25;
    const tileScale = map.groundImageTileSize && map.groundImageTileSize < TILE_SIZE
      ? map.groundImageTileSize / TILE_SIZE
      : 1;
    this.cameras.main.setZoom(baseZoom * tileScale);
    this.cameras.main.startFollow(this.player, true);
    this.cameras.main.setBounds(
      0, 0,
      map.width * TILE_SIZE,
      map.height * TILE_SIZE
    );

    // Log initial spawn position
    const spawnTileStr = `Player tile: (${spawnX}, ${spawnY}) | Map: ${map.id}`;
    console.log(spawnTileStr);
    this.lastLoggedTile = { x: spawnX, y: spawnY };

    this.refreshQuestArrows();
  }

  // ---------------------------------------------------------------------------
  // Quest arrows
  // ---------------------------------------------------------------------------

  private refreshQuestArrows(): void {
    // Destroy existing quest arrows
    for (const arrow of this.questArrows) arrow.destroy();
    this.questArrows = [];

    // Only show arrows in the train station
    if (this.currentMap.id !== 'tiled_train_station') return;

    const qs = useGameStore.getState().questStates;

    // Don't show arrows before arrival cutscene
    if (qs.stationArrivalPlayed !== 'true') return;

    // After cowlick battle is done, check phone call quest arrows
    if (qs.battle_cowlick_npc_done === 'true') {
      const postCowlickArrows: { px: number; py: number }[] = [];

      // Phase 5: After phone call — arrows on gift/postcard shops
      if (qs.phoneCallDone === 'true') {
        const hasSisterPresent = qs.stationSisterPresentBought === 'true';
        const hasPostcard = qs.stationPostcardBought === 'true';

        if (!hasSisterPresent || !hasPostcard) {
          if (!hasSisterPresent) {
            // Arrow on omiyage vendors (sister's present is there now)
            for (const npc of this.npcSprites) {
              if (npc.getData('npcId') === 'omiyage_vendor') {
                postCowlickArrows.push({ px: npc.x, py: npc.y - npc.displayHeight * 0.7 });
              }
            }
          }
          if (!hasPostcard) {
            // Arrow on postcard shop vendor
            for (const npc of this.npcSprites) {
              if (npc.getData('npcId') === 'postcard_shop') {
                postCowlickArrows.push({ px: npc.x, py: npc.y - npc.displayHeight * 0.7 });
              }
            }
          }
        } else {
          // Phase 6: Both bought — arrows on stairs exit
          for (const t of this.currentMap.transitions) {
            postCowlickArrows.push({ px: t.x * TILE_SIZE + TILE_SIZE / 2, py: t.y * TILE_SIZE - 8 });
          }
        }
      }

      // Create arrow sprites for post-cowlick phases
      for (const pos of postCowlickArrows) {
        const arrow = this.add.sprite(pos.px, pos.py - 16, 'quest-arrow');
        arrow.setOrigin(0.5, 1);
        arrow.setDepth(999999);
        this.tweens.add({ targets: arrow, y: arrow.y - 12, duration: 600, ease: 'Sine.easeInOut', yoyo: true, repeat: -1 });
        this.tweens.add({ targets: arrow, alpha: 0.5, duration: 900, ease: 'Sine.easeInOut', yoyo: true, repeat: -1 });
        this.questArrows.push(arrow);
      }
      return;
    }

    const hasFood = qs.stationFoodBought === 'true';
    const hasDrink = qs.stationDrinkBought === 'true';
    const omiyagePrompted = qs.stationOmiyagePrompted === 'true';
    const hasOmiyage = qs.stationOmiyageBought === 'true';
    const cowlickPlayed = qs.cowlickCutscenePlayed === 'true';

    // Arrow positions in pixel coords (placed above sprite/target)
    const arrowPixels: { px: number; py: number }[] = [];

    if (!hasFood || !hasDrink) {
      // Phase 1: Need food and drink — arrows on vending machines + food stalls
      if (!hasDrink) {
        // Vending machines — center of 2-wide machines (tile-based)
        arrowPixels.push({ px: 21.5 * TILE_SIZE + TILE_SIZE / 2, py: 14 * TILE_SIZE });
        arrowPixels.push({ px: 31.5 * TILE_SIZE + TILE_SIZE / 2, py: 14 * TILE_SIZE });
      }
      if (!hasFood) {
        // Food stall NPCs — position above actual sprite
        for (const npc of this.npcSprites) {
          const npcId = npc.getData('npcId') as string;
          if (npcId === 'food_stall') {
            arrowPixels.push({ px: npc.x, py: npc.y - npc.displayHeight * 0.7 });
          }
        }
      }
    } else if (!omiyagePrompted) {
      // Phase 2: Got food+drink, need to talk to Tanaka
      const fixer = this.npcSprites.find(
        (s) => s.getData('npcId') === 'fixer_food_reminder'
      );
      if (fixer) {
        arrowPixels.push({ px: fixer.x, py: fixer.y - fixer.displayHeight * 0.7 });
      }
    } else if (!hasOmiyage) {
      // Phase 3: Tanaka prompted omiyage — arrows above each vendor sprite
      for (const npc of this.npcSprites) {
        if (npc.getData('npcId') === 'omiyage_vendor') {
          arrowPixels.push({ px: npc.x, py: npc.y - npc.displayHeight * 0.7 });
        }
      }
    } else if (!cowlickPlayed) {
      // Phase 4: Got omiyage, need to talk to Tanaka again
      const fixer = this.npcSprites.find(
        (s) => s.getData('npcId') === 'fixer_food_reminder'
      );
      if (fixer) {
        arrowPixels.push({ px: fixer.x, py: fixer.y - fixer.displayHeight * 0.7 });
      }
    }

    // Create arrow sprites
    for (const pos of arrowPixels) {
      const arrow = this.add.sprite(
        pos.px,
        pos.py - 16,
        'quest-arrow'
      );
      arrow.setOrigin(0.5, 1);
      arrow.setDepth(999999);

      // Bobbing animation
      this.tweens.add({
        targets: arrow,
        y: arrow.y - 12,
        duration: 600,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1,
      });

      // Alpha pulse
      this.tweens.add({
        targets: arrow,
        alpha: 0.5,
        duration: 900,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1,
      });

      this.questArrows.push(arrow);
    }
  }

  // ---------------------------------------------------------------------------
  // Map transitions
  // ---------------------------------------------------------------------------

  /** Transition to a different map with fade effect */
  private transitionToMap(transition: MapTransition): void {
    if (this.isTransitioning) return;
    this.isTransitioning = true;
    this.isMoving = true;

    // Stop running animation
    this.player.stop();
    this.showIdleSprite();

    this.cameras.main.fadeOut(FADE_DURATION, 0, 0, 0);

    this.cameras.main.once('camerafadeoutcomplete', () => {
      const targetMap = getMap(transition.targetMap);
      if (!targetMap) {
        this.isTransitioning = false;
        this.isMoving = false;
        return;
      }

      this.cameras.main.stopFollow();

      // Set facing before building so the idle sprite faces correctly
      if (transition.facing) {
        const dirMap: Record<string, { dx: number; dy: number }> = {
          up: { dx: 0, dy: -1 },
          down: { dx: 0, dy: 1 },
          left: { dx: -1, dy: 0 },
          right: { dx: 1, dy: 0 },
        };
        this.facingDirection = dirMap[transition.facing];
      }

      this.buildMap(targetMap, transition.targetX, transition.targetY);

      this.cameras.main.fadeIn(FADE_DURATION, 0, 0, 0);

      this.cameras.main.once('camerafadeincomplete', () => {
        this.isTransitioning = false;
        this.isMoving = false;
      });
    });
  }

  // ---------------------------------------------------------------------------
  // Player movement & interaction
  // ---------------------------------------------------------------------------

  /** Show the idle sprite for the current facing direction */
  private showIdleSprite(): void {
    const dir = lpcDirection(this.facingDirection.dx, this.facingDirection.dy);
    this.player.stop();
    this.player.setTexture('lpc-walk', LPC_ROW[dir] * LPC_COLS); // col 0 = standing
    this.player.setDisplaySize(PLAYER_W, PLAYER_H);
  }

  /** Play the running animation for the current facing direction */
  private playRunAnimation(dx: number, dy: number): void {
    const dir = lpcDirection(dx, dy);
    const animKey = `player-walk-${dir}`;
    if (this.player.anims.currentAnim?.key !== animKey || !this.player.anims.isPlaying) {
      this.player.play(animKey);
      this.player.setDisplaySize(PLAYER_W, PLAYER_H);
    }
  }

  private isGamepadJustDown(pad: Phaser.Input.Gamepad.Gamepad, index: number): boolean {
    const current = pad.buttons[index]?.pressed ?? false;
    const prev = this.gamepadPrevButtons[index];
    return current && !prev;
  }

  private updateGamepadButtonStates(pad: Phaser.Input.Gamepad.Gamepad | null): void {
    if (!pad) {
      this.gamepadPrevButtons.fill(false);
      return;
    }
    for (let i = 0; i < this.gamepadPrevButtons.length; i++) {
      this.gamepadPrevButtons[i] = pad.buttons[i]?.pressed ?? false;
    }
  }

  update(): void {
    // Y-based depth sorting — runs every frame for smooth overlap
    // Characters use y + TILE_SIZE/2 so they sort at tile-bottom (matching decorations)
    // -1 ensures decorations render in front of characters at the same tile
    if (this.player) this.player.setDepth(this.player.y + TILE_SIZE / 2 - 1);
    for (const npc of this.npcSprites) npc.setDepth(npc.y + TILE_SIZE / 2 - 1);

    // Sync shadow positions with their parent sprites
    for (let i = this.shadowSprites.length - 1; i >= 0; i--) {
      const shadow = this.shadowSprites[i];
      const parent = shadow.getData('shadowParent') as Phaser.GameObjects.Sprite;
      if (!parent || !parent.active) {
        shadow.destroy();
        this.shadowSprites.splice(i, 1);
        continue;
      }
      shadow.x = parent.x;
      shadow.y = parent.y + 20;
      shadow.setDepth(parent.depth - 0.5);
      shadow.setVisible(parent.visible);
    }

    // Log tile position when it changes (debug aid)
    if (this.player) {
      const px = Math.floor(this.player.x / TILE_SIZE);
      const py = Math.floor(this.player.y / TILE_SIZE);
      if (px !== this.lastLoggedTile.x || py !== this.lastLoggedTile.y) {
        this.lastLoggedTile = { x: px, y: py };
        console.log(`Player tile: (${px}, ${py}) | Map: ${this.currentMap.id}`);
      }
    }

    // Gamepad reference (may be null if no controller connected)
    const pad = this.input.gamepad?.pad1 ?? null;

    // Detect input mode switching
    if (pad) {
      const anyButton = pad.buttons.some(b => b.pressed);
      const stickActive = Math.abs(pad.leftStick.x) > 0.2 || Math.abs(pad.leftStick.y) > 0.2;
      if (anyButton || stickActive) {
        if (useUIStore.getState().inputMode !== 'gamepad') {
          useUIStore.getState().setInputMode('gamepad');
        }
      }
    }

    // Detect keyboard activity to switch back to keyboard mode
    const anyKeyboardDown =
      this.cursors?.up.isDown || this.cursors?.down.isDown ||
      this.cursors?.left.isDown || this.cursors?.right.isDown ||
      this.wasd?.up.isDown || this.wasd?.down.isDown ||
      this.wasd?.left.isDown || this.wasd?.right.isDown ||
      this.spaceKey?.isDown || this.keyI?.isDown || this.keyEsc?.isDown;
    if (anyKeyboardDown && useUIStore.getState().inputMode !== 'keyboard') {
      useUIStore.getState().setInputMode('keyboard');
    }

    // During combat: emit gamepad UI events for CombatScreen, then early return
    if (useCombatStore.getState().isActive) {
      if (pad) {
        if (this.isGamepadJustDown(pad, 12)) inputBus.emit('navigate_up');
        if (this.isGamepadJustDown(pad, 13)) inputBus.emit('navigate_down');
        if (this.isGamepadJustDown(pad, 14)) inputBus.emit('navigate_left');
        if (this.isGamepadJustDown(pad, 15)) inputBus.emit('navigate_right');
        if (this.isGamepadJustDown(pad, 0)) inputBus.emit('confirm');
        if (this.isGamepadJustDown(pad, 1)) inputBus.emit('cancel');
        // Left stick navigation
        const stickX = Math.abs(pad.leftStick.x) > this.STICK_DEADZONE ? Math.sign(pad.leftStick.x) : 0;
        const stickY = Math.abs(pad.leftStick.y) > this.STICK_DEADZONE ? Math.sign(pad.leftStick.y) : 0;
        if (stickX !== this.stickNavPrev.x) {
          if (stickX > 0) inputBus.emit('navigate_right');
          if (stickX < 0) inputBus.emit('navigate_left');
        }
        if (stickY !== this.stickNavPrev.y) {
          if (stickY > 0) inputBus.emit('navigate_down');
          if (stickY < 0) inputBus.emit('navigate_up');
        }
        this.stickNavPrev = { x: stickX, y: stickY };
        this.updateGamepadButtonStates(pad);
      }
      return;
    }
    if (this.isTransitioning) {
      this.updateGamepadButtonStates(pad);
      return;
    }
    if (useUIStore.getState().activeFoodMenu) {
      this.updateGamepadButtonStates(pad);
      return;
    }

    const isDialogueActive = useUIStore.getState().isDialogueActive;

    // Refresh quest arrows when dialogue transitions from active to inactive
    if (this.wasDialogueActive && !isDialogueActive) {
      this.refreshQuestArrows();
    }
    this.wasDialogueActive = isDialogueActive;

    // Menu hotkeys
    const activeMenu = useUIStore.getState().activeMenu;

    // --- Keyboard: Esc / Gamepad: B button (index 1) — close menu / cancel ---
    let escPressed = Phaser.Input.Keyboard.JustDown(this.keyEsc);
    if (pad && this.isGamepadJustDown(pad, 1)) {
      escPressed = true;
      inputBus.emit('cancel');
    }

    if (escPressed) {
      if (activeMenu) {
        useUIStore.getState().closeMenu();
        this.updateGamepadButtonStates(pad);
        return;
      }
    }

    // --- Keyboard: I / Gamepad: Y button (index 3) — unified menu toggle ---
    let menuPressed = Phaser.Input.Keyboard.JustDown(this.keyI);
    if (pad && this.isGamepadJustDown(pad, 3)) {
      menuPressed = true;
      inputBus.emit('menu_inventory');
    }

    if (menuPressed) {
      if (!activeMenu && !isDialogueActive && !this.isCutsceneActive && !useUIStore.getState().activeMatchingGame) {
        useUIStore.getState().openMenu('menu');
        this.updateGamepadButtonStates(pad);
        return;
      } else if (activeMenu) {
        useUIStore.getState().closeMenu();
        this.updateGamepadButtonStates(pad);
        return;
      }
    }

    // --- Keyboard: V — vocab book toggle ---
    const vocabPressed = Phaser.Input.Keyboard.JustDown(this.keyV);

    if (vocabPressed) {
      if (!activeMenu && !isDialogueActive && !this.isCutsceneActive && !useUIStore.getState().activeMatchingGame) {
        useUIStore.getState().openMenu('vocabbook');
        this.updateGamepadButtonStates(pad);
        return;
      } else if (activeMenu === 'vocabbook') {
        useUIStore.getState().closeMenu();
        this.updateGamepadButtonStates(pad);
        return;
      }
    }

    // --- Keyboard: Esc / Gamepad: Select button (index 8) — settings toggle ---
    let settingsPressed = false;
    if (pad && this.isGamepadJustDown(pad, 8)) {
      settingsPressed = true;
      inputBus.emit('menu_settings');
    }

    if (settingsPressed) {
      if (!activeMenu && !isDialogueActive && !this.isCutsceneActive && !useUIStore.getState().activeMatchingGame) {
        useUIStore.getState().openMenu('settings');
        this.updateGamepadButtonStates(pad);
        return;
      } else if (activeMenu === 'settings') {
        useUIStore.getState().closeMenu();
        this.updateGamepadButtonStates(pad);
        return;
      }
    }

    // --- Gamepad: D-pad navigation events (always emit for UI navigation) ---
    if (pad) {
      if (this.isGamepadJustDown(pad, 12)) inputBus.emit('navigate_up');
      if (this.isGamepadJustDown(pad, 13)) inputBus.emit('navigate_down');
      if (this.isGamepadJustDown(pad, 14)) inputBus.emit('navigate_left');
      if (this.isGamepadJustDown(pad, 15)) inputBus.emit('navigate_right');
    }

    // --- Gamepad: Left stick navigation events (during UI mode) ---
    if (pad) {
      const stickX = Math.abs(pad.leftStick.x) > this.STICK_DEADZONE ? Math.sign(pad.leftStick.x) : 0;
      const stickY = Math.abs(pad.leftStick.y) > this.STICK_DEADZONE ? Math.sign(pad.leftStick.y) : 0;

      // Emit on edge (direction changed from previous frame)
      if (stickX !== this.stickNavPrev.x) {
        if (stickX > 0) inputBus.emit('navigate_right');
        if (stickX < 0) inputBus.emit('navigate_left');
      }
      if (stickY !== this.stickNavPrev.y) {
        if (stickY > 0) inputBus.emit('navigate_down');
        if (stickY < 0) inputBus.emit('navigate_up');
      }
      this.stickNavPrev = { x: stickX, y: stickY };
    }

    // --- Gamepad: A button emit for UI components (before guard) ---
    // Must fire before the menu/matching-game guard so React overlays receive 'confirm'
    if (pad && this.isGamepadJustDown(pad, 0)) {
      inputBus.emit('confirm');
    }

    // --- Gamepad: X button (index 2) — toggle translation in dialogue ---
    if (pad && this.isGamepadJustDown(pad, 2)) {
      inputBus.emit('toggle_translation');
    }

    // Block all game input while menu or mini-game is open
    if (activeMenu || useUIStore.getState().activeMatchingGame || useUIStore.getState().activeScrambleGame || useUIStore.getState().activeReadingGame) {
      this.updateGamepadButtonStates(pad);
      return;
    }

    // --- Keyboard: Space / Gamepad: A button (index 0) — confirm / interact ---
    let confirmPressed = Phaser.Input.Keyboard.JustDown(this.spaceKey);
    if (pad && this.isGamepadJustDown(pad, 0)) {
      confirmPressed = true;
      // 'confirm' already emitted above before the menu/matching guard
    }
    // Touch confirm (one-shot — clear immediately)
    if (useUIStore.getState().touchConfirmPressed) {
      confirmPressed = true;
      useUIStore.getState().clearTouchConfirm();
    }

    if (confirmPressed) {
      if (isDialogueActive) {
        // If React's unified navigation has focus on a word/choice, let React handle confirm
        if (!useUIStore.getState().dialogueFocusActive) {
          useUIStore.getState().advanceLine();
        }
        this.updateGamepadButtonStates(pad);
        return;
      } else if (!this.isCutsceneActive) {
        this.tryInteract();
      }
    }

    // Block movement during cutscene, dialogue, or animation
    if (this.isCutsceneActive || isDialogueActive || this.isMoving) {
      this.updateGamepadButtonStates(pad);
      return;
    }

    // Diagonal movement: check each direction independently
    let dx = 0;
    let dy = 0;

    const up = this.cursors?.up.isDown || this.wasd?.up.isDown;
    const down = this.cursors?.down.isDown || this.wasd?.down.isDown;
    const left = this.cursors?.left.isDown || this.wasd?.left.isDown;
    const right = this.cursors?.right.isDown || this.wasd?.right.isDown;

    if (up) dy -= 1;
    if (down) dy += 1;
    if (left) dx -= 1;
    if (right) dx += 1;

    // Cancel out opposing directions
    if (up && down) dy = 0;
    if (left && right) dx = 0;

    // Gamepad stick and D-pad movement
    if (pad) {
      // Left stick
      if (Math.abs(pad.leftStick.x) > this.STICK_DEADZONE) {
        dx += Math.sign(pad.leftStick.x);
      }
      if (Math.abs(pad.leftStick.y) > this.STICK_DEADZONE) {
        dy += Math.sign(pad.leftStick.y);
      }
      // D-pad held for movement
      if (pad.buttons[12]?.pressed) dy -= 1;
      if (pad.buttons[13]?.pressed) dy += 1;
      if (pad.buttons[14]?.pressed) dx -= 1;
      if (pad.buttons[15]?.pressed) dx += 1;
    }
    // Touch d-pad input
    const touchDir = useUIStore.getState().touchDirection;
    if (touchDir.dx !== 0 || touchDir.dy !== 0) {
      dx += touchDir.dx;
      dy += touchDir.dy;
    }
    // Clamp
    dx = Math.max(-1, Math.min(1, dx));
    dy = Math.max(-1, Math.min(1, dy));

    if (dx === 0 && dy === 0) {
      // Catch stuck running animation when keys released between tween end and update
      if (!this.isMoving && this.player.anims.isPlaying) {
        this.showIdleSprite();
      }
      this.updateGamepadButtonStates(pad);
      return;
    }

    // Update facing direction (store full diagonal for sprites)
    this.facingDirection = { dx, dy };

    const currentTileX = Math.floor(this.player.x / TILE_SIZE);
    const currentTileY = Math.floor(this.player.y / TILE_SIZE);
    const targetTileX = currentTileX + dx;
    const targetTileY = currentTileY + dy;

    // Check bounds
    if (
      targetTileX < 0 || targetTileX >= this.currentMap.width ||
      targetTileY < 0 || targetTileY >= this.currentMap.height
    ) {
      this.playRunAnimation(dx, dy);
      this.updateGamepadButtonStates(pad);
      return;
    }

    // Check if target tile is a transition
    const transition = this.currentMap.transitions.find(
      (t) => t.x === targetTileX && t.y === targetTileY
    );
    if (transition) {
      // Quest gate: block station exit until food+drink+omiyage are bought
      if (this.currentMap.id === 'tiled_train_station') {
        const qs = useGameStore.getState().questStates;
        const hasBoth = qs.stationFoodBought === 'true' && qs.stationDrinkBought === 'true';
        const hasOmiyage = qs.stationOmiyageBought === 'true';
        if (!hasBoth || !hasOmiyage) {
          if (!hasBoth) {
            useUIStore.getState().startDialogue(NPC_DIALOGUE.fixer_food_reminder);
          } else if (!hasOmiyage) {
            useUIStore.getState().startDialogue(NPC_DIALOGUE.fixer_omiyage_reminder);
          }
          this.updateGamepadButtonStates(pad);
          return;
        }
        if (qs.battle_cowlick_npc_done !== 'true') {
          // Can't leave until cowlick encounter is resolved
          this.updateGamepadButtonStates(pad);
          return;
        }
        // Phone call triggers once after cowlick battle
        if (qs.battle_cowlick_npc_done === 'true' && qs.phoneCallDone !== 'true') {
          useGameStore.getState().setQuestState('phoneCallDone', 'true');
          useUIStore.getState().startDialogue(NPC_DIALOGUE.phone_call_thought);
          this.updateGamepadButtonStates(pad);
          return;
        }
        // Block exit until sister's present and grandma's postcard are bought
        if (qs.phoneCallDone === 'true' && (qs.stationSisterPresentBought !== 'true' || qs.stationPostcardBought !== 'true')) {
          this.updateGamepadButtonStates(pad);
          return;
        }
      }
      this.transitionToMap(transition);
      this.updateGamepadButtonStates(pad);
      return;
    }

    // Collision check for diagonal movement
    if (dx !== 0 && dy !== 0) {
      const cardinalXBlocked = this.isTileBlocked(currentTileX + dx, currentTileY);
      const cardinalYBlocked = this.isTileBlocked(currentTileX, currentTileY + dy);
      const diagonalBlocked = this.isTileBlocked(targetTileX, targetTileY);

      if (diagonalBlocked || (cardinalXBlocked && cardinalYBlocked)) {
        if (!cardinalXBlocked) {
          this.facingDirection = { dx, dy: 0 };
          this.updateGamepadButtonStates(pad);
          return this.movePlayer(currentTileX + dx, currentTileY);
        } else if (!cardinalYBlocked) {
          this.facingDirection = { dx: 0, dy };
          this.updateGamepadButtonStates(pad);
          return this.movePlayer(currentTileX, currentTileY + dy);
        }
        this.playRunAnimation(dx, dy);
        this.updateGamepadButtonStates(pad);
        return;
      }

      if (cardinalXBlocked && cardinalYBlocked) {
        this.playRunAnimation(dx, dy);
        this.updateGamepadButtonStates(pad);
        return;
      }
    } else {
      if (this.isTileBlocked(targetTileX, targetTileY)) {
        this.playRunAnimation(dx, dy);
        this.updateGamepadButtonStates(pad);
        return;
      }
    }

    // Soft collision — decorations you can overlap but not pass through vertically
    if (this.isSoftBlocked(currentTileX, currentTileY, targetTileX, targetTileY, dy)) {
      this.playRunAnimation(dx, dy);
      this.updateGamepadButtonStates(pad);
      return;
    }

    this.movePlayer(targetTileX, targetTileY);
    this.updateGamepadButtonStates(pad);
  }

  private isTileBlocked(x: number, y: number): boolean {
    if (x < 0 || x >= this.currentMap.width || y < 0 || y >= this.currentMap.height) {
      return true;
    }
    return this.currentMap.collision[y][x] === 1;
  }

  /**
   * Soft collision check for decoration tiles (collision value 2).
   * Player can enter these tiles from north/east/west but NOT from south.
   * Player on these tiles cannot exit south.
   */
  private isSoftBlocked(
    fromX: number, fromY: number,
    toX: number, toY: number,
    dy: number
  ): boolean {
    const map = this.currentMap;
    // Can't enter a soft-collision tile from the south (moving north into it)
    if (
      toY >= 0 && toY < map.height && toX >= 0 && toX < map.width &&
      map.collision[toY][toX] === 2 && dy < 0
    ) return true;
    // Can't exit a soft-collision tile to the south
    if (
      fromY >= 0 && fromY < map.height && fromX >= 0 && fromX < map.width &&
      map.collision[fromY][fromX] === 2 && dy > 0
    ) return true;
    return false;
  }

  private isNpcOnTile(x: number, y: number): boolean {
    return this.npcSprites.some((npc) => {
      const npcTileX = Math.floor(npc.x / TILE_SIZE);
      const npcTileY = Math.floor(npc.y / TILE_SIZE);
      return npcTileX === x && npcTileY === y;
    });
  }

  private movePlayer(targetX: number, targetY: number): void {
    this.isMoving = true;

    // Play running animation in the movement direction
    this.playRunAnimation(this.facingDirection.dx, this.facingDirection.dy);

    this.tweens.add({
      targets: this.player,
      x: targetX * TILE_SIZE + TILE_SIZE / 2,
      y: targetY * TILE_SIZE + TILE_SIZE / 2,
      duration: MOVE_DURATION,
      ease: 'Linear',
      onComplete: () => {
        this.isMoving = false;

        // Check if we landed on a transition tile
        const px = Math.floor(this.player.x / TILE_SIZE);
        const py = Math.floor(this.player.y / TILE_SIZE);
        const transition = this.currentMap.transitions.find(
          (t) => t.x === px && t.y === py
        );
        if (transition) {
          // Quest gate: block station exit until food+drink+omiyage are bought
          if (this.currentMap.id === 'ch1_train_station' || this.currentMap.id === 'tiled_train_station') {
            const qs = useGameStore.getState().questStates;
            const hasBoth = qs.stationFoodBought === 'true' && qs.stationDrinkBought === 'true';
            const hasOmiyage = qs.stationOmiyageBought === 'true';
            if (!hasBoth || !hasOmiyage) {
              if (!hasBoth) {
                useUIStore.getState().startDialogue(NPC_DIALOGUE.fixer_food_reminder);
              } else if (!hasOmiyage) {
                useUIStore.getState().startDialogue(NPC_DIALOGUE.fixer_omiyage_reminder);
              }
              return;
            }
            if (qs.battle_cowlick_npc_done !== 'true') {
              return;
            }
            // Phone call triggers once after cowlick battle
            if (qs.battle_cowlick_npc_done === 'true' && qs.phoneCallDone !== 'true') {
              useGameStore.getState().setQuestState('phoneCallDone', 'true');
              useUIStore.getState().startDialogue(NPC_DIALOGUE.phone_call_thought);
              return;
            }
            // Block exit until sister's present and grandma's postcard are bought
            if (qs.phoneCallDone === 'true' && (qs.stationSisterPresentBought !== 'true' || qs.stationPostcardBought !== 'true')) {
              return;
            }
          }
          this.transitionToMap(transition);
          return;
        }

        // Random encounter check
        if (this.encounterCooldown > 0) {
          this.encounterCooldown--;
        } else {
          this.encounterSteps++;
          if (this.encounterSteps >= this.encounterThreshold) {
            const config = MAP_ENCOUNTERS[this.currentMap.id];
            if (config?.enabled && config.enemies.length > 0) {
              const enemyKey = config.enemies[Math.floor(Math.random() * config.enemies.length)];
              const enemy = COMBAT_ENEMIES[enemyKey];
              if (enemy) {
                this.encounterSteps = 0;
                this.rollEncounterThreshold();
                this.encounterCooldown = 5;
                this.startRandomEncounterSequence(enemy, config);
                return;
              }
            }
          }
        }

        // If keys, gamepad, or touch d-pad are still held, immediately start next move (no 1-frame gap)
        const movePad = this.input.gamepad?.pad1 ?? null;
        const moveTouchDir = useUIStore.getState().touchDirection;
        const anyInputHeld =
          this.cursors?.up.isDown || this.cursors?.down.isDown ||
          this.cursors?.left.isDown || this.cursors?.right.isDown ||
          this.wasd?.up.isDown || this.wasd?.down.isDown ||
          this.wasd?.left.isDown || this.wasd?.right.isDown ||
          (moveTouchDir.dx !== 0 || moveTouchDir.dy !== 0) ||
          (movePad != null && (
            Math.abs(movePad.leftStick.x) > this.STICK_DEADZONE ||
            Math.abs(movePad.leftStick.y) > this.STICK_DEADZONE ||
            (movePad.buttons[12]?.pressed ?? false) ||
            (movePad.buttons[13]?.pressed ?? false) ||
            (movePad.buttons[14]?.pressed ?? false) ||
            (movePad.buttons[15]?.pressed ?? false)
          ));

        if (!anyInputHeld) {
          this.showIdleSprite();
        }
      },
    });
  }

  private tryInteract(): void {
    const playerTileX = Math.floor(this.player.x / TILE_SIZE);
    const playerTileY = Math.floor(this.player.y / TILE_SIZE);

    // For interaction, use the facing direction (including diagonals)
    const targetX = playerTileX + this.facingDirection.dx;
    const targetY = playerTileY + this.facingDirection.dy;

    // Check NPC sprites — first on the faced tile, then on the player's own tile
    let npc = this.npcSprites.find((sprite) => {
      const npcTileX = Math.floor(sprite.x / TILE_SIZE);
      const npcTileY = Math.floor(sprite.y / TILE_SIZE);
      return npcTileX === targetX && npcTileY === targetY;
    });
    if (!npc) {
      npc = this.npcSprites.find((sprite) => {
        const npcTileX = Math.floor(sprite.x / TILE_SIZE);
        const npcTileY = Math.floor(sprite.y / TILE_SIZE);
        return npcTileX === playerTileX && npcTileY === playerTileY;
      });
    }

    if (npc) {
      let npcId = npc.getData('npcId') as string;

      // Quest-aware fixer dialogue: progress through food → omiyage quest chain
      if (npcId === 'fixer_food_reminder') {
        const qs = useGameStore.getState().questStates;
        const hasBoth = qs.stationFoodBought === 'true' && qs.stationDrinkBought === 'true';
        if (hasBoth) {
          // Food+drink done — check omiyage status
          const hasOmiyage = qs.stationOmiyageBought === 'true';
          if (hasOmiyage) {
            const cutscenePlayed = qs.cowlickCutscenePlayed === 'true';
            if (!cutscenePlayed) {
              // Trigger "let's go home" dialogue, then cutscene
              useUIStore.getState().startDialogue(NPC_DIALOGUE.tanaka_lets_go_home);
              this.playCowlickEncounterCutscene();
              return;
            }
            npcId = 'fixer_omiyage_done';
            npc.setData('npcId', 'fixer_omiyage_done');
          } else if (qs.stationOmiyagePrompted === 'true') {
            npcId = 'fixer_omiyage_reminder';
          } else {
            npcId = 'fixer_omiyage_prompt';
            npc.setData('npcId', 'fixer_food_reminder'); // Keep as reminder so next interaction checks again
            useGameStore.getState().setQuestState('stationOmiyagePrompted', 'true');
          }
        }
      }

      // Quest-aware cowlick NPC: after battle is won, show post-battle dialogue
      if (npcId === 'npc_cowlick_glasses') {
        const qs = useGameStore.getState().questStates;
        if (qs.battle_cowlick_npc_done === 'true') {
          useUIStore.getState().startDialogue(NPC_DIALOGUE.post_battle_cowlick_npc);
          return;
        }
      }

      // Postcard shop — quest-gated
      if (npcId === 'postcard_shop') {
        const qs = useGameStore.getState().questStates;
        if (qs.phoneCallDone === 'true' && qs.stationPostcardBought !== 'true') {
          useUIStore.getState().startDialogue(NPC_DIALOGUE.postcard_shop_active);
        } else {
          useUIStore.getState().startDialogue(NPC_DIALOGUE.postcard_shop_generic);
        }
        return;
      }

      const dialogue = NPC_DIALOGUE[npcId];
      if (dialogue) {
        useUIStore.getState().startDialogue(dialogue);
        return;
      }
    }

    // Check interaction zones (vending machines, food stalls, etc.)
    if (this.currentMap.interactionZones) {
      const zone = this.currentMap.interactionZones.find(
        (z) => targetX >= z.x && targetX < z.x + z.width &&
               targetY >= z.y && targetY < z.y + z.height
      );
      if (zone) {
        // Gate omiyage shops behind quest progression
        if (zone.npcId === 'omiyage_vendor') {
          const qs = useGameStore.getState().questStates;
          // After omiyage bought + phone call done -> sister's present quest
          if (qs.stationOmiyageBought === 'true') {
            if (qs.phoneCallDone === 'true' && qs.stationSisterPresentBought !== 'true') {
              useUIStore.getState().startDialogue(NPC_DIALOGUE.gift_shop_active);
              return;
            }
            // Everything bought -- generic dialogue
            useUIStore.getState().startDialogue(NPC_DIALOGUE.omiyage_vendor_generic);
            return;
          }
          if (qs.stationOmiyagePrompted !== 'true') {
            // Generic dialogue before Tanaka prompts omiyage
            useUIStore.getState().startDialogue(NPC_DIALOGUE.omiyage_vendor_generic);
            return;
          }
        }
        // Gate postcard shop behind phone call quest
        if (zone.npcId === 'postcard_shop') {
          const qs = useGameStore.getState().questStates;
          if (qs.phoneCallDone === 'true' && qs.stationPostcardBought !== 'true') {
            useUIStore.getState().startDialogue(NPC_DIALOGUE.postcard_shop_active);
          } else {
            useUIStore.getState().startDialogue(NPC_DIALOGUE.postcard_shop_generic);
          }
          return;
        }
        const dialogue = NPC_DIALOGUE[zone.npcId];
        if (dialogue) {
          useUIStore.getState().startDialogue(dialogue);
        }
      }
    }
  }
}
