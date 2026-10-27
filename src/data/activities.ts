import type { CharacterId } from '../types';
import type { CharacterActivityConfig } from '../types/activity';

export const CHARACTER_ACTIVITIES: Partial<Record<CharacterId, CharacterActivityConfig>> = {
  student: {
    characterId: 'student',
    activityId: 'student-study',
    title: "Student's Study Notebook",
    subtitle: 'Teach Student a concept in your own words to master it',
    actionLabel: 'Teach Student',
    actionIcon: '📖',
    isImplemented: true,
    teaserDescription:
      'Student listens attentively as you break down an idea, ask clarifying questions, and identify what to review.',
  },
  listener: {
    characterId: 'listener',
    activityId: 'listener-reflection',
    title: "Listener's Quiet Corner",
    subtitle: "A peaceful place to put your thoughts into words and find clarity",
    actionLabel: 'Sit with Listener',
    actionIcon: '🌿',
    isImplemented: true,
    teaserDescription:
      "A supportive reflection space by Dragonfly Pond to organize what's on your mind without pressure or judgment.",
  },
  ideas: {
    characterId: 'ideas',
    activityId: 'ideas-brainstorm',
    title: "Ideas' Idea Garden",
    subtitle: 'An open space to author, connect, and clarify your thoughts',
    actionLabel: 'Enter Idea Garden',
    actionIcon: '🌱',
    isImplemented: true,
    teaserDescription:
      'A blank creative canvas to explore your thoughts freely, connect ideas, examine contradictions, and build your own conclusions.',
  },
  explorer: {
    characterId: 'explorer',
    activityId: 'explorer-journal',
    title: "Explorer's Field Journal",
    subtitle: 'A quiet log of valley secrets, natural landmarks, and personal observations',
    actionLabel: 'Open Field Journal',
    actionIcon: '🔭',
    isImplemented: false,
    teaserDescription:
      'Explore the countryside closely to uncover hidden details, stone carvings, water echoes, and weather shifts, recording what you find in your journal.',
  },
  gardener: {
    characterId: 'gardener',
    activityId: 'gardener-nurture',
    title: "Gardener's Living Garden",
    subtitle: 'Plant, nurture, and grow blossoms and perennials in the valley',
    actionLabel: 'Tend Garden',
    actionIcon: '🌱',
    isImplemented: true,
    teaserDescription:
      'Plant seeds, water terraced beds, and watch sunflowers, bellflowers, strawberries, and ferns flourish across the hillside.',
  },
  inventor: {
    characterId: 'inventor',
    activityId: 'inventor-contraption',
    title: "Inventor's Clockwork Rig",
    subtitle: 'Tune gear transmissions, governors, and pulleys along the windmill hillside',
    actionLabel: 'Tinker with Gears',
    actionIcon: '⚙️',
    isImplemented: true,
    teaserDescription:
      'A tactile mechanical workshop. Swap gear materials, adjust speed ratios, oil escapements, and govern windmill power across the valley.',
  },
  comedian: {
    characterId: 'comedian',
    activityId: 'comedian-stage',
    title: "Comedian's Footbridge Stage",
    subtitle: 'Perform whimsical routines, solve valley riddles, and play with brook stage props',
    actionLabel: 'Share a Laugh',
    actionIcon: '🎭',
    isImplemented: true,
    teaserDescription:
      'An interactive open-air stage by the singing brook. Unpack whimsical valley riddles, orchestrate acrobatic slapstick routines, and trigger playful stage props.',
  },
};
