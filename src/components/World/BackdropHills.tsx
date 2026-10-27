import React from 'react';
import type { DayNightState } from '../../types';

interface BackdropHillsProps {
  dayNight: DayNightState;
  camX: number;
  viewportWidth: number;
}

export const BackdropHills: React.FC<BackdropHillsProps> = ({ dayNight, camX, viewportWidth: _viewportWidth }) => {
  const parallaxX = Math.round(-camX * 0.35);

  // Color shading based on time phase
  const getRidgeColors = () => {
    switch (dayNight.phase) {
      case 'dawn':
        return { far: '#6a7895', mid: '#808b8b', forest: '#55685f' };
      case 'day':
        return { far: '#86a8c4', mid: '#95bba4', forest: '#5c8a66' };
      case 'goldenHour':
        return { far: '#8b7a95', mid: '#a8947f', forest: '#7a7d4f' };
      case 'dusk':
        return { far: '#453a5c', mid: '#5c485c', forest: '#3f4242' };
      case 'night':
        return { far: '#1a1f36', mid: '#1e263d', forest: '#182528' };
    }
  };

  const colors = getRidgeColors();

  return (
    <div className="absolute bottom-0 left-0 h-[900px] w-full pointer-events-none overflow-hidden select-none">
      <svg
        className="h-full absolute bottom-0 left-0"
        style={{
          width: '5000px',
          transform: `translate3d(${parallaxX}px, 0, 0)`,
          willChange: 'transform',
        }}
        viewBox="0 0 5000 900"
        preserveAspectRatio="none"
      >
        {/* Layer 1: Distant Misty Mountain Peaks */}
        <path
          d="
            M 0,900
            L 0,540
            Q 350,420 700,520
            T 1400,480
            Q 1850,380 2300,500
            T 3200,460
            Q 3700,390 4200,510
            T 5000,470
            L 5000,900
            Z
          "
          fill={colors.far}
          opacity="0.85"
          style={{ transition: 'fill 1s ease' }}
        />

        {/* Distant mountain peak highlights / mist */}
        <path
          d="
            M 550,470 Q 700,440 850,510
            M 2150,420 Q 2300,400 2450,480
            M 4050,430 Q 4200,410 4350,490
          "
          fill="none"
          stroke="#ffffff"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity={dayNight.phase === 'night' ? '0.08' : '0.22'}
        />

        {/* Layer 2: Mid-distance Rolling Ridges */}
        <path
          d="
            M 0,900
            L 0,590
            Q 450,520 900,580
            T 1800,560
            Q 2250,510 2700,570
            T 3600,540
            Q 4100,500 4600,570
            T 5000,560
            L 5000,900
            Z
          "
          fill={colors.mid}
          opacity="0.9"
          style={{ transition: 'fill 1s ease' }}
        />

        {/* Distant pine silhouettes along the ridge */}
        <g fill={colors.forest} opacity="0.6">
          {[300, 750, 1150, 1600, 2050, 2500, 2950, 3400, 3850, 4300, 4750].map((treeX, i) => (
            <path
              key={i}
              d={`
                M ${treeX},565
                L ${treeX - 10},590 L ${treeX + 10},590 Z
                M ${treeX},550
                L ${treeX - 8},572 L ${treeX + 8},572 Z
                M ${treeX},538
                L ${treeX - 6},556 L ${treeX + 6},556 Z
              `}
            />
          ))}
        </g>
      </svg>
    </div>
  );
};
