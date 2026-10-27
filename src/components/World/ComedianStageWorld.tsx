import React, { useState } from 'react';
import type { DayNightState, Particle } from '../../types';
import type { ComedianState, WhimsicalPropId } from '../../types/comedian';
import { WHIMSICAL_PROPS } from '../../data/comedian';
import { getGroundY, getGroundSlope } from '../../utils/math';
import { soundEngine } from '../../audio/soundEngine';

interface ComedianStageWorldProps {
  comedianState: ComedianState;
  dayNight: DayNightState;
  onOpenStage: () => void;
  onSpawnParticles: (particles: Particle[]) => void;
}

export const ComedianStageWorld: React.FC<ComedianStageWorldProps> = ({
  comedianState,
  dayNight: _dayNight,
  onOpenStage,
  onSpawnParticles,
}) => {
  const stageBaseX = 1360;
  const stageWidth = 150;
  const groundY = getGroundY(stageBaseX + stageWidth / 2);
  const slopeRad = getGroundSlope(stageBaseX + stageWidth / 2);
  const slopeDeg = (slopeRad * 180) / Math.PI;

  const [jackPopped, setJackPopped] = useState(false);
  const [puppetWiggle, setPuppetWiggle] = useState(false);

  const handlePropClick = (e: React.MouseEvent, propId: WhimsicalPropId, worldX: number) => {
    e.stopPropagation();

    if (propId === 'bubble-frog') {
      soundEngine.playWaterRipple();
      const pGroundY = getGroundY(worldX);
      // Spawn floating bubbles
      const bubbles: Particle[] = Array.from({ length: 7 }).map((_, i) => ({
        id: Date.now() + i,
        x: worldX + (Math.random() * 14 - 7),
        y: pGroundY - 24 + (Math.random() * 8 - 4),
        vx: 15 + Math.random() * 25,
        vy: -20 - Math.random() * 30,
        color: ['#cffafe', '#e0e7ff', '#fce7f3'][i % 3],
        size: 5,
        alpha: 0.85,
        maxLife: 2.2,
        life: 2.2,
        shape: 'circle',
      }));
      onSpawnParticles(bubbles);
    } else if (propId === 'jack-box') {
      soundEngine.playGumdropPop(587.33);
      setJackPopped(true);
      setTimeout(() => setJackPopped(false), 900);
    } else if (propId === 'kazoo-pipe') {
      soundEngine.playFlowerChime();
      const pGroundY = getGroundY(worldX);
      const notes: Particle[] = Array.from({ length: 4 }).map((_, i) => ({
        id: Date.now() + i,
        x: worldX + (Math.random() * 12 - 6),
        y: pGroundY - 28 + (Math.random() * 10 - 5),
        vx: (Math.random() - 0.5) * 30,
        vy: -35 - Math.random() * 25,
        color: '#f43f5e',
        size: 4,
        alpha: 1,
        maxLife: 1.6,
        life: 1.6,
        shape: 'spark',
      }));
      onSpawnParticles(notes);
    } else if (propId === 'sunflower-puppet') {
      soundEngine.playLeafRustle();
      setPuppetWiggle(true);
      setTimeout(() => setPuppetWiggle(false), 800);
    }
  };

  return (
    <svg
      className="w-full h-full absolute inset-0 overflow-visible pointer-events-none select-none"
      viewBox="0 0 5000 900"
      preserveAspectRatio="none"
    >
      <g transform={`translate(${stageBaseX}, ${groundY})`}>
        {/* Contact shadow */}
        <ellipse cx="75" cy="4" rx="82" ry="8.5" fill="#2d3748" opacity="0.32" />

        {/* Stage Timber Plinth */}
        <g transform={`rotate(${slopeDeg * 0.4})`}>
          {/* Low platform base */}
          <polygon
            points={`0,-8 ${stageWidth},-8 ${stageWidth + 4},4 -4,4`}
            fill="#854d0e"
            stroke="#451a03"
            strokeWidth="1.5"
          />
          {/* Proscenium Arch Uprights */}
          <rect x="6" y="-62" width="7" height="56" rx="1.5" fill="#9a3412" stroke="#431407" strokeWidth="1" />
          <rect x={stageWidth - 13} y="-62" width="7" height="56" rx="1.5" fill="#9a3412" stroke="#431407" strokeWidth="1" />
          {/* Curved top valance */}
          <path
            d={`M 6,-60 Q ${stageWidth / 2},-72 ${stageWidth - 6},-60`}
            fill="none"
            stroke="#9a3412"
            strokeWidth="4"
            strokeLinecap="round"
          />

          {/* Whimsical Polka-Dot Bunting Garland */}
          <path
            d={`M 10,-56 Q ${stageWidth / 2},-44 ${stageWidth - 10},-56`}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="1.2"
          />
          {[25, 45, 65, 85, 105, 125].map((bx, i) => (
            <polygon
              key={i}
              points={`${bx},-50 ${bx + 10},-50 ${bx + 5},-40`}
              fill={['#f43f5e', '#fbbf24', '#38bdf8', '#a855f7'][i % 4]}
              stroke="#1e293b"
              strokeWidth="0.8"
            />
          ))}

          {/* Wooden signplate on front: "COMEDY CORNER" */}
          <g
            className="pointer-events-auto cursor-pointer"
            onClick={e => {
              e.stopPropagation();
              onOpenStage();
            }}
          >
            <rect x="42" y="-18" width="66" height="15" rx="3" fill="#fef3c7" stroke="#78350f" strokeWidth="1.2" />
            <text x="75" y="-7.5" textAnchor="middle" className="fill-[#78350f] font-bold text-[9px] select-none">
              🎭 JOKE STAGE
            </text>
          </g>
        </g>
      </g>

      {/* ── INTERACTIVE PROPS ALONG THE BROOK STAGE ── */}
      {WHIMSICAL_PROPS.map(prop => {
        const pGroundY = getGroundY(prop.offsetX);
        const isActive = comedianState.activeProps[prop.id];
        if (!isActive) return null;

        return (
          <g
            key={prop.id}
            transform={`translate(${prop.offsetX}, ${pGroundY})`}
            className="pointer-events-auto cursor-pointer group"
            onClick={e => handlePropClick(e, prop.id, prop.offsetX)}
          >
            {/* Prop contact shadow */}
            <ellipse cx="0" cy="1" rx="11" ry="3" fill="#2d3748" opacity="0.35" />

            {/* Prop Specific Geometry */}
            {prop.id === 'bubble-frog' && (
              <g transform="translate(0, -10)">
                {/* Green mechanical frog body */}
                <ellipse cx="0" cy="0" rx="9" ry="7" fill="#16a34a" stroke="#14532d" strokeWidth="1.2" />
                <circle cx="-4" cy="-5" r="2.8" fill="#22c55e" />
                <circle cx="-4" cy="-5" r="1.2" fill="#14532d" />
                <circle cx="4" cy="-5" r="2.8" fill="#22c55e" />
                <circle cx="4" cy="-5" r="1.2" fill="#14532d" />
                {/* Brass bubble wand */}
                <circle cx="9" cy="-3" r="3" fill="none" stroke="#d97706" strokeWidth="1.2" />
                <line x1="0" y1="0" x2="8" y2="-2" stroke="#d97706" strokeWidth="1.5" />
              </g>
            )}

            {prop.id === 'jack-box' && (
              <g transform="translate(0, -6)">
                {/* Wooden box */}
                <rect x="-8" y="-12" width="16" height="14" rx="2" fill="#b45309" stroke="#451a03" strokeWidth="1.2" />
                {/* Spring & Acorn */}
                <g
                  transform={`translate(0, ${jackPopped ? -24 : -10}) scale(${jackPopped ? 1.2 : 0.9})`}
                  style={{ transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
                >
                  <path d="M 0,0 L -2,4 L 2,8 L 0,12" fill="none" stroke="#94a3b8" strokeWidth="1.5" />
                  <ellipse cx="0" cy="-4" rx="6" ry="7.5" fill="#78350f" stroke="#451a03" strokeWidth="1" />
                  <ellipse cx="0" cy="-9" rx="6.5" ry="3.5" fill="#451a03" />
                </g>
              </g>
            )}

            {prop.id === 'kazoo-pipe' && (
              <g transform="translate(0, -8)">
                {/* Upright willow kazoo pipe */}
                <rect x="-3" y="-22" width="6" height="22" rx="1.5" fill="#e11d48" stroke="#881337" strokeWidth="1.2" />
                <polygon points="-6,-22 6,-22 0,-30" fill="#f43f5e" stroke="#881337" strokeWidth="1" />
                <circle cx="0" cy="-14" r="1.8" fill="#fef08a" />
              </g>
            )}

            {prop.id === 'sunflower-puppet' && (
              <g
                transform={`translate(0, -6) rotate(${puppetWiggle ? 18 : 0})`}
                style={{ transition: 'transform 0.2s ease', transformOrigin: '0px 0px' }}
              >
                {/* Bamboo stick */}
                <line x1="0" y1="0" x2="0" y2="-22" stroke="#65a30d" strokeWidth="2" strokeLinecap="round" />
                {/* Googly Flower Head */}
                <circle cx="0" cy="-28" r="8" fill="#facc15" stroke="#ca8a04" strokeWidth="1" />
                <circle cx="0" cy="-28" r="4.5" fill="#78350f" />
                <circle cx="-1.5" cy="-29" r="1.5" fill="#ffffff" />
                <circle cx="-1.5" cy="-29" r="0.7" fill="#000000" />
                <circle cx="1.5" cy="-29" r="1.5" fill="#ffffff" />
                <circle cx="1.5" cy="-29" r="0.7" fill="#000000" />
              </g>
            )}

            {/* Hover Tooltip */}
            <g transform="translate(0, -42)" className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <rect x="-55" y="-12" width="110" height="22" rx="6" fill="#1c1917" stroke="#f43f5e" strokeWidth="1" opacity="0.95" />
              <text x="0" y="3" textAnchor="middle" className="fill-[#fff1f2] font-bold text-[9px] select-none">
                {prop.icon} {prop.name}
              </text>
            </g>
          </g>
        );
      })}
    </svg>
  );
};
