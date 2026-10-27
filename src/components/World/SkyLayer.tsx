import React, { useMemo } from 'react';
import type { DayNightState } from '../../types';

interface SkyLayerProps {
  dayNight: DayNightState;
  camX: number;
  viewportWidth: number;
}

export const SkyLayer: React.FC<SkyLayerProps> = ({ dayNight, camX, viewportWidth }) => {
  const { skyGradient, sunPosition, moonPosition, starsOpacity } = dayNight;

  // Generate deterministic stars once
  const stars = useMemo(() => {
    const list = [];
    for (let i = 0; i < 90; i++) {
      const seed = i * 137.5;
      const x = (seed * 19) % 5000;
      const y = (seed * 31) % 450;
      const r = 0.8 + ((seed * 7) % 1.6);
      const twinkleSpeed = 1.5 + ((seed * 3) % 2.5);
      list.push({ id: i, x, y, r, twinkleSpeed });
    }
    return list;
  }, []);

  // Parallax clouds
  const clouds = useMemo(() => {
    return [
      { id: 1, worldX: 400, y: 120, scale: 1.1, opacity: 0.85 },
      { id: 2, worldX: 1100, y: 80, scale: 0.9, opacity: 0.75 },
      { id: 3, worldX: 1900, y: 160, scale: 1.3, opacity: 0.9 },
      { id: 4, worldX: 2700, y: 95, scale: 1.0, opacity: 0.8 },
      { id: 5, worldX: 3600, y: 140, scale: 1.2, opacity: 0.85 },
      { id: 6, worldX: 4400, y: 110, scale: 0.95, opacity: 0.75 },
    ];
  }, []);

  // Parallax factor for sky background elements
  const skyParallax = camX * 0.15;

  return (
    <div
      className="absolute inset-0 pointer-events-none overflow-hidden select-none"
      style={{
        background: `linear-gradient(to bottom, ${skyGradient[0]} 0%, ${skyGradient[1]} 55%, ${skyGradient[2]} 100%)`,
        transition: 'background 1.2s ease',
      }}
    >
      <svg
        className="w-full h-full absolute inset-0"
        viewBox={`0 0 ${viewportWidth} 900`}
        preserveAspectRatio="none"
      >
        <defs>
          <radialGradient id="sun-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fff8db" stopOpacity="1" />
            <stop offset="35%" stopColor="#fdd673" stopOpacity="0.8" />
            <stop offset="70%" stopColor="#fca253" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#fca253" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="moon-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="40%" stopColor="#dbe8fd" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#dbe8fd" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* 1. Starfield (Dusk and Night) */}
        {starsOpacity > 0.05 && (
          <g opacity={starsOpacity} style={{ transition: 'opacity 1s ease' }}>
            {stars.map(star => {
              // Parallax screen position
              const screenX = (star.x - camX * 0.08) % 5000;
              const normalizedX = screenX < 0 ? screenX + 5000 : screenX;
              if (normalizedX > viewportWidth + 50) return null;

              return (
                <circle
                  key={star.id}
                  cx={normalizedX}
                  cy={star.y}
                  r={star.r}
                  fill="#ffffff"
                  style={{
                    animation: `twinkle ${star.twinkleSpeed}s ease-in-out infinite alternate`,
                  }}
                />
              );
            })}
          </g>
        )}

        {/* 2. Celestial Sun */}
        {sunPosition.visible && (
          <g
            transform={`translate(${viewportWidth * sunPosition.x - skyParallax * 0.4}, ${
              380 - sunPosition.y * 280
            })`}
          >
            {/* Outer halo */}
            <circle cx="0" cy="0" r="85" fill="url(#sun-glow)" />
            {/* Core Sun */}
            <circle cx="0" cy="0" r="32" fill="#fffbe8" stroke="#fcd34d" strokeWidth="2" />
          </g>
        )}

        {/* 3. Celestial Moon */}
        {moonPosition.visible && (
          <g
            transform={`translate(${viewportWidth * moonPosition.x - skyParallax * 0.4}, ${
              340 - moonPosition.y * 250
            })`}
          >
            {/* Soft moonlight halo */}
            <circle cx="0" cy="0" r="70" fill="url(#moon-glow)" />
            {/* Crescent Moon */}
            <path
              d="M -16,-26 A 28 28 0 1 0 20,20 A 24 24 0 1 1 -16,-26 Z"
              fill="#fffdf5"
              stroke="#dce7f5"
              strokeWidth="1.5"
            />
          </g>
        )}

        {/* 4. Storybook Cumulus Clouds */}
        <g style={{ opacity: dayNight.phase === 'night' ? 0.25 : 0.9 }}>
          {clouds.map(c => {
            const screenX = c.worldX - camX * 0.25;
            if (screenX < -250 || screenX > viewportWidth + 250) return null;

            return (
              <g
                key={c.id}
                transform={`translate(${screenX}, ${c.y}) scale(${c.scale})`}
                opacity={c.opacity}
              >
                {/* Cloud shadow base */}
                <path
                  d="M 20,40 Q 30,15 60,18 Q 85,-5 125,5 Q 160,-8 185,15 Q 215,10 225,40 Q 235,65 200,68 L 30,68 Q 10,65 20,40 Z"
                  fill={dayNight.phase === 'goldenHour' ? '#f5cfb5' : dayNight.phase === 'night' ? '#252e4a' : '#eaf2f8'}
                />
                {/* Cloud fluffy highlight */}
                <path
                  d="M 20,38 Q 30,13 60,16 Q 85,-7 125,3 Q 160,-10 185,13 Q 215,8 225,38 Q 235,62 195,64 L 30,64 Q 12,62 20,38 Z"
                  fill={dayNight.phase === 'goldenHour' ? '#fff0e0' : dayNight.phase === 'night' ? '#333e61' : '#ffffff'}
                />
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
};
