import React, { useState, useEffect } from 'react';
import type { DayNightState, Particle } from '../../types';
import type { GardenPlantRecord, PlantSpeciesId, GrowthStage } from '../../types/garden';
import { GARDEN_PLOTS, GARDEN_SPECIES } from '../../data/garden';
import { getGroundY, getGroundSlope } from '../../utils/math';
import { soundEngine } from '../../audio/soundEngine';

interface LivingGardenWorldProps {
  plants: Record<string, GardenPlantRecord>;
  dayNight: DayNightState;
  selectedPlotId: string | null;
  onSelectPlot: (plotId: string) => void;
  onWaterPlant: (plotId: string) => void;
  onSpawnParticles: (particles: Particle[]) => void;
}

export const LivingGardenWorld: React.FC<LivingGardenWorldProps> = ({
  plants,
  dayNight,
  selectedPlotId,
  onSelectPlot,
  onWaterPlant,
  onSpawnParticles,
}) => {
  const isNight = dayNight.phase === 'night';
  const isDusk = dayNight.phase === 'dusk';

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Handle direct world-space watering action
  const handleQuickWater = (e: React.MouseEvent, plotId: string, worldX: number) => {
    e.stopPropagation();
    onWaterPlant(plotId);
    soundEngine.playWaterRipple();

    const groundY = getGroundY(worldX);
    const droplets: Particle[] = Array.from({ length: 8 }).map((_, i) => ({
      id: Date.now() + i,
      x: worldX + (Math.random() * 24 - 12),
      y: groundY - 10 + (Math.random() * 8 - 4),
      vx: (Math.random() - 0.5) * 40,
      vy: -25 - Math.random() * 35,
      color: ['#60a5fa', '#93c5fd', '#bfdbfe'][i % 3],
      size: 3.5,
      alpha: 1,
      maxLife: 1.4,
      life: 1.4,
      shape: 'circle',
    }));
    onSpawnParticles(droplets);
  };

  return (
    <svg
      className="w-full h-full absolute inset-0 overflow-visible pointer-events-none select-none"
      viewBox="0 0 5000 900"
      preserveAspectRatio="none"
    >
      <defs>
        <radialGradient id="soil-moist-grad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#2b1810" stopOpacity="0.95" />
          <stop offset="65%" stopColor="#3d2417" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#4a2c1d" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="fern-glow-grad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#a7f3d0" stopOpacity="0.8" />
          <stop offset="60%" stopColor="#10b981" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
        </radialGradient>
      </defs>

      {GARDEN_PLOTS.map(plot => {
        const plant = plants[plot.id];
        const species = plant ? GARDEN_SPECIES[plant.speciesId] : null;
        const groundY = getGroundY(plot.worldX);
        const slopeRad = getGroundSlope(plot.worldX);
        const slopeDeg = (slopeRad * 180) / Math.PI;
        const isSelected = selectedPlotId === plot.id;
        const isRecentlyWatered =
          plant && plant.lastWateredAt ? now - plant.lastWateredAt < 120000 : false;

        return (
          <g
            key={plot.id}
            transform={`translate(${plot.worldX}, ${groundY})`}
            className="pointer-events-auto cursor-pointer group"
            onClick={e => {
              e.stopPropagation();
              onSelectPlot(plot.id);
            }}
          >
            {/* Ground Contact Shadow */}
            <ellipse cx="0" cy="2" rx="34" ry="7.5" fill="#2d422a" opacity="0.45" />

            {/* Terraced Cedar Edging & Loam Bed */}
            <g transform={`rotate(${slopeDeg * 0.4})`}>
              {/* Back plank */}
              <polygon
                points="-32,-4 32,-4 30,-8 -30,-8"
                fill="#5c381e"
                stroke="#3d2413"
                strokeWidth="1.2"
              />

              {/* Loam Soil Mound */}
              <ellipse
                cx="0"
                cy="-2"
                rx="28"
                ry="7.5"
                fill={isRecentlyWatered ? '#26160d' : '#57371e'}
                stroke="#331e11"
                strokeWidth="1.2"
              />

              {/* Dark moisture puddle / sheen when watered */}
              {isRecentlyWatered && (
                <>
                  <ellipse cx="0" cy="-2" rx="22" ry="5.5" fill="url(#soil-moist-grad)" />
                  <circle cx="-6" cy="-3" r="1.5" fill="#93c5fd" opacity="0.65" />
                  <circle cx="8" cy="-2" r="1.2" fill="#bfdbfe" opacity="0.75" />
                </>
              )}

              {/* Front plank */}
              <polygon
                points="-34,3 34,3 32,0 -32,0"
                fill="#784725"
                stroke="#3d2413"
                strokeWidth="1.2"
              />

              {/* Corner cedar stakes holding the bed */}
              <line x1="-31" y1="-8" x2="-31" y2="5" stroke="#4a2c17" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="31" y1="-8" x2="31" y2="5" stroke="#4a2c17" strokeWidth="2.5" strokeLinecap="round" />
            </g>

            {/* Selection Focus Ring */}
            {isSelected && (
              <g>
                <ellipse
                  cx="0"
                  cy="-1"
                  rx="36"
                  ry="10"
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="2.5"
                  strokeDasharray="4 3"
                  className="animate-pulse"
                />
              </g>
            )}

            {/* PLANT RENDERING OR EMPTY PLOT STAKE */}
            {plant && species ? (
              <g
                id={`plant-${plot.id}`}
                transform="translate(0, -4)"
                onClick={e => {
                  // If clicking directly on a plant, offer immediate watering if needed
                  if (!isRecentlyWatered) {
                    handleQuickWater(e, plot.id, plot.worldX);
                  }
                }}
              >
                <PlantVisual
                  speciesId={plant.speciesId}
                  stage={plant.stage}
                  isNight={isNight}
                  isDusk={isDusk}
                  isWatered={isRecentlyWatered}
                />

                {/* Subtle Care Badge floating above plant */}
                {!isRecentlyWatered && (
                  <g
                    transform="translate(18, -26)"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <circle cx="0" cy="0" r="8" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="1.2" />
                    <text
                      x="0"
                      y="3.5"
                      textAnchor="middle"
                      className="fill-white font-bold text-[9px] select-none pointer-events-none"
                    >
                      💧
                    </text>
                  </g>
                )}
              </g>
            ) : (
              /* EMPTY PLOT STAKE & SIGN */
              <g transform="translate(0, -2)">
                {/* Cedar plant marker stake */}
                <line x1="0" y1="0" x2="0" y2="-18" stroke="#854d0e" strokeWidth="2.5" strokeLinecap="round" />
                <rect x="-8" y="-24" width="16" height="10" rx="1.5" fill="#fef3c7" stroke="#92400e" strokeWidth="1.2" />
                <text
                  x="0"
                  y="-17"
                  textAnchor="middle"
                  className="fill-[#78350f] font-bold text-[8px] select-none pointer-events-none"
                >
                  +{plot.index + 1}
                </text>
              </g>
            )}

            {/* Hover Tooltip Label */}
            <g
              transform="translate(0, -56)"
              className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
            >
              <rect
                x="-58"
                y="-14"
                width="116"
                height="22"
                rx="6"
                fill="#2b201b"
                stroke="#fef3c7"
                strokeWidth="1.2"
                opacity="0.95"
              />
              <text
                x="0"
                y="1.5"
                textAnchor="middle"
                className="fill-[#fef3c7] font-semibold text-[10px] select-none"
              >
                {plant && species ? `${species.name} (${plant.stage})` : `${plot.label} • Ready`}
              </text>
            </g>
          </g>
        );
      })}
    </svg>
  );
};

interface PlantVisualProps {
  speciesId: PlantSpeciesId;
  stage: GrowthStage;
  isNight: boolean;
  isDusk: boolean;
  isWatered: boolean;
}

const PlantVisual: React.FC<PlantVisualProps> = ({ speciesId, stage, isNight, isDusk, isWatered }) => {
  switch (speciesId) {
    case 'sunflower':
      return <SunflowerVisual stage={stage} isWatered={isWatered} />;
    case 'bellflower':
      return <BellflowerVisual stage={stage} isWatered={isWatered} />;
    case 'strawberry':
      return <StrawberryVisual stage={stage} isWatered={isWatered} />;
    case 'fern':
      return <FernVisual stage={stage} isNight={isNight || isDusk} isWatered={isWatered} />;
    case 'pumpkin':
      return <PumpkinVisual stage={stage} isWatered={isWatered} />;
    default:
      return null;
  }
};

/* ─────────────────────────────────────────────────────────────
   1. SUNBURST SUNFLOWER (Helianthus)
   ───────────────────────────────────────────────────────────── */
const SunflowerVisual: React.FC<{ stage: GrowthStage; isWatered: boolean }> = ({ stage }) => {
  if (stage === 'seed') {
    return (
      <g>
        <ellipse cx="0" cy="1" rx="5" ry="3" fill="#3f2715" stroke="#1f140c" strokeWidth="0.8" />
        <line x1="0" y1="0" x2="1" y2="-6" stroke="#84cc16" strokeWidth="1.4" strokeLinecap="round" />
        <circle cx="1" cy="-7" r="1.2" fill="#a3e635" />
      </g>
    );
  }

  if (stage === 'sprout') {
    return (
      <g>
        {/* Stem */}
        <line x1="0" y1="1" x2="0" y2="-16" stroke="#4d7c0f" strokeWidth="2.4" strokeLinecap="round" />
        {/* Pair of cotyledon leaves */}
        <ellipse cx="-6" cy="-15" rx="5.5" ry="3.2" fill="#65a30d" stroke="#365314" strokeWidth="0.8" />
        <ellipse cx="6" cy="-15" rx="5.5" ry="3.2" fill="#84cc16" stroke="#365314" strokeWidth="0.8" />
        <circle cx="0" cy="-17" r="1.5" fill="#a3e635" />
      </g>
    );
  }

  if (stage === 'growing') {
    return (
      <g>
        {/* Sturdy stalk */}
        <line x1="0" y1="1" x2="0" y2="-38" stroke="#4d7c0f" strokeWidth="3.2" strokeLinecap="round" />
        {/* Lower heart leaves */}
        <path d="M 0,-14 Q -12,-20 -15,-13 Q -10,-8 0,-12" fill="#65a30d" stroke="#365314" strokeWidth="0.8" />
        <path d="M 0,-18 Q 12,-24 15,-17 Q 10,-12 0,-16" fill="#65a30d" stroke="#365314" strokeWidth="0.8" />
        {/* Upper leaves */}
        <path d="M 0,-26 Q -14,-32 -13,-24 Q -7,-20 0,-24" fill="#84cc16" stroke="#365314" strokeWidth="0.8" />
        <path d="M 0,-30 Q 14,-36 13,-28 Q 7,-24 0,-28" fill="#84cc16" stroke="#365314" strokeWidth="0.8" />
        {/* Tight green bud with yellow hints */}
        <circle cx="0" cy="-40" r="6" fill="#4d7c0f" stroke="#365314" strokeWidth="1" />
        <circle cx="0" cy="-40" r="3.2" fill="#facc15" />
      </g>
    );
  }

  // Mature
  return (
    <g>
      {/* Tall ribbed stalk */}
      <line x1="0" y1="1" x2="0" y2="-58" stroke="#3f6212" strokeWidth="4" strokeLinecap="round" />
      <line x1="-1" y1="0" x2="-1" y2="-58" stroke="#65a30d" strokeWidth="1.2" opacity="0.6" />

      {/* Broad textured lower leaves */}
      <path d="M 0,-20 Q -18,-28 -22,-18 Q -14,-10 0,-17" fill="#4d7c0f" stroke="#365314" strokeWidth="1" />
      <path d="M 0,-26 Q 18,-34 22,-24 Q 14,-16 0,-23" fill="#4d7c0f" stroke="#365314" strokeWidth="1" />
      <path d="M 0,-38 Q -16,-46 -18,-36 Q -10,-28 0,-35" fill="#65a30d" stroke="#365314" strokeWidth="1" />
      <path d="M 0,-44 Q 16,-52 18,-42 Q 10,-34 0,-41" fill="#65a30d" stroke="#365314" strokeWidth="1" />

      {/* Flower Head */}
      <g transform="translate(0, -60)">
        {/* Ray Petals (Ring of 12 Petals) */}
        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map(angle => (
          <ellipse
            key={angle}
            cx="0"
            cy="-14"
            rx="4.2"
            ry="9"
            fill="#facc15"
            stroke="#ca8a04"
            strokeWidth="0.8"
            transform={`rotate(${angle})`}
          />
        ))}
        {/* Inner secondary petals */}
        {[15, 45, 75, 105, 135, 165, 195, 225, 255, 285, 315, 345].map(angle => (
          <ellipse
            key={angle}
            cx="0"
            cy="-11"
            rx="3"
            ry="6"
            fill="#fde047"
            transform={`rotate(${angle})`}
          />
        ))}
        {/* Dark Seed Disc */}
        <circle cx="0" cy="0" r="9" fill="#451a03" stroke="#260e02" strokeWidth="1.5" />
        <circle cx="0" cy="0" r="7" fill="#5c2608" />
        {/* Golden Pollen Specks */}
        <circle cx="-3" cy="-2" r="1.1" fill="#facc15" />
        <circle cx="2" cy="-3" r="1.1" fill="#facc15" />
        <circle cx="-1" cy="3" r="1.1" fill="#facc15" />
        <circle cx="3" cy="2" r="1.1" fill="#facc15" />
      </g>
    </g>
  );
};

/* ─────────────────────────────────────────────────────────────
   2. SWEET VIOLET BELLFLOWER (Campanula)
   ───────────────────────────────────────────────────────────── */
const BellflowerVisual: React.FC<{ stage: GrowthStage; isWatered: boolean }> = ({ stage }) => {
  if (stage === 'seed') {
    return (
      <g>
        <circle cx="-2" cy="0" r="1.2" fill="#2d3748" />
        <circle cx="1" cy="1" r="1.2" fill="#2d3748" />
        <line x1="0" y1="1" x2="0" y2="-5" stroke="#65a30d" strokeWidth="1.2" strokeLinecap="round" />
      </g>
    );
  }

  if (stage === 'sprout') {
    return (
      <g>
        <line x1="0" y1="1" x2="0" y2="-14" stroke="#3f6212" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M 0,-14 Q -6,-18 -4,-10" fill="none" stroke="#65a30d" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M 0,-14 Q 6,-18 4,-10" fill="none" stroke="#84cc16" strokeWidth="1.4" strokeLinecap="round" />
      </g>
    );
  }

  if (stage === 'growing') {
    return (
      <g>
        <path d="M 0,1 Q 2,-16 -4,-32" fill="none" stroke="#3f6212" strokeWidth="2.2" strokeLinecap="round" />
        {/* Side branchlets */}
        <line x1="-1" y1="-14" x2="-8" y2="-18" stroke="#4d7c0f" strokeWidth="1.2" />
        <ellipse cx="-9" cy="-19" rx="3.5" ry="1.8" fill="#65a30d" transform="rotate(-20, -9, -19)" />
        <line x1="-3" y1="-24" x2="5" y2="-28" stroke="#4d7c0f" strokeWidth="1.2" />
        {/* Violet buds */}
        <ellipse cx="6" cy="-29" rx="2.5" ry="3.5" fill="#818cf8" stroke="#4f46e5" strokeWidth="0.8" />
        <ellipse cx="-4" cy="-34" rx="3" ry="4" fill="#a78bfa" stroke="#6d28d9" strokeWidth="0.8" />
      </g>
    );
  }

  // Mature
  return (
    <g>
      {/* Arching delicate stems */}
      <path d="M 0,1 Q 4,-24 -6,-48" fill="none" stroke="#3f6212" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M -2,-20 Q -10,-28 -14,-36" fill="none" stroke="#3f6212" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M 0,-28 Q 8,-36 12,-42" fill="none" stroke="#3f6212" strokeWidth="1.5" strokeLinecap="round" />

      {/* Slender spear leaves */}
      <path d="M 0,-10 Q -9,-14 -11,-9" fill="none" stroke="#4d7c0f" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M 1,-16 Q 10,-20 12,-15" fill="none" stroke="#4d7c0f" strokeWidth="2.2" strokeLinecap="round" />

      {/* 4 Nodding Violet Bells */}
      {/* Bell 1 (Left branch) */}
      <g transform="translate(-14, -36) rotate(-25)">
        <path d="M -4,-2 Q 0,-8 4,-2 L 5,4 Q 0,7 -5,4 Z" fill="#818cf8" stroke="#4338ca" strokeWidth="1" />
        <path d="M -2,4 L 0,7 L 2,4" stroke="#c7d2fe" strokeWidth="1" fill="none" />
        <circle cx="0" cy="5" r="1.2" fill="#fef08a" />
      </g>

      {/* Bell 2 (Right branch) */}
      <g transform="translate(12, -42) rotate(25)">
        <path d="M -4,-2 Q 0,-8 4,-2 L 5,4 Q 0,7 -5,4 Z" fill="#6366f1" stroke="#3730a3" strokeWidth="1" />
        <circle cx="0" cy="5" r="1.2" fill="#fef08a" />
      </g>

      {/* Bell 3 (Mid stalk) */}
      <g transform="translate(-2, -38) rotate(-10)">
        <path d="M -4,-2 Q 0,-8 4,-2 L 5,4 Q 0,7 -5,4 Z" fill="#a78bfa" stroke="#5b21b6" strokeWidth="1" />
        <circle cx="0" cy="5" r="1.2" fill="#fef08a" />
      </g>

      {/* Bell 4 (Crown apex) */}
      <g transform="translate(-6, -50) rotate(-15)">
        <path d="M -5,-3 Q 0,-10 5,-3 L 6,5 Q 0,8 -6,5 Z" fill="#818cf8" stroke="#4338ca" strokeWidth="1" />
        <path d="M -3,5 L 0,8 L 3,5" stroke="#e0e7ff" strokeWidth="1" fill="none" />
        <circle cx="0" cy="6" r="1.4" fill="#fef08a" />
      </g>
    </g>
  );
};

/* ─────────────────────────────────────────────────────────────
   3. RUBY WOODLAND STRAWBERRY (Fragaria)
   ───────────────────────────────────────────────────────────── */
const StrawberryVisual: React.FC<{ stage: GrowthStage; isWatered: boolean }> = ({ stage }) => {
  if (stage === 'seed') {
    return (
      <g>
        <ellipse cx="0" cy="1" rx="3.5" ry="2.2" fill="#713f12" />
        <circle cx="0" cy="0" r="1.2" fill="#dc2626" />
        <line x1="0" y1="0" x2="0" y2="-4" stroke="#22c55e" strokeWidth="1.2" strokeLinecap="round" />
      </g>
    );
  }

  if (stage === 'sprout') {
    return (
      <g>
        <line x1="0" y1="1" x2="0" y2="-10" stroke="#15803d" strokeWidth="1.6" />
        {/* Trio of baby toothed leaflets */}
        <ellipse cx="-4" cy="-11" rx="3.5" ry="2.5" fill="#22c55e" stroke="#14532d" strokeWidth="0.8" />
        <ellipse cx="4" cy="-11" rx="3.5" ry="2.5" fill="#22c55e" stroke="#14532d" strokeWidth="0.8" />
        <ellipse cx="0" cy="-14" rx="3.8" ry="2.8" fill="#4ade80" stroke="#14532d" strokeWidth="0.8" />
      </g>
    );
  }

  if (stage === 'growing') {
    return (
      <g>
        {/* Low runner mound */}
        <path d="M 0,1 Q -8,-12 -14,-6" fill="none" stroke="#16a34a" strokeWidth="1.6" />
        <path d="M 0,1 Q 8,-12 14,-6" fill="none" stroke="#16a34a" strokeWidth="1.6" />
        {/* Leaf clumps */}
        <ellipse cx="-12" cy="-9" rx="5" ry="3.5" fill="#15803d" />
        <ellipse cx="12" cy="-9" rx="5" ry="3.5" fill="#15803d" />
        <ellipse cx="0" cy="-14" rx="6" ry="4" fill="#22c55e" />
        {/* White flower */}
        <g transform="translate(-6, -18)">
          <circle cx="0" cy="0" r="4.5" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="0.8" />
          <circle cx="0" cy="0" r="1.6" fill="#facc15" />
        </g>
        {/* Baby green strawberry */}
        <polygon points="6,-10 9,-10 7.5,-5" fill="#86efac" stroke="#15803d" strokeWidth="0.8" />
      </g>
    );
  }

  // Mature
  return (
    <g>
      {/* Broad lush ground cover */}
      <ellipse cx="-14" cy="-8" rx="8" ry="5.5" fill="#15803d" stroke="#14532d" strokeWidth="1" />
      <ellipse cx="14" cy="-8" rx="8" ry="5.5" fill="#15803d" stroke="#14532d" strokeWidth="1" />
      <ellipse cx="-6" cy="-16" rx="8" ry="6" fill="#16a34a" stroke="#14532d" strokeWidth="1" />
      <ellipse cx="6" cy="-16" rx="8" ry="6" fill="#22c55e" stroke="#14532d" strokeWidth="1" />
      <ellipse cx="0" cy="-22" rx="9" ry="6.5" fill="#4ade80" stroke="#15803d" strokeWidth="1" />

      {/* White Star Blossoms */}
      <g transform="translate(-14, -20)">
        <circle cx="0" cy="0" r="4" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.8" />
        <circle cx="0" cy="0" r="1.5" fill="#facc15" />
      </g>
      <g transform="translate(12, -22)">
        <circle cx="0" cy="0" r="4" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.8" />
        <circle cx="0" cy="0" r="1.5" fill="#facc15" />
      </g>

      {/* Ripe Crimson Strawberries */}
      {/* Berry 1 (Center bottom) */}
      <g transform="translate(0, -6)">
        <path d="M -5,-3 Q 0,-5 5,-3 Q 4,6 0,8 Q -4,6 -5,-3 Z" fill="#ef4444" stroke="#991b1b" strokeWidth="1" />
        {/* Green calyx cap */}
        <polygon points="-4,-3 -1,-1 1,-1 4,-3 2,-4 -2,-4" fill="#15803d" />
        {/* Golden seed specks */}
        <circle cx="-2" cy="0" r="0.6" fill="#fef08a" />
        <circle cx="2" cy="1" r="0.6" fill="#fef08a" />
        <circle cx="0" cy="4" r="0.6" fill="#fef08a" />
      </g>

      {/* Berry 2 (Right side) */}
      <g transform="translate(16, -4) rotate(15)">
        <path d="M -4,-2 Q 0,-4 4,-2 Q 3,5 0,7 Q -3,5 -4,-2 Z" fill="#dc2626" stroke="#7f1d1d" strokeWidth="0.9" />
        <polygon points="-3,-2 0,0 3,-2" fill="#15803d" />
        <circle cx="-1" cy="1" r="0.5" fill="#fef08a" />
        <circle cx="1" cy="3" r="0.5" fill="#fef08a" />
      </g>

      {/* Berry 3 (Left side) */}
      <g transform="translate(-16, -4) rotate(-15)">
        <path d="M -4,-2 Q 0,-4 4,-2 Q 3,5 0,7 Q -3,5 -4,-2 Z" fill="#f87171" stroke="#991b1b" strokeWidth="0.9" />
        <polygon points="-3,-2 0,0 3,-2" fill="#15803d" />
        <circle cx="0" cy="2" r="0.5" fill="#fef08a" />
      </g>
    </g>
  );
};

/* ─────────────────────────────────────────────────────────────
   4. VALLEY MOON FERN (Polystichum)
   ───────────────────────────────────────────────────────────── */
const FernVisual: React.FC<{ stage: GrowthStage; isNight: boolean; isWatered: boolean }> = ({ stage, isNight }) => {
  if (stage === 'seed') {
    return (
      <g>
        <ellipse cx="0" cy="1" rx="4" ry="2.5" fill="#064e3b" />
        <circle cx="-1" cy="0" r="1.1" fill="#34d399" />
        <circle cx="1" cy="1" r="1.1" fill="#6ee7b7" />
      </g>
    );
  }

  if (stage === 'sprout') {
    return (
      <g>
        {/* Coiled Spiral Fiddlehead */}
        <path d="M 0,1 L 0,-10 Q 0,-16 4,-16 Q 8,-16 8,-12 Q 8,-8 4,-8 Q 2,-8 2,-11" fill="none" stroke="#059669" strokeWidth="2.2" strokeLinecap="round" />
        <circle cx="4" cy="-11" r="1.5" fill="#6ee7b7" />
      </g>
    );
  }

  if (stage === 'growing') {
    return (
      <g>
        {/* Unfurling fronds */}
        <path d="M 0,1 Q -6,-16 -12,-26" fill="none" stroke="#047857" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M 0,1 Q 6,-16 12,-26" fill="none" stroke="#059669" strokeWidth="2.2" strokeLinecap="round" />
        {/* Pinnules */}
        {[-8, -14, -20].map((y, i) => (
          <ellipse key={i} cx={-4 - i * 3} cy={y} rx="4" ry="1.8" fill="#10b981" transform={`rotate(${-35 - i * 5}, ${-4 - i * 3}, ${y})`} />
        ))}
        {[ -8, -14, -20].map((y, i) => (
          <ellipse key={i} cx={4 + i * 3} cy={y} rx="4" ry="1.8" fill="#34d399" transform={`rotate(${35 + i * 5}, ${4 + i * 3}, ${y})`} />
        ))}
      </g>
    );
  }

  // Mature
  return (
    <g>
      {/* Night soft luminescence */}
      {isNight && <circle cx="0" cy="-24" r="26" fill="url(#fern-glow-grad)" />}

      {/* 5 Sprawling Fountain Fronds */}
      {/* Far Left Frond */}
      <path d="M 0,1 Q -14,-18 -26,-24 Q -32,-26 -36,-22" fill="none" stroke="#065f46" strokeWidth="2.2" strokeLinecap="round" />
      {/* Mid Left Frond */}
      <path d="M 0,1 Q -10,-24 -18,-42 Q -22,-48 -24,-46" fill="none" stroke="#047857" strokeWidth="2.4" strokeLinecap="round" />
      {/* Center Tall Frond */}
      <path d="M 0,1 Q 0,-28 0,-50 Q 0,-54 2,-52" fill="none" stroke="#059669" strokeWidth="2.6" strokeLinecap="round" />
      {/* Mid Right Frond */}
      <path d="M 0,1 Q 10,-24 18,-42 Q 22,-48 24,-46" fill="none" stroke="#059669" strokeWidth="2.4" strokeLinecap="round" />
      {/* Far Right Frond */}
      <path d="M 0,1 Q 14,-18 26,-24 Q 32,-26 36,-22" fill="none" stroke="#065f46" strokeWidth="2.2" strokeLinecap="round" />

      {/* Pinnules along center frond */}
      {[-12, -20, -28, -36, -44].map((y, i) => (
        <g key={i}>
          <ellipse cx="-4.5" cy={y} rx="5" ry="1.8" fill="#10b981" transform={`rotate(-25, -4.5, ${y})`} />
          <ellipse cx="4.5" cy={y} rx="5" ry="1.8" fill="#34d399" transform={`rotate(25, 4.5, ${y})`} />
        </g>
      ))}

      {/* Pinnules along left and right fronds */}
      {[-10, -18, -26, -34].map((y, i) => (
        <g key={i}>
          <ellipse cx={-10 - i * 2.5} cy={y} rx="4.5" ry="1.6" fill="#059669" transform={`rotate(-40, ${-10 - i * 2.5}, ${y})`} />
          <ellipse cx={10 + i * 2.5} cy={y} rx="4.5" ry="1.6" fill="#10b981" transform={`rotate(40, ${10 + i * 2.5}, ${y})`} />
        </g>
      ))}
    </g>
  );
};

/* ─────────────────────────────────────────────────────────────
   5. GOLDEN VALLEY PUMPKIN (Cucurbita)
   ───────────────────────────────────────────────────────────── */
const PumpkinVisual: React.FC<{ stage: GrowthStage; isWatered: boolean }> = ({ stage }) => {
  if (stage === 'seed') {
    return (
      <g>
        <ellipse cx="0" cy="1" rx="4" ry="2.2" fill="#713f12" />
        <ellipse cx="0" cy="0" rx="3.2" ry="1.6" fill="#fef3c7" stroke="#b45309" strokeWidth="0.8" />
        <line x1="0" y1="0" x2="2" y2="-5" stroke="#15803d" strokeWidth="1.2" strokeLinecap="round" />
      </g>
    );
  }

  if (stage === 'sprout') {
    return (
      <g>
        <line x1="0" y1="1" x2="0" y2="-12" stroke="#15803d" strokeWidth="2.2" />
        <ellipse cx="-5" cy="-12" rx="4.5" ry="3.2" fill="#16a34a" stroke="#14532d" strokeWidth="0.8" />
        <ellipse cx="5" cy="-12" rx="4.5" ry="3.2" fill="#22c55e" stroke="#14532d" strokeWidth="0.8" />
        {/* Curled baby tendril */}
        <path d="M 0,-12 Q 4,-18 2,-20" fill="none" stroke="#86efac" strokeWidth="1.2" />
      </g>
    );
  }

  if (stage === 'growing') {
    return (
      <g>
        {/* Sprawling vine */}
        <path d="M 0,1 Q -12,-8 -20,-2" fill="none" stroke="#14532d" strokeWidth="2.4" />
        <path d="M 0,1 Q 12,-10 20,-4" fill="none" stroke="#14532d" strokeWidth="2.4" />
        {/* Scalloped leaves */}
        <path d="M -16,-2 Q -22,-16 -12,-16 Q -6,-6 -14,-2" fill="#15803d" stroke="#14532d" strokeWidth="1" />
        <path d="M 14,-3 Q 22,-16 12,-16 Q 6,-6 14,-3" fill="#16a34a" stroke="#14532d" strokeWidth="1" />
        {/* Funnel flower */}
        <polygon points="-2,-14 2,-14 4,-8 -4,-8" fill="#f59e0b" stroke="#b45309" strokeWidth="0.8" />
        {/* Small green gourd */}
        <ellipse cx="0" cy="-6" rx="7" ry="5.5" fill="#65a30d" stroke="#365314" strokeWidth="1" />
      </g>
    );
  }

  // Mature
  return (
    <g>
      {/* Ground contact shadow under squash */}
      <ellipse cx="0" cy="1" rx="19" ry="5" fill="#20140c" opacity="0.45" />

      {/* Sprawling thick vine with coiled tendril */}
      <path d="M -24,-2 Q -12,-14 0,-16 Q 16,-16 28,-3" fill="none" stroke="#14532d" strokeWidth="3" strokeLinecap="round" />
      <path d="M 18,-14 Q 24,-22 28,-18 Q 30,-14 26,-12" fill="none" stroke="#15803d" strokeWidth="1.8" />

      {/* Broad parasol leaves */}
      <path d="M -18,-4 Q -28,-22 -16,-24 Q -6,-10 -16,-4" fill="#15803d" stroke="#0f3d21" strokeWidth="1.2" />
      <path d="M 16,-6 Q 28,-24 16,-26 Q 8,-12 16,-6" fill="#16a34a" stroke="#0f3d21" strokeWidth="1.2" />

      {/* Plump Ribbed Golden Orange Pumpkin */}
      <g transform="translate(0, -9)">
        {/* Back lobes */}
        <ellipse cx="-10" cy="0" rx="9" ry="10" fill="#c2410c" stroke="#7c2d12" strokeWidth="1.2" />
        <ellipse cx="10" cy="0" rx="9" ry="10" fill="#c2410c" stroke="#7c2d12" strokeWidth="1.2" />
        {/* Mid lobes */}
        <ellipse cx="-5" cy="1" rx="9" ry="11" fill="#ea580c" stroke="#7c2d12" strokeWidth="1.2" />
        <ellipse cx="5" cy="1" rx="9" ry="11" fill="#ea580c" stroke="#7c2d12" strokeWidth="1.2" />
        {/* Front center lobe */}
        <ellipse cx="0" cy="1.5" rx="8" ry="11.5" fill="#f97316" stroke="#9a3412" strokeWidth="1.2" />
        {/* Highlight sheen */}
        <ellipse cx="-2" cy="-2" rx="4" ry="7" fill="#fb923c" opacity="0.6" />

        {/* Coiled green stem */}
        <path d="M 0,-10 Q 2,-16 6,-14 Q 8,-12 6,-10" fill="none" stroke="#15803d" strokeWidth="2.5" strokeLinecap="round" />
      </g>
    </g>
  );
};
