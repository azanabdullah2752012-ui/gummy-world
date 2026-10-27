import { useState, useRef, useEffect } from 'react';
import type { DayNightState, TimePhase } from '../types';
import { lerpColor } from '../utils/math';
import { loadSavedTimeProgress, saveTimeProgress } from '../utils/storage';
import { soundEngine } from '../audio/soundEngine';

// 25 minutes = 1500 seconds
export const CYCLE_DURATION_SECONDS = 1500;

export function useDayNight(speedMultiplier: number = 1.0) {
  const [progress, setProgress] = useState<number>(() => loadSavedTimeProgress());
  const progressRef = useRef(progress);
  const lastSaveRef = useRef<number>(0);
  const lastPhaseRef = useRef<TimePhase>('day');

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    lastSaveRef.current = Date.now();
  }, []);

  // Compute time attributes from 0.0 -> 1.0
  const computeState = (p: number): DayNightState => {
    // 0.00 - 0.15 : Dawn
    // 0.15 - 0.55 : Daylight
    // 0.55 - 0.72 : Golden Hour
    // 0.72 - 0.84 : Dusk / Twilight
    // 0.84 - 1.00 : Deep Night
    let phase: TimePhase = 'day';
    let phaseProgress = 0;

    if (p < 0.15) {
      phase = 'dawn';
      phaseProgress = p / 0.15;
    } else if (p < 0.55) {
      phase = 'day';
      phaseProgress = (p - 0.15) / 0.40;
    } else if (p < 0.72) {
      phase = 'goldenHour';
      phaseProgress = (p - 0.55) / 0.17;
    } else if (p < 0.84) {
      phase = 'dusk';
      phaseProgress = (p - 0.72) / 0.12;
    } else {
      phase = 'night';
      phaseProgress = (p - 0.84) / 0.16;
    }

    // 24-hour clock simulation: 0.0 is 05:00 AM (dawn)
    // 24 hours in 1500 seconds
    const totalMinutes = (5 * 60 + p * 24 * 60) % (24 * 60);
    const hours24 = Math.floor(totalMinutes / 60);
    const minutes = Math.floor(totalMinutes % 60);
    const ampm = hours24 >= 12 ? 'PM' : 'AM';
    const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
    const timeString = `${hours12.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${ampm}`;

    // Color Gradients [Top, Mid, Horizon]
    let skyGradient: [string, string, string];
    let ambientLightColor = '#ffffff';
    let ambientLightOpacity = 0;
    let starsOpacity = 0;

    switch (phase) {
      case 'dawn': {
        const top = lerpColor('#2b3352', '#6ba3d4', phaseProgress);
        const mid = lerpColor('#7b687f', '#e6a88b', phaseProgress);
        const horiz = lerpColor('#e39a74', '#fce2ba', phaseProgress);
        skyGradient = [top, mid, horiz];
        ambientLightColor = '#ffecd2';
        ambientLightOpacity = (1 - phaseProgress) * 0.25;
        starsOpacity = (1 - phaseProgress) * 0.6;
        break;
      }
      case 'day': {
        skyGradient = ['#76b5e5', '#a5d5f5', '#dff0fc'];
        ambientLightColor = '#ffffff';
        ambientLightOpacity = 0;
        starsOpacity = 0;
        break;
      }
      case 'goldenHour': {
        const top = lerpColor('#76b5e5', '#517aa8', phaseProgress);
        const mid = lerpColor('#a5d5f5', '#d99768', phaseProgress);
        const horiz = lerpColor('#dff0fc', '#f5b578', phaseProgress);
        skyGradient = [top, mid, horiz];
        ambientLightColor = '#e89a55';
        ambientLightOpacity = phaseProgress * 0.22;
        starsOpacity = 0;
        break;
      }
      case 'dusk': {
        const top = lerpColor('#517aa8', '#262947', phaseProgress);
        const mid = lerpColor('#d99768', '#6b476b', phaseProgress);
        const horiz = lerpColor('#f5b578', '#cb6851', phaseProgress);
        skyGradient = [top, mid, horiz];
        ambientLightColor = '#4a3b63';
        ambientLightOpacity = 0.22 + phaseProgress * 0.28;
        starsOpacity = phaseProgress * 0.75;
        break;
      }
      case 'night': {
        const top = lerpColor('#262947', '#121629', Math.min(1, phaseProgress * 2));
        const mid = lerpColor('#393452', '#1b223c', Math.min(1, phaseProgress * 2));
        const horiz = lerpColor('#53445c', '#27314f', Math.min(1, phaseProgress * 2));
        skyGradient = [top, mid, horiz];
        ambientLightColor = '#1a2240';
        ambientLightOpacity = 0.55;
        starsOpacity = 1;
        break;
      }
    }

    // Sun arc (visible from dawn 0.0 to dusk 0.8)
    const sunVisible = p < 0.76;
    // Map p 0.0 -> 0.76 to angle 0 -> PI
    const sunAngle = (p / 0.76) * Math.PI;
    const sunX = (1 - Math.cos(sunAngle)) * 0.5; // 0 to 1 across screen
    const sunY = Math.sin(sunAngle); // 0 at horizon, 1 at peak

    // Moon arc (visible from dusk 0.70 to dawn 0.08)
    const moonVisible = p >= 0.72 || p <= 0.10;
    const moonProgress = p >= 0.72 ? (p - 0.72) / 0.38 : (p + 0.28) / 0.38;
    const moonAngle = Math.max(0, Math.min(1, moonProgress)) * Math.PI;
    const moonX = (1 - Math.cos(moonAngle)) * 0.5;
    const moonY = Math.sin(moonAngle);

    const lanternsOn = phase === 'dusk' || phase === 'night';
    const firefliesActive = phase === 'dusk' || phase === 'night';

    return {
      progress: p,
      phase,
      phaseProgress,
      timeString,
      skyGradient,
      ambientLightColor,
      ambientLightOpacity,
      sunPosition: { x: sunX, y: sunY, visible: sunVisible },
      moonPosition: { x: moonX, y: moonY, visible: moonVisible },
      starsOpacity,
      firefliesActive,
      lanternsOn,
    };
  };

  const [state, setState] = useState<DayNightState>(() => computeState(progress));

  // Advance day/night cycle via tick
  const advanceTime = (deltaSeconds: number) => {
    if (deltaSeconds <= 0) return;
    const increment = (deltaSeconds * speedMultiplier) / CYCLE_DURATION_SECONDS;
    const newProgress = (progressRef.current + increment) % 1.0;
    progressRef.current = newProgress;
    setProgress(newProgress);

    const newState = computeState(newProgress);
    setState(newState);

    // Periodically save to localStorage (every 10 seconds of wall time)
    const now = Date.now();
    if (now - lastSaveRef.current > 10000) {
      saveTimeProgress(newProgress);
      lastSaveRef.current = now;
    }

    // When phase changes, adjust sound ambience if active
    if (newState.phase !== lastPhaseRef.current) {
      lastPhaseRef.current = newState.phase;
      if (!soundEngine.getMuted()) {
        soundEngine.startAmbience(newState.phase);
      }
    }
  };

  const setManualProgress = (p: number) => {
    const clamped = Math.max(0, Math.min(1, p));
    progressRef.current = clamped;
    setProgress(clamped);
    const newState = computeState(clamped);
    setState(newState);
    saveTimeProgress(clamped);
  };

  return {
    state,
    advanceTime,
    setManualProgress,
  };
}
