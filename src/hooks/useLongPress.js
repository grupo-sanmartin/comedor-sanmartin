import { useCallback, useRef } from 'react';

/** Returns pointer handlers that fire `callback` after the element is held for `ms`. */
export function useLongPress(callback, ms = 1200) {
  const timer = useRef(null);

  const cancel = useCallback(() => {
    clearTimeout(timer.current);
    timer.current = null;
  }, []);

  const start = useCallback(() => {
    cancel();
    timer.current = setTimeout(() => {
      timer.current = null;
      callback();
    }, ms);
  }, [callback, cancel, ms]);

  return {
    onPointerDown: start,
    onPointerUp: cancel,
    onPointerLeave: cancel,
    onPointerCancel: cancel,
    onContextMenu: (e) => e.preventDefault(),
  };
}
