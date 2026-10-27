import { useState, useEffect, useRef, useCallback } from 'react';
import { WORLD_WIDTH } from '../utils/math';

interface UseCameraOptions {
  viewportWidth: number;
}

export function useCamera({ viewportWidth }: UseCameraOptions) {
  const maxCamX = Math.max(0, WORLD_WIDTH - viewportWidth);

  // Start centered on Gummy's home around x=2350, or from URL ?camX= query param if present
  const getInitialCamX = () => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const camParam = params.get('camX');
      if (camParam !== null) {
        const parsed = parseFloat(camParam);
        if (!Number.isNaN(parsed)) {
          return Math.max(0, Math.min(maxCamX, parsed));
        }
      }
    }
    return Math.max(0, Math.min(maxCamX, 2350 - viewportWidth / 2));
  };

  const initialCamX = getInitialCamX();
  const [camX, setCamX] = useState<number>(initialCamX);

  const camXRef = useRef(initialCamX);

  useEffect(() => {
    camXRef.current = camX;
  }, [camX]);

  // Dragging and velocity state
  const isPointerDownRef = useRef(false);
  const isDraggingRef = useRef(false);
  const pointerDownXRef = useRef(0);
  const dragStartXRef = useRef(0);
  const camStartXRef = useRef(0);
  const velocityRef = useRef(0);
  const lastPointerXRef = useRef(0);
  const lastPointerTimeRef = useRef(0);

  // Target camera focus (for smooth pan to character)
  const targetCamXRef = useRef<number | null>(null);

  const setCameraXClamped = useCallback(
    (newX: number) => {
      const clamped = Math.max(0, Math.min(maxCamX, newX));
      camXRef.current = clamped;
      setCamX(clamped);
    },
    [maxCamX]
  );

  // Smooth focus on world X position
  const focusOnWorldX = useCallback(
    (worldX: number) => {
      const target = Math.max(0, Math.min(maxCamX, worldX - viewportWidth / 2));
      targetCamXRef.current = target;
    },
    [maxCamX, viewportWidth]
  );

  // Pointer drag start: record position but DO NOT engage drag until threshold exceeded
  const handlePointerDown = useCallback((clientX: number) => {
    isPointerDownRef.current = true;
    isDraggingRef.current = false;
    pointerDownXRef.current = clientX;
    dragStartXRef.current = clientX;
    camStartXRef.current = camXRef.current;
    velocityRef.current = 0;
    targetCamXRef.current = null;
    lastPointerXRef.current = clientX;
    lastPointerTimeRef.current = performance.now();
  }, []);

  // Pointer drag move: only move camera if moved > 6px from initial press
  const handlePointerMove = useCallback(
    (clientX: number) => {
      if (!isPointerDownRef.current) return;

      if (!isDraggingRef.current) {
        const dist = Math.abs(clientX - pointerDownXRef.current);
        if (dist > 6) {
          isDraggingRef.current = true;
          dragStartXRef.current = clientX;
          camStartXRef.current = camXRef.current;
          lastPointerXRef.current = clientX;
          lastPointerTimeRef.current = performance.now();
          targetCamXRef.current = null; // Cancel automated pan only on actual drag
        } else {
          return;
        }
      }

      const dx = clientX - dragStartXRef.current;
      setCameraXClamped(camStartXRef.current - dx);

      const now = performance.now();
      const dt = (now - lastPointerTimeRef.current) / 1000;
      if (dt > 0.005) {
        velocityRef.current = -(clientX - lastPointerXRef.current) / dt;
        lastPointerXRef.current = clientX;
        lastPointerTimeRef.current = now;
      }
    },
    [setCameraXClamped]
  );

  // Pointer drag release: clear dragging state
  const handlePointerUp = useCallback(() => {
    isPointerDownRef.current = false;
    if (!isDraggingRef.current) {
      velocityRef.current = 0;
    }
    isDraggingRef.current = false;
  }, []);

  // Camera animation tick (called every frame from game loop)
  const updateCamera = useCallback(
    (dt: number) => {
      // 1. If smoothly panning toward a target
      if (targetCamXRef.current !== null) {
        const diff = targetCamXRef.current - camXRef.current;
        if (Math.abs(diff) < 2) {
          setCameraXClamped(targetCamXRef.current);
          targetCamXRef.current = null;
        } else {
          const step = diff * Math.min(1, dt * 7.5);
          setCameraXClamped(camXRef.current + step);
        }
        return;
      }

      // 2. Inertial momentum after drag release
      if (!isDraggingRef.current && Math.abs(velocityRef.current) > 5) {
        const move = velocityRef.current * dt;
        setCameraXClamped(camXRef.current + move);
        // Friction decay
        velocityRef.current *= Math.pow(0.08, dt);
      }
    },
    [setCameraXClamped]
  );

  // Keyboard navigation listener (Arrow keys and A/D)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const panSpeed = 350; // px per second
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        velocityRef.current = -panSpeed;
        targetCamXRef.current = null;
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        velocityRef.current = panSpeed;
        targetCamXRef.current = null;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return {
    camX,
    maxCamX,
    setCameraXClamped,
    focusOnWorldX,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    updateCamera,
    isDragging: isDraggingRef,
  };
}
