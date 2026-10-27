import type { CharacterId } from './index';

export type ActivityId =
  | 'student-study'
  | 'listener-reflection'
  | 'ideas-brainstorm'
  | 'gardener-nurture'
  | 'inventor-contraption'
  | 'explorer-journal'
  | 'comedian-stage';

export interface CharacterActivityConfig {
  characterId: CharacterId;
  activityId: ActivityId;
  title: string;
  subtitle: string;
  actionLabel: string;
  actionIcon: string;
  isImplemented: boolean;
  teaserDescription: string;
}

export type UnderstandingLevel = 'confident' | 'revisit';

export interface StudentSection {
  id: 'concept' | 'mechanism' | 'analogy' | 'connection';
  title: string;
  prompt: string;
  helperText: string;
  studentQuestion: string;
  userInput: string;
  understanding: UnderstandingLevel;
}

export interface StudentSession {
  id: string;
  topic: string;
  currentStep: number; // 0: topic, 1: concept, 2: mechanism, 3: analogy, 4: connection, 5: summary
  sections: {
    concept: StudentSection;
    mechanism: StudentSection;
    analogy: StudentSection;
    connection: StudentSection;
  };
  startedAt: number;
  updatedAt: number;
  isCompleted: boolean;
}

export interface CompletedLessonRecord {
  id: string;
  topic: string;
  completedAt: number;
  confidentCount: number;
  revisitCount: number;
  summary: {
    concept: string;
    mechanism: string;
    analogy: string;
    connection: string;
  };
  revisitItems: string[];
}

// ==========================================
// Listener Gumdrop: The Quiet Corner Types
// ==========================================

export type ThoughtCategory = 'influence' | 'waiting' | 'uncontrollable';

export interface ThoughtCard {
  id: string;
  text: string;
  category: ThoughtCategory;
  createdAt: number;
}

export type EndingType = 'small-step' | 'think-later' | 'leave-here';

export type ListenerStage = 'let-it-out' | 'understand' | 'sort' | 'clarity';

export interface ListenerSession {
  id: string;
  stage: ListenerStage;
  initialThought: string;
  understandingResponses: {
    bothersMost: string;
    knownVsUnsure: string;
    wishedUnderstood: string;
    interpretations: string;
  };
  thoughtCards: ThoughtCard[];
  endingType: EndingType | null;
  chosenStep: string;
  startedAt: number;
  updatedAt: number;
  isCompleted: boolean;
}

export interface SavedReflectionRecord {
  id: string;
  savedAt: number;
  snippet: string;
  influenceCount: number;
  waitingCount: number;
  uncontrollableCount: number;
  endingType: EndingType | null;
  chosenStep?: string;
  cards: ThoughtCard[];
}

// ==========================================
// Ideas Gumdrop: The Creative Studio Types
// ==========================================

export type IdeaFilterView = 'all' | 'connected' | 'starred' | 'blueprints';

export interface IdeaCard {
  id: string;
  title: string;
  description: string;
  sourceCardIds?: [string, string];
  sourceLabels?: [string, string];
  splitFromCardId?: string;
  splitFromLabel?: string;
  connectionNote?: string;
  isFavorite: boolean;
  createdAt: number;
  updatedAt?: number;
}

export interface ThoughtConnectionRecord {
  id: string;
  cardAId: string;
  cardBId: string;
  cardATitle: string;
  cardBTitle: string;
  relationshipNote: string;
  commonality?: string;
  conflict?: string;
  newInsight?: string;
  createdAt: number;
}

export interface IdeaBlueprint {
  id: string;
  sourceCardId: string;
  conceptTitle: string;
  coreConcept: string;
  targetAudienceOrPurpose: string;
  differentiatingFeature: string;
  smallestExperiment: string;
  unansweredQuestions: string;
  createdAt: number;
  updatedAt?: number;
}

export interface IdeaGardenSession {
  id: string;
  workspaceFocus?: string;
  cards: IdeaCard[];
  connections?: ThoughtConnectionRecord[];
  blueprints?: IdeaBlueprint[];
  startedAt: number;
  updatedAt: number;
}

export interface SavedBlueprintRecord {
  id: string;
  title: string;
  savedAt: number;
  blueprint: IdeaBlueprint;
}


