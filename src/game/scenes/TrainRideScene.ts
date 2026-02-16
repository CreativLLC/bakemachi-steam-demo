import Phaser from 'phaser';
import { useGameStore } from '../../store/gameStore';
import { useUIStore } from '../../store/uiStore';
import { inputBus } from '../inputBus';

export class TrainRideScene extends Phaser.Scene {
  private gamepadPrevButtons: boolean[] = new Array(20).fill(false);
  private stickNavPrev = { x: 0, y: 0 };
  private readonly STICK_DEADZONE = 0.4;

  constructor() {
    super({ key: 'TrainRideScene' });
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#0a0a1e');

    // Train interior background image — fill the game canvas
    const { width, height } = this.scale.gameSize;
    const bg = this.add.image(width / 2, height / 2, 'bg-train');
    const scaleX = width / bg.width;
    const scaleY = height / bg.height;
    const scale = Math.max(scaleX, scaleY);
    bg.setScale(scale);

    // Keep background centered and covering when window resizes
    const onResize = (gameSize: Phaser.Structs.Size) => {
      if (!this.cameras?.main) return;
      this.cameras.main.setSize(gameSize.width, gameSize.height);
      bg.setPosition(gameSize.width / 2, gameSize.height / 2);
      const sx = gameSize.width / bg.width;
      const sy = gameSize.height / bg.height;
      bg.setScale(Math.max(sx, sy));
    };
    this.scale.on('resize', onResize);
    this.events.once('shutdown', () => this.scale.off('resize', onResize));

    // Reset edge-detection state
    this.gamepadPrevButtons.fill(false);
    this.stickNavPrev = { x: 0, y: 0 };

    // Tell React to show the tutorial overlay
    useGameStore.getState().setCurrentScene('TrainRide');

    // Watch for tutorial completion
    const unsubscribe = useUIStore.subscribe((state) => {
      if (state.tutorialComplete) {
        unsubscribe();
        this.cameras.main.fadeOut(800, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.scene.start('OverworldScene');
        });
      }
    });
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
    const pad = this.input.gamepad?.pad1 ?? null;
    if (!pad) return;

    // Input mode detection — switch to gamepad when buttons/stick are active
    const anyButton = pad.buttons.some(b => b.pressed);
    const stickActive = Math.abs(pad.leftStick.x) > 0.2 || Math.abs(pad.leftStick.y) > 0.2;
    if (anyButton || stickActive) {
      if (useUIStore.getState().inputMode !== 'gamepad') {
        useUIStore.getState().setInputMode('gamepad');
      }
    }

    // D-pad navigation
    if (this.isGamepadJustDown(pad, 12)) inputBus.emit('navigate_up');
    if (this.isGamepadJustDown(pad, 13)) inputBus.emit('navigate_down');
    if (this.isGamepadJustDown(pad, 14)) inputBus.emit('navigate_left');
    if (this.isGamepadJustDown(pad, 15)) inputBus.emit('navigate_right');

    // Left stick navigation (edge detection)
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

    // A button = confirm
    if (this.isGamepadJustDown(pad, 0)) inputBus.emit('confirm');
    // B button = cancel
    if (this.isGamepadJustDown(pad, 1)) inputBus.emit('cancel');

    this.updateGamepadButtonStates(pad);
  }
}
