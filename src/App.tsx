import React, { useState, useEffect, useRef, useCallback } from 'react';
import type {
  CharacterId,
  CharacterLiveState,
  Particle,
  DiscoveryRecord,
} from './types';
import type { GardenPlantRecord, PlantSpeciesId, GrowthStage } from './types/garden';
import type { ClockworkState, MechanismModuleId } from './types/clockwork';
import type { ComedianState, AcrobaticMove, WhimsicalPropId } from './types/comedian';
import { CHARACTERS } from './data/characters';
import { GARDEN_PLOTS, GARDEN_SPECIES } from './data/garden';
import {
  loadSavedDiscoveries,
  saveDiscovery,
  loadSavedGarden,
  saveGardenPlant,
  removeGardenPlant,
  saveAllGardenPlants,
  loadSavedClockwork,
  saveClockworkState,
  loadSavedComedian,
  saveComedianState,
} from './utils/storage';
import { getDiscoveryDef } from './data/discoveries';
import { getGroundY } from './utils/math';
import { soundEngine } from './audio/soundEngine';
import { useDayNight } from './hooks/useDayNight';
import { useCamera } from './hooks/useCamera';
import { useGameLoop } from './hooks/useGameLoop';

// World Layers
import { SkyLayer } from './components/World/SkyLayer';
import { BackdropHills } from './components/World/BackdropHills';
import { ForegroundTerrain } from './components/World/ForegroundTerrain';
import { InteractiveObjects } from './components/World/InteractiveObjects';
import { LivingGardenWorld } from './components/World/LivingGardenWorld';
import { ClockworkWorld } from './components/World/ClockworkWorld';
import { ComedianStageWorld } from './components/World/ComedianStageWorld';
import { CharacterLayer } from './components/World/CharacterLayer';
import { SpeechBubble } from './components/World/SpeechBubble';
import { ParticlesLayer } from './components/World/ParticlesLayer';

// Activities
import { CharacterActivityModal } from './components/Activities/CharacterActivityModal';

/**
 * Ensures character positions and roam targets avoid solid obstacles and out-of-bounds terrain
 */
function clampToWalkable(
  x: number,
  roamRange: [number, number],
  charId: string
): number {
  let clamped = Math.max(Math.max(60, roamRange[0]), Math.min(Math.min(4940, roamRange[1]), x));

  const obstacles: { min: number; max: number; allowChar?: string }[] = [
    { min: 1185, max: 1255 }, // Stone well base
    { min: 1530, max: 1770, allowChar: 'listener' }, // Dragonfly Pond deep basin
    { min: 2620, max: 2740 }, // Sunflower Cottage back wall
    { min: 3680, max: 3760 }, // Ridge Windmill stone tower base
  ];

  let corrected = false;
  do {
    corrected = false;
    for (const obs of obstacles) {
      if (obs.allowChar && obs.allowChar === charId) continue;
      if (clamped >= obs.min && clamped <= obs.max) {
        const distToMin = Math.abs(clamped - obs.min);
        const distToMax = Math.abs(clamped - obs.max);
        clamped = distToMin < distToMax ? obs.min - 14 : obs.max + 14;
        corrected = true;
      }
    }
  } while (corrected);

  return Math.max(60, Math.min(4940, clamped));
}

export function App() {
  const [viewportWidth, setViewportWidth] = useState<number>(
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );

  // Resize listener
  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 1. Day-Night Simulation
  const { state: dayNight, advanceTime } = useDayNight(1.0);

  // 2. Camera Navigation
  const {
    camX,
    focusOnWorldX,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    updateCamera,
    isDragging,
  } = useCamera({ viewportWidth });

  // 3. Cursor Tracking in World Space
  const [cursorWorld, setCursorWorld] = useState<{ x: number | null; y: number | null }>({
    x: null,
    y: null,
  });

  // 4. Discoveries Persistence
  const [_discoveries, setDiscoveries] = useState<Record<string, DiscoveryRecord>>(() =>
    loadSavedDiscoveries()
  );

  // 5. Active Character Activity Modal
  const [activeActivityCharacter, setActiveActivityCharacter] = useState<CharacterId | null>(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      const act = p.get('activity') as CharacterId;
      if (act && act in CHARACTERS) return act;
    }
    return null;
  });

  // 6. Living Garden Persistence & State
  const [gardenPlants, setGardenPlants] = useState<Record<string, GardenPlantRecord>>(() =>
    loadSavedGarden()
  );
  const gardenPlantsRef = useRef(gardenPlants);
  useEffect(() => {
    gardenPlantsRef.current = gardenPlants;
  }, [gardenPlants]);

  const [selectedPlotId, setSelectedPlotId] = useState<string | null>(null);

  // 6b. Clockwork Rig Persistence & State
  const [clockworkState, setClockworkState] = useState<ClockworkState>(() =>
    loadSavedClockwork()
  );
  const [selectedClockworkModuleId, setSelectedClockworkModuleId] = useState<MechanismModuleId>(
    'windmill-drive'
  );

  // 6c. Comedian Stage Persistence & State
  const [comedianState, setComedianState] = useState<ComedianState>(() =>
    loadSavedComedian()
  );

  // 6d. Windmill continuous angle (for gear transmission synchronization)
  const [windmillAngle, setWindmillAngle] = useState(0);

  // 7. Active Particle System
  const [particles, setParticles] = useState<Particle[]>([]);
  const particlesRef = useRef(particles);

  useEffect(() => {
    particlesRef.current = particles;
  }, [particles]);

  const handleSpawnParticles = useCallback((newParticles: Particle[]) => {
    setParticles(prev => [...prev.slice(-60), ...newParticles]);
  }, []);

  // 8. Discovery Handler
  const handleDiscovery = useCallback(
    (id: string, title: string, desc: string, icon: string) => {
      const def = getDiscoveryDef(id);
      setDiscoveries(prev => {
        const existing = prev[id];
        const record: DiscoveryRecord = {
          id,
          title: def ? def.title : title,
          desc: def ? def.desc : desc,
          icon: def ? def.icon : icon,
          locationName: def?.locationName || existing?.locationName,
          zone: def?.zone || existing?.zone,
          worldX: def?.worldX ?? existing?.worldX,
          explorerRemark: def?.explorerRemark || existing?.explorerRemark,
          timePhaseDiscovered: existing?.timePhaseDiscovered || dayNight.phase,
          timestamp: existing?.timestamp || Date.now(),
          userNotes: existing?.userNotes,
          updatedAt: existing?.updatedAt,
        };

        if (!existing) {
          saveDiscovery(record);
          return { ...prev, [id]: record };
        }

        return prev;
      });
    },
    [dayNight.phase]
  );

  // 9. Characters Autonomous Simulation
  const [charactersState, setCharactersState] = useState<Record<string, CharacterLiveState>>(() => {
    const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const bubbleCharId = params?.get('bubble');
    const initial: Record<string, CharacterLiveState> = {};
    Object.keys(CHARACTERS).forEach(id => {
      const char = CHARACTERS[id];
      const initialFacing = id === 'explorer' ? 'left' : 'right';
      const isBubbleChar = bubbleCharId === id;
      initial[id] = {
        id: char.id,
        x: char.homeX,
        y: 0,
        vx: 0,
        facing: initialFacing,
        targetFacing: initialFacing,
        action: 'idle',
        walkTimer: Math.random() * 5,
        idleTimer: 2.0 + Math.random() * 3.5,
        turnTimer: 0,
        idleLookTimer: 2.5 + Math.random() * 3.0,
        idleLookOffset: 0,
        targetX: null,
        squashStretch: 1.0,
        greetingTargetId: null,
        greetingCooldown: 6 + Math.random() * 6,
        activeQuote: isBubbleChar ? char.quotes[0] : null,
        quoteExpiresAt: isBubbleChar ? Date.now() + 600000 : null,
      };
    });
    return initial;
  });

  const charactersRef = useRef(charactersState);
  useEffect(() => {
    charactersRef.current = charactersState;
  }, [charactersState]);

  // Gardener contextual speech trigger
  const triggerGardenerQuote = useCallback((quote: string) => {
    setCharactersState(prev => {
      const gardener = prev['gardener'];
      if (!gardener) return prev;
      return {
        ...prev,
        gardener: {
          ...gardener,
          activeQuote: quote,
          quoteExpiresAt: performance.now() + 6500,
          squashStretch: 0.88, // happy hop
        },
      };
    });
  }, []);

  // 10. Garden Actions
  const handleSelectPlot = useCallback((plotId: string) => {
    setSelectedPlotId(plotId);
    setActiveActivityCharacter('gardener');
    const plot = GARDEN_PLOTS.find(p => p.id === plotId);
    if (plot) {
      focusOnWorldX(plot.worldX);
    }
  }, [focusOnWorldX]);

  const handlePlantSeed = useCallback(
    (plotId: string, speciesId: PlantSpeciesId) => {
      const plot = GARDEN_PLOTS.find(p => p.id === plotId);
      if (!plot) return;

      const record: GardenPlantRecord = {
        plotId,
        speciesId,
        stage: 'seed',
        plantedAt: Date.now(),
        lastWateredAt: null,
        waterCount: 0,
        growthProgress: 0,
        updatedAt: Date.now(),
      };

      setGardenPlants(prev => {
        const next = { ...prev, [plotId]: record };
        saveGardenPlant(record);
        return next;
      });

      // Spawn soil planting dust particles
      const groundY = getGroundY(plot.worldX);
      const soilParticles: Particle[] = Array.from({ length: 8 }).map((_, i) => ({
        id: Date.now() + i,
        x: plot.worldX + (Math.random() * 20 - 10),
        y: groundY - 6 + (Math.random() * 6 - 3),
        vx: (Math.random() - 0.5) * 35,
        vy: -20 - Math.random() * 25,
        color: ['#854d0e', '#713f12', '#a16207'][i % 3],
        size: 3.5,
        alpha: 1,
        maxLife: 1.2,
        life: 1.2,
        shape: 'circle',
      }));
      handleSpawnParticles(soilParticles);

      // Gardener responds with natural warmth
      const species = GARDEN_SPECIES[speciesId];
      triggerGardenerQuote(
        `A fresh ${species.name} seed tucked into warm soil! May it drink deeply.`
      );

      handleDiscovery(
        `garden-planted-${speciesId}`,
        `Planted ${species.name}`,
        `Sowed a ${species.name} seed in ${plot.label}.`,
        species.icon
      );
    },
    [handleDiscovery, handleSpawnParticles, triggerGardenerQuote]
  );

  const handleWaterPlant = useCallback(
    (plotId: string) => {
      const current = gardenPlantsRef.current[plotId];
      if (!current) return;

      const plot = GARDEN_PLOTS.find(p => p.id === plotId);
      const groundY = plot ? getGroundY(plot.worldX) : 700;

      // Calculate stage progression
      const nextProgress = current.growthProgress + 0.38;
      let nextStage: GrowthStage = current.stage;
      let stageBumped = false;

      if (nextProgress >= 1.0) {
        if (current.stage === 'seed') {
          nextStage = 'sprout';
          stageBumped = true;
        } else if (current.stage === 'sprout') {
          nextStage = 'growing';
          stageBumped = true;
        } else if (current.stage === 'growing') {
          nextStage = 'mature';
          stageBumped = true;
        }
      }

      const updated: GardenPlantRecord = {
        ...current,
        stage: nextStage,
        growthProgress: stageBumped ? 0 : Math.min(0.99, nextProgress),
        lastWateredAt: Date.now(),
        waterCount: current.waterCount + 1,
        updatedAt: Date.now(),
      };

      setGardenPlants(prev => {
        const next = { ...prev, [plotId]: updated };
        saveGardenPlant(updated);
        return next;
      });

      // Spawn water splash droplets
      if (plot) {
        const drops: Particle[] = Array.from({ length: 9 }).map((_, i) => ({
          id: Date.now() + i,
          x: plot.worldX + (Math.random() * 26 - 13),
          y: groundY - 12 + (Math.random() * 8 - 4),
          vx: (Math.random() - 0.5) * 45,
          vy: -30 - Math.random() * 35,
          color: ['#60a5fa', '#93c5fd', '#bfdbfe'][i % 3],
          size: 3.5,
          alpha: 1,
          maxLife: 1.5,
          life: 1.5,
          shape: 'circle',
        }));
        handleSpawnParticles(drops);
      }

      if (stageBumped && nextStage === 'mature') {
        soundEngine.playFlowerChime();
        triggerGardenerQuote('Look at that blossom unfold! What a magnificent sight in our valley.');
      } else if (stageBumped) {
        triggerGardenerQuote('The roots are drinking and reaching! Look at that fresh green shoot.');
      } else {
        triggerGardenerQuote('Ah, listen to that gentle sip! Soil stays happy when nourished.');
      }
    },
    [handleSpawnParticles, triggerGardenerQuote]
  );

  const handleTendPlant = useCallback(
    (plotId: string) => {
      const current = gardenPlantsRef.current[plotId];
      if (!current) return;

      const plot = GARDEN_PLOTS.find(p => p.id === plotId);
      const groundY = plot ? getGroundY(plot.worldX) : 700;

      const nextProgress = current.growthProgress + 0.45;
      let nextStage: GrowthStage = current.stage;
      let stageBumped = false;

      if (nextProgress >= 1.0) {
        if (current.stage === 'seed') {
          nextStage = 'sprout';
          stageBumped = true;
        } else if (current.stage === 'sprout') {
          nextStage = 'growing';
          stageBumped = true;
        } else if (current.stage === 'growing') {
          nextStage = 'mature';
          stageBumped = true;
        }
      }

      const updated: GardenPlantRecord = {
        ...current,
        stage: nextStage,
        growthProgress: stageBumped ? 0 : Math.min(0.99, nextProgress),
        updatedAt: Date.now(),
      };

      setGardenPlants(prev => {
        const next = { ...prev, [plotId]: updated };
        saveGardenPlant(updated);
        return next;
      });

      if (plot) {
        const leaves: Particle[] = Array.from({ length: 6 }).map((_, i) => ({
          id: Date.now() + i,
          x: plot.worldX + (Math.random() * 20 - 10),
          y: groundY - 14 + (Math.random() * 8 - 4),
          vx: (Math.random() - 0.5) * 30,
          vy: -20 - Math.random() * 25,
          color: ['#86efac', '#4ade80', '#facc15'][i % 3],
          size: 3.5,
          alpha: 1,
          maxLife: 1.4,
          life: 1.4,
          shape: 'leaf',
        }));
        handleSpawnParticles(leaves);
      }

      if (stageBumped && nextStage === 'mature') {
        soundEngine.playFlowerChime();
        triggerGardenerQuote('Singing softly to the petals works wonders every single time.');
      } else {
        triggerGardenerQuote('Loosening the soil lets the morning air reach the deeper roots.');
      }
    },
    [handleSpawnParticles, triggerGardenerQuote]
  );

  const handleRemovePlant = useCallback(
    (plotId: string) => {
      setGardenPlants(prev => {
        const next = { ...prev };
        delete next[plotId];
        removeGardenPlant(plotId);
        return next;
      });
      triggerGardenerQuote('Clearing a bed gives fresh soil room to breathe for the next season.');
    },
    [triggerGardenerQuote]
  );

  // 10b. Inventor Clockwork Handlers
  const triggerInventorQuote = useCallback((quote: string) => {
    setCharactersState(prev => {
      const char = prev['inventor'];
      if (!char) return prev;
      return {
        ...prev,
        inventor: {
          ...char,
          activeQuote: quote,
          quoteExpiresAt: performance.now() + 6500,
          squashStretch: 0.9,
        },
      };
    });
  }, []);

  const handleSelectClockworkModule = useCallback((moduleId: MechanismModuleId) => {
    setSelectedClockworkModuleId(moduleId);
    setActiveActivityCharacter('inventor');
    focusOnWorldX(3850);
  }, [focusOnWorldX]);

  const handleInstallClockworkGear = useCallback(
    (moduleId: MechanismModuleId, gearId: string) => {
      setClockworkState(prev => {
        const moduleState = prev.installed[moduleId];
        if (!moduleState) return prev;
        const updated: ClockworkState = {
          ...prev,
          installed: {
            ...prev.installed,
            [moduleId]: {
              ...moduleState,
              installedGearId: gearId,
              lastMaintainedAt: Date.now(),
            },
          },
        };
        saveClockworkState(updated);
        return updated;
      });
      triggerInventorQuote('Splendid fit! Notice how the meshing teeth distribute torque smoothly.');
      handleDiscovery(
        'clockwork-tuned',
        "Inventor's Clockwork Tuned",
        'Installed and meshed a precision gear into the hillside rig.',
        '⚙️'
      );
    },
    [triggerInventorQuote, handleDiscovery]
  );

  const handleTuneClockworkParameter = useCallback(
    (moduleId: MechanismModuleId, value: number) => {
      setClockworkState(prev => {
        const moduleState = prev.installed[moduleId];
        if (!moduleState) return prev;
        const updated: ClockworkState = {
          ...prev,
          installed: {
            ...prev.installed,
            [moduleId]: {
              ...moduleState,
              tuneValue: value,
              lastMaintainedAt: Date.now(),
            },
          },
        };
        saveClockworkState(updated);
        return updated;
      });
    },
    []
  );

  const handleToggleClockworkEngage = useCallback(
    (moduleId: MechanismModuleId) => {
      setClockworkState(prev => {
        const moduleState = prev.installed[moduleId];
        if (!moduleState) return prev;
        const nextEngaged = !moduleState.isEngaged;
        const updated: ClockworkState = {
          ...prev,
          installed: {
            ...prev.installed,
            [moduleId]: {
              ...moduleState,
              isEngaged: nextEngaged,
              lastMaintainedAt: Date.now(),
            },
          },
        };
        saveClockworkState(updated);
        return updated;
      });
      triggerInventorQuote('Clutch shifted! The kinetic train responds immediately.');
    },
    [triggerInventorQuote]
  );

  const handleLubricateClockwork = useCallback(
    (moduleId: MechanismModuleId) => {
      setClockworkState(prev => {
        const moduleState = prev.installed[moduleId];
        if (!moduleState) return prev;
        const updated: ClockworkState = {
          ...prev,
          installed: {
            ...prev.installed,
            [moduleId]: {
              ...moduleState,
              lubricationLevel: 1.0,
              lastMaintainedAt: Date.now(),
            },
          },
        };
        saveClockworkState(updated);
        return updated;
      });

      const sparks: Particle[] = Array.from({ length: 6 }).map((_, i) => ({
        id: Date.now() + i,
        x: 3850 + (Math.random() * 30 - 15),
        y: getGroundY(3850) - 35 + (Math.random() * 10 - 5),
        vx: (Math.random() - 0.5) * 20,
        vy: 10 + Math.random() * 20,
        color: ['#d97706', '#f59e0b', '#fbbf24'][i % 3],
        size: 3,
        alpha: 1,
        maxLife: 1.2,
        life: 1.2,
        shape: 'circle',
      }));
      handleSpawnParticles(sparks);
      triggerInventorQuote('A drop of cedar oil! Whispering smooth and frictionless once more.');
    },
    [handleSpawnParticles, triggerInventorQuote]
  );

  // 10c. Comedian Stage Handlers
  const triggerComedianQuote = useCallback((quote: string) => {
    setCharactersState(prev => {
      const char = prev['comedian'];
      if (!char) return prev;
      return {
        ...prev,
        comedian: {
          ...char,
          activeQuote: quote,
          quoteExpiresAt: performance.now() + 6500,
          squashStretch: 1.15, // joyful bounce
        },
      };
    });
  }, []);

  const handleOpenComedianStage = useCallback(() => {
    setActiveActivityCharacter('comedian');
    focusOnWorldX(1435);
  }, [focusOnWorldX]);

  const handleToggleComedianProp = useCallback(
    (propId: string) => {
      setComedianState(prev => {
        const pId = propId as WhimsicalPropId;
        const currentVal = !!prev.activeProps[pId];
        const updated: ComedianState = {
          ...prev,
          activeProps: {
            ...prev.activeProps,
            [pId]: !currentVal,
          },
        };
        saveComedianState(updated);
        return updated;
      });
      triggerComedianQuote('Ta-da! The stage props are alive and bubbling!');
    },
    [triggerComedianQuote]
  );

  const handleSolveComedianRiddle = useCallback(
    (riddleId: string) => {
      setComedianState(prev => {
        if (prev.solvedRiddleIds.includes(riddleId)) return prev;
        const updated: ComedianState = {
          ...prev,
          solvedRiddleIds: [...prev.solvedRiddleIds, riddleId],
          laughsDelivered: prev.laughsDelivered + 1,
        };
        saveComedianState(updated);
        return updated;
      });
      triggerComedianQuote('Hahaha! You cracked the riddle! The valley cheers!');
      handleDiscovery(
        'comedian-riddle-solved',
        'Valley Riddle Solved',
        "Cracked one of Comedian's whimsical valley riddles.",
        '🎭'
      );
    },
    [triggerComedianQuote, handleDiscovery]
  );

  const handlePerformComedianRoutine = useCallback(
    (routine: AcrobaticMove[]) => {
      setComedianState(prev => {
        const updated: ComedianState = {
          ...prev,
          routine,
          laughsDelivered: prev.laughsDelivered + 1,
          isPerforming: true,
        };
        saveComedianState(updated);
        return updated;
      });

      setCharactersState(prev => {
        const char = prev['comedian'];
        if (!char) return prev;
        return {
          ...prev,
          comedian: {
            ...char,
            squashStretch: 0.72,
            activeQuote: 'Encore! A show-stopping acrobatic masterclass!',
            quoteExpiresAt: performance.now() + 5000,
          },
        };
      });

      const confetti: Particle[] = Array.from({ length: 16 }).map((_, i) => ({
        id: Date.now() + i,
        x: 1435 + (Math.random() * 40 - 20),
        y: getGroundY(1435) - 40 + (Math.random() * 20 - 10),
        vx: (Math.random() - 0.5) * 60,
        vy: -40 - Math.random() * 40,
        color: ['#f43f5e', '#ec4899', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b'][i % 6],
        size: 4,
        alpha: 1,
        maxLife: 1.8,
        life: 1.8,
        shape: 'spark',
      }));
      handleSpawnParticles(confetti);
    },
    [handleSpawnParticles]
  );

  // 11. Main Game Loop Tick (Delta-Time Based)
  useGameLoop(dt => {
    // A. Advance Day-Night Cycle
    advanceTime(dt);

    // B. Update Camera Inertia / Focus Smooth Step
    updateCamera(dt);

    // B2. Continuous Windmill Rotation for Gear Synchronization
    setWindmillAngle(prev => (prev + 30 * dt) % 360);

    // C. Update Particles
    if (particlesRef.current.length > 0) {
      setParticles(prev =>
        prev
          .map(p => ({
            ...p,
            x: p.x + p.vx * dt,
            y: p.y + p.vy * dt,
            life: p.life - dt,
          }))
          .filter(p => p.life > 0)
      );
    }

    // D. Autonomous Plant Development Tick (Consistent with Day/Night & Soil Hydration)
    const currentGarden = { ...gardenPlantsRef.current };
    let gardenChanged = false;

    Object.keys(currentGarden).forEach(plotId => {
      const plant = currentGarden[plotId];
      if (!plant || plant.stage === 'mature') return;

      // If hydrated within the last 120 seconds, plant gently grows over time
      const isHydrated = plant.lastWateredAt && Date.now() - plant.lastWateredAt < 120000;
      if (isHydrated) {
        // Growth progression speed: ~25 seconds of hydrated sunshine to advance
        const addProgress = dt * 0.04;
        const totalProgress = plant.growthProgress + addProgress;

        if (totalProgress >= 1.0) {
          let nextStage: GrowthStage = plant.stage;
          if (plant.stage === 'seed') nextStage = 'sprout';
          else if (plant.stage === 'sprout') nextStage = 'growing';
          else if (plant.stage === 'growing') nextStage = 'mature';

          currentGarden[plotId] = {
            ...plant,
            stage: nextStage,
            growthProgress: 0,
            updatedAt: Date.now(),
          };
          gardenChanged = true;

          if (nextStage === 'mature') {
            soundEngine.playFlowerChime();
          }
        } else {
          currentGarden[plotId] = {
            ...plant,
            growthProgress: totalProgress,
          };
        }
      }
    });

    if (gardenChanged) {
      setGardenPlants(currentGarden);
      saveAllGardenPlants(currentGarden);
    }

    // E. Autonomous Character Behaviors & Social Reactions
    const currentChars = { ...charactersRef.current };
    const charIds = Object.keys(currentChars);

    charIds.forEach(id => {
      const char = currentChars[id];
      const def = CHARACTERS[id];
      if (!char || !def) return;

      // Relax squash and stretch toward 1.0
      if (Math.abs(char.squashStretch - 1.0) > 0.005) {
        char.squashStretch += (1.0 - char.squashStretch) * Math.min(1, dt * 7);
      } else {
        char.squashStretch = 1.0;
      }

      // Decrement greeting cooldown
      if (char.greetingCooldown > 0) {
        char.greetingCooldown -= dt;
      }

      // Check quote expiration
      if (char.quoteExpiresAt && performance.now() > char.quoteExpiresAt) {
        char.activeQuote = null;
        char.quoteExpiresAt = null;
      }

      // Behavior state machine
      switch (char.action) {
        case 'idle': {
          char.vx += (0 - char.vx) * Math.min(1, dt * 8.5);

          char.idleLookTimer -= dt;
          if (char.idleLookTimer <= 0) {
            char.idleLookOffset = Math.random() > 0.6 ? (Math.random() > 0.5 ? 1 : -1) : 0;
            char.idleLookTimer = 2.5 + Math.random() * 4.0;
          }

          char.idleTimer -= dt;
          if (char.idleTimer <= 0) {
            const [minX, maxX] = def.roamRange;
            let target = minX + Math.random() * (maxX - minX);

            // Character specific autonomous attraction zones
            if (id === 'gardener' && Math.random() < 0.45) {
              const randomPlot = GARDEN_PLOTS[Math.floor(Math.random() * GARDEN_PLOTS.length)];
              target = randomPlot.worldX + (Math.random() > 0.5 ? 24 : -24);
            } else if (id === 'inventor' && Math.random() < 0.45) {
              // Inventor inspects the clockwork rig near the windmill
              target = 3800 + Math.random() * 80;
            } else if (id === 'comedian' && Math.random() < 0.45) {
              // Comedian visits the footbridge brook stage
              target = 1380 + Math.random() * 80;
            } else if (Math.abs(target - char.x) < 140) {
              target = char.x + (Math.random() > 0.5 ? 240 : -240);
            }

            target = clampToWalkable(target, def.roamRange, id);

            const neededFacing = target < char.x ? 'left' : 'right';
            char.targetX = target;

            if (neededFacing !== char.facing) {
              char.action = 'turning';
              char.targetFacing = neededFacing;
              char.turnTimer = 0.32;
            } else {
              char.action = 'starting';
              char.squashStretch = 0.94;
            }
          }
          break;
        }

        case 'turning': {
          char.vx += (0 - char.vx) * Math.min(1, dt * 10);
          char.turnTimer -= dt;
          if (char.turnTimer <= 0) {
            char.facing = char.targetFacing;
            char.action = 'starting';
            char.squashStretch = 0.94;
          }
          break;
        }

        case 'starting': {
          if (char.targetX === null) {
            char.action = 'idle';
            char.idleTimer = 3;
            break;
          }
          const dir = char.facing === 'left' ? -1 : 1;
          const targetVx = dir * def.baseSpeed;
          char.vx += (targetVx - char.vx) * Math.min(1, dt * 3.8);
          char.x += char.vx * dt;
          char.walkTimer += dt * (Math.abs(char.vx) / def.baseSpeed);

          if (Math.abs(char.vx) >= def.baseSpeed * 0.65) {
            char.action = 'walking';
          }
          break;
        }

        case 'walking': {
          if (char.targetX === null) {
            char.action = 'slowing';
            break;
          }
          const distToTarget = char.targetX - char.x;
          const dir = Math.sign(distToTarget);

          if (
            Math.abs(distToTarget) < 65 ||
            (dir < 0 && char.facing === 'right') ||
            (dir > 0 && char.facing === 'left')
          ) {
            char.action = 'slowing';
            break;
          }

          const targetVx = dir * def.baseSpeed;
          char.vx += (targetVx - char.vx) * Math.min(1, dt * 4.2);
          char.x += char.vx * dt;
          char.walkTimer += dt * (Math.abs(char.vx) / def.baseSpeed);
          break;
        }

        case 'slowing': {
          if (char.targetX === null) {
            char.action = 'idle';
            char.idleTimer = 3;
            char.vx = 0;
            break;
          }
          const distToTarget = char.targetX - char.x;
          const dir = Math.sign(distToTarget);
          const ratio = Math.max(0.12, Math.min(1, Math.abs(distToTarget) / 65));
          const targetVx = dir * def.baseSpeed * ratio;

          char.vx += (targetVx - char.vx) * Math.min(1, dt * 5.2);
          char.x += char.vx * dt;
          char.walkTimer += dt * (Math.abs(char.vx) / def.baseSpeed);

          if (Math.abs(distToTarget) < 3.5 || Math.abs(char.vx) < 5) {
            char.x = char.targetX;
            char.vx = 0;
            char.targetX = null;
            char.action = 'idle';
            char.idleTimer = 3.5 + Math.random() * 5.5;
            char.squashStretch = 0.90;
          }
          break;
        }

        case 'greeting': {
          char.vx += (0 - char.vx) * Math.min(1, dt * 8);
          char.idleTimer -= dt;
          if (char.idleTimer <= 0) {
            char.action = 'idle';
            char.idleTimer = 2.5 + Math.random() * 3.5;
            char.greetingTargetId = null;
          }
          break;
        }

        default:
          char.action = 'idle';
          break;
      }

      char.x = clampToWalkable(char.x, def.roamRange, id);
    });

    // Social Awareness: Greet when crossing paths smoothly
    for (let i = 0; i < charIds.length; i++) {
      for (let j = i + 1; j < charIds.length; j++) {
        const idA = charIds[i];
        const idB = charIds[j];
        const a = currentChars[idA];
        const b = currentChars[idB];

        if (a && b) {
          const distance = Math.abs(a.x - b.x);
          if (
            distance < 80 &&
            (a.action === 'walking' || a.action === 'slowing') &&
            (b.action === 'walking' || b.action === 'slowing') &&
            a.greetingCooldown <= 0 &&
            b.greetingCooldown <= 0
          ) {
            a.action = 'greeting';
            b.action = 'greeting';
            a.idleTimer = 2.4;
            b.idleTimer = 2.4;
            a.greetingCooldown = 22;
            b.greetingCooldown = 22;
            a.facing = a.x < b.x ? 'right' : 'left';
            b.facing = b.x < a.x ? 'right' : 'left';
            a.squashStretch = 1.08;
            b.squashStretch = 1.08;
          }
        }
      }
    }

    setCharactersState(currentChars);
  });

  // Handle Character Click -> Trigger Speech Bubble with Random Quote
  const handleCharacterClick = useCallback(
    (id: string) => {
      const def = CHARACTERS[id];
      if (!def) return;

      setCharactersState(prev => {
        const current = prev[id];
        if (!current) return prev;

        const quotes = def.quotes;
        const quote = quotes[Math.floor(Math.random() * quotes.length)];

        return {
          ...prev,
          [id]: {
            ...current,
            vx: 0,
            action: 'idle',
            idleTimer: 6.5,
            squashStretch: 0.85,
            activeQuote: quote,
            quoteExpiresAt: performance.now() + 7500,
          },
        };
      });

      handleDiscovery(
        `character-${id}`,
        `Met ${def.name}`,
        `Shared a pleasant conversation with ${def.name} (${def.role}).`,
        '🍬'
      );
    },
    [handleDiscovery]
  );

  const handleDismissQuote = useCallback((id: string) => {
    setCharactersState(prev => {
      const current = prev[id];
      if (!current) return prev;
      return {
        ...prev,
        [id]: {
          ...current,
          activeQuote: null,
          quoteExpiresAt: null,
        },
      };
    });
  }, []);

  const handleFocusCharacter = useCallback(
    (id: string) => {
      const char = charactersRef.current[id];
      if (char) {
        focusOnWorldX(char.x);
      }
    },
    [focusOnWorldX]
  );

  // Spacebar quick shortcut to focus on Gummy
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.code === 'Space' &&
        !activeActivityCharacter &&
        !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)
      ) {
        e.preventDefault();
        handleFocusCharacter('gummy');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleFocusCharacter, activeActivityCharacter]);

  // Pointer Handlers for Panorama Navigation
  const onPointerDownHandler = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activeActivityCharacter) return;
    handlePointerDown(e.clientX);
    try {
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    } catch {}
  };

  const onPointerMoveHandler = (e: React.PointerEvent<HTMLDivElement>) => {
    handlePointerMove(e.clientX);
    const worldYOffset = Math.max(0, window.innerHeight - 900);
    setCursorWorld({
      x: e.clientX + camX,
      y: e.clientY - worldYOffset,
    });
  };

  const onPointerUpHandler = (e: React.PointerEvent<HTMLDivElement>) => {
    handlePointerUp();
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
    } catch {}
  };

  return (
    <div
      className="relative w-screen h-screen overflow-hidden select-none bg-[#76b5e5]"
      style={{
        cursor: isDragging.current ? 'grabbing' : 'grab',
        touchAction: 'none',
      }}
      onPointerDown={onPointerDownHandler}
      onPointerMove={onPointerMoveHandler}
      onPointerUp={onPointerUpHandler}
    >
      {/* 1. Sky & Celestial Lighting Layer */}
      <SkyLayer dayNight={dayNight} camX={camX} viewportWidth={viewportWidth} />

      {/* 2. Parallax Backdrop Mountains */}
      <BackdropHills dayNight={dayNight} camX={camX} viewportWidth={viewportWidth} />

      {/* 3. The Unified Continuous World Stage (Hardware Accelerated, Zero Layer-Lag) */}
      <div
        className="absolute bottom-0 left-0 h-[900px] pointer-events-auto select-none"
        style={{
          width: '5000px',
          transform: `translate3d(${-camX}px, 0, 0)`,
          willChange: 'transform',
        }}
      >
        {/* Continuous Terrain */}
        <ForegroundTerrain dayNight={dayNight} />

        {/* Landmarks: Oak, Well, Cottages, Windmill, Flowers, Lookout */}
        <InteractiveObjects
          dayNight={dayNight}
          onSpawnParticles={handleSpawnParticles}
          onDiscovery={handleDiscovery}
        />

        {/* 3b. LIVING GARDEN WORLD LAYER: 6 Terraced Plots & Botanical Plants */}
        <LivingGardenWorld
          plants={gardenPlants}
          dayNight={dayNight}
          selectedPlotId={selectedPlotId}
          onSelectPlot={handleSelectPlot}
          onWaterPlant={handleWaterPlant}
          onSpawnParticles={handleSpawnParticles}
        />

        {/* 3c. INVENTOR'S CLOCKWORK RIG: Hillside Gantry beside Windmill */}
        <ClockworkWorld
          clockwork={clockworkState}
          dayNight={dayNight}
          windmillAngle={windmillAngle}
          onSelectModule={handleSelectClockworkModule}
          onSpawnParticles={handleSpawnParticles}
        />

        {/* 3d. COMEDIAN'S FOOTBRIDGE STAGE: Timber Plinth & Brook Props */}
        <ComedianStageWorld
          comedianState={comedianState}
          dayNight={dayNight}
          onOpenStage={handleOpenComedianStage}
          onSpawnParticles={handleSpawnParticles}
        />

        {/* Autonomous Gumdrop Characters Layer */}
        <CharacterLayer
          charactersState={charactersState}
          cursorWorldX={cursorWorld.x}
          cursorWorldY={cursorWorld.y}
          onCharacterClick={handleCharacterClick}
        />

        {/* HTML Floating Speech Bubbles (Zero SVG Clipping, Native Crisp Typography) */}
        {Object.keys(CHARACTERS).map(id => {
          const def = CHARACTERS[id];
          const live = charactersState[id];
          if (!live || !live.activeQuote) return null;
          return (
            <SpeechBubble
              key={`speech-${id}`}
              character={def}
              worldX={live.x}
              quote={live.activeQuote}
              onDismiss={() => handleDismissQuote(id)}
              onStartActivity={charId => setActiveActivityCharacter(charId)}
            />
          );
        })}

        {/* Particles & Fireflies Layer */}
        <ParticlesLayer particles={particles} dayNight={dayNight} />
      </div>

      {/* 4. Ambient Lighting Tint Overlay */}
      {dayNight.ambientLightOpacity > 0.02 && (
        <div
          className="absolute inset-0 pointer-events-none transition-colors duration-1000"
          style={{
            backgroundColor: dayNight.ambientLightColor,
            opacity: dayNight.ambientLightOpacity,
            mixBlendMode: dayNight.phase === 'night' ? 'multiply' : 'soft-light',
          }}
        />
      )}

      {/* 5. Contextual Character Activity Modal (Keeps world visible behind it) */}
      {activeActivityCharacter && (
        <CharacterActivityModal
          characterId={activeActivityCharacter}
          onClose={() => setActiveActivityCharacter(null)}
          gardenPlants={gardenPlants}
          dayNight={dayNight}
          selectedPlotId={selectedPlotId}
          onSelectPlot={handleSelectPlot}
          onPlantSeed={handlePlantSeed}
          onWaterPlant={handleWaterPlant}
          onTendPlant={handleTendPlant}
          onRemovePlant={handleRemovePlant}
          onFocusPlotInWorld={focusOnWorldX}
          // Clockwork Workshop props
          clockworkState={clockworkState}
          selectedClockworkModuleId={selectedClockworkModuleId}
          onSelectClockworkModule={setSelectedClockworkModuleId}
          onInstallClockworkGear={handleInstallClockworkGear}
          onTuneClockworkParameter={handleTuneClockworkParameter}
          onToggleClockworkEngage={handleToggleClockworkEngage}
          onLubricateClockwork={handleLubricateClockwork}
          onFocusClockworkInWorld={() => focusOnWorldX(3850)}
          // Comedian Stage props
          comedianState={comedianState}
          onToggleComedianProp={handleToggleComedianProp}
          onSolveComedianRiddle={handleSolveComedianRiddle}
          onPerformComedianRoutine={handlePerformComedianRoutine}
          onFocusComedianStageInWorld={() => focusOnWorldX(1435)}
        />
      )}
    </div>
  );
}

export default App;
