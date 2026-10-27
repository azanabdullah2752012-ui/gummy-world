import type { WhimsicalPropDef, ValleyRiddle, ComedianState } from '../types/comedian';

export const WHIMSICAL_PROPS: WhimsicalPropDef[] = [
  {
    id: 'bubble-frog',
    name: 'Brass Bubble Frog',
    title: 'Iridescent Brook Bubbler',
    icon: '🐸',
    description: 'A cheerful mechanical clockwork frog that periodically blows shimmering soap bubbles across the brook.',
    effect: 'Drifting iridescent bubbles that pop softly on contact with flowers.',
    soundType: 'bubble',
    offsetX: 1370,
  },
  {
    id: 'jack-box',
    name: 'Acorn Spring Jack',
    title: 'Pop-up Forest Surprise',
    icon: '🌰',
    description: 'A hand-carved cedar box with an oversized bouncy felt acorn on a copper coil spring.',
    effect: 'Springs skyward with a playful boing when tapped.',
    soundType: 'spring',
    offsetX: 1410,
  },
  {
    id: 'kazoo-pipe',
    name: 'Brook Kazoo Chime',
    title: 'Acoustic Reed Whistle',
    icon: '🎺',
    description: 'Tuned willow pipe powered by the passing brook water, emitting cheerful warbles.',
    effect: 'Emits buoyant harmonic chimes across the pond ripples.',
    soundType: 'chime',
    offsetX: 1450,
  },
  {
    id: 'sunflower-puppet',
    name: 'Bouncing Flower Marionette',
    title: 'Googly-Eyed Sunflower',
    icon: '🌻',
    description: 'A cloth sunflower with googly eyes on a flexible bamboo rod that dances when touched.',
    effect: 'Jiggles and wiggles merrily in the afternoon breeze.',
    soundType: 'pop',
    offsetX: 1490,
  },
];

export const VALLEY_RIDDLES: ValleyRiddle[] = [
  {
    id: 'riddle-1',
    setup: 'Why did the clover refuse to roll downhill?',
    punchline: 'Because it was rooted to the spot!',
    topic: 'Meadow Plants',
    audienceReaction: '🌿 Student chuckles and writes it down in his notebook margin.',
  },
  {
    id: 'riddle-2',
    setup: 'What is a cloud’s favorite musical instrument?',
    punchline: 'The thunder drum! (Though it secretly loves the rain harp too.)',
    topic: 'Weather & Sky',
    audienceReaction: '☁️ Gummy looks up and giggles at the fluffy cumulus clouds.',
  },
  {
    id: 'riddle-3',
    setup: 'How do dragonflies send quick messages across the valley?',
    punchline: 'By air-mail with extra flutter-postage!',
    topic: 'Dragonfly Pond',
    audienceReaction: '💧 Listener smiles gently as three blue dragonflies loop around.',
  },
  {
    id: 'riddle-4',
    setup: 'What do you call an acorn that took a wrong turn off the cliff?',
    punchline: 'A little nuts!',
    topic: 'Forest Ridges',
    audienceReaction: '🌰 Explorer tips his acorn cap with an adventurous grin.',
  },
  {
    id: 'riddle-5',
    setup: 'Why are Inventor’s cogs always so calm under pressure?',
    punchline: 'Because they know how to mesh with whatever comes their way!',
    topic: 'Clockwork Ridge',
    audienceReaction: '⚙️ Inventor taps his brass wrench against his goggles approvingly.',
  },
];

export const DEFAULT_COMEDIAN_STATE: ComedianState = {
  activeProps: {
    'bubble-frog': true,
    'jack-box': true,
    'kazoo-pipe': true,
    'sunflower-puppet': true,
  },
  solvedRiddleIds: [],
  activeRiddleIndex: 0,
  routine: ['squash', 'somersault', 'bowtie-spin'],
  laughsDelivered: 12,
  isPerforming: false,
};
