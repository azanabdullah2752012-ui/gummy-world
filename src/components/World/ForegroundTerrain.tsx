import React, { useMemo } from 'react';
import type { DayNightState } from '../../types';
import { getGroundY, WORLD_WIDTH } from '../../utils/math';

interface ForegroundTerrainProps {
  dayNight: DayNightState;
}

export const ForegroundTerrain: React.FC<ForegroundTerrainProps> = ({ dayNight }) => {
  const { groundPath, soilPath, grassHighlightPath, countryPathWest, countryPathEast } = useMemo(() => {
    const step = 20;
    let d = `M 0,${getGroundY(0)}`;
    let highlightD = `M 0,${getGroundY(0)}`;

    for (let x = step; x <= WORLD_WIDTH; x += step) {
      const y = getGroundY(x);
      d += ` L ${x},${y}`;
      highlightD += ` L ${x},${y}`;
    }

    // Close bottom of ground shape
    const fullGround = `${d} L ${WORLD_WIDTH},900 L 0,900 Z`;

    // Soil sublayer path starting 38px below surface
    let soilD = `M 0,${getGroundY(0) + 38}`;
    for (let x = step; x <= WORLD_WIDTH; x += step) {
      const y = getGroundY(x) + 38;
      soilD += ` L ${x},${y}`;
    }
    const fullSoil = `${soilD} L ${WORLD_WIDTH},900 L 0,900 Z`;

    // Country dirt path segments: follow terrain elevation precisely, pause at footbridge and pond
    let pathWestD = `M 0,${getGroundY(0) + 8}`;
    for (let x = step; x <= 1295; x += step) {
      pathWestD += ` L ${x},${getGroundY(x) + 8}`;
    }

    let pathEastD = `M 1820,${getGroundY(1820) + 8}`;
    for (let x = 1820 + step; x <= WORLD_WIDTH; x += step) {
      pathEastD += ` L ${x},${getGroundY(x) + 8}`;
    }

    return {
      groundPath: fullGround,
      soilPath: fullSoil,
      grassHighlightPath: highlightD,
      countryPathWest: pathWestD,
      countryPathEast: pathEastD,
    };
  }, []);

  // Palette adjusted by time of day
  const getGroundColors = () => {
    switch (dayNight.phase) {
      case 'dawn':
        return {
          grassTop: '#689d6a',
          grassMid: '#4e7e52',
          soil: '#533c32',
          path: '#cbb08f',
          water: '#5689a8',
          waterShine: '#88bfdf',
        };
      case 'day':
        return {
          grassTop: '#6cb370',
          grassMid: '#4d8c52',
          soil: '#5c4135',
          path: '#dec7a4',
          water: '#4f9bc4',
          waterShine: '#93dbf5',
        };
      case 'goldenHour':
        return {
          grassTop: '#84a856',
          grassMid: '#5c7b38',
          soil: '#63402e',
          path: '#e4b67e',
          water: '#5e859b',
          waterShine: '#f3c490',
        };
      case 'dusk':
        return {
          grassTop: '#3e5c46',
          grassMid: '#2d4434',
          soil: '#3d2b24',
          path: '#997c65',
          water: '#354d68',
          waterShine: '#7386a3',
        };
      case 'night':
        return {
          grassTop: '#1b2d22',
          grassMid: '#14221a',
          soil: '#251b17',
          path: '#483c35',
          water: '#162438',
          waterShine: '#2e496b',
        };
    }
  };

  const colors = getGroundColors();

  // Pond center & geometry
  const pondX = 1650;
  const pondY = getGroundY(pondX) + 12;

  return (
    <svg
      className="w-full h-full absolute inset-0 pointer-events-none select-none"
      viewBox={`0 0 ${WORLD_WIDTH} 900`}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="ground-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={colors.grassTop} />
          <stop offset="28%" stopColor={colors.grassMid} />
          <stop offset="100%" stopColor={colors.soil} />
        </linearGradient>

        <linearGradient id="pond-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={colors.waterShine} stopOpacity="0.8" />
          <stop offset="40%" stopColor={colors.water} />
          <stop offset="100%" stopColor={colors.soil} />
        </linearGradient>
      </defs>

      {/* 1. Base Soil Sublayer */}
      <path d={soilPath} fill={colors.soil} />

      {/* 2. Main Rolling Green Turf */}
      <path d={groundPath} fill="url(#ground-gradient)" />

      {/* 3. Surface Grass Blade Rim Highlight */}
      <path
        d={grassHighlightPath}
        fill="none"
        stroke={colors.grassTop}
        strokeWidth="3.5"
        opacity="0.85"
      />

      {/* 4. Natural Country Dirt Walking Paths (Following terrain, cleanly pausing at bridge and pond) */}
      <path
        d={countryPathWest}
        fill="none"
        stroke={colors.path}
        strokeWidth="11"
        strokeLinecap="round"
        opacity="0.65"
      />
      <path
        d={countryPathEast}
        fill="none"
        stroke={colors.path}
        strokeWidth="11"
        strokeLinecap="round"
        opacity="0.65"
      />

      {/* 5. Country Wooden Footbridge (x = 1350, exactly anchored to terrain elevations) */}
      {(() => {
        const x1 = 1295;
        const y1 = getGroundY(x1);
        const x2 = 1405;
        const y2 = getGroundY(x2);
        const midX = 1350;
        const peakY = getGroundY(midX) - 22;

        const pile1X = 1320;
        const pile1DeckY = 702.5;
        const pile1GroundY = getGroundY(pile1X) + 18;

        const pile2X = 1380;
        const pile2DeckY = 711.2;
        const pile2GroundY = getGroundY(pile2X) + 18;

        return (
          <g>
            {/* Bridge support pilings driven securely into the stream banks */}
            <rect
              x={pile1X - 4}
              y={pile1DeckY}
              width="8"
              height={pile1GroundY - pile1DeckY}
              rx="2"
              fill="#4a3528"
              stroke="#2c1f18"
              strokeWidth="1.5"
            />
            <rect
              x={pile2X - 4}
              y={pile2DeckY}
              width="8"
              height={pile2GroundY - pile2DeckY}
              rx="2"
              fill="#4a3528"
              stroke="#2c1f18"
              strokeWidth="1.5"
            />

            {/* Bridge wooden arch deck - ends meet terrain exactly */}
            <path
              d={`
                M ${x1},${y1}
                Q ${midX},${peakY} ${x2},${y2}
                L ${x2},${y2 + 8}
                Q ${midX},${peakY + 8} ${x1},${y1 + 8}
                Z
              `}
              fill="#8a6142"
              stroke="#38251a"
              strokeWidth="2"
            />

            {/* Wooden deck planks texture */}
            <line x1={midX - 30} y1={peakY + 1} x2={midX - 30} y2={peakY + 9} stroke="#5c3e27" strokeWidth="1.5" />
            <line x1={midX} y1={peakY - 1} x2={midX} y2={peakY + 7} stroke="#5c3e27" strokeWidth="1.5" />
            <line x1={midX + 30} y1={peakY + 3} x2={midX + 30} y2={peakY + 11} stroke="#5c3e27" strokeWidth="1.5" />

            {/* Rope Railing Posts */}
            <line x1={x1 + 8} y1={y1 - 14} x2={x1 + 8} y2={y1} stroke="#5a3b25" strokeWidth="2.2" strokeLinecap="round" />
            <line x1={midX} y1={peakY - 16} x2={midX} y2={peakY} stroke="#5a3b25" strokeWidth="2.2" strokeLinecap="round" />
            <line x1={x2 - 8} y1={y2 - 14} x2={x2 - 8} y2={y2} stroke="#5a3b25" strokeWidth="2.2" strokeLinecap="round" />

            {/* Wooden Handrail Curve */}
            <path
              d={`
                M ${x1 + 8},${y1 - 14}
                Q ${midX},${peakY - 18} ${x2 - 8},${y2 - 14}
              `}
              fill="none"
              stroke="#5a3b25"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </g>
        );
      })()}

      {/* 6. The Dragonfly Pond (x = 1650) */}
      <g transform={`translate(${pondX - 160}, ${pondY - 10})`}>
        {/* Water basin */}
        <ellipse cx="160" cy="30" rx="160" ry="34" fill="url(#pond-gradient)" />
        {/* Gentle water ripple rings */}
        <ellipse cx="120" cy="28" rx="45" ry="10" fill="none" stroke={colors.waterShine} strokeWidth="1.2" opacity="0.6" />
        <ellipse cx="205" cy="34" rx="60" ry="12" fill="none" stroke={colors.waterShine} strokeWidth="1.2" opacity="0.5" />

        {/* Floating Lily Pads */}
        <g transform="translate(90, 22)">
          <ellipse cx="0" cy="0" rx="14" ry="7" fill="#3e8248" stroke="#24542c" strokeWidth="1" />
          <path d="M 0,0 L 14,-2" stroke="#24542c" strokeWidth="1.5" />
          <circle cx="2" cy="-2" r="3" fill="#f48fb1" />
        </g>
        <g transform="translate(210, 36)">
          <ellipse cx="0" cy="0" rx="18" ry="8" fill="#3e8248" stroke="#24542c" strokeWidth="1" />
          <path d="M 0,0 L 17,-3" stroke="#24542c" strokeWidth="1.5" />
          <circle cx="-1" cy="-2" r="3.5" fill="#ffffff" />
        </g>

        {/* Cattails & reeds at pond bank */}
        <g transform="translate(15, -15)">
          <line x1="0" y1="35" x2="5" y2="0" stroke="#3d6b38" strokeWidth="2.5" />
          <line x1="8" y1="35" x2="12" y2="5" stroke="#3d6b38" strokeWidth="2" />
          <rect x="3" y="2" width="4" height="18" rx="2" fill="#5c3c26" />
        </g>
        <g transform="translate(295, -12)">
          <line x1="0" y1="35" x2="-4" y2="2" stroke="#3d6b38" strokeWidth="2.5" />
          <rect x="-6" y="4" width="4" height="16" rx="2" fill="#5c3c26" />
        </g>
      </g>

      {/* 7. Countryside Fence Posts across the Meadow */}
      {[
        { x: 920, count: 4 },
        { x: 2360, count: 5 },
        { x: 3340, count: 4 },
      ].map((fence, fIdx) => (
        <g key={fIdx}>
          {Array.from({ length: fence.count }).map((_, pIdx) => {
            const postX = fence.x + pIdx * 35;
            const postY = getGroundY(postX) - 2;
            return (
              <g key={pIdx}>
                <rect
                  x={postX}
                  y={postY - 26}
                  width="6"
                  height="28"
                  rx="1"
                  fill="#8d6849"
                  stroke="#422e1e"
                  strokeWidth="1.2"
                />
                {pIdx > 0 && (
                  <line
                    x1={postX - 35}
                    y1={getGroundY(postX - 35) - 16}
                    x2={postX}
                    y2={postY - 16}
                    stroke="#8d6849"
                    strokeWidth="2.2"
                  />
                )}
              </g>
            );
          })}
        </g>
      ))}

      {/* 8. Wildflower Sprigs & Grass Tufts dotted along the surface */}
      {[
        180, 420, 680, 1080, 1850, 2180, 2480, 2850, 3200, 3550, 3950, 4250, 4700,
      ].map((tuftX, i) => {
        const tuftY = getGroundY(tuftX);
        const flowerColors = ['#f48fb1', '#fff59d', '#90caf9', '#ce93d8', '#ffcc80'];
        const fColor = flowerColors[i % flowerColors.length];
        return (
          <g key={i} transform={`translate(${tuftX}, ${tuftY - 6})`}>
            <path
              d="M -6,6 Q -8,-4 -12,-8 M 0,6 Q 0,-6 0,-12 M 6,6 Q 8,-4 12,-8"
              fill="none"
              stroke={colors.grassTop}
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle cx="0" cy="-13" r="2.8" fill={fColor} />
          </g>
        );
      })}
    </svg>
  );
};
