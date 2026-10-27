import { useEffect, useRef } from 'react';

export function useGameLoop(onTick: (deltaTimeSeconds: number) => void) {
  const onTickRef = useRef(onTick);
  const lastTimeRef = useRef<number>(0);
  const rafIdRef = useRef<number | null>(null);
  const isHiddenRef = useRef<boolean>(false);

  useEffect(() => {
    onTickRef.current = onTick;
  }, [onTick]);

  useEffect(() => {
    isHiddenRef.current = typeof document !== 'undefined' ? document.hidden : false;

    // Page Visibility API handler
    const handleVisibilityChange = () => {
      if (document.hidden) {
        isHiddenRef.current = true;
      } else {
        // Just returned to visibility: reset lastTime so no giant delta-time leap occurs
        isHiddenRef.current = false;
        lastTimeRef.current = performance.now();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    const loop = (now: number) => {
      if (!isHiddenRef.current) {
        const rawDt = (now - lastTimeRef.current) / 1000;
        // Clamp dt between 0.001 and 0.1 to avoid frame drop physics skips
        const dt = Math.max(0.001, Math.min(0.1, rawDt));
        onTickRef.current(dt);
      }
      lastTimeRef.current = now;
      rafIdRef.current = requestAnimationFrame(loop);
    };

    lastTimeRef.current = performance.now();
    rafIdRef.current = requestAnimationFrame(loop);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);
}
