export interface DiscoveryDef {
  id: string;
  title: string;
  locationName: string;
  zone: string;
  worldX: number;
  icon: string;
  desc: string;
  explorerRemark: string;
  timeHint?: string;
  isSecret?: boolean;
}

export const DISCOVERY_DEFINITIONS: Record<string, DiscoveryDef> = {
  'oak-canopy': {
    id: 'oak-canopy',
    title: 'The Ancient Reading Oak',
    locationName: 'Reading Meadows',
    zone: 'The Reading Meadows',
    worldX: 760,
    icon: '🌳',
    desc: 'A century-old oak with sprawling branches and golden leaves, providing deep shade and quiet shelter for readers and wanderers.',
    explorerRemark:
      'The oak’s root flares reach forty feet out into the meadow. Notice how the ground stays damp and cool underneath, even in high summer.',
  },
  'oak-hollow': {
    id: 'oak-hollow',
    title: 'Owl Hollow & Flood Tallies',
    locationName: 'Reading Meadows',
    zone: 'The Reading Meadows',
    worldX: 760,
    icon: '🦉',
    desc: 'A sheltered knot in the oak’s trunk where a sleepy screech owl nests. Above the hollow, faint tally marks are carved into the bark.',
    explorerRemark:
      'Look at the sap-sealed notches four inches above the hollow. Someone was measuring the brook’s spring flood levels sixty years ago.',
    timeHint: 'The screech owl stirs and opens its amber eyes as twilight falls.',
    isSecret: true,
  },
  'well-water': {
    id: 'well-water',
    title: 'The Whispering Well',
    locationName: 'Meadow Spring',
    zone: 'The Reading Meadows',
    worldX: 1220,
    icon: '🪣',
    desc: 'A stone well sunk deep into the valley floor. Lowering the cedar bucket brings up cold, clear mountain water.',
    explorerRemark:
      'The bucket drops thirty feet down before the splash echoes back up. It’s fed by deep mountain snowmelt that stays icy all year.',
  },
  'well-quartz': {
    id: 'well-quartz',
    title: 'Bedrock Quartz Resonator',
    locationName: 'Meadow Spring',
    zone: 'The Reading Meadows',
    worldX: 1220,
    icon: '💎',
    desc: 'An exposed vein of natural quartz inside the well shaft that rings with a clear harmonic tone when water droplets strike it.',
    explorerRemark:
      'When the ridge wind changes direction, you can hear the well humming like a quiet tuning fork. That’s the quartz seam catching the air pressure.',
    timeHint: 'Gleams with faint blue phosphorescence in evening and night.',
    isSecret: true,
  },
  'pond-water': {
    id: 'pond-water',
    title: 'The Dragonfly Pond',
    locationName: 'Dragonfly Basin',
    zone: 'Dragonfly Pond & Footbridge',
    worldX: 1650,
    icon: '💧',
    desc: 'A mirrored basin where the mountain stream widens into a quiet pond filled with lily pads and cattails.',
    explorerRemark:
      'As long as the breeze holds off, the surface acts like clean glass. You can count the smooth river pebbles six feet down.',
  },
  'pond-dragonfly': {
    id: 'pond-dragonfly',
    title: 'Reeds & Emperor Dragonfly',
    locationName: 'Dragonfly Basin',
    zone: 'Dragonfly Pond & Footbridge',
    worldX: 1650,
    icon: '🪷',
    desc: 'Sunken river stones near the reed bed where an iridescent blue emperor dragonfly perches between flights.',
    explorerRemark:
      'Dragonflies always return to the exact same reed stalk after hunting. If you stand motionless on the bank, they’ll land right on your cap.',
    timeHint: 'Fireflies dance over the lily pads during dusk and night.',
    isSecret: true,
  },
  'bridge-culvert': {
    id: 'bridge-culvert',
    title: 'The Mossy Brook Footbridge',
    locationName: 'Brook Crossing',
    zone: 'Dragonfly Pond & Footbridge',
    worldX: 2050,
    icon: '🌉',
    desc: 'A low stone arch bridge where the pond spillway splits into meadow irrigation channels. An otter rune is carved into the keystone.',
    explorerRemark:
      'The stream splits into three underground channels right under this arch. You can feel the water vibrating beneath your boots if you pause in the center.',
    isSecret: true,
  },
  'cottage-hearth': {
    id: 'cottage-hearth',
    title: 'Sunflower Cottage Hearth',
    locationName: 'Sunflower Hamlet',
    zone: 'Sunflower Cottages & Gardens',
    worldX: 2680,
    icon: '🏡',
    desc: 'A terracotta-roofed stone cottage with fragrant white cedar smoke puffing steadily from its river-cobble chimney.',
    explorerRemark:
      'You can smell wild rosemary and applewood on the breeze whenever the cottage hearth is burning.',
  },
  'cottage-sundial': {
    id: 'cottage-sundial',
    title: 'The Slate Solar & Lunar Dial',
    locationName: 'Sunflower Hamlet',
    zone: 'Sunflower Cottages & Gardens',
    worldX: 2680,
    icon: '☀️',
    desc: 'A circular slate dial embedded into the porch flagstones, calibrated to track the sun during the day and the moon path at night.',
    explorerRemark:
      'The builders notched the patio flags so the gnomon shadow touches the garden gate at exact solar noon. It still keeps better time than the clock in town.',
    timeHint: 'Reflects the current position of the celestial cycle.',
    isSecret: true,
  },
  'trellis-sweetpeas': {
    id: 'trellis-sweetpeas',
    title: 'Sweet Pea Trellis & Pumpkins',
    locationName: 'Gardener’s Plot',
    zone: 'Sunflower Cottages & Gardens',
    worldX: 3040,
    icon: '🌸',
    desc: 'A cedar trellis covered in sweet pea blossoms that gently shake golden pollen into the pumpkin patch below.',
    explorerRemark:
      'Sweet pea tendrils coil tightest around the north side of the lattice. Plants always know where the warmth comes from.',
  },
  'trellis-moonflower': {
    id: 'trellis-moonflower',
    title: 'Night-Blooming Moonflower Vine',
    locationName: 'Gardener’s Plot',
    zone: 'Sunflower Cottages & Gardens',
    worldX: 3040,
    icon: '🌙',
    desc: 'A nocturnal vine nestled beside the trellis. Its pale silver blossoms stay coiled tight by day, but breathe open once dusk settles.',
    explorerRemark:
      'Those spiral buds stay sealed tight under direct sunlight. Five minutes after dusk begins, the petals unstick with a faint whisper.',
    timeHint: 'Blossoms glow with silver radiance during dusk and night.',
    isSecret: true,
  },
  'windmill-sails': {
    id: 'windmill-sails',
    title: 'The Clockwork Ridge Windmill',
    locationName: 'Windmill Ridge',
    zone: 'Clockwork Ridge & Workshop',
    worldX: 3720,
    icon: '⚙️',
    desc: 'A heavy stone tower with brass gearwork and canvas lattice sails that catch the high mountain currents.',
    explorerRemark:
      'The main drive shaft was carved from seasoned white oak and greased with beeswax. It has turned in every mountain storm for forty years.',
  },
  'windmill-anemometer': {
    id: 'windmill-anemometer',
    title: 'High-Wind Anemometer Bell',
    locationName: 'Windmill Ridge',
    zone: 'Clockwork Ridge & Workshop',
    worldX: 3720,
    icon: '🔔',
    desc: 'A tuned copper bell mounted high on the windmill gantry that sounds a clear harmonic note when ridge gusts surge.',
    explorerRemark:
      'The bell isn’t decorative. When ridge gusts hit twenty knots, it rings out to warn the cottage gardeners down the slope to secure their frames.',
    isSecret: true,
  },
  'ridge-geode': {
    id: 'ridge-geode',
    title: 'Pine Ridge Quartz Outcrop',
    locationName: 'Lookout Trail',
    zone: 'Clockwork Ridge & Workshop',
    worldX: 4050,
    icon: '✨',
    desc: 'A natural fissure in the granite slope revealing amber quartz crystals that sparkle brilliantly in low-angle sunlight.',
    explorerRemark:
      'The crystals formed inside ancient volcanic gas bubbles. At golden hour, they split the low sunlight into double amber rays.',
    timeHint: 'Flashes intensely during golden hour and sunset.',
    isSecret: true,
  },
  'lookout-cliff': {
    id: 'lookout-cliff',
    title: 'Western High Lookout',
    locationName: 'Western Cliff',
    zone: 'The Western Lookout Cliff',
    worldX: 4420,
    icon: '🔭',
    desc: 'A cantilevered timber observation deck built out over the western cliffs, looking out over the endless mountain range.',
    explorerRemark:
      'From up here on the cliffs, you can see the weather arriving an hour before a single drop touches the reading meadows.',
  },
  'lookout-spyglass': {
    id: 'lookout-spyglass',
    title: 'The Mountain Weather Spyglass',
    locationName: 'Western Cliff',
    zone: 'The Western Lookout Cliff',
    worldX: 4420,
    icon: '☁️',
    desc: 'A brass spyglass on a tripod aimed through a mountain pass, revealing distant clouds and soaring hawks riding the thermals.',
    explorerRemark:
      'Look through the lens toward the notch in the third peak. That’s where the valley’s evening mist always originates.',
    isSecret: true,
  },
};

export const DISCOVERY_LIST = Object.values(DISCOVERY_DEFINITIONS);

export function getDiscoveryDef(id: string): DiscoveryDef | undefined {
  return DISCOVERY_DEFINITIONS[id];
}
