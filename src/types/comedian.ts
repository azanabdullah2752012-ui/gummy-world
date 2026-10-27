export type WhimsicalPropId = 'bubble-frog' | 'jack-box' | 'kazoo-pipe' | 'sunflower-puppet';

export interface WhimsicalPropDef {
  id: WhimsicalPropId;
  name: string;
  title: string;
  icon: string;
  description: string;
  effect: string;
  soundType: 'bubble' | 'spring' | 'chime' | 'pop';
  offsetX: number;
}

export interface ValleyRiddle {
  id: string;
  setup: string;
  punchline: string;
  topic: string;
  audienceReaction: string;
}

export type AcrobaticMove = 'squash' | 'somersault' | 'bowtie-spin' | 'pratfall' | 'happy-hop';

export interface ComedianState {
  activeProps: Record<WhimsicalPropId, boolean>;
  solvedRiddleIds: string[];
  activeRiddleIndex: number;
  routine: AcrobaticMove[];
  laughsDelivered: number;
  isPerforming: boolean;
}
