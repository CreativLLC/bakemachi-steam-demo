import { useEffect, useRef } from 'react';
import { inputBus } from '../../game/inputBus';
import type { InputAction } from '../../game/inputBus';

/**
 * Subscribe to input actions from the gamepad/keyboard event bus.
 * Callback fires synchronously when the action occurs.
 */
export function useInputAction(
  action: InputAction | InputAction[],
  callback: () => void,
  enabled = true,
): void {
  const cbRef = useRef(callback);
  cbRef.current = callback;

  useEffect(() => {
    if (!enabled) return;
    const actions = Array.isArray(action) ? action : [action];
    return inputBus.subscribe((emitted) => {
      if (actions.includes(emitted)) cbRef.current();
    });
  }, [action, enabled]);
}
