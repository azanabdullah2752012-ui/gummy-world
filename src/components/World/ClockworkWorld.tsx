import React from 'react';
import type { DayNightState, Particle } from '../../types';
import type { ClockworkState, MechanismModuleId } from '../../types/clockwork';
import { GEAR_PARTS, MECHANISM_MODULES } from '../../data/clockwork';
import { getGroundY, getGroundSlope } from '../../utils/math';
import { soundEngine } from '../../audio/soundEngine';

interface ClockworkWorldProps {
  clockwork: ClockworkState;
  dayNight: DayNightState;
  windmillAngle: number; // passed from game loop
  onSelectModule: (moduleId: MechanismModuleId) => void;
  onSpawnParticles: (particles: Particle[]) => void;
}

export const ClockworkWorld: React.FC<ClockworkWorldProps> = ({
  clockwork,
  dayNight: _dayNight,
  windmillAngle,
  onSelectModule,
  onSpawnParticles,
}) => {
  const gantryBaseX = 3770;
  const gantryWidth = 160;
  const gantryGroundY = getGroundY(gantryBaseX + gantryWidth / 2);
  const slopeRad = getGroundSlope(gantryBaseX + gantryWidth / 2);
  const slopeDeg = (slopeRad * 180) / Math.PI;

  const handleModuleClick = (e: React.MouseEvent, moduleId: MechanismModuleId, worldX: number) => {
    e.stopPropagation();
    onSelectModule(moduleId);
    soundEngine.playWindmillClick();

    // Spawn brass sparks
    const groundY = getGroundY(worldX);
    const sparks: Particle[] = Array.from({ length: 6 }).map((_, i) => ({
      id: Date.now() + i,
      x: worldX + (Math.random() * 16 - 8),
      y: groundY - 45 + (Math.random() * 14 - 7),
      vx: (Math.random() - 0.5) * 45,
      vy: -25 - Math.random() * 30,
      color: ['#f59e0b', '#fbbf24', '#fef08a'][i % 3],
      size: 3,
      alpha: 1,
      maxLife: 1.2,
      life: 1.2,
      shape: 'spark',
    }));
    onSpawnParticles(sparks);
  };

  return (
    <svg
      className="w-full h-full absolute inset-0 overflow-visible pointer-events-none select-none"
      viewBox="0 0 5000 900"
      preserveAspectRatio="none"
    >
      <defs>
        <radialGradient id="brass-gear-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fef08a" stopOpacity="0.85" />
          <stop offset="60%" stopColor="#d97706" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#d97706" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* ── HEAVY OAK TIMBER GANTRY BENCH ── */}
      <g transform={`translate(${gantryBaseX}, ${gantryGroundY})`}>
        {/* Contact shadow */}
        <ellipse cx="80" cy="4" rx="90" ry="10" fill="#1c1917" opacity="0.38" />

        {/* Oak Framework */}
        <g transform={`rotate(${slopeDeg * 0.4})`}>
          {/* Main horizontal beams */}
          <rect x="0" y="-38" width={gantryWidth} height="7" rx="1.5" fill="#5c381e" stroke="#38210f" strokeWidth="1.2" />
          <rect x="4" y="-72" width={gantryWidth - 8} height="6" rx="1.5" fill="#784725" stroke="#38210f" strokeWidth="1.2" />

          {/* Upright posts anchored into ground */}
          <rect x="12" y="-78" width="8" height="82" rx="1" fill="#4a2c17" stroke="#26160b" strokeWidth="1" />
          <rect x="56" y="-78" width="7" height="82" rx="1" fill="#4a2c17" stroke="#26160b" strokeWidth="1" />
          <rect x="98" y="-78" width="7" height="82" rx="1" fill="#4a2c17" stroke="#26160b" strokeWidth="1" />
          <rect x="140" y="-78" width="8" height="82" rx="1" fill="#4a2c17" stroke="#26160b" strokeWidth="1" />

          {/* Cross brace struts */}
          <line x1="20" y1="-38" x2="56" y2="-72" stroke="#4a2c17" strokeWidth="2.5" />
          <line x1="63" y1="-38" x2="98" y2="-72" stroke="#4a2c17" strokeWidth="2.5" />
          <line x1="105" y1="-38" x2="140" y2="-72" stroke="#4a2c17" strokeWidth="2.5" />

          {/* Steel drive shaft running through gantry */}
          <line x1="-30" y1="-56" x2={gantryWidth + 4} y2="-56" stroke="#94a3b8" strokeWidth="3" />
          <line x1="-30" y1="-57" x2={gantryWidth + 4} y2="-57" stroke="#e2e8f0" strokeWidth="1" opacity="0.8" />

          {/* Drive belt coupling from Windmill ($X = 3720$) */}
          <path
            d="M -50,-62 L 6,-62 L 18,-56 L 6,-50 L -50,-50 Z"
            fill="#451a03"
            stroke="#270e02"
            strokeWidth="1"
            opacity="0.8"
          />
        </g>
      </g>

      {/* ── THE 4 CLOCKWORK MODULES ── */}
      {MECHANISM_MODULES.map((mod, idx) => {
        const state = clockwork.installed[mod.id];
        const gear = GEAR_PARTS[state?.installedGearId || mod.defaultGearId] || GEAR_PARTS['brass-spur'];
        const groundY = getGroundY(mod.worldOffset.x);
        const isSelected = clockwork.selectedModuleId === mod.id;
        const isEngaged = state?.isEngaged ?? true;

        // Gear rotation angle proportional to windmill
        const speedMultiplier = idx === 0 ? 1.5 : idx === 1 ? -2.2 : idx === 2 ? 3.0 : -1.0;
        const gearAngle = isEngaged ? (windmillAngle * speedMultiplier) % 360 : 0;

        return (
          <g
            key={mod.id}
            transform={`translate(${mod.worldOffset.x}, ${groundY - 56})`}
            className="pointer-events-auto cursor-pointer group"
            onClick={e => handleModuleClick(e, mod.id, mod.worldOffset.x)}
          >
            {/* Selection Focus Glow */}
            {isSelected && (
              <circle cx="0" cy="0" r={gear.radius + 12} fill="url(#brass-gear-glow)" className="animate-pulse" />
            )}

            {/* Gear Body with Rotating Teeth */}
            <g transform={`rotate(${gearAngle})`}>
              {/* Gear Teeth */}
              {Array.from({ length: gear.teeth }).map((_, tIdx) => {
                const angle = (360 / gear.teeth) * tIdx;
                return (
                  <rect
                    key={tIdx}
                    x="-2"
                    y={-gear.radius - 3}
                    width="4"
                    height="6"
                    rx="1"
                    fill={gear.color}
                    stroke={gear.borderColor}
                    strokeWidth="0.8"
                    transform={`rotate(${angle})`}
                  />
                );
              })}

              {/* Main Gear Disc */}
              <circle
                cx="0"
                cy="0"
                r={gear.radius}
                fill={gear.color}
                stroke={gear.borderColor}
                strokeWidth="1.5"
              />

              {/* Spoke cutouts */}
              {[0, 90, 180, 270].map(sAngle => (
                <circle
                  key={sAngle}
                  cx={Math.cos((sAngle * Math.PI) / 180) * (gear.radius * 0.55)}
                  cy={Math.sin((sAngle * Math.PI) / 180) * (gear.radius * 0.55)}
                  r={gear.radius * 0.22}
                  fill="#26160b"
                  opacity="0.85"
                />
              ))}

              {/* Central brass hub bushing */}
              <circle cx="0" cy="0" r="5" fill="#fef08a" stroke="#854d0e" strokeWidth="1" />
              <circle cx="0" cy="0" r="2" fill="#18181b" />
            </g>

            {/* Module Special Visual Elements */}
            {mod.id === 'chime-governor' && (
              <g transform="translate(0, -28)">
                {/* Centrifugal spinning flyballs */}
                <line x1="-14" y1="0" x2="14" y2="0" stroke="#d4af37" strokeWidth="2" strokeLinecap="round" />
                <circle cx="-14" cy="0" r="4" fill="#fbbf24" stroke="#854d0e" strokeWidth="1" />
                <circle cx="14" cy="0" r="4" fill="#fbbf24" stroke="#854d0e" strokeWidth="1" />
                {/* Tuned copper chime bell */}
                <path d="M -5,10 Q 0,4 5,10 L 6,16 Q 0,18 -6,16 Z" fill="#ea580c" stroke="#9a3412" strokeWidth="1" />
              </g>
            )}

            {mod.id === 'weather-pulley' && (
              <g transform="translate(0, 18)">
                {/* Bobbing counterweight */}
                <line x1="0" y1="-8" x2="0" y2="10" stroke="#71717a" strokeWidth="1.5" />
                <rect x="-4" y="10" width="8" height="12" rx="2" fill="#3f3f46" stroke="#18181b" strokeWidth="1" />
              </g>
            )}

            {/* Hover Tooltip Label */}
            <g transform="translate(0, -42)" className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <rect x="-65" y="-12" width="130" height="22" rx="6" fill="#1c1917" stroke="#fef08a" strokeWidth="1" opacity="0.95" />
              <text x="0" y="3" textAnchor="middle" className="fill-[#fef08a] font-bold text-[10px] select-none">
                ⚙️ {mod.name.split(' ')[0]} ({gear.material})
              </text>
            </g>
          </g>
        );
      })}
    </svg>
  );
};
