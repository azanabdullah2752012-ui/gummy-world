import React, { useRef } from 'react';
import type { CharacterLiveState } from '../../types';
import { CHARACTERS } from '../../data/characters';
import { WORLD_WIDTH } from '../../utils/math';

interface MinimapProps {
  camX: number;
  viewportWidth: number;
  maxCamX: number;
  characters: Record<string, CharacterLiveState>;
  onPanToWorldX: (worldX: number) => void;
}

export const Minimap: React.FC<MinimapProps> = ({
  camX,
  viewportWidth,
  maxCamX: _maxCamX,
  characters,
  onPanToWorldX,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isScrubbingRef = useRef(false);

  const updateMinimapPan = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    if (rect.width <= 0) return;
    const clickRatio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const targetWorldX = clickRatio * WORLD_WIDTH;
    onPanToWorldX(targetWorldX);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    isScrubbingRef.current = true;
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
    updateMinimapPan(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isScrubbingRef.current) return;
    e.stopPropagation();
    updateMinimapPan(e.clientX);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isScrubbingRef.current) return;
    e.stopPropagation();
    isScrubbingRef.current = false;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  // Viewport window indicator in minimap (ratio 0 to 1)
  const windowLeftRatio = camX / WORLD_WIDTH;
  const windowWidthRatio = Math.min(1, viewportWidth / WORLD_WIDTH);

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className="relative w-72 sm:w-96 h-9 bg-[#261d18]/75 backdrop-blur-md rounded-xl border border-[#fffdf8]/20 shadow-lg cursor-pointer overflow-hidden transition-colors hover:bg-[#261d18]/85 select-none"
      title="Click or drag to scrub across the countryside"
    >
      {/* 1. Zone Divider notches */}
      <div className="absolute inset-0 flex justify-between pointer-events-none opacity-20">
        <div className="w-px h-full bg-white/40" style={{ left: `${(1200 / WORLD_WIDTH) * 100}%` }} />
        <div className="w-px h-full bg-white/40" style={{ left: `${(2300 / WORLD_WIDTH) * 100}%` }} />
        <div className="w-px h-full bg-white/40" style={{ left: `${(3400 / WORLD_WIDTH) * 100}%` }} />
        <div className="w-px h-full bg-white/40" style={{ left: `${(4200 / WORLD_WIDTH) * 100}%` }} />
      </div>

      {/* 2. Simplified Terrain Silhouette */}
      <svg className="w-full h-full absolute inset-0 pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 36">
        <path
          d="M 0,26 Q 20,20 40,25 T 70,22 T 100,24 L 100,36 L 0,36 Z"
          fill="#5a8a5f"
          opacity="0.6"
        />
      </svg>

      {/* 3. Character Position Dots */}
      {Object.keys(characters).map(id => {
        const c = characters[id];
        const def = CHARACTERS[id];
        if (!c || !def) return null;
        const leftPct = (c.x / WORLD_WIDTH) * 100;

        return (
          <div
            key={id}
            className={`absolute top-2 w-2 h-2 rounded-full -translate-x-1/2 shadow-sm border border-black/30 pointer-events-none transition-all duration-300 ${
              id === 'gummy' ? 'w-2.5 h-2.5 ring-1 ring-white z-10' : ''
            }`}
            style={{
              left: `${leftPct}%`,
              backgroundColor: def.palette.bodyTop,
            }}
            title={def.name}
          />
        );
      })}

      {/* 4. Active Camera Viewport Frame */}
      <div
        className="absolute top-0.5 bottom-0.5 rounded-lg border-2 border-[#fffdf8] bg-white/15 pointer-events-none shadow"
        style={{
          left: `${windowLeftRatio * 100}%`,
          width: `${windowWidthRatio * 100}%`,
          transition: 'left 0.05s linear',
        }}
      />
    </div>
  );
};
