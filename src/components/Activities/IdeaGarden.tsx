import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type {
  IdeaGardenSession,
  IdeaCard,
  IdeaBlueprint,
  IdeaFilterView,
  ThoughtConnectionRecord,
  SavedBlueprintRecord,
} from '../../types/activity';
import { soundEngine } from '../../audio/soundEngine';

const STORAGE_SESSION_KEY = 'gummy_ideas_session';
const STORAGE_BLUEPRINTS_KEY = 'gummy_ideas_blueprints';

// Safe local storage helpers that handle storage disabled or full gracefully
function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

function safeRemoveItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {}
}

let nextIdCounter = 0;
function createUniqueId(prefix = 'thought'): string {
  nextIdCounter += 1;
  return `${prefix}-${Date.now()}-${nextIdCounter}`;
}

// Test data used strictly when ?testData=true query parameter is present for verification
const TEST_CARDS: IdeaCard[] = [
  {
    id: 'test-card-1',
    title: 'Tool Library Hours Conflict',
    description:
      'Neighbors want to borrow tools on weekday evenings after work, but volunteer staff are only available on Saturday mornings.',
    isFavorite: true,
    createdAt: 1000,
  },
  {
    id: 'test-card-2',
    title: 'Coded Lockers for Contactless Exchange',
    description:
      'Could we mount weather-sealed lockers with combination push-buttons outside the shed so borrowers can pick up reserved gear anytime?',
    isFavorite: false,
    createdAt: 2000,
  },
  {
    id: 'test-card-3',
    title: 'Noise & Dust Workshop Boundaries',
    description:
      'Table saws and belt sanders create heavy noise and airborne dust. Needs strict separation from communal garden walkways.',
    isFavorite: true,
    createdAt: 3000,
  },
  {
    id: 'test-card-4',
    title: 'Twilight Quiet-Carving & Key Exchange',
    description:
      'Split activities: weekday evenings are reserved exclusively for silent hand-carving and contactless pickup lockers, keeping power machinery strictly to Saturdays.',
    sourceCardIds: ['test-card-1', 'test-card-2'],
    sourceLabels: ['Tool Library Hours Conflict', 'Coded Lockers for Contactless Exchange'],
    connectionNote:
      'Resolved the staffing barrier by combining contactless pick-up with quiet hand tool evening sessions.',
    isFavorite: true,
    createdAt: 4000,
  },
  {
    id: 'test-card-5',
    title: 'Sawdust Extraction & HEPA Filtration',
    description:
      'How to capture fine particulate matter at the tool source before it reaches neighboring air.',
    splitFromCardId: 'test-card-3',
    splitFromLabel: 'Noise & Dust Workshop Boundaries',
    isFavorite: false,
    createdAt: 5000,
  },
];

interface IdeaGardenProps {
  onClose: () => void;
}

export const IdeaGarden: React.FC<IdeaGardenProps> = ({ onClose }) => {
  // 1. Core Session State — Genuinely blank canvas by default
  const [session, setSession] = useState<IdeaGardenSession>(() => {
    let base: IdeaGardenSession = {
      id: `ideas-${Date.now()}`,
      workspaceFocus: '',
      cards: [],
      connections: [],
      blueprints: [],
      startedAt: Date.now(),
      updatedAt: Date.now(),
    };

    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      if (p.get('testData') === 'true') {
        return {
          ...base,
          workspaceFocus: 'Community Woodworking & Tool Sharing Cooperative',
          cards: TEST_CARDS,
        };
      }

      const saved = safeGetItem(STORAGE_SESSION_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed === 'object') {
            base = {
              ...base,
              ...parsed,
              cards: Array.isArray(parsed.cards) ? parsed.cards : [],
              connections: Array.isArray(parsed.connections) ? parsed.connections : [],
              blueprints: Array.isArray(parsed.blueprints) ? parsed.blueprints : [],
            };
          }
        } catch {}
      }
    }

    return base;
  });

  // 2. Saved Blueprints Archive
  const [savedBlueprints, setSavedBlueprints] = useState<SavedBlueprintRecord[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = safeGetItem(STORAGE_BLUEPRINTS_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        } catch {}
      }
    }
    return [];
  });

  // Sync session changes to localStorage (skip when running testData to avoid overwriting user session)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      if (p.get('testData') === 'true') return;
    }
    safeSetItem(STORAGE_SESSION_KEY, JSON.stringify(session));
  }, [session]);

  // Sync blueprints changes to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      if (p.get('testData') === 'true') return;
    }
    safeSetItem(STORAGE_BLUEPRINTS_KEY, JSON.stringify(savedBlueprints));
  }, [savedBlueprints]);

  // 3. UI Navigation & Filter State
  const [filterView, setFilterView] = useState<IdeaFilterView>('all');
  const [quickThoughtInput, setQuickThoughtInput] = useState('');
  const [workspaceFocusInput, setWorkspaceFocusInput] = useState(
    () => session.workspaceFocus || ''
  );
  const [isEditingFocus, setIsEditingFocus] = useState(false);

  // 4. Modals and Workspaces State
  // Selected cards for 2-card connection (stores up to 2 card IDs)
  const [selectedForConnect, setSelectedForConnect] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      if (p.get('modal') === 'connect') return ['test-card-1', 'test-card-2'];
    }
    return [];
  });
  const [showConnectModal, setShowConnectModal] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      if (p.get('modal') === 'connect') return true;
    }
    return false;
  });
  const [connectionNotes, setConnectionNotes] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      if (p.get('modal') === 'connect')
        return 'Both ideas address access barriers: by putting key exchange into lockers, evening pickup becomes feasible without burning out morning volunteers.';
    }
    return '';
  });
  const [connectionTitle, setConnectionTitle] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      if (p.get('modal') === 'connect') return 'Contactless Evening Tool Locker';
    }
    return '';
  });

  // Card being split
  const [splittingCard, setSplittingCard] = useState<IdeaCard | null>(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      if (p.get('modal') === 'split') return TEST_CARDS[2];
    }
    return null;
  });
  const [splitParts, setSplitParts] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      if (p.get('modal') === 'split')
        return [
          'Sound-dampening acoustic baffles and acoustic curtain around the miter station',
          'Cyclonic dust extraction bin with HEPA micro-filter',
        ];
    }
    return ['', ''];
  });
  const [keepOriginalOnSplit, setKeepOriginalOnSplit] = useState(true);

  // Card being examined with Ideas Gumdrop
  const [examiningCard, setExaminingCard] = useState<IdeaCard | null>(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      if (p.get('modal') === 'inquiry') return TEST_CARDS[1];
    }
    return null;
  });
  const [selectedInquiryIndex, setSelectedInquiryIndex] = useState(0);
  const [inquiryReflection, setInquiryReflection] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      if (p.get('modal') === 'inquiry')
        return 'I am assuming people will return tools on time without a person checking them back in. If that fails, we might need a deposit or photo check-in.';
    }
    return '';
  });

  // Card being edited inline / modal
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');

  // Developing a blueprint
  const [activeBlueprintCard, setActiveBlueprintCard] = useState<IdeaCard | null>(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      if (p.get('modal') === 'blueprint') return TEST_CARDS[3];
    }
    return null;
  });
  const [blueprintDraft, setBlueprintDraft] = useState<IdeaBlueprint | null>(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      if (p.get('modal') === 'blueprint') {
        return {
          id: 'test-blueprint-1',
          sourceCardId: 'test-card-4',
          conceptTitle: 'Twilight Quiet-Carving & Key Exchange Cooperative',
          coreConcept:
            'A neighborhood workshop model separating noisy fabrication into weekend daylight, leaving weekday evenings open for quiet handcrafts and contactless tool lockers.',
          targetAudienceOrPurpose:
            'For apartment dwellers and hobbyists who want to make things without disturbing neighbors or conflicting with 9-to-5 schedules.',
          differentiatingFeature:
            'Embraces quiet time as a community feature rather than an obstacle—silent tea and hand-whittling instead of roaring saws.',
          smallestExperiment:
            'Set up 1 push-button locker box on Thursday evening with 3 hand-planes and a sign-out clipboard.',
          unansweredQuestions:
            'How do we handle tool sharpening when tools are borrowed frequently? What happens if a combination code gets shared outside the group?',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
      }
    }
    return null;
  });
  const [copiedBlueprint, setCopiedBlueprint] = useState(false);

  // Blueprints ledger drawer
  const [showBlueprintsLedger, setShowBlueprintsLedger] = useState(false);

  // Clear confirmation modal
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Socratic Inquiry Questions (Neutral, thought-provoking, user-answered)
  const INQUIRY_ANGLES = useMemo(
    () => [
      {
        id: 'assumptions',
        title: 'Examine Assumptions',
        icon: '🔍',
        prompt:
          'What are you assuming must be true here? What happens if that assumption is actually false or inverted?',
      },
      {
        id: 'contradictions',
        title: 'Explore Contradictions',
        icon: '⚡',
        prompt:
          'What is the strongest objection, reality, or conflicting fact that pushes back against this thought?',
      },
      {
        id: 'core',
        title: 'Clarify the Essence',
        icon: '🎯',
        prompt:
          'If you had to explain the raw, fundamental point of this in one plain sentence to a friend, what would you say?',
      },
      {
        id: 'unknowns',
        title: 'Identify What’s Missing',
        icon: '❓',
        prompt:
          'What part of this do you still feel you do not understand or have not worked out yet?',
      },
      {
        id: 'smallest-scale',
        title: 'Smallest Test / Scale',
        icon: '🌱',
        prompt:
          'What is the absolute simplest, lowest-friction version of this you could try or sketch in a single afternoon?',
      },
      {
        id: 'perspective',
        title: 'Alternative Perspective',
        icon: '👁️',
        prompt:
          'How would someone with completely different priorities or who wants the opposite outcome view this thought?',
      },
    ],
    []
  );

  // Handlers: Quick Add Thought
  const handleAddThought = useCallback(
    (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      const text = quickThoughtInput.trim();
      if (!text) return;

      soundEngine.playGumdropPop(520);
      const lines = text.split('\n');
      const title = lines[0].length > 40 ? `${lines[0].slice(0, 36)}...` : lines[0];
      const desc = lines.length > 1 ? lines.slice(1).join('\n').trim() : text;

      const newCard: IdeaCard = {
        id: createUniqueId('thought'),
        title,
        description: desc,
        isFavorite: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      setSession(prev => ({
        ...prev,
        cards: [newCard, ...prev.cards],
        updatedAt: Date.now(),
      }));
      setQuickThoughtInput('');
    },
    [quickThoughtInput]
  );

  // Handlers: Create Blank Card
  const handleCreateBlankCard = useCallback(() => {
    soundEngine.playGumdropPop(480);
    const newCard: IdeaCard = {
      id: createUniqueId('thought'),
      title: 'Untitled Thought',
      description: '',
      isFavorite: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setSession(prev => ({
      ...prev,
      cards: [newCard, ...prev.cards],
      updatedAt: Date.now(),
    }));

    // Immediately open in edit mode
    setEditingCardId(newCard.id);
    setEditTitle('');
    setEditDescription('');
  }, []);

  // Handlers: Edit Card
  const handleStartEdit = useCallback((card: IdeaCard) => {
    setEditingCardId(card.id);
    setEditTitle(card.title);
    setEditDescription(card.description);
  }, []);

  const handleSaveEdit = useCallback(
    (cardId: string) => {
      soundEngine.playGumdropPop(560);
      const trimmedTitle = editTitle.trim();
      const trimmedDesc = editDescription.trim();

      setSession(prev => ({
        ...prev,
        cards: prev.cards.map(c => {
          if (c.id === cardId) {
            return {
              ...c,
              title: trimmedTitle || (trimmedDesc ? trimmedDesc.slice(0, 32) : 'Untitled Thought'),
              description: trimmedDesc,
              updatedAt: Date.now(),
            };
          }
          return c;
        }),
        updatedAt: Date.now(),
      }));

      setEditingCardId(null);
    },
    [editTitle, editDescription]
  );

  // Handlers: Delete Card
  const handleDeleteCard = useCallback((cardId: string) => {
    soundEngine.playGumdropPop(380);
    setSelectedForConnect(prev => prev.filter(id => id !== cardId));
    setSession(prev => ({
      ...prev,
      cards: prev.cards.filter(c => c.id !== cardId),
      updatedAt: Date.now(),
    }));
  }, []);

  // Handlers: Toggle Favorite
  const handleToggleFavorite = useCallback((cardId: string) => {
    soundEngine.playGumdropPop(620);
    setSession(prev => ({
      ...prev,
      cards: prev.cards.map(c =>
        c.id === cardId ? { ...c, isFavorite: !c.isFavorite, updatedAt: Date.now() } : c
      ),
      updatedAt: Date.now(),
    }));
  }, []);

  // Handlers: 2-Card Connection Selection
  const handleToggleSelectForConnect = useCallback((cardId: string) => {
    soundEngine.playGumdropPop(500);
    setSelectedForConnect(prev => {
      if (prev.includes(cardId)) {
        return prev.filter(id => id !== cardId);
      }
      if (prev.length >= 2) {
        // Keep second and replace with new
        return [prev[1], cardId];
      }
      const next = [...prev, cardId];
      if (next.length === 2) {
        // Open connection modal
        setShowConnectModal(true);
        setConnectionNotes('');
        setConnectionTitle('');
      }
      return next;
    });
  }, []);

  // Handlers: Save User-Reasoned Connection
  const handleSaveConnection = useCallback(() => {
    if (selectedForConnect.length !== 2) return;
    const cardA = session.cards.find(c => c.id === selectedForConnect[0]);
    const cardB = session.cards.find(c => c.id === selectedForConnect[1]);
    if (!cardA || !cardB) return;

    soundEngine.playFlowerChime();
    const title = connectionTitle.trim() || `Connection: ${cardA.title} & ${cardB.title}`;
    const notes = connectionNotes.trim();

    // 1. Create a new card linked to both parents
    const newConnectedCard: IdeaCard = {
      id: createUniqueId('connected'),
      title,
      description: notes || `Connected thoughts:\n• ${cardA.title}\n• ${cardB.title}`,
      sourceCardIds: [cardA.id, cardB.id],
      sourceLabels: [cardA.title, cardB.title],
      connectionNote: notes,
      isFavorite: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // 2. Record the connection record
    const record: ThoughtConnectionRecord = {
      id: createUniqueId('conn-record'),
      cardAId: cardA.id,
      cardBId: cardB.id,
      cardATitle: cardA.title,
      cardBTitle: cardB.title,
      relationshipNote: notes,
      createdAt: Date.now(),
    };

    setSession(prev => ({
      ...prev,
      cards: [newConnectedCard, ...prev.cards],
      connections: [record, ...(prev.connections || [])],
      updatedAt: Date.now(),
    }));

    setSelectedForConnect([]);
    setShowConnectModal(false);
  }, [selectedForConnect, session.cards, connectionTitle, connectionNotes]);

  // Handlers: Split Thought
  const handleOpenSplitModal = useCallback((card: IdeaCard) => {
    setSplittingCard(card);
    setSplitParts(['', '']);
    setKeepOriginalOnSplit(true);
  }, []);

  const handleSaveSplit = useCallback(() => {
    if (!splittingCard) return;
    const validParts = splitParts.map(p => p.trim()).filter(Boolean);
    if (validParts.length === 0) return;

    soundEngine.playFlowerChime();
    const newCards: IdeaCard[] = validParts.map((partText, idx) => {
      const lines = partText.split('\n');
      const title = lines[0].length > 40 ? `${lines[0].slice(0, 36)}...` : lines[0];
      return {
        id: createUniqueId(`split-${idx}`),
        title,
        description: partText,
        splitFromCardId: splittingCard.id,
        splitFromLabel: splittingCard.title,
        isFavorite: false,
        createdAt: Date.now() + idx,
        updatedAt: Date.now(),
      };
    });

    setSession(prev => {
      let updatedCards = prev.cards;
      if (!keepOriginalOnSplit) {
        updatedCards = updatedCards.filter(c => c.id !== splittingCard.id);
      }
      return {
        ...prev,
        cards: [...newCards, ...updatedCards],
        updatedAt: Date.now(),
      };
    });

    setSplittingCard(null);
  }, [splittingCard, splitParts, keepOriginalOnSplit]);

  // Handlers: Socratic Inquiry with Ideas Gumdrop
  const handleOpenInquiry = useCallback((card: IdeaCard) => {
    setExaminingCard(card);
    setSelectedInquiryIndex(0);
    setInquiryReflection('');
  }, []);

  const handleSaveInquiryAsNewThought = useCallback(() => {
    if (!examiningCard) return;
    const text = inquiryReflection.trim();
    if (!text) return;

    soundEngine.playFlowerChime();
    const angle = INQUIRY_ANGLES[selectedInquiryIndex];
    const newCard: IdeaCard = {
      id: createUniqueId('reflection'),
      title: `${angle.title}: ${examiningCard.title.slice(0, 24)}`,
      description: text,
      splitFromCardId: examiningCard.id,
      splitFromLabel: examiningCard.title,
      connectionNote: `Explored from inquiry angle: "${angle.title}"`,
      isFavorite: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setSession(prev => ({
      ...prev,
      cards: [newCard, ...prev.cards],
      updatedAt: Date.now(),
    }));

    setExaminingCard(null);
  }, [examiningCard, inquiryReflection, selectedInquiryIndex, INQUIRY_ANGLES]);

  const handleAppendInquiryToOriginal = useCallback(() => {
    if (!examiningCard) return;
    const text = inquiryReflection.trim();
    if (!text) return;

    soundEngine.playGumdropPop(540);
    const angle = INQUIRY_ANGLES[selectedInquiryIndex];
    const noteToAdd = `\n\n[${angle.title}]: ${text}`;

    setSession(prev => ({
      ...prev,
      cards: prev.cards.map(c =>
        c.id === examiningCard.id
          ? {
              ...c,
              description: `${c.description}${noteToAdd}`,
              updatedAt: Date.now(),
            }
          : c
      ),
      updatedAt: Date.now(),
    }));

    setExaminingCard(null);
  }, [examiningCard, inquiryReflection, selectedInquiryIndex, INQUIRY_ANGLES]);

  // Handlers: Develop Concept Blueprint (User Authored)
  const handleStartDevelopBlueprint = useCallback(
    (card: IdeaCard) => {
      soundEngine.playGumdropPop(580);
      setActiveBlueprintCard(card);

      // Check if blueprint already exists for this card
      const existing = session.blueprints?.find(b => b.sourceCardId === card.id);
      if (existing) {
        setBlueprintDraft(existing);
      } else {
        setBlueprintDraft({
          id: createUniqueId('blueprint'),
          sourceCardId: card.id,
          conceptTitle: card.title,
          coreConcept: card.description,
          targetAudienceOrPurpose: '',
          differentiatingFeature: '',
          smallestExperiment: '',
          unansweredQuestions: '',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }
      setCopiedBlueprint(false);
    },
    [session.blueprints]
  );

  const handleSaveBlueprint = useCallback(() => {
    if (!blueprintDraft) return;
    soundEngine.playFlowerChime();

    const updatedBlueprint = {
      ...blueprintDraft,
      updatedAt: Date.now(),
    };

    // Save into active session
    setSession(prev => {
      const existingIdx = prev.blueprints?.findIndex(b => b.id === updatedBlueprint.id) ?? -1;
      let newBlueprints = prev.blueprints ? [...prev.blueprints] : [];
      if (existingIdx >= 0) {
        newBlueprints[existingIdx] = updatedBlueprint;
      } else {
        newBlueprints.push(updatedBlueprint);
      }
      return {
        ...prev,
        blueprints: newBlueprints,
        updatedAt: Date.now(),
      };
    });

    // Save into persistent archive ledger
    const record: SavedBlueprintRecord = {
      id: updatedBlueprint.id,
      title: updatedBlueprint.conceptTitle || 'Untitled Blueprint',
      savedAt: Date.now(),
      blueprint: updatedBlueprint,
    };

    setSavedBlueprints(prev => {
      const filtered = prev.filter(p => p.id !== record.id);
      return [record, ...filtered];
    });

    setActiveBlueprintCard(null);
    setBlueprintDraft(null);
  }, [blueprintDraft]);

  const handleCopyMarkdownBlueprint = useCallback(() => {
    if (!blueprintDraft) return;
    const md = [
      `# ${blueprintDraft.conceptTitle || 'Idea Blueprint'}`,
      '',
      `## 1. Core Concept`,
      blueprintDraft.coreConcept || '*(Not yet written)*',
      '',
      `## 2. Who or What This Is For`,
      blueprintDraft.targetAudienceOrPurpose || '*(Not yet written)*',
      '',
      `## 3. What Makes This Distinct or Interesting`,
      blueprintDraft.differentiatingFeature || '*(Not yet written)*',
      '',
      `## 4. Smallest 1-Day Experiment / Test`,
      blueprintDraft.smallestExperiment || '*(Not yet written)*',
      '',
      `## 5. Unresolved Doubts & Open Questions`,
      blueprintDraft.unansweredQuestions || '*(Not yet written)*',
      '',
      `---`,
      `*Authored in Gummy World Idea Garden on ${new Date().toLocaleDateString()}*`,
    ].join('\n');

    navigator.clipboard?.writeText(md).then(() => {
      soundEngine.playFlowerChime();
      setCopiedBlueprint(true);
      setTimeout(() => setCopiedBlueprint(false), 2400);
    });
  }, [blueprintDraft]);

  // Handlers: Clear Canvas
  const handleConfirmClearCanvas = useCallback(() => {
    soundEngine.playGumdropPop(340);
    setSession({
      id: createUniqueId('ideas'),
      workspaceFocus: '',
      cards: [],
      connections: [],
      blueprints: [],
      startedAt: Date.now(),
      updatedAt: Date.now(),
    });
    safeRemoveItem(STORAGE_SESSION_KEY);
    setShowClearConfirm(false);
  }, []);

  // Filtered Cards List
  const displayedCards = useMemo(() => {
    switch (filterView) {
      case 'connected':
        return session.cards.filter(c => Boolean(c.sourceCardIds?.length));
      case 'starred':
        return session.cards.filter(c => c.isFavorite);
      case 'blueprints': {
        const blueprintCardIds = new Set((session.blueprints || []).map(b => b.sourceCardId));
        return session.cards.filter(c => blueprintCardIds.has(c.id));
      }
      case 'all':
      default:
        return session.cards;
    }
  }, [filterView, session.cards, session.blueprints]);

  // Selected Cards for Connect Lookup
  const cardA = useMemo(
    () => session.cards.find(c => c.id === selectedForConnect[0]),
    [session.cards, selectedForConnect]
  );
  const cardB = useMemo(
    () => session.cards.find(c => c.id === selectedForConnect[1]),
    [session.cards, selectedForConnect]
  );

  return (
    <div
      className="relative w-full max-w-4xl max-h-[92vh] bg-[#fffdfa] border-2 border-[#382b26] rounded-3xl shadow-2xl flex flex-col text-[#2b201b] overflow-hidden select-none"
      onClick={e => e.stopPropagation()}
      onPointerDown={e => e.stopPropagation()}
    >
      {/* 1. Header: Ideas Gumdrop Identity & Top Actions */}
      <div className="p-4 sm:p-5 border-b-2 border-[#382b26]/15 bg-[#fffbeb] flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#fde047] border-2 border-[#382b26] flex items-center justify-center text-xl shadow-xs">
            🌱
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-[#382b26] leading-tight">
                Ideas&apos; Idea Garden
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-[#fef08a] border border-[#eab308] text-[#713f12] text-[10px] font-bold uppercase tracking-wider">
                Thinking Canvas
              </span>
            </div>
            <p className="text-xs text-[#78645b] font-medium">
              An open space to author, connect, and examine your own thoughts.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Blueprints Ledger Button */}
          <button
            type="button"
            onClick={() => setShowBlueprintsLedger(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-[#fefce8] border border-[#382b26]/20 text-xs font-bold text-[#382b26] transition-colors shadow-xs"
            title="View saved blueprints"
          >
            <span>📜</span>
            <span className="hidden sm:inline">Blueprints</span>
            {savedBlueprints.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-[#382b26] text-white text-[10px]">
                {savedBlueprints.length}
              </span>
            )}
          </button>

          {/* Clear Canvas Button */}
          {session.cards.length > 0 && (
            <button
              type="button"
              onClick={() => setShowClearConfirm(true)}
              className="p-1.5 rounded-xl text-[#78645b] hover:text-[#991b1b] hover:bg-[#fee2e2] transition-colors"
              title="Clear canvas"
            >
              🗑️
            </button>
          )}

          {/* Close Modal Button */}
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#382b26]/5 hover:bg-[#382b26]/15 text-[#382b26] flex items-center justify-center font-bold text-sm transition-colors"
            title="Return to Valley (Escape)"
          >
            ✕
          </button>
        </div>
      </div>

      {/* 2. Sub-Header: Optional Focus Question & View Tabs */}
      <div className="px-4 sm:px-6 py-2.5 bg-[#fefce8] border-b border-[#382b26]/10 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
        {/* Workspace Focus / Question */}
        <div className="flex-1 min-w-[240px]">
          {isEditingFocus ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={workspaceFocusInput}
                onChange={e => setWorkspaceFocusInput(e.target.value)}
                placeholder="What question or theme are you thinking about right now?"
                className="flex-1 px-2.5 py-1 text-xs rounded-lg border border-[#382b26]/30 bg-white text-[#2b201b] focus:outline-none focus:ring-2 focus:ring-[#ca8a04]"
                autoFocus
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    setIsEditingFocus(false);
                    setSession(prev => ({ ...prev, workspaceFocus: workspaceFocusInput }));
                  } else if (e.key === 'Escape') {
                    setIsEditingFocus(false);
                  }
                }}
              />
              <button
                type="button"
                onClick={() => {
                  setIsEditingFocus(false);
                  setSession(prev => ({ ...prev, workspaceFocus: workspaceFocusInput }));
                }}
                className="px-2 py-1 rounded-md bg-[#382b26] text-white text-[11px] font-bold"
              >
                Set
              </button>
            </div>
          ) : (
            <div
              onClick={() => setIsEditingFocus(true)}
              className="cursor-pointer text-[#713f12] hover:text-[#382b26] font-medium flex items-center gap-1.5 group"
              title="Click to write what you are exploring"
            >
              <span className="text-sm">🎯</span>
              <span className="truncate">
                {session.workspaceFocus ? (
                  <span className="font-semibold">&ldquo;{session.workspaceFocus}&rdquo;</span>
                ) : (
                  <span className="italic text-[#78645b] group-hover:underline">
                    + Add a guiding focus or open question (optional)
                  </span>
                )}
              </span>
              <span className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">
                ✏️
              </span>
            </div>
          )}
        </div>

        {/* View Filter Segmented Tabs */}
        <div className="flex items-center gap-1 bg-white/80 p-0.5 rounded-xl border border-[#382b26]/15">
          <button
            type="button"
            onClick={() => setFilterView('all')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
              filterView === 'all'
                ? 'bg-[#382b26] text-white'
                : 'text-[#78645b] hover:text-[#382b26]'
            }`}
          >
            All ({session.cards.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterView('connected')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
              filterView === 'connected'
                ? 'bg-[#382b26] text-white'
                : 'text-[#78645b] hover:text-[#382b26]'
            }`}
          >
            Connected ({session.cards.filter(c => Boolean(c.sourceCardIds?.length)).length})
          </button>
          <button
            type="button"
            onClick={() => setFilterView('starred')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
              filterView === 'starred'
                ? 'bg-[#382b26] text-white'
                : 'text-[#78645b] hover:text-[#382b26]'
            }`}
          >
            ★ ({session.cards.filter(c => c.isFavorite).length})
          </button>
          <button
            type="button"
            onClick={() => setFilterView('blueprints')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
              filterView === 'blueprints'
                ? 'bg-[#382b26] text-white'
                : 'text-[#78645b] hover:text-[#382b26]'
            }`}
          >
            Blueprints ({session.blueprints?.length || 0})
          </button>
        </div>
      </div>

      {/* 3. Action / Quick-Add Bar */}
      <div className="p-3 sm:px-6 bg-white border-b border-[#382b26]/10 flex flex-wrap items-center gap-2 shrink-0">
        <form onSubmit={handleAddThought} className="flex-1 flex items-center gap-2 min-w-[260px]">
          <input
            type="text"
            value={quickThoughtInput}
            onChange={e => setQuickThoughtInput(e.target.value)}
            placeholder="Write a thought, question, contradiction, or observation..."
            className="flex-1 px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#382b26]/20 bg-[#fffdfa] text-[#2b201b] placeholder:text-[#a89890] focus:outline-none focus:ring-2 focus:ring-[#ca8a04]"
          />
          <button
            type="submit"
            disabled={!quickThoughtInput.trim()}
            className="px-3.5 py-2 rounded-xl bg-[#382b26] hover:bg-[#523e37] disabled:opacity-40 text-white font-bold text-xs transition-colors shrink-0 shadow-xs"
          >
            + Add Thought
          </button>
        </form>

        <button
          type="button"
          onClick={handleCreateBlankCard}
          className="px-3 py-2 rounded-xl bg-[#fefce8] hover:bg-[#fef08a] border border-[#ca8a04]/40 text-[#713f12] font-bold text-xs transition-colors shrink-0 shadow-xs flex items-center gap-1.5"
        >
          <span>📝</span>
          <span>+ Blank Card</span>
        </button>

        {/* Selected connection notification pill */}
        {selectedForConnect.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#fef3c7] border border-[#f59e0b] text-[#78350f] text-xs font-bold animate-pulse">
            <span>🔗</span>
            <span>
              {selectedForConnect.length === 1
                ? 'Select 1 more card to connect'
                : '2 cards selected'}
            </span>
            {selectedForConnect.length === 2 && (
              <button
                type="button"
                onClick={() => setShowConnectModal(true)}
                className="px-2 py-0.5 rounded-md bg-[#78350f] text-white text-[10px] font-bold"
              >
                Connect Now ➔
              </button>
            )}
            <button
              type="button"
              onClick={() => setSelectedForConnect([])}
              className="ml-1 text-[10px] hover:underline"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* 4. Canvas Work Area (Scrollable Cards Grid) */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {/* Empty Canvas Welcome (Clean, zero canned answers) */}
        {session.cards.length === 0 && (
          <div className="py-12 px-4 max-w-lg mx-auto text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-[#fefce8] border-2 border-[#ca8a04]/30 flex items-center justify-center text-3xl shadow-sm">
              🌱
            </div>
            <div className="space-y-2">
              <h3 className="text-base font-bold text-[#382b26]">Your Open Creative Canvas</h3>
              <p className="text-xs text-[#78645b] leading-relaxed">
                There are no pre-written answers, fixed templates, or canned suggestions here. Write
                down whatever you are thinking about—a question, a project, a problem, or an
                observation.
              </p>
            </div>
            <p className="text-[11px] text-[#a89890] italic">
              You can connect thoughts, split them into smaller pieces, examine assumptions, or
              leave things unfinished.
            </p>
            <div className="pt-2 flex justify-center gap-2">
              <button
                type="button"
                onClick={handleCreateBlankCard}
                className="px-4 py-2 rounded-xl bg-[#382b26] hover:bg-[#523e37] text-white font-bold text-xs transition-colors shadow-xs"
              >
                + Create First Thought Card
              </button>
            </div>
          </div>
        )}

        {/* Filter Empty Notice */}
        {session.cards.length > 0 && displayedCards.length === 0 && (
          <div className="py-8 text-center text-xs text-[#78645b]">
            No thoughts match the current &ldquo;{filterView}&rdquo; filter.
            <button
              type="button"
              onClick={() => setFilterView('all')}
              className="ml-2 font-bold text-[#382b26] underline"
            >
              View all thoughts
            </button>
          </div>
        )}

        {/* Active Cards Grid */}
        {displayedCards.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {displayedCards.map(card => {
              const isSelectedForConnect = selectedForConnect.includes(card.id);
              const isEditing = editingCardId === card.id;

              return (
                <div
                  key={card.id}
                  className={`relative p-4 rounded-2xl border-2 transition-all flex flex-col justify-between gap-3 shadow-xs ${
                    isSelectedForConnect
                      ? 'bg-[#fef9c3] border-[#ca8a04] ring-2 ring-[#ca8a04]/40'
                      : 'bg-white border-[#382b26]/15 hover:border-[#382b26]/35'
                  }`}
                >
                  <div className="space-y-2">
                    {/* Lineage / Connection Meta Badges */}
                    {card.sourceLabels && card.sourceLabels.length === 2 && (
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#713f12] bg-[#fefce8] border border-[#fde047] px-2.5 py-1 rounded-lg">
                        <span>🔗</span>
                        <span className="truncate">
                          Connected: &ldquo;{card.sourceLabels[0]}&rdquo; + &ldquo;
                          {card.sourceLabels[1]}&rdquo;
                        </span>
                      </div>
                    )}

                    {card.splitFromLabel && (
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#1e3a8a] bg-[#eff6ff] border border-[#bfdbfe] px-2.5 py-1 rounded-lg">
                        <span>✂️</span>
                        <span className="truncate">
                          Split from: &ldquo;{card.splitFromLabel}&rdquo;
                        </span>
                      </div>
                    )}

                    {/* Card Header & Favorite Toggle */}
                    <div className="flex items-start justify-between gap-2">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editTitle}
                          onChange={e => setEditTitle(e.target.value)}
                          placeholder="Thought title..."
                          className="flex-1 px-2 py-1 text-xs font-bold rounded-lg border border-[#382b26]/30 bg-[#fffdfa] focus:outline-none focus:ring-1 focus:ring-[#ca8a04]"
                          autoFocus
                        />
                      ) : (
                        <h4 className="text-sm font-bold text-[#382b26] leading-snug">
                          {card.title}
                        </h4>
                      )}

                      <button
                        type="button"
                        onClick={() => handleToggleFavorite(card.id)}
                        className={`text-base leading-none transition-transform active:scale-125 ${
                          card.isFavorite ? 'text-[#eab308]' : 'text-[#382b26]/20 hover:text-[#382b26]/50'
                        }`}
                        title={card.isFavorite ? 'Remove star' : 'Star thought'}
                      >
                        ★
                      </button>
                    </div>

                    {/* Card Content */}
                    {isEditing ? (
                      <textarea
                        value={editDescription}
                        onChange={e => setEditDescription(e.target.value)}
                        placeholder="Write your thoughts, questions, or observations..."
                        rows={3}
                        className="w-full p-2 text-xs rounded-lg border border-[#382b26]/30 bg-[#fffdfa] text-[#2b201b] focus:outline-none focus:ring-1 focus:ring-[#ca8a04] resize-none"
                      />
                    ) : (
                      <p className="text-xs text-[#4a3932] leading-relaxed whitespace-pre-wrap">
                        {card.description || <span className="italic text-[#a89890]">Empty note</span>}
                      </p>
                    )}
                  </div>

                  {/* Card Actions Toolbar */}
                  <div className="pt-2 border-t border-[#382b26]/10 flex flex-wrap items-center justify-between gap-1 text-[11px]">
                    {isEditing ? (
                      <div className="flex items-center gap-1.5 w-full justify-end">
                        <button
                          type="button"
                          onClick={() => setEditingCardId(null)}
                          className="px-2.5 py-1 rounded-lg text-[#78645b] hover:bg-[#382b26]/5"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(card.id)}
                          className="px-3 py-1 rounded-lg bg-[#382b26] text-white font-bold"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-1">
                          {/* Connect Toggle Button */}
                          <button
                            type="button"
                            onClick={() => handleToggleSelectForConnect(card.id)}
                            className={`px-2 py-1 rounded-lg font-bold transition-colors ${
                              isSelectedForConnect
                                ? 'bg-[#ca8a04] text-white'
                                : 'bg-[#fefce8] hover:bg-[#fde047] text-[#713f12] border border-[#fde047]'
                            }`}
                            title="Select this card to connect with another"
                          >
                            🔗 {isSelectedForConnect ? 'Selected' : 'Connect'}
                          </button>

                          {/* Split Thought Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenSplitModal(card)}
                            className="px-2 py-1 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 text-[#4a3932] font-medium"
                            title="Split this thought into smaller pieces"
                          >
                            ✂️ Split
                          </button>

                          {/* Socratic Inquiry Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenInquiry(card)}
                            className="px-2 py-1 rounded-lg bg-[#ecfdf5] hover:bg-[#d1fae5] border border-[#a7f3d0] text-[#065f46] font-medium"
                            title="Examine this thought with Ideas Gumdrop"
                          >
                            💬 Examine
                          </button>

                          {/* Develop Blueprint Button */}
                          <button
                            type="button"
                            onClick={() => handleStartDevelopBlueprint(card)}
                            className="px-2 py-1 rounded-lg bg-[#fff7ed] hover:bg-[#fed7aa] border border-[#fdba74] text-[#9a3412] font-medium"
                            title="Develop an authored blueprint from this concept"
                          >
                            📐 Develop
                          </button>
                        </div>

                        <div className="flex items-center gap-1">
                          {/* Edit Button */}
                          <button
                            type="button"
                            onClick={() => handleStartEdit(card)}
                            className="p-1 rounded-md text-[#78645b] hover:text-[#382b26] hover:bg-[#382b26]/5"
                            title="Edit thought"
                          >
                            ✏️
                          </button>
                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={() => handleDeleteCard(card.id)}
                            className="p-1 rounded-md text-[#78645b] hover:text-[#991b1b] hover:bg-red-50"
                            title="Delete card"
                          >
                            🗑️
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* MODAL 1: 2-CARD CONNECTION WORKSPACE (User Reasoned)       */}
      {/* ========================================================= */}
      {showConnectModal && cardA && cardB && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#1a130f]/50 backdrop-blur-xs select-none"
          onClick={() => setShowConnectModal(false)}
        >
          <div
            className="relative w-full max-w-2xl bg-[#fffdfa] border-2 border-[#382b26] rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-[#382b26] flex items-center gap-2">
                  <span>🔗</span>
                  <span>Connect Two Thoughts</span>
                </h3>
                <p className="text-xs text-[#78645b]">
                  Examine both thoughts side by side. What relationship do you notice?
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowConnectModal(false)}
                className="w-7 h-7 rounded-full bg-[#382b26]/5 hover:bg-[#382b26]/15 text-[#382b26] flex items-center justify-center font-bold text-xs"
              >
                ✕
              </button>
            </div>

            {/* Side-by-Side Cards Display (User's Exact Words) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-[#fefce8] border border-[#fde047] space-y-1">
                <span className="text-[10px] font-bold text-[#713f12] uppercase tracking-wider block">
                  Thought 1
                </span>
                <h4 className="text-xs font-bold text-[#382b26]">{cardA.title}</h4>
                <p className="text-xs text-[#4a3932] whitespace-pre-wrap">{cardA.description}</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#fefce8] border border-[#fde047] space-y-1">
                <span className="text-[10px] font-bold text-[#713f12] uppercase tracking-wider block">
                  Thought 2
                </span>
                <h4 className="text-xs font-bold text-[#382b26]">{cardB.title}</h4>
                <p className="text-xs text-[#4a3932] whitespace-pre-wrap">{cardB.description}</p>
              </div>
            </div>

            {/* Neutral Guiding Questions for User's Reasoning */}
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 text-xs text-[#4a3932] space-y-1">
              <span className="font-semibold text-[#382b26] block">Reflective Questions:</span>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-[#78645b]">
                <li>What do these two thoughts have in common?</li>
                <li>Where do they conflict or push against each other?</li>
                <li>Does one thought change or deepen how you see the other?</li>
                <li>What new possibility, question, or realization emerges?</li>
              </ul>
            </div>

            {/* User-Authored Connection Input */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#382b26] mb-1">
                  Name for this connection / resulting thought (optional):
                </label>
                <input
                  type="text"
                  value={connectionTitle}
                  onChange={e => setConnectionTitle(e.target.value)}
                  placeholder={`e.g. ${cardA.title} & ${cardB.title}`}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#382b26]/25 bg-white text-[#2b201b] focus:outline-none focus:ring-2 focus:ring-[#ca8a04]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#382b26] mb-1">
                  What relationship, contradiction, or new idea do you see between them?
                </label>
                <textarea
                  value={connectionNotes}
                  onChange={e => setConnectionNotes(e.target.value)}
                  placeholder="Explain the connection in your own words..."
                  rows={4}
                  className="w-full p-3 text-xs rounded-xl border border-[#382b26]/25 bg-white text-[#2b201b] focus:outline-none focus:ring-2 focus:ring-[#ca8a04] resize-none"
                  autoFocus
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedForConnect([]);
                  setShowConnectModal(false);
                }}
                className="text-xs text-[#78645b] hover:text-[#991b1b] underline"
              >
                These don&apos;t connect (cancel)
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowConnectModal(false)}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium text-[#78645b] hover:bg-[#382b26]/5"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleSaveConnection}
                  className="px-4 py-2 rounded-xl bg-[#382b26] hover:bg-[#523e37] text-white text-xs font-bold transition-colors shadow-xs"
                >
                  Save Connected Thought 🌱
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: SPLIT THOUGHT WORKSPACE                           */}
      {/* ========================================================= */}
      {splittingCard && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#1a130f]/50 backdrop-blur-xs select-none"
          onClick={() => setSplittingCard(null)}
        >
          <div
            className="relative w-full max-w-xl bg-[#fffdfa] border-2 border-[#382b26] rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-[#382b26] flex items-center gap-2">
                  <span>✂️</span>
                  <span>Split Thought into Smaller Pieces</span>
                </h3>
                <p className="text-xs text-[#78645b]">
                  Tease apart distinct threads, assumptions, or questions into separate cards.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSplittingCard(null)}
                className="w-7 h-7 rounded-full bg-[#382b26]/5 hover:bg-[#382b26]/15 text-[#382b26] flex items-center justify-center font-bold text-xs"
              >
                ✕
              </button>
            </div>

            {/* Original Card Quote */}
            <div className="p-3.5 rounded-2xl bg-[#eff6ff] border border-[#bfdbfe] space-y-1">
              <span className="text-[10px] font-bold text-[#1e3a8a] uppercase tracking-wider block">
                Original Thought
              </span>
              <h4 className="text-xs font-bold text-[#1e3a8a]">{splittingCard.title}</h4>
              <p className="text-xs text-[#3b82f6] whitespace-pre-wrap leading-relaxed">
                {splittingCard.description}
              </p>
            </div>

            {/* Separate Sub-Thoughts Input */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-[#382b26] block">
                Write each separate thread in your own words:
              </span>

              {splitParts.map((part, idx) => (
                <div key={idx} className="space-y-1">
                  <label className="text-[11px] font-medium text-[#78645b]">
                    Sub-Thought {idx + 1}:
                  </label>
                  <textarea
                    value={part}
                    onChange={e => {
                      const val = e.target.value;
                      setSplitParts(prev => prev.map((p, i) => (i === idx ? val : p)));
                    }}
                    placeholder={`Thread ${idx + 1}...`}
                    rows={2}
                    className="w-full p-2.5 text-xs rounded-xl border border-[#382b26]/25 bg-white text-[#2b201b] focus:outline-none focus:ring-2 focus:ring-[#3b82f6] resize-none"
                  />
                </div>
              ))}

              <button
                type="button"
                onClick={() => setSplitParts(prev => [...prev, ''])}
                className="text-xs font-bold text-[#2563eb] hover:underline flex items-center gap-1"
              >
                <span>+</span>
                <span>Add another thread</span>
              </button>
            </div>

            {/* Options & Action */}
            <div className="pt-2 border-t border-[#382b26]/10 flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs text-[#4a3932] cursor-pointer">
                <input
                  type="checkbox"
                  checked={keepOriginalOnSplit}
                  onChange={e => setKeepOriginalOnSplit(e.target.checked)}
                  className="rounded text-[#382b26] focus:ring-[#382b26]"
                />
                <span>Keep original card on canvas</span>
              </label>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSplittingCard(null)}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium text-[#78645b] hover:bg-[#382b26]/5"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveSplit}
                  disabled={splitParts.every(p => !p.trim())}
                  className="px-4 py-2 rounded-xl bg-[#1e3a8a] hover:bg-[#1e40af] disabled:opacity-40 text-white text-xs font-bold transition-colors shadow-xs"
                >
                  Create Split Cards
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: SOCRATIC INQUIRY (Examine with Ideas Gumdrop)     */}
      {/* ========================================================= */}
      {examiningCard && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#1a130f]/50 backdrop-blur-xs select-none"
          onClick={() => setExaminingCard(null)}
        >
          <div
            className="relative w-full max-w-2xl bg-[#fffdfa] border-2 border-[#382b26] rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-[#382b26] flex items-center gap-2">
                  <span>💬</span>
                  <span>Examine Thought with Ideas</span>
                </h3>
                <p className="text-xs text-[#78645b]">
                  Ideas asks neutral questions to help you challenge, clarify, and inspect your own
                  thinking.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setExaminingCard(null)}
                className="w-7 h-7 rounded-full bg-[#382b26]/5 hover:bg-[#382b26]/15 text-[#382b26] flex items-center justify-center font-bold text-xs"
              >
                ✕
              </button>
            </div>

            {/* Target Thought Display */}
            <div className="p-3.5 rounded-2xl bg-[#fefce8] border border-[#fde047] space-y-1">
              <span className="text-[10px] font-bold text-[#713f12] uppercase tracking-wider block">
                Examining:
              </span>
              <h4 className="text-xs font-bold text-[#382b26]">{examiningCard.title}</h4>
              <p className="text-xs text-[#4a3932] whitespace-pre-wrap">
                {examiningCard.description}
              </p>
            </div>

            {/* Inquiry Angle Selector Buttons */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-[#382b26] block">
                Choose an inquiry angle to explore:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {INQUIRY_ANGLES.map((angle, idx) => (
                  <button
                    key={angle.id}
                    type="button"
                    onClick={() => setSelectedInquiryIndex(idx)}
                    className={`p-2.5 rounded-xl border text-left transition-colors flex items-center gap-2 ${
                      selectedInquiryIndex === idx
                        ? 'bg-[#382b26] text-white border-[#382b26] shadow-xs'
                        : 'bg-white hover:bg-[#fefce8] border-[#382b26]/15 text-[#382b26]'
                    }`}
                  >
                    <span className="text-base">{angle.icon}</span>
                    <span className="text-[11px] font-bold leading-tight">{angle.title}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Active Socratic Prompt */}
            <div className="p-4 rounded-2xl bg-[#ecfdf5] border border-[#a7f3d0] space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#065f46]">
                <span>Ideas asks:</span>
              </div>
              <p className="text-xs sm:text-sm text-[#064e3b] font-medium leading-relaxed italic">
                &ldquo;{INQUIRY_ANGLES[selectedInquiryIndex].prompt}&rdquo;
              </p>
            </div>

            {/* User-Authored Reflection Input */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-[#382b26]">
                Your reflection or realization:
              </label>
              <textarea
                value={inquiryReflection}
                onChange={e => setInquiryReflection(e.target.value)}
                placeholder="Write whatever comes up—answers, doubts, or new questions..."
                rows={4}
                className="w-full p-3 text-xs rounded-xl border border-[#382b26]/25 bg-white text-[#2b201b] focus:outline-none focus:ring-2 focus:ring-[#059669] resize-none"
                autoFocus
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-2 border-t border-[#382b26]/10 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setExaminingCard(null)}
                className="px-3 py-1.5 rounded-xl text-xs font-medium text-[#78645b] hover:bg-[#382b26]/5"
              >
                Done (No changes)
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAppendInquiryToOriginal}
                  disabled={!inquiryReflection.trim()}
                  className="px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 disabled:opacity-40 text-[#382b26] text-xs font-bold transition-colors"
                >
                  Append to Note
                </button>
                <button
                  type="button"
                  onClick={handleSaveInquiryAsNewThought}
                  disabled={!inquiryReflection.trim()}
                  className="px-4 py-2 rounded-xl bg-[#065f46] hover:bg-[#047857] disabled:opacity-40 text-white text-xs font-bold transition-colors shadow-xs"
                >
                  Save as New Card 🌱
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 4: AUTHORED IDEA BLUEPRINT (Develop Concept)         */}
      {/* ========================================================= */}
      {activeBlueprintCard && blueprintDraft && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#1a130f]/50 backdrop-blur-xs select-none"
          onClick={() => setActiveBlueprintCard(null)}
        >
          <div
            className="relative w-full max-w-3xl bg-[#fffdfa] border-2 border-[#382b26] rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-[#382b26]/10 pb-3">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-[#382b26] flex items-center gap-2">
                  <span>📐</span>
                  <span>Develop Idea Blueprint</span>
                </h3>
                <p className="text-xs text-[#78645b]">
                  Work through these questions to give your concept clear shape. All answers are
                  written by you.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveBlueprintCard(null)}
                className="w-7 h-7 rounded-full bg-[#382b26]/5 hover:bg-[#382b26]/15 text-[#382b26] flex items-center justify-center font-bold text-xs"
              >
                ✕
              </button>
            </div>

            {/* Questions Form (All blank for user authorship) */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#382b26] mb-1">
                  1. Concept Title
                </label>
                <input
                  type="text"
                  value={blueprintDraft.conceptTitle}
                  onChange={e =>
                    setBlueprintDraft(prev => prev ? { ...prev, conceptTitle: e.target.value } : null)
                  }
                  placeholder="Give this concept a clear, distinctive name..."
                  className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-[#382b26]/25 bg-white text-[#2b201b] focus:outline-none focus:ring-2 focus:ring-[#ea580c]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#382b26] mb-1">
                  2. What is the core concept in your own words?
                </label>
                <textarea
                  value={blueprintDraft.coreConcept}
                  onChange={e =>
                    setBlueprintDraft(prev => prev ? { ...prev, coreConcept: e.target.value } : null)
                  }
                  placeholder="Explain the idea plainly..."
                  rows={3}
                  className="w-full p-2.5 text-xs rounded-xl border border-[#382b26]/25 bg-white text-[#2b201b] focus:outline-none focus:ring-2 focus:ring-[#ea580c] resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#382b26] mb-1">
                  3. Who or what is this for?
                </label>
                <textarea
                  value={blueprintDraft.targetAudienceOrPurpose}
                  onChange={e =>
                    setBlueprintDraft(prev =>
                      prev ? { ...prev, targetAudienceOrPurpose: e.target.value } : null
                    )
                  }
                  placeholder="What person, community, or situation does this serve?"
                  rows={2}
                  className="w-full p-2.5 text-xs rounded-xl border border-[#382b26]/25 bg-white text-[#2b201b] focus:outline-none focus:ring-2 focus:ring-[#ea580c] resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#382b26] mb-1">
                  4. What makes this distinct or interesting to you?
                </label>
                <textarea
                  value={blueprintDraft.differentiatingFeature}
                  onChange={e =>
                    setBlueprintDraft(prev =>
                      prev ? { ...prev, differentiatingFeature: e.target.value } : null
                    )
                  }
                  placeholder="What is the spark that makes this different from ordinary approaches?"
                  rows={2}
                  className="w-full p-2.5 text-xs rounded-xl border border-[#382b26]/25 bg-white text-[#2b201b] focus:outline-none focus:ring-2 focus:ring-[#ea580c] resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#382b26] mb-1">
                  5. What is the smallest 1-day experiment you could test?
                </label>
                <textarea
                  value={blueprintDraft.smallestExperiment}
                  onChange={e =>
                    setBlueprintDraft(prev =>
                      prev ? { ...prev, smallestExperiment: e.target.value } : null
                    )
                  }
                  placeholder="A paper sketch, a conversation with a neighbor, a quick prototype..."
                  rows={2}
                  className="w-full p-2.5 text-xs rounded-xl border border-[#382b26]/25 bg-white text-[#2b201b] focus:outline-none focus:ring-2 focus:ring-[#ea580c] resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#382b26] mb-1">
                  6. What unresolved doubts, questions, or risks remain?
                </label>
                <textarea
                  value={blueprintDraft.unansweredQuestions}
                  onChange={e =>
                    setBlueprintDraft(prev =>
                      prev ? { ...prev, unansweredQuestions: e.target.value } : null
                    )
                  }
                  placeholder="What do you still need to find out or solve?"
                  rows={2}
                  className="w-full p-2.5 text-xs rounded-xl border border-[#382b26]/25 bg-white text-[#2b201b] focus:outline-none focus:ring-2 focus:ring-[#ea580c] resize-none"
                />
              </div>
            </div>

            {/* Blueprint Actions */}
            <div className="pt-3 border-t border-[#382b26]/10 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleCopyMarkdownBlueprint}
                className="px-3.5 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-bold text-[#382b26] flex items-center gap-1.5 transition-colors"
              >
                <span>📋</span>
                <span>{copiedBlueprint ? 'Copied to Clipboard! ✓' : 'Copy as Markdown'}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveBlueprintCard(null)}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium text-[#78645b] hover:bg-[#382b26]/5"
                >
                  Back to Canvas
                </button>
                <button
                  type="button"
                  onClick={handleSaveBlueprint}
                  className="px-4 py-2 rounded-xl bg-[#c2410c] hover:bg-[#9a3412] text-white text-xs font-bold transition-colors shadow-xs"
                >
                  Save to Blueprints Ledger 📜
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 5: BLUEPRINTS LEDGER DRAWER                          */}
      {/* ========================================================= */}
      {showBlueprintsLedger && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#1a130f]/50 backdrop-blur-xs select-none"
          onClick={() => setShowBlueprintsLedger(false)}
        >
          <div
            className="relative w-full max-w-2xl bg-[#fffdfa] border-2 border-[#382b26] rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-[#382b26]/10 pb-3">
              <div>
                <h3 className="text-base font-bold text-[#382b26] flex items-center gap-2">
                  <span>📜</span>
                  <span>Blueprints Ledger</span>
                </h3>
                <p className="text-xs text-[#78645b]">
                  Concepts you have developed and saved in this garden.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowBlueprintsLedger(false)}
                className="w-7 h-7 rounded-full bg-[#382b26]/5 hover:bg-[#382b26]/15 text-[#382b26] flex items-center justify-center font-bold text-xs"
              >
                ✕
              </button>
            </div>

            {savedBlueprints.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#78645b] space-y-1">
                <p>No blueprints saved yet.</p>
                <p className="text-[11px] text-[#a89890]">
                  Click &ldquo;📐 Develop&rdquo; on any thought card to cultivate a blueprint.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {savedBlueprints.map(record => (
                  <div
                    key={record.id}
                    className="p-4 rounded-2xl bg-white border border-[#382b26]/15 hover:border-[#382b26]/30 shadow-xs space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <h4 className="text-sm font-bold text-[#382b26]">{record.title}</h4>
                      <span className="text-[10px] text-[#78645b]">
                        {new Date(record.savedAt).toLocaleDateString()}
                      </span>
                    </div>

                    <p className="text-xs text-[#4a3932] line-clamp-2">
                      {record.blueprint.coreConcept || 'No core description'}
                    </p>

                    <div className="flex items-center justify-end gap-2 pt-1 text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          const targetCard = session.cards.find(
                            c => c.id === record.blueprint.sourceCardId
                          );
                          if (targetCard) {
                            setActiveBlueprintCard(targetCard);
                            setBlueprintDraft(record.blueprint);
                            setShowBlueprintsLedger(false);
                          }
                        }}
                        className="font-bold text-[#c2410c] hover:underline"
                      >
                        Open Blueprint ➔
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowBlueprintsLedger(false)}
                className="px-4 py-2 rounded-xl bg-[#382b26] text-white text-xs font-bold"
              >
                Close Ledger
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 6: CLEAR CANVAS CONFIRMATION                        */}
      {/* ========================================================= */}
      {showClearConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#1a130f]/50 backdrop-blur-xs select-none"
          onClick={() => setShowClearConfirm(false)}
        >
          <div
            className="relative w-full max-w-sm bg-[#fffdfa] border-2 border-[#382b26] rounded-3xl p-5 shadow-2xl space-y-3 text-center"
            onClick={e => e.stopPropagation()}
          >
            <span className="text-3xl block">🗑️</span>
            <h4 className="text-sm font-bold text-[#382b26]">Clear Creative Canvas?</h4>
            <p className="text-xs text-[#78645b] leading-relaxed">
              This will remove all current thought cards from the canvas. Any saved blueprints will
              remain in your ledger.
            </p>
            <div className="flex justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="px-3 py-1.5 rounded-xl text-xs font-medium text-[#78645b] hover:bg-[#382b26]/5"
              >
                Keep Canvas
              </button>
              <button
                type="button"
                onClick={handleConfirmClearCanvas}
                className="px-4 py-1.5 rounded-xl bg-[#991b1b] text-white text-xs font-bold hover:bg-[#b91c1c]"
              >
                Yes, Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IdeaGarden;
