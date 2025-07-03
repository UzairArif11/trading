import { useCallback, useEffect, useMemo, useRef } from 'react';

const useLongPress = (onLongPress, delay = 600, movementThreshold = 5) => {
  const timerRef = useRef(null);
  const startPoint = useRef(null);
  const triggered = useRef(false);

  const clear = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);

  const onPointerDown = useCallback((e) => {
    if (e.button !== 0 || e.pointerType === 'mouse' && e.ctrlKey) return;

    triggered.current = false;
    startPoint.current = { x: e.clientX, y: e.clientY };

    timerRef.current = setTimeout(() => {
      triggered.current = true;
      e.persist?.(); 
      onLongPress(e);
    }, delay);
  }, [onLongPress, delay]);

  const onPointerMove = useCallback((e) => {
    if (!startPoint.current || !timerRef.current) return;

    const dx = Math.abs(e.clientX - startPoint.current.x);
    const dy = Math.abs(e.clientY - startPoint.current.y);

    if (dx > movementThreshold || dy > movementThreshold) clear();
  }, [movementThreshold, clear]);

  useEffect(() => clear, [clear]);

  return {
    handlers: useMemo(() => ({
      onPointerDown,
      onPointerMove,
      onPointerUp: clear,
      onPointerLeave: clear,
      onPointerCancel: clear,
    }), [onPointerDown, onPointerMove, clear]),
    isLongPress: () => triggered.current,
    cancel: clear,
  };
};

export default useLongPress;
