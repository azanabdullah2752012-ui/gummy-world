import type { PlantSpeciesDef, GardenPlotDef, PlantSpeciesId } from '../types/garden';

export const GARDEN_SPECIES: Record<PlantSpeciesId, PlantSpeciesDef> = {
  sunflower: {
    id: 'sunflower',
    name: 'Sunburst Sunflower',
    botanicalName: 'Helianthus valleyus',
    category: 'Blossom',
    icon: '🌻',
    summary: 'A towering golden sunflower that follows the valley sun. Features broad textured leaves and a dark seed center loved by goldfinches.',
    careTip: 'Grows tall quickly once roots find moisture. Loves full daylight along the cottage slope.',
    sunRequirement: 'Full Sunlight',
    colorPalette: {
      stem: '#4d7c0f',
      leaf: '#65a30d',
      bloom: '#eab308',
      accent: '#78350f',
    },
    stages: {
      seed: {
        name: 'Sheltered Seed',
        stageLabel: 'Stage 1 of 4',
        description: 'Tucked beneath warm terracotta loam, waiting for initial water to swell.',
        heightPx: 14,
      },
      sprout: {
        name: 'Sunward Cotyledon',
        stageLabel: 'Stage 2 of 4',
        description: 'Two rounded seed-leaves break through the soil, tilting eastward toward dawn.',
        heightPx: 26,
      },
      growing: {
        name: 'Sturdy Young Stalk',
        stageLabel: 'Stage 3 of 4',
        description: 'A stout ribbed stalk with four notched heart-shaped leaves and a tight green bud.',
        heightPx: 46,
      },
      mature: {
        name: 'Radiant Sunburst',
        stageLabel: 'Stage 4 of 4',
        description: 'Full magnificent bloom with a ring of twenty golden ray petals and pollen disc.',
        heightPx: 72,
      },
    },
  },

  bellflower: {
    id: 'bellflower',
    name: 'Sweet Violet Bellflower',
    botanicalName: 'Campanula pratensis',
    category: 'Blossom',
    icon: '🪻',
    summary: 'Delicate perennial with arching stems and nodding periwinkle-violet bells that chime softly in the mountain breeze.',
    careTip: 'Prefers cool soil and gentle morning moisture. Attracts bumblebees and hummingbirds.',
    sunRequirement: 'Morning Sun',
    colorPalette: {
      stem: '#3f6212',
      leaf: '#4d7c0f',
      bloom: '#818cf8',
      accent: '#c084fc',
    },
    stages: {
      seed: {
        name: 'Minute Specks',
        stageLabel: 'Stage 1 of 4',
        description: 'Tiny dark seeds nestled among crushed river gravel and fine loam.',
        heightPx: 12,
      },
      sprout: {
        name: 'Slender Shoot',
        stageLabel: 'Stage 2 of 4',
        description: 'Fine needle-like green blades emerging beside the garden stake.',
        heightPx: 22,
      },
      growing: {
        name: 'Branching Spray',
        stageLabel: 'Stage 3 of 4',
        description: 'Gracefully curved stem with small serrated leaves and teardrop violet buds.',
        heightPx: 40,
      },
      mature: {
        name: 'Singing Bells',
        stageLabel: 'Stage 4 of 4',
        description: 'Five nodding violet blossom bells with creamy stamen tips that sway in the wind.',
        heightPx: 56,
      },
    },
  },

  strawberry: {
    id: 'strawberry',
    name: 'Ruby Woodland Strawberry',
    botanicalName: 'Fragaria vesca',
    category: 'Berry',
    icon: '🍓',
    summary: 'Low ground-hugging perennial with serrated trifoliate leaves, white star blossoms, and fragrant ruby strawberries.',
    careTip: 'Spreads healthy runners over dry ground. Soil should stay slightly damp.',
    sunRequirement: 'Dappled Shade',
    colorPalette: {
      stem: '#15803d',
      leaf: '#22c55e',
      bloom: '#f8fafc',
      accent: '#ef4444',
    },
    stages: {
      seed: {
        name: 'Pip in Soil',
        stageLabel: 'Stage 1 of 4',
        description: 'Individual berry seed resting beneath a blanket of aged pine needle mulch.',
        heightPx: 10,
      },
      sprout: {
        name: 'Clover-like Trio',
        stageLabel: 'Stage 2 of 4',
        description: 'First set of three tiny toothed leaves opening close to the ground.',
        heightPx: 18,
      },
      growing: {
        name: 'Flowering Runner',
        stageLabel: 'Stage 3 of 4',
        description: 'Vigorous leaf mound with two white star flowers and miniature green berries.',
        heightPx: 30,
      },
      mature: {
        name: 'Bountiful Berries',
        stageLabel: 'Stage 4 of 4',
        description: 'Lush ground carpet boasting ripe crimson strawberries and fresh white blooms.',
        heightPx: 38,
      },
    },
  },

  fern: {
    id: 'fern',
    name: 'Valley Moon Fern',
    botanicalName: 'Polystichum lunas',
    category: 'Frond',
    icon: '🌿',
    summary: 'Architectural woodland fern with feather-cut fronds that unfurl from tight spiral fiddleheads. Emits a faint soft silver sheen at dusk.',
    careTip: 'Thrives in rich humus. Keep roots cool and damp; needs no direct blazing sun.',
    sunRequirement: 'Cool Mist',
    colorPalette: {
      stem: '#065f46',
      leaf: '#059669',
      bloom: '#34d399',
      accent: '#a7f3d0',
    },
    stages: {
      seed: {
        name: 'Spore Cluster',
        stageLabel: 'Stage 1 of 4',
        description: 'Microscopic velvety spores settling into deep mossy soil.',
        heightPx: 10,
      },
      sprout: {
        name: 'Coiled Fiddlehead',
        stageLabel: 'Stage 2 of 4',
        description: 'Tight cinnamon-furred spiral crozier rising cleanly from the bed.',
        heightPx: 20,
      },
      growing: {
        name: 'Unfurling Pinnae',
        stageLabel: 'Stage 3 of 4',
        description: 'Fiddlehead opens outward into two delicate arching feather fronds.',
        heightPx: 36,
      },
      mature: {
        name: 'Crown of Fronds',
        stageLabel: 'Stage 4 of 4',
        description: 'Sprawling rosette of five graceful fronds rustling in the valley air.',
        heightPx: 50,
      },
    },
  },

  pumpkin: {
    id: 'pumpkin',
    name: 'Golden Valley Pumpkin',
    botanicalName: 'Cucurbita aurea',
    category: 'Gourd',
    icon: '🎃',
    summary: 'A hearty valley heirloom squash with broad parasol leaves, curling climbing tendrils, and a plump golden-orange ribbed gourd.',
    careTip: 'Heavy feeder that enjoys generous compost and deep watering.',
    sunRequirement: 'Full Sunlight',
    colorPalette: {
      stem: '#14532d',
      leaf: '#15803d',
      bloom: '#f59e0b',
      accent: '#ea580c',
    },
    stages: {
      seed: {
        name: 'Flat Seed Bed',
        stageLabel: 'Stage 1 of 4',
        description: 'Plump teardrop seed buried flat two knuckles deep into fertile compost.',
        heightPx: 12,
      },
      sprout: {
        name: 'Thick Oval Leaves',
        stageLabel: 'Stage 2 of 4',
        description: 'Pair of broad fleshy seed leaves accompanied by a first spiraling tendril.',
        heightPx: 22,
      },
      growing: {
        name: 'Sprawling Vine',
        stageLabel: 'Stage 3 of 4',
        description: 'Scalloped leaves with a bright yellow funnel blossom and baby green melon.',
        heightPx: 38,
      },
      mature: {
        name: 'Harvest Gourd',
        stageLabel: 'Stage 4 of 4',
        description: 'Plump deep orange ribbed squash resting comfortably on the hillside earth.',
        heightPx: 48,
      },
    },
  },
};

export const GARDEN_PLOTS: GardenPlotDef[] = [
  {
    id: 'plot-1',
    index: 0,
    worldX: 2830,
    label: 'Cottage Terrace Bed 1',
    zoneDescription: 'Sheltered western plot directly below Sunflower Cottage porch.',
  },
  {
    id: 'plot-2',
    index: 1,
    worldX: 2900,
    label: 'Cottage Terrace Bed 2',
    zoneDescription: 'Warm afternoon plot with natural granite stone edging.',
  },
  {
    id: 'plot-3',
    index: 2,
    worldX: 2970,
    label: "Gardener's Potting Bench Bed",
    zoneDescription: 'Central bed right next to Gardener Gumdrop’s home stake.',
  },
  {
    id: 'plot-4',
    index: 3,
    worldX: 3190,
    label: 'East Pumpkin Verge 1',
    zoneDescription: 'Sunny open terrace just past the sweet pea trellis.',
  },
  {
    id: 'plot-5',
    index: 4,
    worldX: 3260,
    label: 'East Pumpkin Verge 2',
    zoneDescription: 'Deep loam bed beside the gentle downward meadow slope.',
  },
  {
    id: 'plot-6',
    index: 5,
    worldX: 3330,
    label: 'Lower Meadow Border',
    zoneDescription: 'Open eastern plot catching the first rays of valley dawn.',
  },
];
