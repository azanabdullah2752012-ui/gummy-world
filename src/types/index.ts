export type TimePhase = 'dawn' | 'day' | 'goldenHour' | 'dusk' | 'night';

export interface DayNightState {
  progress: number; // 0.0 to 1.0 (25-min cycle)
  phase: TimePhase;
  phaseProgress: number; // 0.0 to 1.0 within current phase
  timeString: string; // e.g. "07:15 AM", "05:40 PM"
  skyGradient: [string, string, string]; // Top, Mid, Horizon colors
  ambientLightColor: string;
  ambientLightOpacity: number;
  sunPosition: { x: number; y: number; visible: boolean };
  moonPosition: { x: number; y: number; visible: boolean };
  starsOpacity: number;
  firefliesActive: boolean;
  lanternsOn: boolean;
}

export type CharacterId =
  | 'gummy'
  | 'student'
  | 'listener'
  | 'ideas'
  | 'explorer'
  | 'gardener'
  | 'inventor'
  | 'comedian';

export type CharacterActionState =
  | 'idle'
  | 'starting'
  | 'walking'
  | 'slowing'
  | 'turning'
  | 'greeting'
  | 'inspecting'
  | 'reacting';

export interface CharacterPalette {
  bodyTop: string;
  bodyBottom: string;
  outline: string;
  blush: string;
  accessoryPrimary: string;
  accessorySecondary?: string;
}

export interface CharacterDef {
  id: CharacterId;
  name: string;
  role: string;
  title: string;
  bio: string;
  species: 'Gumdrop';
  palette: CharacterPalette;
  homeX: number;
  roamRange: [number, number];
  baseSpeed: number; // px/sec
  signaturePitch: number; // Audio frequency in Hz
  quotes: string[];
}

export interface CharacterLiveState {
  id: CharacterId;
  x: number;
  y: number;
  vx: number; // current horizontal velocity in px/sec
  facing: 'left' | 'right';
  targetFacing: 'left' | 'right';
  action: CharacterActionState;
  walkTimer: number; // accumulated step phase progress
  idleTimer: number;
  turnTimer: number;
  idleLookTimer: number; // subtle looking around while idle
  idleLookOffset: number; // -1 (left), 0 (center), 1 (right)
  targetX: number | null;
  squashStretch: number; // 1.0 is neutral, <1 is squash, >1 is stretch
  greetingTargetId: CharacterId | null;
  greetingCooldown: number;
  activeQuote: string | null;
  quoteExpiresAt: number | null;
}

export interface InteractiveObjectDef {
  id: string;
  type: 'flower' | 'tree' | 'pond' | 'chimney' | 'windmill' | 'lantern' | 'well';
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  discoveryId: string;
  discoveryTitle: string;
  discoveryDesc: string;
}

export interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  maxLife: number;
  life: number;
  shape?: 'circle' | 'leaf' | 'spark' | 'smoke' | 'note';
}

export interface DiscoveryRecord {
  id: string;
  title: string;
  desc: string;
  icon: string;
  timestamp: number;
  locationName?: string;
  zone?: string;
  worldX?: number;
  explorerRemark?: string;
  timePhaseDiscovered?: TimePhase;
  userNotes?: string;
  updatedAt?: number;
}
