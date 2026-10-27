import type { CharacterDef } from '../types';

export const CHARACTERS: Record<string, CharacterDef> = {
  gummy: {
    id: 'gummy',
    name: 'Gummy',
    role: 'Studio Mascot & Valley Wanderer',
    title: 'The Inquisitive Gumdrop',
    bio: 'The beloved studio companion from Pickle Corp. A sweet, warm gumdrop with an open heart. Gummy wanders the countryside, visiting friends, soaking in the breeze, and watching ideas turn into reality.',
    species: 'Gumdrop',
    palette: {
      bodyTop: '#b8a18c',
      bodyBottom: '#ab947e',
      outline: '#593d3b',
      blush: '#c0a692',
      accessoryPrimary: '#ffffff',
      accessorySecondary: '#593d3b',
    },
    homeX: 2350,
    roamRange: [400, 4600],
    baseSpeed: 38,
    signaturePitch: 523.25, // C5 (bright, clear)
    quotes: [
      "The countryside smells like fresh clover and morning sunshine today!",
      "I wonder what Inventor is hammering up on the ridge?",
      "Every step feels lighter when you take your time.",
      "Look at that cloud! It looks like a friendly pebble.",
      "Hello, traveler! The world is in no rush today.",
    ],
  },

  student: {
    id: 'student',
    name: 'Student',
    role: 'Observer & Naturalist',
    title: 'The Diligent Gumdrop',
    bio: 'Armed with tiny round spectacles and a hand-stitched notebook, Student records cloud heights, butterfly wingbeats, and the geometry of rolling hills.',
    species: 'Gumdrop',
    palette: {
      bodyTop: '#b5c0e6',
      bodyBottom: '#9aa8db',
      outline: '#593d3b',
      blush: '#c4a6b8',
      accessoryPrimary: '#d4af37', // brass spectacles
      accessorySecondary: '#593d3b', // book cover
    },
    homeX: 820,
    roamRange: [300, 1300],
    baseSpeed: 28,
    signaturePitch: 440.0, // A4
    quotes: [
      "Did you know clover leaves fold slightly inward at twilight?",
      "Every hill in this valley follows a predictable harmonic curve.",
      "I'm charting the flight paths of the green dragonflies today.",
      "Taking notes under the shady oak tree makes formulas make sense.",
      "Patience is just curiosity with a notebook.",
    ],
  },

  listener: {
    id: 'listener',
    name: 'Listener',
    role: 'Empath & Brook Companion',
    title: 'The Gentle Gumdrop',
    bio: 'Wearing a cozy knitted peach scarf, Listener sits by the edge of the pond, listening to the brook whisper to the stones and providing quiet comfort to anyone passing by.',
    species: 'Gumdrop',
    palette: {
      bodyTop: '#f2b5a5',
      bodyBottom: '#de9b8a',
      outline: '#593d3b',
      blush: '#e69888',
      accessoryPrimary: '#f7dfce', // knitted scarf
      accessorySecondary: '#593d3b',
    },
    homeX: 1680,
    roamRange: [1350, 2050],
    baseSpeed: 24,
    signaturePitch: 329.63, // E4
    quotes: [
      "Close your eyes... the brook has three different melodies today.",
      "When the breeze pauses, the pond becomes a clean mirror for the clouds.",
      "You don't always have to reply. Sitting quietly together is plenty.",
      "The reed frogs are tuning their evening chorus already.",
      "I hear your footsteps. They sound steady and thoughtful.",
    ],
  },

  ideas: {
    id: 'ideas',
    name: 'Ideas',
    role: 'Visionary & Spontaneous Thinker',
    title: 'The Sparky Gumdrop',
    bio: 'Constantly having sudden epiphanies that make them hop into the air. A luminous little spark twinkles above their head whenever an inspiration strikes.',
    species: 'Gumdrop',
    palette: {
      bodyTop: '#fad973',
      bodyBottom: '#e8be48',
      outline: '#593d3b',
      blush: '#d89b65',
      accessoryPrimary: '#fff7ba', // glowing spark
      accessorySecondary: '#593d3b',
    },
    homeX: 2150,
    roamRange: [1800, 2700],
    baseSpeed: 42,
    signaturePitch: 587.33, // D5
    quotes: [
      "Aha! What if we tied tiny leaf sails to dandelion seeds?!",
      "I just had a thought: what if night is just the sky putting on a velvet coat?",
      "Wait! If we mirror the pond's curve, we could build an acoustic amphitheater!",
      "Quick, someone write this down before the breeze blows it away!",
      "There are at least eleven ways to arrange these pebbles better!",
    ],
  },

  explorer: {
    id: 'explorer',
    name: 'Explorer',
    role: 'Trailblazer & Lookout Scout',
    title: 'The Adventurous Gumdrop',
    bio: 'Wears an acorn cap with a tiny pine needle feather. Explorer patrols the high ridges and boundary trails, scanning the horizon for undiscovered places.',
    species: 'Gumdrop',
    palette: {
      bodyTop: '#a2bb84',
      bodyBottom: '#88a368',
      outline: '#593d3b',
      blush: '#bca487',
      accessoryPrimary: '#734c34', // acorn cap
      accessorySecondary: '#593d3b',
    },
    homeX: 4350,
    roamRange: [3700, 4800],
    baseSpeed: 40,
    signaturePitch: 392.0, // G4
    quotes: [
      "Past the western lookout ridge, you can see the weather arriving an hour early!",
      "My pocket compass spins whenever I pass the old stone well.",
      "A trail is only a suggestion. The ridges are where the view lives.",
      "Keep your map loose in your pocket—the best places don't have names yet.",
      "The wind smells like wild pine needle tea up here on the cliffs.",
    ],
  },

  gardener: {
    id: 'gardener',
    name: 'Gardener',
    role: 'Botanist & Seed Tender',
    title: 'The Nurturing Gumdrop',
    bio: 'Sprouting a tiny green leaf from the top of their dome, Gardener carefully waters the sweet peas, tends the pumpkin patch, and listens to the roots drinking.',
    species: 'Gumdrop',
    palette: {
      bodyTop: '#7ebc84',
      bodyBottom: '#63a36a',
      outline: '#593d3b',
      blush: '#b2baa0',
      accessoryPrimary: '#388e3c', // sprout
      accessorySecondary: '#593d3b',
    },
    homeX: 2950,
    roamRange: [2500, 3450],
    baseSpeed: 26,
    signaturePitch: 349.23, // F4
    quotes: [
      "The sweet pea blossoms opened two hours earlier today!",
      "A garden never rushes. Soil takes its own sweet time, and that's proper.",
      "Singing softly to the chamomile makes the stems grow straight.",
      "Give a seedling clean water and morning light, and it will surprise you.",
      "Look at this earthworm! Hardest working neighbor in the valley.",
    ],
  },

  inventor: {
    id: 'inventor',
    name: 'Inventor',
    role: 'Clockwork & Mechanism Builder',
    title: 'The Crafting Gumdrop',
    bio: 'Sporting polished round brass goggles and carrying a miniature brass wrench, Inventor builds windmills, waterwheels, and self-lighting oil lanterns.',
    species: 'Gumdrop',
    palette: {
      bodyTop: '#d98b68',
      bodyBottom: '#bf6e49',
      outline: '#593d3b',
      blush: '#cba28f',
      accessoryPrimary: '#d8a44b', // brass goggles
      accessorySecondary: '#593d3b',
    },
    homeX: 3750,
    roamRange: [3400, 4200],
    baseSpeed: 30,
    signaturePitch: 293.66, // D4
    quotes: [
      "The windmill cog is meshing with near-zero friction today. Mechanical harmony!",
      "Every broken spring is just kinetic potential waiting for a better angle.",
      "Hand me that mini brass spanner, will you? Just tightening the weather vane.",
      "If we balance the counterweights, the lanterns can light themselves at dusk!",
      "Craft isn't about perfection—it's about making something that lasts.",
    ],
  },

  comedian: {
    id: 'comedian',
    name: 'Comedian',
    role: 'Jester & Morale Master',
    title: 'The Playful Gumdrop',
    bio: 'Wears a dapper polka-dot bowtie and does spontaneous acrobatic squashes and flips to make everyone in the valley giggle.',
    species: 'Gumdrop',
    palette: {
      bodyTop: '#e889a2',
      bodyBottom: '#cf6884',
      outline: '#593d3b',
      blush: '#dfa0b0',
      accessoryPrimary: '#ffffff', // white dots bowtie
      accessorySecondary: '#593d3b',
    },
    homeX: 1350,
    roamRange: [900, 1850],
    baseSpeed: 44,
    signaturePitch: 659.25, // E5
    quotes: [
      "Why did the clover refuse to roll downhill? It was rooted to the spot!",
      "Watch this! A triple squash-and-stretch waddle with a half twist!",
      "Never trust an acorn... they always look a little nuts to me!",
      "What do you call a sleeping Gumdrop? A gum-slumber!",
      "If you aren't laughing at least three times a day, come see me immediately!",
    ],
  },
};
