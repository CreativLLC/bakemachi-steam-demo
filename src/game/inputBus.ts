/**
 * Synchronous event bus for input actions.
 * Phaser's gamepad polling emits actions here;
 * React components subscribe via useInputAction hook.
 */

export type InputAction =
  | 'confirm'
  | 'cancel'
  | 'navigate_up'
  | 'navigate_down'
  | 'navigate_left'
  | 'navigate_right'
  | 'toggle_translation'
  | 'menu_inventory'
  | 'menu_settings';

type InputActionListener = (action: InputAction) => void;

const listeners = new Set<InputActionListener>();

export const inputBus = {
  emit(action: InputAction): void {
    for (const fn of listeners) fn(action);
  },
  subscribe(fn: InputActionListener): () => void {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
};
