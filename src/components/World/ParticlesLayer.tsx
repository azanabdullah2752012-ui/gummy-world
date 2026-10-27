import React from 'react';
import type { Particle, DayNightState } from '../../types';
import { WORLD_WIDTH } from '../../utils/math';

interface ParticlesLayerProps {
  particles: Particle[];
  dayNight: DayNightState;
}

export const ParticlesLayer: React.FC<ParticlesLayerProps> = ({ particles, dayNight }) => {
  return (
    <svg
      className="w-full h-full absolute inset-0 overflow-visible pointer-events-none select-none"
      viewBox={`0 0 ${WORLD_WIDTH} 900`}
      preserveAspectRatio="none"
    >
      <defs>
        <radialGradient id="firefly-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffff8d" stopOpacity="1" />
          <stop offset="40%" stopColor="#c6ff00" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#c6ff00" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* 1. Fireflies hovering across countryside during dusk and night */}
      {dayNight.firefliesActive && (
        <g>
          {[
            { x: 1550, y: 680, speed: 1.2, id: 'ff1' },
            { x: 1720, y: 710, speed: 1.8, id: 'ff2' },
            { x: 2150, y: 660, speed: 1.4, id: 'ff3' },
            { x: 2850, y: 690, speed: 2.1, id: 'ff4' },
            { x: 3100, y: 670, speed: 1.6, id: 'ff5' },
            { x: 3850, y: 640, speed: 1.5, id: 'ff6' },
            { x: 850, y: 690, speed: 1.3, id: 'ff7' },
            { x: 4400, y: 610, speed: 1.9, id: 'ff8' },
          ].map(ff => {
            return (
              <g
                key={ff.id}
                transform={`translate(${ff.x}, ${ff.y})`}
                style={{
                  animation: `fireflyFloat ${ff.speed * 2.2}s ease-in-out infinite alternate`,
                }}
              >
                <circle cx="0" cy="0" r="14" fill="url(#firefly-glow)" />
                <circle cx="0" cy="0" r="2.5" fill="#ffffff" />
              </g>
            );
          })}
        </g>
      )}

      {/* 2. Interactive Spawning Particles */}
      {particles.map(p => {
        const normLife = Math.max(0, p.life / p.maxLife);
        const opacity = normLife * p.alpha;

        if (p.shape === 'leaf') {
          return (
            <g
              key={p.id}
              transform={`translate(${p.x}, ${p.y}) rotate(${p.life * 120})`}
              opacity={opacity}
            >
              <path d="M 0,-4 Q 6,0 0,6 Q -6,0 0,-4" fill={p.color} />
            </g>
          );
        }

        if (p.shape === 'smoke') {
          const scale = (1 - normLife * 0.4) * (p.size / 6);
          return (
            <circle
              key={p.id}
              cx={p.x}
              cy={p.y}
              r={p.size * scale}
              fill={p.color}
              opacity={opacity * 0.6}
            />
          );
        }

        if (p.shape === 'spark') {
          return (
            <g key={p.id} transform={`translate(${p.x}, ${p.y})`} opacity={opacity}>
              <polygon points="0,-4 3,0 0,4 -3,0" fill={p.color} />
            </g>
          );
        }

        // Default water drop or circular particle
        return (
          <circle
            key={p.id}
            cx={p.x}
            cy={p.y}
            r={p.size * normLife}
            fill={p.color}
            opacity={opacity}
          />
        );
      })}
    </svg>
  );
};
