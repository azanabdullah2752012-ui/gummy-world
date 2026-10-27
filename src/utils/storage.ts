import type { DiscoveryRecord } from '../types';
import type { GardenPlantRecord } from '../types/garden';
import type { ClockworkState } from '../types/clockwork';
import { DEFAULT_CLOCKWORK_STATE } from '../data/clockwork';
import type { ComedianState } from '../types/comedian';
import { DEFAULT_COMEDIAN_STATE } from '../data/comedian';

const DISCOVERIES_KEY = 'gummy_world_discoveries_v1';
const AUDIO_MUTED_KEY = 'gummy_world_audio_muted_v1';
const TIME_PROGRESS_KEY = 'gummy_world_time_v1';
const GARDEN_STORAGE_KEY = 'gummy_world_garden_v1';
const CLOCKWORK_STORAGE_KEY = 'gummy_world_clockwork_v1';
const COMEDIAN_STORAGE_KEY = 'gummy_world_comedian_v1';

const LEGACY_ID_MAP: Record<string, string> = {
  'oak-shaken': 'oak-canopy',
  'well-rung': 'well-water',
  'pond-rippled': 'pond-water',
  'chimney-puffed': 'cottage-hearth',
  'garden-bloomed': 'trellis-sweetpeas',
  'windmill-spun': 'windmill-sails',
  'lookout-reached': 'lookout-cliff',
};

export function loadSavedDiscoveries(): Record<string, DiscoveryRecord> {
  try {
    const raw = localStorage.getItem(DISCOVERIES_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, DiscoveryRecord>;
    const normalized: Record<string, DiscoveryRecord> = {};
    for (const [k, v] of Object.entries(parsed)) {
      const canonicalId = LEGACY_ID_MAP[k] || k;
      normalized[canonicalId] = {
        ...v,
        id: canonicalId,
      };
    }
    return normalized;
  } catch (err) {
    console.warn('GummyWorld: localStorage unavailable or corrupted, using in-memory state.', err);
    return {};
  }
}

export function saveDiscovery(record: DiscoveryRecord): void {
  try {
    const current = loadSavedDiscoveries();
    current[record.id] = {
      ...current[record.id],
      ...record,
    };
    localStorage.setItem(DISCOVERIES_KEY, JSON.stringify(current));
  } catch (err) {
    console.warn('GummyWorld: Could not persist discovery to localStorage.', err);
  }
}

export function saveDiscoveryNote(id: string, userNotes: string): void {
  try {
    const current = loadSavedDiscoveries();
    if (current[id]) {
      current[id].userNotes = userNotes;
      current[id].updatedAt = Date.now();
      localStorage.setItem(DISCOVERIES_KEY, JSON.stringify(current));
    }
  } catch (err) {
    console.warn('GummyWorld: Could not persist discovery note to localStorage.', err);
  }
}

export function deleteDiscoveryNote(id: string): void {
  try {
    const current = loadSavedDiscoveries();
    if (current[id]) {
      delete current[id].userNotes;
      current[id].updatedAt = Date.now();
      localStorage.setItem(DISCOVERIES_KEY, JSON.stringify(current));
    }
  } catch (err) {
    console.warn('GummyWorld: Could not remove discovery note from localStorage.', err);
  }
}

export function loadAudioMuted(): boolean {
  try {
    const raw = localStorage.getItem(AUDIO_MUTED_KEY);
    if (raw === null) return true;
    return raw === 'true';
  } catch {
    return true;
  }
}

export function saveAudioMuted(muted: boolean): void {
  try {
    localStorage.setItem(AUDIO_MUTED_KEY, String(muted));
  } catch {
    // Graceful fallback
  }
}

export function loadSavedTimeProgress(): number {
  try {
    const raw = localStorage.getItem(TIME_PROGRESS_KEY);
    if (!raw) return 0.25;
    const val = parseFloat(raw);
    return isNaN(val) ? 0.25 : Math.max(0, Math.min(1, val));
  } catch {
    return 0.25;
  }
}

export function saveTimeProgress(val: number): void {
  try {
    localStorage.setItem(TIME_PROGRESS_KEY, val.toFixed(4));
  } catch {
    // Graceful fallback
  }
}

export function loadSavedGarden(): Record<string, GardenPlantRecord> {
  try {
    const raw = localStorage.getItem(GARDEN_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, GardenPlantRecord>;
    // Validate schema
    const valid: Record<string, GardenPlantRecord> = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (v && v.plotId && v.speciesId && v.stage) {
        valid[k] = {
          ...v,
          waterCount: v.waterCount || 0,
          growthProgress: typeof v.growthProgress === 'number' ? v.growthProgress : 0,
        };
      }
    }
    return valid;
  } catch (err) {
    console.warn('GummyWorld: Could not read garden from localStorage, using memory.', err);
    return {};
  }
}

export function saveGardenPlant(record: GardenPlantRecord): void {
  try {
    const current = loadSavedGarden();
    current[record.plotId] = {
      ...record,
      updatedAt: Date.now(),
    };
    localStorage.setItem(GARDEN_STORAGE_KEY, JSON.stringify(current));
  } catch (err) {
    console.warn('GummyWorld: Could not save plant to localStorage.', err);
  }
}

export function removeGardenPlant(plotId: string): void {
  try {
    const current = loadSavedGarden();
    if (current[plotId]) {
      delete current[plotId];
      localStorage.setItem(GARDEN_STORAGE_KEY, JSON.stringify(current));
    }
  } catch (err) {
    console.warn('GummyWorld: Could not remove plant from localStorage.', err);
  }
}

export function saveAllGardenPlants(plants: Record<string, GardenPlantRecord>): void {
  try {
    localStorage.setItem(GARDEN_STORAGE_KEY, JSON.stringify(plants));
  } catch (err) {
    console.warn('GummyWorld: Could not save all garden plants to localStorage.', err);
  }
}

export function loadSavedClockwork(): ClockworkState {
  try {
    const raw = localStorage.getItem(CLOCKWORK_STORAGE_KEY);
    if (!raw) return DEFAULT_CLOCKWORK_STATE;
    const parsed = JSON.parse(raw) as Partial<ClockworkState>;
    return {
      ...DEFAULT_CLOCKWORK_STATE,
      ...parsed,
      installed: {
        ...DEFAULT_CLOCKWORK_STATE.installed,
        ...(parsed.installed || {}),
      },
    };
  } catch (err) {
    console.warn('GummyWorld: Could not read clockwork state from localStorage, using default.', err);
    return DEFAULT_CLOCKWORK_STATE;
  }
}

export function saveClockworkState(state: ClockworkState): void {
  try {
    localStorage.setItem(CLOCKWORK_STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.warn('GummyWorld: Could not save clockwork state to localStorage.', err);
  }
}

export function loadSavedComedian(): ComedianState {
  try {
    const raw = localStorage.getItem(COMEDIAN_STORAGE_KEY);
    if (!raw) return DEFAULT_COMEDIAN_STATE;
    const parsed = JSON.parse(raw) as Partial<ComedianState>;
    return {
      ...DEFAULT_COMEDIAN_STATE,
      ...parsed,
      activeProps: {
        ...DEFAULT_COMEDIAN_STATE.activeProps,
        ...(parsed.activeProps || {}),
      },
      routine: Array.isArray(parsed.routine) ? parsed.routine : DEFAULT_COMEDIAN_STATE.routine,
      solvedRiddleIds: Array.isArray(parsed.solvedRiddleIds) ? parsed.solvedRiddleIds : DEFAULT_COMEDIAN_STATE.solvedRiddleIds,
    };
  } catch (err) {
    console.warn('GummyWorld: Could not read comedian state from localStorage, using default.', err);
    return DEFAULT_COMEDIAN_STATE;
  }
}

export function saveComedianState(state: ComedianState): void {
  try {
    localStorage.setItem(COMEDIAN_STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.warn('GummyWorld: Could not save comedian state to localStorage.', err);
  }
}

