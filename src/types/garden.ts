export type PlantSpeciesId = 'sunflower' | 'bellflower' | 'strawberry' | 'fern' | 'pumpkin';

export type GrowthStage = 'seed' | 'sprout' | 'growing' | 'mature';

export interface PlantStageDetail {
  name: string;
  stageLabel: string;
  description: string;
  heightPx: number;
}

export interface PlantSpeciesDef {
  id: PlantSpeciesId;
  name: string;
  botanicalName: string;
  category: 'Blossom' | 'Perennial' | 'Berry' | 'Frond' | 'Gourd';
  icon: string;
  summary: string;
  careTip: string;
  sunRequirement: 'Full Sunlight' | 'Morning Sun' | 'Dappled Shade' | 'Cool Mist';
  colorPalette: {
    stem: string;
    leaf: string;
    bloom: string;
    accent: string;
  };
  stages: Record<GrowthStage, PlantStageDetail>;
}

export interface GardenPlotDef {
  id: string; // 'plot-1' through 'plot-6'
  index: number;
  worldX: number;
  label: string;
  zoneDescription: string;
}

export interface GardenPlantRecord {
  plotId: string;
  speciesId: PlantSpeciesId;
  stage: GrowthStage;
  plantedAt: number;
  lastWateredAt: number | null;
  waterCount: number;
  growthProgress: number; // 0.0 to 1.0 toward next stage
  notes?: string;
  updatedAt: number;
}

export type CareActionType = 'water' | 'tend' | 'transplant';
