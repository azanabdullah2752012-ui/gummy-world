import React, { useState, useRef } from 'react';
import type { DayNightState, Particle } from '../../types';
import { getGroundY, WORLD_WIDTH } from '../../utils/math';
import { soundEngine } from '../../audio/soundEngine';
import { useGameLoop } from '../../hooks/useGameLoop';

interface InteractiveObjectsProps {
  dayNight: DayNightState;
  onSpawnParticles: (particles: Particle[]) => void;
  onDiscovery: (id: string, title: string, desc: string, icon: string) => void;
}

export const InteractiveObjects: React.FC<InteractiveObjectsProps> = ({
  dayNight,
  onSpawnParticles,
  onDiscovery,
}) => {
  // Interactive state hooks
  const [treeRustle, setTreeRustle] = useState(false);
  const [owlAwake, setOwlAwake] = useState(false);
  const [chimneyPuff, setChimneyPuff] = useState(0);
  const [flowerBloom, setFlowerBloom] = useState(false);
  const [moonflowerGleam, setMoonflowerGleam] = useState(false);
  const [windmillBoost, setWindmillBoost] = useState(false);
  const [anemometerRing, setAnemometerRing] = useState(false);
  const [wellCrank, setWellCrank] = useState(0);
  const [quartzGleam, setQuartzGleam] = useState(false);
  const [dragonflyFlutter, setDragonflyFlutter] = useState(false);
  const [bridgeRuneGlow, setBridgeRuneGlow] = useState(false);
  const [sundialGlint, setSundialGlint] = useState(false);
  const [geodeSparkle, setGeodeSparkle] = useState(false);
  const [spyglassGlint, setSpyglassGlint] = useState(false);
  const [lanternManualOn, setLanternManualOn] = useState(false);

  // Continuous delta-time driven windmill rotation (pauses smoothly when simulation pauses)
  const [windmillAngle, setWindmillAngle] = useState(0);
  const windmillSpeedRef = useRef(28);

  useGameLoop(dt => {
    const targetSpeed = windmillBoost ? 190 : 28; // deg/sec
    windmillSpeedRef.current += (targetSpeed - windmillSpeedRef.current) * Math.min(1, dt * 3.5);
    setWindmillAngle(prev => (prev + windmillSpeedRef.current * dt) % 360);
  });

  // 1. Reading Oak Canopy interaction
  const handleOakClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTreeRustle(true);
    setTimeout(() => setTreeRustle(false), 800);
    soundEngine.playLeafRustle();

    onDiscovery('oak-canopy', 'The Ancient Reading Oak', 'Rustled the canopy of the ancient reading oak.', '🌳');

    const groundY = getGroundY(760);
    const newLeaves: Particle[] = Array.from({ length: 6 }).map((_, i) => ({
      id: Date.now() + i,
      x: 760 + (Math.random() * 120 - 60),
      y: groundY - 180 + Math.random() * 40,
      vx: (Math.random() - 0.5) * 40,
      vy: 30 + Math.random() * 40,
      color: '#d6a048',
      size: 5,
      alpha: 1,
      maxLife: 2.2,
      life: 2.2,
      shape: 'leaf',
    }));
    onSpawnParticles(newLeaves);
  };

  // 1b. Owl Hollow & Flood Tallies (Secret)
  const handleOwlHollowClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOwlAwake(true);
    setTimeout(() => setOwlAwake(false), 2400);
    soundEngine.playLeafRustle();

    onDiscovery(
      'oak-hollow',
      'Owl Hollow & Flood Tallies',
      'Sheltered screech owl and vintage spring flood tallies carved into the reading oak.',
      '🦉'
    );

    const groundY = getGroundY(760);
    const feathers: Particle[] = Array.from({ length: 4 }).map((_, i) => ({
      id: Date.now() + i,
      x: 760 - 8 + (Math.random() * 16 - 8),
      y: groundY - 60 + (Math.random() * 10 - 5),
      vx: (Math.random() - 0.5) * 25,
      vy: 15 + Math.random() * 20,
      color: '#fef3c7',
      size: 3.5,
      alpha: 0.9,
      maxLife: 2.0,
      life: 2.0,
      shape: 'leaf',
    }));
    onSpawnParticles(feathers);
  };

  // 2. Whispering Well interaction
  const handleWellClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setWellCrank(prev => prev + 1);
    soundEngine.playWaterRipple();
    onDiscovery('well-water', 'The Whispering Well', 'Lowered the cedar bucket and heard the deep spring chime.', '🪣');
  };

  // 2b. Bedrock Quartz Resonator (Secret)
  const handleWellQuartzClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setQuartzGleam(true);
    setTimeout(() => setQuartzGleam(false), 2000);
    soundEngine.playFlowerChime();

    onDiscovery(
      'well-quartz',
      'Bedrock Quartz Resonator',
      'Struck the natural quartz seam inside the well shaft, evoking a crystalline harmonic chime.',
      '💎'
    );

    const wellY = getGroundY(1220);
    const crystals: Particle[] = Array.from({ length: 6 }).map((_, i) => ({
      id: Date.now() + i,
      x: 1220 + 16 + (Math.random() * 14 - 7),
      y: wellY - 14 + (Math.random() * 14 - 7),
      vx: (Math.random() - 0.5) * 35,
      vy: -25 - Math.random() * 30,
      color: ['#80deea', '#e0f7fa', '#b2ebf2'][i % 3],
      size: 4,
      alpha: 1,
      maxLife: 1.6,
      life: 1.6,
      shape: 'spark',
    }));
    onSpawnParticles(crystals);
  };

  // 3. Pond click interaction
  const handlePondClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    soundEngine.playWaterRipple();
    onDiscovery('pond-water', 'The Dragonfly Pond', 'Stirred clear concentric water ripples.', '💧');

    const pondY = getGroundY(1650);
    const drops: Particle[] = Array.from({ length: 7 }).map((_, i) => ({
      id: Date.now() + i,
      x: 1650 + (Math.random() * 100 - 50),
      y: pondY + 15,
      vx: (Math.random() - 0.5) * 60,
      vy: -60 - Math.random() * 50,
      color: '#90caf9',
      size: 4,
      alpha: 1,
      maxLife: 1.2,
      life: 1.2,
      shape: 'circle',
    }));
    onSpawnParticles(drops);
  };

  // 3b. Emperor Dragonfly & Reeds (Secret)
  const handleDragonflyClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDragonflyFlutter(true);
    setTimeout(() => setDragonflyFlutter(false), 1800);
    soundEngine.playWaterRipple();

    onDiscovery(
      'pond-dragonfly',
      'Reeds & Emperor Dragonfly',
      'Observed the iridescent blue emperor dragonfly resting beside the reed bed.',
      '🪷'
    );

    const pondY = getGroundY(1650);
    const sparkles: Particle[] = Array.from({ length: 5 }).map((_, i) => ({
      id: Date.now() + i,
      x: 1650 + 70 + (Math.random() * 20 - 10),
      y: pondY + (Math.random() * 20 - 10),
      vx: (Math.random() - 0.5) * 40,
      vy: -35 - Math.random() * 30,
      color: ['#38bdf8', '#7dd3fc', '#bae6fd'][i % 3],
      size: 3.5,
      alpha: 1,
      maxLife: 1.5,
      life: 1.5,
      shape: 'spark',
    }));
    onSpawnParticles(sparkles);
  };

  // 4. Mossy Brook Footbridge & Otter Rune (Secret Landmark x = 2050)
  const handleBridgeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setBridgeRuneGlow(true);
    setTimeout(() => setBridgeRuneGlow(false), 2200);
    soundEngine.playWaterRipple();

    onDiscovery(
      'bridge-culvert',
      'The Mossy Brook Footbridge',
      'Examined the low stone culvert arch where the stream divides, noting the carved otter rune on the keystone.',
      '🌉'
    );

    const bridgeY = getGroundY(2050);
    const runes: Particle[] = Array.from({ length: 6 }).map((_, i) => ({
      id: Date.now() + i,
      x: 2050 + (Math.random() * 30 - 15),
      y: bridgeY - 12 + (Math.random() * 16 - 8),
      vx: (Math.random() - 0.5) * 30,
      vy: -20 - Math.random() * 30,
      color: '#6ee7b7',
      size: 3.5,
      alpha: 1,
      maxLife: 1.8,
      life: 1.8,
      shape: 'spark',
    }));
    onSpawnParticles(runes);
  };

  // 5. Cottage Chimney interaction
  const handleChimneyClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setChimneyPuff(prev => prev + 1);
    soundEngine.playSmokePuff();
    onDiscovery('cottage-hearth', 'Sunflower Cottage Hearth', 'Puffed soft white cedar smoke rings from the cottage hearth.', '🏡');

    const chimneyY = getGroundY(2680) - 170;
    const smoke: Particle[] = Array.from({ length: 4 }).map((_, i) => ({
      id: Date.now() + i,
      x: 2680 + (Math.random() * 10 - 5),
      y: chimneyY - i * 8,
      vx: 12 + (Math.random() - 0.5) * 15,
      vy: -45 - Math.random() * 20,
      color: '#ffffff',
      size: 8 + i * 4,
      alpha: 0.85,
      maxLife: 2.5,
      life: 2.5,
      shape: 'smoke',
    }));
    onSpawnParticles(smoke);
  };

  // 5b. Porch Slate Solar & Lunar Dial (Secret)
  const handleSundialClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSundialGlint(true);
    setTimeout(() => setSundialGlint(false), 2000);
    soundEngine.playFlowerChime();

    onDiscovery(
      'cottage-sundial',
      'The Slate Solar & Lunar Dial',
      'Inspected the porch slate dial tracking the celestial arc of sun and moon across the valley.',
      '☀️'
    );

    const cotY = getGroundY(2680);
    const sunbeams: Particle[] = Array.from({ length: 6 }).map((_, i) => ({
      id: Date.now() + i,
      x: 2680 - 52 + (Math.random() * 14 - 7),
      y: cotY - 4 + (Math.random() * 8 - 4),
      vx: (Math.random() - 0.5) * 35,
      vy: -30 - Math.random() * 25,
      color: ['#fde047', '#facc15', '#ffffff'][i % 3],
      size: 3.5,
      alpha: 1,
      maxLife: 1.5,
      life: 1.5,
      shape: 'spark',
    }));
    onSpawnParticles(sunbeams);
  };

  // 6. Flower Trellis interaction
  const handleFlowerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFlowerBloom(true);
    setTimeout(() => setFlowerBloom(false), 1200);
    soundEngine.playFlowerChime();
    onDiscovery('trellis-sweetpeas', 'Sweet Pea Trellis & Pumpkins', 'Encouraged the sweet peas to unfurl their petals.', '🌸');

    const gardenY = getGroundY(3040);
    const pollen: Particle[] = Array.from({ length: 9 }).map((_, i) => ({
      id: Date.now() + i,
      x: 3040 + (Math.random() * 60 - 30),
      y: gardenY - 40 + (Math.random() * 30 - 15),
      vx: (Math.random() - 0.5) * 45,
      vy: -35 - Math.random() * 35,
      color: ['#ffb74d', '#f48fb1', '#fff59d'][i % 3],
      size: 4,
      alpha: 1,
      maxLife: 1.8,
      life: 1.8,
      shape: 'spark',
    }));
    onSpawnParticles(pollen);
  };

  // 6b. Night-Blooming Moonflower Vine (Secret)
  const handleMoonflowerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMoonflowerGleam(true);
    setTimeout(() => setMoonflowerGleam(false), 2200);
    soundEngine.playFlowerChime();

    onDiscovery(
      'trellis-moonflower',
      'Night-Blooming Moonflower Vine',
      'Discovered the silver moonflower vine clinging to the western trellis post, unfurling its pale nocturnal petals.',
      '🌙'
    );

    const gardenY = getGroundY(3040);
    const petals: Particle[] = Array.from({ length: 7 }).map((_, i) => ({
      id: Date.now() + i,
      x: 3040 - 42 + (Math.random() * 12 - 6),
      y: gardenY - 32 + (Math.random() * 16 - 8),
      vx: (Math.random() - 0.5) * 30,
      vy: -25 - Math.random() * 30,
      color: ['#e0f2fe', '#f0fdf4', '#f8fafc'][i % 3],
      size: 3.5,
      alpha: 1,
      maxLife: 1.8,
      life: 1.8,
      shape: 'leaf',
    }));
    onSpawnParticles(petals);
  };

  // 7. Mountain Windmill interaction
  const handleWindmillClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setWindmillBoost(true);
    setTimeout(() => setWindmillBoost(false), 3000);
    soundEngine.playWindmillClick();
    onDiscovery('windmill-sails', 'The Clockwork Ridge Windmill', 'Caught the high ridge breeze and spun the brass gears.', '⚙️');

    const millY = getGroundY(3720) - 130;
    const sparks: Particle[] = Array.from({ length: 6 }).map((_, i) => ({
      id: Date.now() + i,
      x: 3720 + (Math.random() * 20 - 10),
      y: millY + (Math.random() * 20 - 10),
      vx: (Math.random() - 0.5) * 80,
      vy: -40 - Math.random() * 50,
      color: '#ffca28',
      size: 3,
      alpha: 1,
      maxLife: 0.9,
      life: 0.9,
      shape: 'spark',
    }));
    onSpawnParticles(sparks);
  };

  // 7b. High-Wind Anemometer Bell (Secret)
  const handleAnemometerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setAnemometerRing(true);
    setTimeout(() => setAnemometerRing(false), 2000);
    soundEngine.playWindmillClick();

    onDiscovery(
      'windmill-anemometer',
      'High-Wind Anemometer Bell',
      'Tapped the tuned copper anemometer bell on the windmill gantry, sounding the ridge storm warning tone.',
      '🔔'
    );

    const millY = getGroundY(3720);
    const rings: Particle[] = Array.from({ length: 5 }).map((_, i) => ({
      id: Date.now() + i,
      x: 3720 + 36 + (Math.random() * 10 - 5),
      y: millY - 118 + (Math.random() * 10 - 5),
      vx: (Math.random() - 0.5) * 30,
      vy: -30 - Math.random() * 30,
      color: '#f59e0b',
      size: 3.5,
      alpha: 1,
      maxLife: 1.4,
      life: 1.4,
      shape: 'spark',
    }));
    onSpawnParticles(rings);
  };

  // 8. Pine Ridge Quartz Outcrop (Secret Landmark x = 4050)
  const handleGeodeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setGeodeSparkle(true);
    setTimeout(() => setGeodeSparkle(false), 2200);
    soundEngine.playFlowerChime();

    onDiscovery(
      'ridge-geode',
      'Pine Ridge Quartz Outcrop',
      'Examined the granite fissure on the pine ridge, gazing into natural amber quartz crystal clusters.',
      '✨'
    );

    const geodeY = getGroundY(4050);
    const sparks: Particle[] = Array.from({ length: 8 }).map((_, i) => ({
      id: Date.now() + i,
      x: 4050 + (Math.random() * 24 - 12),
      y: geodeY - 12 + (Math.random() * 14 - 7),
      vx: (Math.random() - 0.5) * 45,
      vy: -35 - Math.random() * 35,
      color: ['#fbbf24', '#f59e0b', '#fef08a'][i % 3],
      size: 4,
      alpha: 1,
      maxLife: 1.6,
      life: 1.6,
      shape: 'spark',
    }));
    onSpawnParticles(sparks);
  };

  // 9. Lookout Cliff interaction
  const handleLookoutClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    soundEngine.playFlowerChime();
    onDiscovery('lookout-cliff', 'Western High Lookout', 'Scouted the endless western horizon from the ridge.', '🔭');
  };

  // 9b. Mountain Weather Spyglass (Secret)
  const handleSpyglassClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSpyglassGlint(true);
    setTimeout(() => setSpyglassGlint(false), 2200);
    soundEngine.playFlowerChime();

    onDiscovery(
      'lookout-spyglass',
      'The Mountain Weather Spyglass',
      'Peered through the brass weather spyglass across the western crags, tracking distant thermal currents.',
      '☁️'
    );

    const lookY = getGroundY(4420);
    const glints: Particle[] = Array.from({ length: 6 }).map((_, i) => ({
      id: Date.now() + i,
      x: 4420 + 12 + (Math.random() * 16 - 8),
      y: lookY - 45 + (Math.random() * 12 - 6),
      vx: 20 + Math.random() * 25,
      vy: -20 - Math.random() * 25,
      color: ['#93c5fd', '#fef08a', '#ffffff'][i % 3],
      size: 3.5,
      alpha: 1,
      maxLife: 1.5,
      life: 1.5,
      shape: 'spark',
    }));
    onSpawnParticles(glints);
  };

  // Lantern glowing condition
  const areLanternsLit = dayNight.lanternsOn || lanternManualOn;

  return (
    <svg
      className="w-full h-full absolute inset-0 overflow-visible pointer-events-auto select-none"
      viewBox={`0 0 ${WORLD_WIDTH} 900`}
      preserveAspectRatio="none"
    >
      <defs>
        <radialGradient id="lantern-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff3bf" stopOpacity="0.9" />
          <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="quartz-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#cffafe" stopOpacity="0.95" />
          <stop offset="60%" stopColor="#06b6d4" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="moonflower-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="60%" stopColor="#93c5fd" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#93c5fd" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* ════════════════════════════════════════════════════════════════
          1. THE ANCIENT READING OAK (x = 760)
      ════════════════════════════════════════════════════════════════ */}
      {(() => {
        const oakX = 760;
        const oakY = getGroundY(oakX);
        const benchLeg1Y = getGroundY(oakX - 48) - oakY;
        const benchLeg2Y = getGroundY(oakX - 12) - oakY;

        return (
          <g
            transform={`translate(${oakX}, ${oakY})`}
            className="cursor-pointer group"
            onClick={handleOakClick}
            onPointerDown={e => e.stopPropagation()}
          >
            {/* Trunk Ground Contact Shadow */}
            <ellipse cx="0" cy="2" rx="48" ry="7" fill="#3b5237" opacity="0.38" />

            {/* Wooden bench under oak - mathematically anchored to ground slope */}
            <g>
              {/* Bench contact shadows */}
              <ellipse cx="-48" cy={benchLeg1Y + 1} rx="5" ry="1.8" fill="#3b5237" opacity="0.35" />
              <ellipse cx="-12" cy={benchLeg2Y + 1} rx="5" ry="1.8" fill="#3b5237" opacity="0.35" />

              {/* Bench Legs extending precisely to terrain */}
              <line x1="-48" y1="-18" x2="-48" y2={benchLeg1Y + 1.5} stroke="#4d3120" strokeWidth="4" strokeLinecap="round" />
              <line x1="-12" y1="-18" x2="-12" y2={benchLeg2Y + 1.5} stroke="#4d3120" strokeWidth="4" strokeLinecap="round" />

              {/* Bench Seat (level) */}
              <rect x="-54" y="-19" width="48" height="6" rx="2" fill="#7a5438" stroke="#3d2719" strokeWidth="1.2" />

              {/* Bench Backrest */}
              <rect x="-52" y="-30" width="44" height="6" rx="1.5" fill="#8c6242" stroke="#3d2719" strokeWidth="1" />
              <line x1="-46" y1="-30" x2="-46" y2="-19" stroke="#4d3120" strokeWidth="2.5" />
              <line x1="-18" y1="-30" x2="-18" y2="-19" stroke="#4d3120" strokeWidth="2.5" />
            </g>

            {/* Massive Tree Trunk with bark contours */}
            <path
              d="M -30,0 Q -24,-90 -45,-140 Q -10,-110 0,-150 Q 20,-110 40,-130 Q 30,-80 32,0 Z"
              fill="#543c2c"
              stroke="#322217"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            {/* Root flares spreading naturally into soil */}
            <path d="M -30,0 Q -45,8 -65,12" stroke="#463123" strokeWidth="6" strokeLinecap="round" />
            <path d="M 32,0 Q 50,8 68,14" stroke="#463123" strokeWidth="6" strokeLinecap="round" />

            {/* 1b. SECRET: Owl Hollow & Flood Tallies (Clickable trunk detail) */}
            <g
              className="cursor-pointer group/owl"
              onClick={handleOwlHollowClick}
              onPointerDown={e => e.stopPropagation()}
            >
              {/* Four vintage flood tally notches carved into bark above hollow */}
              <line x1="-12" y1="-78" x2="-4" y2="-78" stroke="#3a2215" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="-13" y1="-74" x2="-3" y2="-74" stroke="#3a2215" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="-12" y1="-70" x2="-5" y2="-70" stroke="#3a2215" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="-11" y1="-66" x2="-6" y2="-66" stroke="#3a2215" strokeWidth="1.5" strokeLinecap="round" />

              {/* Hollow knot border */}
              <ellipse cx="-8" cy="-56" rx="9.5" ry="13.5" fill="#1b1009" stroke="#3d2719" strokeWidth="1.5" />
              <ellipse cx="-8" cy="-56" rx="8" ry="12" fill="#24160d" />

              {/* Screech Owl Inside Hollow */}
              <g
                transform={`translate(-8, -56) scale(${owlAwake ? 1.12 : 1.0})`}
                style={{ transition: 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
              >
                {/* Feathery ear tufts */}
                <path d="M -5,-7 L -3,-4 L 3,-4 L 5,-7" stroke="#4a3728" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                {/* Owl face mask */}
                <ellipse cx="0" cy="0" rx="6.5" ry="7.5" fill="#3e271a" />
                {/* Owl eyes (bright amber when awake or night, soft sleepy slit by day) */}
                {owlAwake || dayNight.phase === 'dusk' || dayNight.phase === 'night' ? (
                  <>
                    <circle cx="-2.5" cy="-1.5" r="2.2" fill="#f59e0b" />
                    <circle cx="-2.5" cy="-1.5" r="1.1" fill="#1f140e" />
                    <circle cx="2.5" cy="-1.5" r="2.2" fill="#f59e0b" />
                    <circle cx="2.5" cy="-1.5" r="1.1" fill="#1f140e" />
                  </>
                ) : (
                  <>
                    <path d="M -4,-1.5 Q -2.5,0.5 -1,-1.5" stroke="#f59e0b" strokeWidth="1.2" fill="none" />
                    <path d="M 1,-1.5 Q 2.5,0.5 4,-1.5" stroke="#f59e0b" strokeWidth="1.2" fill="none" />
                  </>
                )}
                {/* Amber beak */}
                <polygon points="0,0.5 -1,2.5 1,2.5" fill="#f59e0b" />
              </g>

              <text
                x="-8"
                y="-85"
                textAnchor="middle"
                className="opacity-0 group-hover/owl:opacity-100 transition-opacity fill-[#382b26] font-semibold text-[11px] select-none pointer-events-none"
              >
                Owl Hollow & Flood Tallies 🦉
              </text>
            </g>

            {/* Sprawling Leaf Canopy (rustles on click) */}
            <g
              className={treeRustle ? 'animate-bounce' : ''}
              style={{
                transformOrigin: '0px -150px',
                transition: 'transform 0.3s ease',
              }}
            >
              {/* Back shadow foliage */}
              <ellipse cx="-45" cy="-170" rx="75" ry="55" fill="#386b3e" />
              <ellipse cx="45" cy="-160" rx="70" ry="50" fill="#386b3e" />
              <ellipse cx="0" cy="-210" rx="85" ry="60" fill="#386b3e" />

              {/* Main lush green leaf clusters */}
              <ellipse cx="-55" cy="-180" rx="65" ry="50" fill="#4c8a54" />
              <ellipse cx="50" cy="-175" rx="65" ry="46" fill="#4c8a54" />
              <ellipse cx="0" cy="-225" rx="75" ry="55" fill="#589e60" />

              {/* Sunlight highlights */}
              <ellipse cx="-20" cy="-245" rx="45" ry="32" fill="#72b87a" opacity="0.8" />
              <ellipse cx="35" cy="-205" rx="38" ry="28" fill="#72b87a" opacity="0.8" />

              {/* Hanging brass lantern from branch */}
              <g transform="translate(42, -125)">
                <line x1="0" y1="0" x2="0" y2="18" stroke="#3b2b20" strokeWidth="1.5" />
                <rect x="-6" y="18" width="12" height="16" rx="2" fill="#2b221a" stroke="#d4af37" strokeWidth="1" />
                <rect x="-4" y="21" width="8" height="10" rx="1" fill={areLanternsLit ? '#fff176' : '#90a4ae'} />
                {areLanternsLit && <circle cx="0" cy="26" r="28" fill="url(#lantern-glow)" />}
              </g>
            </g>

            {/* Tooltip hint on hover */}
            <text
              x="0"
              y="-275"
              textAnchor="middle"
              className="opacity-0 group-hover:opacity-100 transition-opacity fill-[#382b26] font-semibold text-xs select-none pointer-events-none"
            >
              The Ancient Reading Oak 🍃
            </text>
          </g>
        );
      })()}

      {/* ════════════════════════════════════════════════════════════════
          2. THE WHISPERING WELL (x = 1220)
      ════════════════════════════════════════════════════════════════ */}
      {(() => {
        const wellX = 1220;
        const wellY = getGroundY(wellX);
        const groundLeft = getGroundY(wellX - 30) - wellY;
        const groundRight = getGroundY(wellX + 30) - wellY;

        return (
          <g
            transform={`translate(${wellX}, ${wellY})`}
            className="cursor-pointer group"
            onClick={handleWellClick}
            onPointerDown={e => e.stopPropagation()}
          >
            {/* Grassy contact shadow beneath well */}
            <ellipse cx="0" cy={Math.max(groundLeft, groundRight) / 2} rx="30" ry="6" fill="#2d422a" opacity="0.4" />

            {/* Cobblestone well base extending into terrain slope */}
            <polygon
              points={`-25,-28 25,-28 28,${Math.max(0, groundRight) + 6} -28,${Math.max(0, groundLeft) + 6}`}
              fill="#8d8479"
              stroke="#423b34"
              strokeWidth="2"
            />
            {/* Cobblestone mortar details */}
            <line x1="-20" y1="-14" x2="20" y2="-14" stroke="#5d554e" strokeWidth="1.5" strokeDasharray="8 4" />
            <line x1="-22" y1="-6" x2="22" y2="-6" stroke="#5d554e" strokeWidth="1.5" strokeDasharray="6 4" />

            {/* 2b. SECRET: Bedrock Quartz Resonator (Clickable crystal seam) */}
            <g
              className="cursor-pointer group/quartz"
              onClick={handleWellQuartzClick}
              onPointerDown={e => e.stopPropagation()}
            >
              {/* Quartz cluster jutting from lower cobblestones */}
              <g transform="translate(14, -14)">
                {(quartzGleam || dayNight.phase === 'night' || dayNight.phase === 'dusk') && (
                  <circle cx="2" cy="-4" r="14" fill="url(#quartz-glow)" />
                )}
                <polygon
                  points="-4,4 0,-10 4,4"
                  fill={quartzGleam ? '#ffffff' : '#b2ebf2'}
                  stroke="#00838f"
                  strokeWidth="1"
                />
                <polygon
                  points="2,4 6,-6 9,4"
                  fill={quartzGleam ? '#e0f7fa' : '#80deea'}
                  stroke="#00838f"
                  strokeWidth="1"
                />
                <polygon
                  points="-7,4 -4,-4 -1,4"
                  fill={quartzGleam ? '#cffafe' : '#4dd0e1'}
                  stroke="#00838f"
                  strokeWidth="0.8"
                />
              </g>

              <text
                x="14"
                y="-32"
                textAnchor="middle"
                className="opacity-0 group-hover/quartz:opacity-100 transition-opacity fill-[#0e7490] font-semibold text-[10px] select-none pointer-events-none"
              >
                Quartz Resonator 💎
              </text>
            </g>

            {/* Posts & Roof */}
            <line x1="-20" y1="-28" x2="-20" y2="-65" stroke="#543c2c" strokeWidth="3" />
            <line x1="20" y1="-28" x2="20" y2="-65" stroke="#543c2c" strokeWidth="3" />
            {/* Spindle & crank */}
            <line x1="-20" y1="-50" x2="20" y2="-50" stroke="#795548" strokeWidth="2.5" />
            <g transform={`rotate(${wellCrank * 45}, 22, -50)`}>
              <line x1="20" y1="-50" x2="28" y2="-50" stroke="#b08d57" strokeWidth="2" />
              <line x1="28" y1="-50" x2="28" y2="-40" stroke="#b08d57" strokeWidth="2" />
            </g>
            {/* Thatched triangular roof */}
            <polygon points="0,-82 -32,-62 32,-62" fill="#c77b4d" stroke="#54311c" strokeWidth="2" />

            <text
              x="0"
              y="-92"
              textAnchor="middle"
              className="opacity-0 group-hover:opacity-100 transition-opacity fill-[#382b26] font-semibold text-xs select-none pointer-events-none"
            >
              The Whispering Well 🪣
            </text>
          </g>
        );
      })()}

      {/* ════════════════════════════════════════════════════════════════
          3. THE DRAGONFLY POND (x = 1650) & EMPEROR DRAGONFLY
      ════════════════════════════════════════════════════════════════ */}
      {(() => {
        const pondX = 1650;
        const pondY = getGroundY(pondX) + 12;
        return (
          <g transform={`translate(${pondX}, ${pondY})`}>
            {/* Main Pond Water click area */}
            <g
              className="cursor-pointer group/pond"
              onClick={handlePondClick}
              onPointerDown={e => e.stopPropagation()}
            >
              <ellipse cx="0" cy="22" rx="140" ry="30" fill="transparent" />
              <text
                x="0"
                y="-8"
                textAnchor="middle"
                className="opacity-0 group-hover/pond:opacity-100 transition-opacity fill-[#382b26] font-semibold text-xs select-none pointer-events-none"
              >
                Ripple Pond 💧
              </text>
            </g>

            {/* 3b. SECRET: Reeds & Emperor Dragonfly (x = pondX + 75) */}
            <g
              className="cursor-pointer group/dragonfly"
              transform="translate(75, 4)"
              onClick={handleDragonflyClick}
              onPointerDown={e => e.stopPropagation()}
            >
              {/* River stepping stone */}
              <ellipse cx="0" cy="10" rx="15" ry="5.5" fill="#64748b" stroke="#334155" strokeWidth="1.2" />
              <ellipse cx="-2" cy="8.5" rx="10" ry="3.5" fill="#94a3b8" />

              {/* Slender green reed stalk */}
              <path d="M 0,10 Q 8,-10 6,-32" fill="none" stroke="#16a34a" strokeWidth="2.2" strokeLinecap="round" />
              <path d="M 2,10 Q -6,-8 -4,-28" fill="none" stroke="#15803d" strokeWidth="1.8" strokeLinecap="round" />

              {/* Perched Emperor Dragonfly */}
              <g
                transform={`translate(6, -32) rotate(${dragonflyFlutter ? -12 : 5})`}
                style={{ transition: 'transform 0.2s ease-in-out' }}
              >
                {/* Thin sapphire abdomen */}
                <line x1="0" y1="0" x2="-2" y2="15" stroke="#0284c7" strokeWidth="2.2" strokeLinecap="round" />
                {/* Thorax & Head */}
                <ellipse cx="0" cy="-2" rx="2" ry="3" fill="#0369a1" />
                <circle cx="-1" cy="-4" r="1.3" fill="#38bdf8" />
                <circle cx="1" cy="-4" r="1.3" fill="#38bdf8" />

                {/* Translucent Wings with flutter effect */}
                <g className={dragonflyFlutter ? 'animate-pulse' : ''}>
                  {/* Left wings */}
                  <ellipse cx="-8" cy="-3" rx="7" ry="2.2" fill="#bae6fd" stroke="#0284c7" strokeWidth="0.8" opacity="0.85" />
                  <ellipse cx="-7" cy="1" rx="6" ry="2" fill="#bae6fd" stroke="#0284c7" strokeWidth="0.8" opacity="0.85" />
                  {/* Right wings */}
                  <ellipse cx="8" cy="-3" rx="7" ry="2.2" fill="#bae6fd" stroke="#0284c7" strokeWidth="0.8" opacity="0.85" />
                  <ellipse cx="7" cy="1" rx="6" ry="2" fill="#bae6fd" stroke="#0284c7" strokeWidth="0.8" opacity="0.85" />
                </g>
              </g>

              <text
                x="0"
                y="-45"
                textAnchor="middle"
                className="opacity-0 group-hover/dragonfly:opacity-100 transition-opacity fill-[#0369a1] font-semibold text-[11px] select-none pointer-events-none"
              >
                Emperor Dragonfly & Reeds 🪷
              </text>
            </g>
          </g>
        );
      })()}

      {/* ════════════════════════════════════════════════════════════════
          4. THE MOSSY BROOK FOOTBRIDGE & OTTER RUNE (x = 2050)
      ════════════════════════════════════════════════════════════════ */}
      {(() => {
        const brX = 2050;
        const brY = getGroundY(brX);
        const brL_Y = getGroundY(brX - 42) - brY;
        const brR_Y = getGroundY(brX + 42) - brY;

        return (
          <g
            transform={`translate(${brX}, ${brY})`}
            className="cursor-pointer group/bridge"
            onClick={handleBridgeClick}
            onPointerDown={e => e.stopPropagation()}
          >
            {/* Low stone culvert arch embedded into terrain */}
            <polygon
              points={`-42,-2 -42,${brL_Y + 14} 42,${brR_Y + 14} 42,-2`}
              fill="#64748b"
              stroke="#334155"
              strokeWidth="2"
            />

            {/* Arched water channel beneath */}
            <path
              d="M -24,8 Q 0,-14 24,8 Z"
              fill="#1e293b"
              stroke="#0f172a"
              strokeWidth="1.5"
            />
            {/* Stream water ripples in culvert */}
            <line x1="-16" y1="4" x2="16" y2="4" stroke="#38bdf8" strokeWidth="1.2" opacity="0.8" />

            {/* Arch stone voussoirs */}
            <path
              d="M -28,8 Q 0,-18 28,8"
              fill="none"
              stroke="#475569"
              strokeWidth="3.5"
            />

            {/* Keystone with carved Otter Rune */}
            <polygon points="-6,-18 6,-18 4,-10 -4,-10" fill="#475569" stroke="#1e293b" strokeWidth="1.2" />
            <path
              d="M -2,-16 Q 0,-13 2,-16 Q 0,-11 -2,-13"
              fill="none"
              stroke={bridgeRuneGlow ? '#34d399' : '#94a3b8'}
              strokeWidth="1.4"
              strokeLinecap="round"
            />

            {/* Low rustic timber parapet handrails */}
            <rect x="-44" y="-7" width="88" height="5" rx="1.5" fill="#78350f" stroke="#451a03" strokeWidth="1.2" />
            <line x1="-38" y1="-7" x2="-38" y2="-18" stroke="#78350f" strokeWidth="2.5" />
            <line x1="0" y1="-7" x2="0" y2="-18" stroke="#78350f" strokeWidth="2.5" />
            <line x1="38" y1="-7" x2="38" y2="-18" stroke="#78350f" strokeWidth="2.5" />
            <line x1="-42" y1="-18" x2="42" y2="-18" stroke="#92400e" strokeWidth="2.5" strokeLinecap="round" />

            {/* Moss patches clinging to stone arch */}
            <ellipse cx="-18" cy="-2" rx="7" ry="2.5" fill="#15803d" opacity="0.85" />
            <ellipse cx="20" cy="-2" rx="8" ry="3" fill="#16a34a" opacity="0.85" />

            <text
              x="0"
              y="-28"
              textAnchor="middle"
              className="opacity-0 group-hover/bridge:opacity-100 transition-opacity fill-[#065f46] font-semibold text-[11px] select-none pointer-events-none"
            >
              Mossy Brook Footbridge & Otter Rune 🌉
            </text>
          </g>
        );
      })()}

      {/* ════════════════════════════════════════════════════════════════
          5. SUNFLOWER COTTAGES (x = 2680) & SLATE SUNDIAL
      ════════════════════════════════════════════════════════════════ */}
      {(() => {
        const cotX = 2680;
        const cotY = getGroundY(cotX);

        // Calculate slope offsets across cottage width [-88..88]
        const yL88 = getGroundY(cotX - 88) - cotY;
        const yL44 = getGroundY(cotX - 44) - cotY;
        const yMid = 0;
        const yR44 = getGroundY(cotX + 44) - cotY;
        const yR88 = getGroundY(cotX + 88) - cotY;

        return (
          <g transform={`translate(${cotX}, ${cotY})`}>
            {/* Fieldstone Foundation Plinth (seamlessly embeds into the hillside with zero gap) */}
            <polygon
              points={`
                -88,-6
                88,-6
                88,${yR88 + 12}
                44,${yR44 + 12}
                0,${yMid + 12}
                -44,${yL44 + 12}
                -88,${yL88 + 12}
              `}
              fill="#7a7062"
              stroke="#4d443a"
              strokeWidth="2"
            />
            {/* Stone course mortar lines on foundation */}
            <line x1="-84" y1="2" x2="84" y2="-4" stroke="#524a40" strokeWidth="1.5" strokeDasharray="14 6" />

            {/* Front Door Steps (grounded onto the path) */}
            <rect x="-22" y="-6" width="44" height="6" rx="1.5" fill="#8d8070" stroke="#4d443a" strokeWidth="1.2" />
            <rect x="-26" y="0" width="52" height="7" rx="1.5" fill="#756959" stroke="#4d443a" strokeWidth="1.2" />

            {/* 5b. SECRET: Porch Slate Solar & Lunar Dial (x = -52, y = -4) */}
            <g
              className="cursor-pointer group/sundial"
              onClick={handleSundialClick}
              onPointerDown={e => e.stopPropagation()}
            >
              {/* Dial base plate in porch stones */}
              <ellipse cx="-52" cy="-4" rx="15" ry="6" fill="#475569" stroke="#1e293b" strokeWidth="1.2" />
              <ellipse cx="-52" cy="-4" rx="11" ry="4" fill="none" stroke="#94a3b8" strokeWidth="0.8" strokeDasharray="3 2" />

              {/* Brass gnomon triangle casting a directional shadow */}
              <polygon
                points="-53,-4 -52,-15 -51,-4"
                fill={sundialGlint ? '#fef08a' : '#fbbf24'}
                stroke="#b45309"
                strokeWidth="0.8"
              />
              {/* Gnomon shadow */}
              <line
                x1="-52"
                y1="-4"
                x2={dayNight.phase === 'dawn' ? -44 : dayNight.phase === 'dusk' ? -60 : -52}
                y2="-1"
                stroke="#0f172a"
                strokeWidth="1.5"
                opacity="0.6"
              />

              <text
                x="-52"
                y="-22"
                textAnchor="middle"
                className="opacity-0 group-hover/sundial:opacity-100 transition-opacity fill-[#b45309] font-semibold text-[10px] select-none pointer-events-none"
              >
                Slate Solar & Lunar Dial ☀️
              </text>
            </g>

            {/* Main Cottage Stone Wall */}
            <rect x="-85" y="-120" width="170" height="114" rx="2" fill="#eae3d2" stroke="#54483b" strokeWidth="2.5" />

            {/* Stone corner quoins */}
            {[-110, -90, -70, -50, -30, -10].map((yOff, i) => (
              <rect key={i} x="-85" y={yOff} width="12" height="14" fill="#cfc5af" stroke="#756b56" strokeWidth="1" />
            ))}

            {/* Wooden Cottage Door */}
            <path d="M -16,-6 L -16,-46 Q 0,-56 16,-46 L 16,-6 Z" fill="#794828" stroke="#3b200e" strokeWidth="2" />
            <circle cx="10" cy="-24" r="2.2" fill="#ffca28" />

            {/* Windows with warm glass and wooden crossbars */}
            {[-58, 32].map((winX, i) => (
              <g key={i} transform={`translate(${winX}, -80)`}>
                <rect
                  x="0"
                  y="0"
                  width="26"
                  height="32"
                  rx="3"
                  fill={areLanternsLit ? '#ffecb3' : '#aed581'}
                  stroke="#4d3829"
                  strokeWidth="1.8"
                />
                <line x1="13" y1="0" x2="13" y2="32" stroke="#4d3829" strokeWidth="1.2" />
                <line x1="0" y1="16" x2="26" y2="16" stroke="#4d3829" strokeWidth="1.2" />
                {/* Flower window box */}
                <rect x="-2" y="30" width="30" height="7" rx="1.5" fill="#8d5b36" />
                <circle cx="4" cy="31" r="2.5" fill="#f06292" />
                <circle cx="13" cy="30" r="2.5" fill="#fff176" />
                <circle cx="22" cy="31" r="2.5" fill="#f06292" />
              </g>
            ))}

            {/* Steep Terracotta Thatched Roof */}
            <polygon points="0,-175 -102,-116 102,-116" fill="#c75d38" stroke="#542514" strokeWidth="3" />
            <line x1="-70" y1="-132" x2="70" y2="-132" stroke="#a34724" strokeWidth="2" />
            <line x1="-45" y1="-150" x2="45" y2="-150" stroke="#a34724" strokeWidth="2" />

            {/* Stone Chimney with Clickable Hearth */}
            <g
              transform={`translate(48, -175) scale(${1 + (chimneyPuff % 2 === 1 ? 0.08 : 0)})`}
              className="cursor-pointer group/chimney"
              onClick={handleChimneyClick}
              onPointerDown={e => e.stopPropagation()}
            >
              <rect x="-12" y="-30" width="24" height="42" fill="#8d8479" stroke="#423b34" strokeWidth="2" />
              <rect x="-14" y="-35" width="28" height="8" rx="2" fill="#6d655c" stroke="#3b342e" strokeWidth="1.5" />

              <text
                x="0"
                y="-45"
                textAnchor="middle"
                className="opacity-0 group-hover/chimney:opacity-100 transition-opacity fill-[#382b26] font-semibold text-xs select-none pointer-events-none"
              >
                Puff Hearth 🏡
              </text>
            </g>
          </g>
        );
      })()}

      {/* ════════════════════════════════════════════════════════════════
          6. GARDENER'S SWEET PEA TRELLIS, MOONFLOWER & PUMPKINS (x = 3040)
      ════════════════════════════════════════════════════════════════ */}
      {(() => {
        const garX = 3040;
        const garY = getGroundY(garX);

        // Ground heights for trellis posts
        const postL_Y = getGroundY(garX - 40) - garY;
        const postM_Y = 0;
        const postR_Y = getGroundY(garX + 40) - garY;

        // Ground heights for pumpkins
        const p1X = 3090;
        const p1Y = getGroundY(p1X) - garY;
        const p2X = 3122;
        const p2Y = getGroundY(p2X) - garY;
        const p3X = 3065;
        const p3Y = getGroundY(p3X) - garY;

        return (
          <g transform={`translate(${garX}, ${garY})`}>
            {/* Main Trellis group */}
            <g
              className="cursor-pointer group/trellis"
              onClick={handleFlowerClick}
              onPointerDown={e => e.stopPropagation()}
            >
              {/* Wooden Trellis upright posts extending securely into terrain */}
              <line x1="-40" y1="-85" x2="-40" y2={postL_Y + 8} stroke="#7d5534" strokeWidth="4" strokeLinecap="round" />
              <line x1="0" y1="-85" x2="0" y2={postM_Y + 8} stroke="#7d5534" strokeWidth="4" strokeLinecap="round" />
              <line x1="40" y1="-85" x2="40" y2={postR_Y + 8} stroke="#7d5534" strokeWidth="4" strokeLinecap="round" />

              {/* Horizontal Trellis crossbars */}
              <line x1="-42" y1="-80" x2="42" y2="-80" stroke="#9e734c" strokeWidth="2.5" />
              <line x1="-42" y1="-60" x2="42" y2="-60" stroke="#9e734c" strokeWidth="2" />
              <line x1="-42" y1="-40" x2="42" y2="-40" stroke="#9e734c" strokeWidth="2" />
              <line x1="-42" y1="-20" x2="42" y2="-20" stroke="#9e734c" strokeWidth="2" />

              {/* Vertical interior trellis lattice */}
              <line x1="-20" y1="-80" x2="-20" y2="-8" stroke="#9e734c" strokeWidth="1.5" />
              <line x1="20" y1="-80" x2="20" y2="-4" stroke="#9e734c" strokeWidth="1.5" />

              {/* Climbing Sweet Pea Vine */}
              <path
                d="M -35,0 Q -10,-35 -25,-60 Q 5,-75 25,-45 Q 35,-20 15,0"
                fill="none"
                stroke="#43a047"
                strokeWidth="3.5"
                strokeLinecap="round"
              />

              {/* Sweet Pea Blossoms */}
              {[
                { x: -25, y: -60, c: '#e91e63' },
                { x: -5, y: -45, c: '#ab47bc' },
                { x: 20, y: -55, c: '#ec407a' },
                { x: 10, y: -25, c: '#ba68c8' },
              ].map((blossom, bIdx) => (
                <g
                  key={bIdx}
                  transform={`translate(${blossom.x}, ${blossom.y}) scale(${flowerBloom ? 1.4 : 1.0})`}
                  style={{ transition: 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
                >
                  <circle cx="-3" cy="0" r="4.5" fill={blossom.c} />
                  <circle cx="3" cy="0" r="4.5" fill={blossom.c} />
                  <circle cx="0" cy="-3" r="4.5" fill={blossom.c} />
                  <circle cx="0" cy="0" r="2.5" fill="#ffeb3b" />
                </g>
              ))}

              <text
                x="0"
                y="-95"
                textAnchor="middle"
                className="opacity-0 group-hover/trellis:opacity-100 transition-opacity fill-[#382b26] font-semibold text-xs select-none pointer-events-none"
              >
                Sweet Pea Trellis 🌸
              </text>
            </g>

            {/* 6b. SECRET: Night-Blooming Moonflower Vine (Climbing western post) */}
            <g
              className="cursor-pointer group/moonflower"
              transform="translate(-40, 0)"
              onClick={handleMoonflowerClick}
              onPointerDown={e => e.stopPropagation()}
            >
              {/* Silver Moonflower twining vine */}
              <path
                d="M -6,0 Q 4,-20 -4,-40 Q 4,-60 -2,-78"
                fill="none"
                stroke="#86efac"
                strokeWidth="2.4"
                strokeLinecap="round"
              />

              {/* Luminous nocturnal buds & open blossoms */}
              {[
                { x: -4, y: -24, scale: 0.9 },
                { x: 2, y: -50, scale: 1.1 },
                { x: -3, y: -72, scale: 1.0 },
              ].map((mf, mfIdx) => {
                const isOpen = moonflowerGleam || dayNight.phase === 'dusk' || dayNight.phase === 'night';
                return (
                  <g
                    key={mfIdx}
                    transform={`translate(${mf.x}, ${mf.y}) scale(${mf.scale * (isOpen ? 1.25 : 0.85)})`}
                    style={{ transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
                  >
                    {isOpen && <circle cx="0" cy="0" r="10" fill="url(#moonflower-glow)" />}
                    {/* Spiral silver petals */}
                    <circle cx="-2.5" cy="-2.5" r="3.5" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="0.8" />
                    <circle cx="2.5" cy="-2.5" r="3.5" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="0.8" />
                    <circle cx="0" cy="2.5" r="3.5" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="0.8" />
                    <circle cx="0" cy="0" r="2" fill={isOpen ? '#fef08a' : '#94a3b8'} />
                  </g>
                );
              })}

              <text
                x="-4"
                y="-88"
                textAnchor="middle"
                className="opacity-0 group-hover/moonflower:opacity-100 transition-opacity fill-[#0369a1] font-semibold text-[10px] select-none pointer-events-none"
              >
                Night Moonflower Vine 🌙
              </text>
            </g>

            {/* ════════════════════════════════════════════════════════════
                THE PUMPKIN PATCH (100% Mathematically Grounded on Terrain)
            ════════════════════════════════════════════════════════════ */}
            {/* Ground Vine Weaving Between Pumpkins */}
            <path
              d={`
                M ${p3X - garX},${p3Y - 2}
                Q 38,${p1Y + 4} ${p1X - garX},${p1Y - 2}
                Q 68,${p1Y} ${p2X - garX},${p2Y - 2}
              `}
              fill="none"
              stroke="#2e7d32"
              strokeWidth="2.5"
              strokeLinecap="round"
            />

            {/* Pumpkin 3 (Small Round Pumpkin, X = 3065) */}
            <g transform={`translate(${p3X - garX}, ${p3Y})`}>
              <ellipse cx="0" cy="1" rx="10" ry="2.8" fill="#354e30" opacity="0.38" />
              <ellipse cx="0" cy="-6.5" rx="9" ry="7" fill="#ffa726" stroke="#c65102" strokeWidth="1.4" />
              <ellipse cx="0" cy="-6.5" rx="4.5" ry="7" fill="#ffb74d" />
              <path d="M 0,-13.5 Q 2,-17.5 5,-15.5" stroke="#2e7d32" strokeWidth="1.8" fill="none" />
            </g>

            {/* Pumpkin 1 (Large Ripe Pumpkin, X = 3090) */}
            <g transform={`translate(${p1X - garX}, ${p1Y})`}>
              <ellipse cx="0" cy="1" rx="18" ry="4" fill="#354e30" opacity="0.4" />
              <ellipse cx="0" cy="-10.5" rx="16" ry="12" fill="#ef6c00" stroke="#bf360c" strokeWidth="1.5" />
              <ellipse cx="0" cy="-10.5" rx="8" ry="12" fill="#f57c00" />
              <path d="M 0,-22.5 Q 3,-28.5 8,-26.5" stroke="#2e7d32" strokeWidth="2.4" fill="none" />
            </g>

            {/* Pumpkin 2 (Medium Pumpkin, X = 3122) */}
            <g transform={`translate(${p2X - garX}, ${p2Y})`}>
              <ellipse cx="0" cy="1" rx="14" ry="3.5" fill="#354e30" opacity="0.38" />
              <ellipse cx="0" cy="-8.5" rx="12.5" ry="9.5" fill="#f57c00" stroke="#bf360c" strokeWidth="1.5" />
              <ellipse cx="0" cy="-8.5" rx="6" ry="9.5" fill="#ff9800" />
              <path d="M 0,-18 Q 2,-23 6,-21" stroke="#2e7d32" strokeWidth="2" fill="none" />
            </g>

            {/* Broad Pumpkin Leaves */}
            <path
              d={`M 36,${p1Y - 4} Q 40,${p1Y - 14} 46,${p1Y - 8} Q 42,${p1Y} 36,${p1Y - 4}`}
              fill="#43a047"
              stroke="#2e7d32"
              strokeWidth="1"
            />
            <path
              d={`M 66,${p1Y - 2} Q 70,${p1Y - 12} 76,${p1Y - 6} Q 72,${p1Y + 2} 66,${p1Y - 2}`}
              fill="#43a047"
              stroke="#2e7d32"
              strokeWidth="1"
            />
          </g>
        );
      })()}

      {/* ════════════════════════════════════════════════════════════════
          7. THE CLOCKWORK WINDMILL & ANEMOMETER BELL (x = 3720)
      ════════════════════════════════════════════════════════════════ */}
      {(() => {
        const millX = 3720;
        const millY = getGroundY(millX);

        // Ground slope under workshop [-88..-8]
        const wsL_Y = getGroundY(millX - 88) - millY;
        const wsR_Y = getGroundY(millX - 8) - millY;

        // Ground slope under tower [-40..40]
        const twL_Y = getGroundY(millX - 40) - millY;
        const twR_Y = getGroundY(millX + 40) - millY;

        return (
          <g transform={`translate(${millX}, ${millY})`}>
            {/* Workshop Foundation Plinth (anchors workshop into slope with zero float) */}
            <polygon
              points={`-88,-6 -8,-6 -8,${wsR_Y + 12} -88,${wsL_Y + 12}`}
              fill="#6d5e52"
              stroke="#3e2723"
              strokeWidth="2"
            />

            {/* Workshop Lower Building Body */}
            <rect x="-85" y="-76" width="77" height="70" rx="2" fill="#8d6e63" stroke="#4e342e" strokeWidth="2" />
            <polygon points="-47,-100 -92,-65 -5,-65" fill="#4e342e" stroke="#2c1a16" strokeWidth="2" />

            {/* Workshop circular window */}
            <circle cx="-47" cy="-38" r="12" fill={areLanternsLit ? '#fff59d' : '#81d4fa'} stroke="#3e2723" strokeWidth="1.8" />
            <line x1="-47" y1="-50" x2="-47" y2="-26" stroke="#3e2723" strokeWidth="1.5" />
            <line x1="-59" y1="-38" x2="-35" y2="-38" stroke="#3e2723" strokeWidth="1.5" />

            {/* Tower Masonry Foundation Plinth (anchors tower base into slope) */}
            <polygon
              points={`-40,-6 40,-6 40,${twR_Y + 12} -40,${twL_Y + 12}`}
              fill="#7d756b"
              stroke="#4e342e"
              strokeWidth="2"
            />

            {/* Main Windmill Tower Body (Clickable to spin windmill) */}
            <g
              className="cursor-pointer group/mill"
              onClick={handleWindmillClick}
              onPointerDown={e => e.stopPropagation()}
            >
              <polygon
                points="-38,-6 -24,-170 24,-170 38,-6"
                fill="#d7ccc8"
                stroke="#4e342e"
                strokeWidth="2.5"
              />
              {/* Masonry decorative stone bands */}
              <line x1="-33" y1="-55" x2="33" y2="-55" stroke="#a1887f" strokeWidth="2" />
              <line x1="-28" y1="-115" x2="28" y2="-115" stroke="#a1887f" strokeWidth="2" />

              {/* Windmill Conical Cap */}
              <polygon points="0,-205 -32,-168 32,-168" fill="#5d4037" stroke="#3e2723" strokeWidth="2" />

              {/* Weather Vane */}
              <line x1="0" y1="-205" x2="0" y2="-224" stroke="#ffca28" strokeWidth="2" />
              <polygon points="0,-224 14,-219 0,-214" fill="#ffca28" />

              {/* ════════════════════════════════════════════════════════════
                  WINDMILL ROTOR & SAILS (Strict SVG-Anchored Delta-Time Hub)
              ════════════════════════════════════════════════════════════ */}
              <g transform={`translate(0, -170) rotate(${windmillAngle})`}>
                {[0, 90, 180, 270].map((angle, sIdx) => (
                  <g key={sIdx} transform={`rotate(${angle})`}>
                    <line x1="0" y1="0" x2="0" y2="-112" stroke="#5d4037" strokeWidth="3.5" strokeLinecap="round" />
                    <rect x="4" y="-106" width="24" height="92" rx="2" fill="#fff8e1" stroke="#8d6e63" strokeWidth="1.2" opacity="0.92" />
                    <line x1="4" y1="-86" x2="28" y2="-86" stroke="#8d6e63" strokeWidth="1" />
                    <line x1="4" y1="-66" x2="28" y2="-66" stroke="#8d6e63" strokeWidth="1" />
                    <line x1="4" y1="-46" x2="28" y2="-46" stroke="#8d6e63" strokeWidth="1" />
                    <line x1="4" y1="-26" x2="28" y2="-26" stroke="#8d6e63" strokeWidth="1" />
                  </g>
                ))}
                {/* Central Solid Brass Hub Axle Nut */}
                <circle cx="0" cy="0" r="10" fill="#ffb300" stroke="#3e2723" strokeWidth="2" />
                <circle cx="0" cy="0" r="5" fill="#e65100" />
                <circle cx="0" cy="0" r="2" fill="#ffffff" />
              </g>

              <text
                x="0"
                y="-235"
                textAnchor="middle"
                className="opacity-0 group-hover/mill:opacity-100 transition-opacity fill-[#382b26] font-semibold text-xs select-none pointer-events-none"
              >
                Spin Windmill ⚙️
              </text>
            </g>

            {/* 7b. SECRET: High-Wind Anemometer Bell on Gantry (x = 34, y = -120) */}
            <g
              className="cursor-pointer group/bell"
              onClick={handleAnemometerClick}
              onPointerDown={e => e.stopPropagation()}
            >
              {/* Gantry catwalk extension bracket */}
              <line x1="24" y1="-120" x2="42" y2="-120" stroke="#4e342e" strokeWidth="2.5" />
              <line x1="42" y1="-120" x2="42" y2="-138" stroke="#4e342e" strokeWidth="2" />

              {/* Anemometer spinning cups on spindle */}
              <g
                transform="translate(42, -138)"
                className={anemometerRing || windmillBoost ? 'animate-spin' : ''}
                style={{ transformOrigin: '0 0', animationDuration: '0.8s' }}
              >
                <line x1="-8" y1="0" x2="8" y2="0" stroke="#d97706" strokeWidth="1.5" />
                <circle cx="-8" cy="0" r="2.8" fill="#f59e0b" stroke="#78350f" strokeWidth="0.8" />
                <circle cx="8" cy="0" r="2.8" fill="#f59e0b" stroke="#78350f" strokeWidth="0.8" />
              </g>

              {/* Tuned copper warning bell */}
              <g
                transform={`translate(42, -114) rotate(${anemometerRing ? 15 : 0})`}
                style={{ transformOrigin: '0 -6px', transition: 'transform 0.15s ease-in-out' }}
              >
                <path
                  d="M -5,-6 L -5,-1 Q -5,6 0,6 Q 5,6 5,-1 L 5,-6 Z"
                  fill="#d97706"
                  stroke="#78350f"
                  strokeWidth="1.2"
                />
                <circle cx="0" cy="7" r="1.5" fill="#fef08a" />
              </g>

              <text
                x="42"
                y="-145"
                textAnchor="middle"
                className="opacity-0 group-hover/bell:opacity-100 transition-opacity fill-[#b45309] font-semibold text-[10px] select-none pointer-events-none"
              >
                Anemometer Bell 🔔
              </text>
            </g>
          </g>
        );
      })()}

      {/* ════════════════════════════════════════════════════════════════
          8. PINE RIDGE QUARTZ OUTCROP (x = 4050)
      ════════════════════════════════════════════════════════════════ */}
      {(() => {
        const geodeX = 4050;
        const geodeY = getGroundY(geodeX);
        const geodeL_Y = getGroundY(geodeX - 32) - geodeY;
        const geodeR_Y = getGroundY(geodeX + 32) - geodeY;

        return (
          <g
            transform={`translate(${geodeX}, ${geodeY})`}
            className="cursor-pointer group/geode"
            onClick={handleGeodeClick}
            onPointerDown={e => e.stopPropagation()}
          >
            {/* Granite Rock Mass embedded into hillside */}
            <polygon
              points={`-32,${geodeL_Y + 6} -24,-24 0,-30 26,-22 32,${geodeR_Y + 6}`}
              fill="#78716c"
              stroke="#44403c"
              strokeWidth="2"
            />
            {/* Rock strata facet lines */}
            <line x1="-18" y1="-22" x2="6" y2="-12" stroke="#57534e" strokeWidth="1.5" />
            <line x1="-6" y1="-12" x2="22" y2="-18" stroke="#57534e" strokeWidth="1.5" />

            {/* Internal Geode Fissure */}
            <polygon
              points="-12,-8 -6,-22 8,-20 14,-6 6,0"
              fill="#1c1917"
              stroke="#292524"
              strokeWidth="1.2"
            />

            {/* Amber and Smoky Quartz Crystals lined inside fissure */}
            <g
              transform={`scale(${geodeSparkle ? 1.2 : 1.0})`}
              style={{ transformOrigin: '0px -12px', transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
            >
              <polygon points="-8,-6 -6,-18 -3,-8" fill="#f59e0b" stroke="#b45309" strokeWidth="0.8" />
              <polygon points="-3,-8 1,-21 5,-7" fill="#fbbf24" stroke="#d97706" strokeWidth="0.8" />
              <polygon points="3,-7 8,-17 12,-5" fill="#fef08a" stroke="#b45309" strokeWidth="0.8" />
              <polygon points="-10,-8 -9,-14 -6,-8" fill="#d97706" />
            </g>

            {/* Golden glint flash */}
            {geodeSparkle && (
              <circle cx="1" cy="-14" r="16" fill="url(#quartz-glow)" />
            )}

            <text
              x="0"
              y="-36"
              textAnchor="middle"
              className="opacity-0 group-hover/geode:opacity-100 transition-opacity fill-[#b45309] font-semibold text-[11px] select-none pointer-events-none"
            >
              Pine Ridge Quartz Outcrop ✨
            </text>
          </g>
        );
      })()}

      {/* ════════════════════════════════════════════════════════════════
          9. WESTERN HIGH LOOKOUT & SPYGLASS (x = 4420)
      ════════════════════════════════════════════════════════════════ */}
      {(() => {
        const lookX = 4420;
        const lookY = getGroundY(lookX);
        const postL_Y = getGroundY(lookX - 28) - lookY;
        const postM_Y = 0;
        const postR_Y = getGroundY(lookX + 28) - lookY;

        return (
          <g transform={`translate(${lookX}, ${lookY})`}>
            {/* Timber Support Pilings (driven securely into the ridge) */}
            <rect x="-30" y="-14" width="5" height={14 + postL_Y + 12} rx="1" fill="#5d4037" stroke="#3e2723" strokeWidth="1.5" />
            <rect x="-2.5" y="-14" width="5" height={14 + postM_Y + 12} rx="1" fill="#5d4037" stroke="#3e2723" strokeWidth="1.5" />
            <rect x="25" y="-14" width="5" height={14 + postR_Y + 12} rx="1" fill="#5d4037" stroke="#3e2723" strokeWidth="1.5" />

            {/* Structural Cross Braces */}
            <line x1="-28" y1="-10" x2="27" y2="2" stroke="#5d4037" strokeWidth="2" />
            <line x1="-28" y1="2" x2="27" y2="-10" stroke="#5d4037" strokeWidth="2" />

            {/* Wooden Observation Deck Planks (Main Lookout Deck Click) */}
            <g
              className="cursor-pointer group/lookout"
              onClick={handleLookoutClick}
              onPointerDown={e => e.stopPropagation()}
            >
              <rect x="-35" y="-18" width="70" height="6" rx="1.5" fill="#795548" stroke="#3e2723" strokeWidth="1.5" />

              {/* Deck Railing Posts */}
              <line x1="-30" y1="-18" x2="-30" y2="-45" stroke="#5d4037" strokeWidth="2.5" />
              <line x1="30" y1="-18" x2="30" y2="-45" stroke="#5d4037" strokeWidth="2.5" />
              <line x1="-32" y1="-45" x2="32" y2="-45" stroke="#8d6e63" strokeWidth="3" />

              {/* High wind flag on pole */}
              <line x1="-28" y1="-18" x2="-28" y2="-95" stroke="#455a64" strokeWidth="2" />
              <path d="M -28,-95 L -4,-85 L -28,-75 Z" fill="#e53935" stroke="#b71c1c" strokeWidth="1" />

              <text
                x="0"
                y="-105"
                textAnchor="middle"
                className="opacity-0 group-hover/lookout:opacity-100 transition-opacity fill-[#382b26] font-semibold text-xs select-none pointer-events-none"
              >
                High Lookout 🔭
              </text>
            </g>

            {/* 9b. SECRET: Mountain Weather Spyglass on tripod (x = 0, y = -45 on deck) */}
            <g
              className="cursor-pointer group/spyglass"
              transform="translate(0, -45)"
              onClick={handleSpyglassClick}
              onPointerDown={e => e.stopPropagation()}
            >
              {/* Tripod legs anchored to deck */}
              <line x1="0" y1="0" x2="-12" y2="27" stroke="#3e2723" strokeWidth="2" />
              <line x1="0" y1="0" x2="12" y2="27" stroke="#3e2723" strokeWidth="2" />
              <line x1="0" y1="0" x2="0" y2="27" stroke="#3e2723" strokeWidth="2" />

              {/* Brass Telescope Tube angled toward horizon */}
              <g
                transform={`scale(${spyglassGlint ? 1.15 : 1.0})`}
                style={{ transformOrigin: '0 0', transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
              >
                <path d="M -16,8 L 22,-8 L 24,-4 L -14,12 Z" fill="#ffd54f" stroke="#ff8f00" strokeWidth="1.2" />
                <rect x="22" y="-10" width="4" height="8" rx="1" fill="#ffa000" />
                {/* Focusing knurl rings */}
                <line x1="0" y1="1" x2="-2" y2="5" stroke="#d97706" strokeWidth="1.5" />
                <line x1="6" y1="-2" x2="4" y2="2" stroke="#d97706" strokeWidth="1.5" />
                {/* Eyepiece */}
                <rect x="-18" y="7" width="4" height="7" rx="1" fill="#b45309" />
              </g>

              <text
                x="0"
                y="-16"
                textAnchor="middle"
                className="opacity-0 group-hover/spyglass:opacity-100 transition-opacity fill-[#b45309] font-semibold text-[10px] select-none pointer-events-none"
              >
                Weather Spyglass ☁️
              </text>
            </g>
          </g>
        );
      })()}

      {/* ════════════════════════════════════════════════════════════════
          10. COUNTRYSIDE BRASS LANTERN POSTS (x = 1300, 2500, 4200)
      ════════════════════════════════════════════════════════════════ */}
      {[1300, 2500, 4200].map((lampX, lIdx) => {
        const lampY = getGroundY(lampX);
        return (
          <g
            key={lIdx}
            transform={`translate(${lampX}, ${lampY})`}
            className="cursor-pointer group"
            onClick={() => setLanternManualOn(prev => !prev)}
            onPointerDown={e => e.stopPropagation()}
          >
            {/* Flange base mounting plate on ground */}
            <ellipse cx="0" cy="0" rx="7" ry="2.4" fill="#212a2e" />

            {/* Cast iron post */}
            <line x1="0" y1="0" x2="0" y2="-65" stroke="#37474f" strokeWidth="3" />
            <circle cx="0" cy="0" r="4" fill="#263238" />

            {/* Curved bracket */}
            <path d="M 0,-55 Q 12,-62 14,-45" fill="none" stroke="#37474f" strokeWidth="2" />

            {/* Lantern housing */}
            <g transform="translate(14, -45)">
              <rect x="-6" y="0" width="12" height="15" rx="2" fill="#263238" stroke="#d4af37" strokeWidth="1" />
              <rect
                x="-4"
                y="2"
                width="8"
                height="11"
                rx="1"
                fill={areLanternsLit ? '#fff176' : '#90a4ae'}
              />
              {areLanternsLit && <circle cx="0" cy="7" r="32" fill="url(#lantern-glow)" />}
            </g>
          </g>
        );
      })}
    </svg>
  );
};
