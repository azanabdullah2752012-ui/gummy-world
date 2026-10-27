export type GearMaterial = 'brass' | 'iron' | 'cedar' | 'copper' | 'ruby';

export interface GearPart {
  id: string;
  name: string;
  material: GearMaterial;
  teeth: number;
  radius: number;
  color: string;
  borderColor: string;
  frictionRatio: number; // lower = smoother
}

export type MechanismModuleId = 'windmill-drive' | 'lantern-escapement' | 'chime-governor' | 'weather-pulley';

export interface MechanismModuleDef {
  id: MechanismModuleId;
  name: string;
  title: string;
  description: string;
  worldOffset: { x: number; y: number };
  defaultGearId: string;
  purpose: string;
  effectDescription: string;
  tuneParameterName: string;
  tuneParameterUnit: string;
  tuneMin: number;
  tuneMax: number;
  tuneDefault: number;
}

export interface InstalledMechanismState {
  moduleId: MechanismModuleId;
  installedGearId: string;
  tuneValue: number; // e.g. ratio or tension
  isEngaged: boolean;
  lubricationLevel: number; // 0 to 1
  lastMaintainedAt: number;
}

export interface ClockworkState {
  installed: Record<MechanismModuleId, InstalledMechanismState>;
  selectedModuleId: MechanismModuleId;
  powerOutputRpm: number;
  totalCraftedParts: number;
  isGearboxRunning: boolean;
}
