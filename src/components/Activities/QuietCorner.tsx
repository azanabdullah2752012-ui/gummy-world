import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type {
  ListenerSession,
  ListenerStage,
  ThoughtCategory,
  ThoughtCard,
  SavedReflectionRecord,
} from '../../types/activity';
import { soundEngine } from '../../audio/soundEngine';

const STORAGE_SESSION_KEY = 'gummy_listener_session';
const STORAGE_HISTORY_KEY = 'gummy_listener_history';

// Safe local storage helpers that handle storage full / disabled gracefully
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

const STAGE_ORDER: ListenerStage[] = ['let-it-out', 'understand', 'sort', 'clarity'];

const STARTER_PROMPTS = [
  "What's been bothering you?",
  "What happened?",
  "What part keeps coming back to your mind?",
];

const DEFAULT_SAMPLE_SESSION: ListenerSession = {
  id: 'sample-reflection',
  stage: 'clarity',
  initialThought:
    'A friend didn’t reply to my message for three days after we planned to meet up. I kept wondering if I did something wrong or if they are upset with me.',
  understandingResponses: {
    bothersMost: 'Feeling ignored and replaying our last conversation over and over.',
    knownVsUnsure: 'I know they have not replied yet. I am unsure whether they are busy, overwhelmed, or actually upset.',
    wishedUnderstood: 'I wish they knew that a quick note saying they are busy is totally fine with me.',
    interpretations: 'I might be assuming they are mad at me, but I have no actual evidence that they are.',
  },
  thoughtCards: [
    {
      id: 'card-1',
      text: 'Send a gentle, low-pressure follow-up message when I feel calm',
      category: 'influence',
      createdAt: Date.now() - 30000,
    },
    {
      id: 'card-2',
      text: 'Whether and when they decide to reply back',
      category: 'waiting',
      createdAt: Date.now() - 25000,
    },
    {
      id: 'card-3',
      text: 'Whatever other stress or problems they might be dealing with in their life',
      category: 'uncontrollable',
      createdAt: Date.now() - 20000,
    },
    {
      id: 'card-4',
      text: 'How I spend my own evening instead of waiting on the notification',
      category: 'influence',
      createdAt: Date.now() - 15000,
    },
  ],
  endingType: 'think-later',
  chosenStep: 'Go for a walk by the brook and leave my phone on the desk',
  startedAt: Date.now() - 600000,
  updatedAt: Date.now(),
  isCompleted: true,
};

interface QuietCornerProps {
  onClose: () => void;
}

export const QuietCorner: React.FC<QuietCornerProps> = ({ onClose }) => {
  // Initialize session from localStorage or URL parameter
  const [session, setSession] = useState<ListenerSession>(() => {
    let base: ListenerSession = {
      id: `reflection-${Date.now()}`,
      stage: 'let-it-out',
      initialThought: '',
      understandingResponses: {
        bothersMost: '',
        knownVsUnsure: '',
        wishedUnderstood: '',
        interpretations: '',
      },
      thoughtCards: [],
      endingType: null,
      chosenStep: '',
      startedAt: Date.now(),
      updatedAt: Date.now(),
      isCompleted: false,
    };

    if (typeof window !== 'undefined') {
      const saved = safeGetItem(STORAGE_SESSION_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed === 'object') {
            base = {
              ...base,
              ...parsed,
              understandingResponses: {
                ...base.understandingResponses,
                ...(parsed.understandingResponses || {}),
              },
              thoughtCards: Array.isArray(parsed.thoughtCards) ? parsed.thoughtCards : [],
            };
          }
        } catch {}
      }

      // Check URL query params for deep-testing or stage override
      const p = new URLSearchParams(window.location.search);
      const stageParam = p.get('stage');
      if (stageParam !== null) {
        let targetStage: ListenerStage | null = null;
        if (stageParam === '0' || stageParam === 'let-it-out') targetStage = 'let-it-out';
        if (stageParam === '1' || stageParam === 'understand') targetStage = 'understand';
        if (stageParam === '2' || stageParam === 'sort') targetStage = 'sort';
        if (stageParam === '3' || stageParam === 'clarity') targetStage = 'clarity';

        if (targetStage) {
          if ((targetStage === 'clarity' || targetStage === 'sort') && !base.initialThought) {
            base = { ...DEFAULT_SAMPLE_SESSION, stage: targetStage };
          } else {
            base = { ...base, stage: targetStage };
          }
        }
      }
    }
    return base;
  });

  // Modal dialog states
  const [showPrivacyModal, setShowPrivacyModal] = useState(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search).get('modal') === 'privacy';
    }
    return false;
  });
  const [showClearConfirm, setShowClearConfirm] = useState(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search).get('modal') === 'clear';
    }
    return false;
  });
  const [showCrisisModal, setShowCrisisModal] = useState(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search).get('modal') === 'support';
    }
    return false;
  });
  const [hasSavedHistory, setHasSavedHistory] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);

  // Test storage availability synchronously once without cascading setState
  const isStorageAvailable = useMemo(() => {
    if (typeof window === 'undefined') return true;
    try {
      const testKey = '__test_storage__';
      window.localStorage.setItem(testKey, '1');
      window.localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }, []);

  // New card inputs for Stage C
  const [newCardText, setNewCardText] = useState('');
  const [newCardCategory, setNewCardCategory] = useState<ThoughtCategory>('influence');
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [editingCardText, setEditingCardText] = useState('');

  // Auto-sync session to localStorage
  useEffect(() => {
    safeSetItem(STORAGE_SESSION_KEY, JSON.stringify(session));
  }, [session]);

  // Stage navigation
  const setStage = useCallback((nextStage: ListenerStage) => {
    soundEngine.playGumdropPop(480);
    setSession(prev => ({
      ...prev,
      stage: nextStage,
      updatedAt: Date.now(),
    }));
  }, []);

  const currentStageIndex = useMemo(
    () => STAGE_ORDER.indexOf(session.stage),
    [session.stage]
  );

  // Handlers for Stage A (Let it out)
  const handleStarterPromptClick = (prompt: string) => {
    soundEngine.playGumdropPop(520);
    setSession(prev => {
      const trimmed = prev.initialThought.trim();
      const nextText = trimmed ? `${trimmed}\n\n${prompt} ` : `${prompt} `;
      return {
        ...prev,
        initialThought: nextText,
        updatedAt: Date.now(),
      };
    });
  };

  // Handlers for Stage B (Understand)
  const handleUnderstandingChange = (
    field: keyof ListenerSession['understandingResponses'],
    val: string
  ) => {
    setSession(prev => ({
      ...prev,
      understandingResponses: {
        ...prev.understandingResponses,
        [field]: val,
      },
      updatedAt: Date.now(),
    }));
  };

  // Handlers for Stage C (Thought Cards)
  const handleAddCard = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = newCardText.trim();
    if (!text) return;

    soundEngine.playFlowerChime();
    const newCard: ThoughtCard = {
      id: `card-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      text,
      category: newCardCategory,
      createdAt: Date.now(),
    };

    setSession(prev => ({
      ...prev,
      thoughtCards: [...prev.thoughtCards, newCard],
      updatedAt: Date.now(),
    }));
    setNewCardText('');
  };

  const handleMoveCard = (cardId: string, nextCategory: ThoughtCategory) => {
    soundEngine.playGumdropPop(560);
    setSession(prev => ({
      ...prev,
      thoughtCards: prev.thoughtCards.map(c =>
        c.id === cardId ? { ...c, category: nextCategory } : c
      ),
      updatedAt: Date.now(),
    }));
  };

  const handleDeleteCard = (cardId: string) => {
    soundEngine.playGumdropPop(380);
    setSession(prev => ({
      ...prev,
      thoughtCards: prev.thoughtCards.filter(c => c.id !== cardId),
      updatedAt: Date.now(),
    }));
  };

  const handleStartEditCard = (card: ThoughtCard) => {
    setEditingCardId(card.id);
    setEditingCardText(card.text);
  };

  const handleSaveEditCard = (cardId: string) => {
    const text = editingCardText.trim();
    if (!text) {
      handleDeleteCard(cardId);
      setEditingCardId(null);
      return;
    }
    soundEngine.playGumdropPop(520);
    setSession(prev => ({
      ...prev,
      thoughtCards: prev.thoughtCards.map(c =>
        c.id === cardId ? { ...c, text } : c
      ),
      updatedAt: Date.now(),
    }));
    setEditingCardId(null);
  };

  // Quick suggestion snippets extracted from Stage A & B notes
  const suggestedSnippets = useMemo(() => {
    const allText = [
      session.initialThought,
      session.understandingResponses.bothersMost,
      session.understandingResponses.knownVsUnsure,
      session.understandingResponses.wishedUnderstood,
      session.understandingResponses.interpretations,
    ]
      .filter(Boolean)
      .join('. ');

    if (!allText.trim()) return [];

    // Split by sentence delimiters and filter clean chunks
    const rawChunks = allText
      .split(/[.\n?!]/)
      .map(s => s.trim())
      .filter(s => s.length > 14 && s.length < 120);

    const existingCardTexts = new Set(session.thoughtCards.map(c => c.text.toLowerCase()));
    const unique = Array.from(new Set(rawChunks)).filter(
      chunk => !existingCardTexts.has(chunk.toLowerCase())
    );

    return unique.slice(0, 4);
  }, [session.initialThought, session.understandingResponses, session.thoughtCards]);

  const handleAddSnippetAsCard = (snippet: string, category: ThoughtCategory) => {
    soundEngine.playFlowerChime();
    const newCard: ThoughtCard = {
      id: `card-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      text: snippet,
      category,
      createdAt: Date.now(),
    };
    setSession(prev => ({
      ...prev,
      thoughtCards: [...prev.thoughtCards, newCard],
      updatedAt: Date.now(),
    }));
  };

  // Grouped cards for Stage C & D
  const influenceCards = useMemo(
    () => session.thoughtCards.filter(c => c.category === 'influence'),
    [session.thoughtCards]
  );
  const waitingCards = useMemo(
    () => session.thoughtCards.filter(c => c.category === 'waiting'),
    [session.thoughtCards]
  );
  const uncontrollableCards = useMemo(
    () => session.thoughtCards.filter(c => c.category === 'uncontrollable'),
    [session.thoughtCards]
  );

  // Save to History
  const handleSaveToJournal = () => {
    const record: SavedReflectionRecord = {
      id: session.id,
      savedAt: Date.now(),
      snippet: session.initialThought.trim() || 'Quiet reflection by the pond',
      influenceCount: influenceCards.length,
      waitingCount: waitingCards.length,
      uncontrollableCount: uncontrollableCards.length,
      endingType: session.endingType,
      chosenStep: session.chosenStep.trim() || undefined,
      cards: [...session.thoughtCards],
    };

    let history: SavedReflectionRecord[] = [];
    const saved = safeGetItem(STORAGE_HISTORY_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) history = parsed;
      } catch {}
    }

    history = [record, ...history.filter(r => r.id !== record.id)].slice(0, 20);
    safeSetItem(STORAGE_HISTORY_KEY, JSON.stringify(history));
    soundEngine.playWaterRipple();
    setHasSavedHistory(true);
    setTimeout(() => setHasSavedHistory(false), 3000);
  };

  // Copy Markdown summary
  const handleCopySummary = () => {
    const markdown = `# Quiet Reflection with Listener
Date: ${new Date(session.updatedAt).toLocaleDateString()}

## What Was on My Mind
${session.initialThought.trim() || '*(No initial text recorded)*'}

## What I Can Influence
${
  influenceCards.length > 0
    ? influenceCards.map(c => `- ${c.text}`).join('\n')
    : '- *(None listed)*'
}

## What I Am Waiting On
${
  waitingCards.length > 0
    ? waitingCards.map(c => `- ${c.text}`).join('\n')
    : '- *(None listed)*'
}

## What I Cannot Control
${
  uncontrollableCards.length > 0
    ? uncontrollableCards.map(c => `- ${c.text}`).join('\n')
    : '- *(None listed)*'
}

## Ending Chosen
${
  session.endingType === 'small-step'
    ? `Take a small step: ${session.chosenStep || 'Action not specified'}`
    : session.endingType === 'think-later'
      ? 'Think about it later'
      : 'Leave it here for now'
}
`;

    navigator.clipboard.writeText(markdown);
    soundEngine.playGumdropPop(600);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  // Reset current draft
  const handleDiscardDraft = () => {
    safeRemoveItem(STORAGE_SESSION_KEY);
    setSession({
      id: `reflection-${Date.now()}`,
      stage: 'let-it-out',
      initialThought: '',
      understandingResponses: {
        bothersMost: '',
        knownVsUnsure: '',
        wishedUnderstood: '',
        interpretations: '',
      },
      thoughtCards: [],
      endingType: null,
      chosenStep: '',
      startedAt: Date.now(),
      updatedAt: Date.now(),
      isCompleted: false,
    });
    soundEngine.playGumdropPop(440);
  };

  // Permanently clear all Listener data
  const handleClearAllData = () => {
    safeRemoveItem(STORAGE_SESSION_KEY);
    safeRemoveItem(STORAGE_HISTORY_KEY);
    handleDiscardDraft();
    setShowClearConfirm(false);
  };

  return (
    <div
      className="relative w-full max-w-2xl max-h-[92vh] bg-[#fbf9f4] border-2 border-[#382b26] rounded-3xl shadow-2xl flex flex-col overflow-hidden text-[#2b201b] font-sans"
      onClick={e => e.stopPropagation()}
      role="dialog"
      aria-labelledby="quiet-corner-title"
    >
      {/* 1. Header Bar */}
      <div className="px-5 py-3.5 bg-[#f5ede4] border-b-2 border-[#382b26] flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center border-2 border-[#382b26] text-xl shadow-sm bg-[#f2b5a5]"
            title="Listener Gumdrop"
          >
            🌿
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 id="quiet-corner-title" className="text-sm font-extrabold text-[#382b26] tracking-tight">
                Listener&apos;s Quiet Corner
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#e2f1e6] text-[#22543d] border border-[#22543d]/20">
                Safe &amp; Private
              </span>
            </div>
            <p className="text-[11px] text-[#78645b] font-medium">
              Sort what you can influence, what you wait on, and what to set down
            </p>
          </div>
        </div>

        {/* Header Right Controls */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowPrivacyModal(true)}
            className="px-2 py-1 rounded-lg text-[11px] font-bold text-[#635147] hover:bg-[#382b26]/10 transition-colors focus-visible:ring-2 focus-visible:ring-[#382b26]"
            title="Local Privacy Controls"
          >
            🔒 Privacy
          </button>
          <button
            type="button"
            onClick={() => setShowCrisisModal(true)}
            className="px-2 py-1 rounded-lg text-[11px] font-bold text-[#854d0e] hover:bg-[#fef9c3] transition-colors focus-visible:ring-2 focus-visible:ring-[#382b26]"
            title="Immediate human support resources"
          >
            🤍 Support
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close quiet corner"
            className="w-8 h-8 rounded-full bg-[#382b26]/5 hover:bg-[#382b26]/15 active:scale-95 text-[#382b26] flex items-center justify-center font-bold text-sm transition-transform focus-visible:ring-2 focus-visible:ring-[#382b26]"
          >
            ✕
          </button>
        </div>
      </div>

      {/* 2. Stepper Progress Breadcrumbs */}
      <div className="px-5 py-2.5 bg-[#fffdfa] border-b border-[#382b26]/10 flex items-center justify-between gap-2 overflow-x-auto text-xs">
        <div className="flex items-center gap-1 sm:gap-2">
          {STAGE_ORDER.map((stageKey, idx) => {
            const isActive = session.stage === stageKey;
            const isPassed = currentStageIndex > idx;
            const labels: Record<ListenerStage, string> = {
              'let-it-out': '1. Let it out',
              understand: '2. Understand',
              sort: '3. Sort thoughts',
              clarity: '4. Clarity',
            };

            return (
              <button
                key={stageKey}
                type="button"
                onClick={() => setStage(stageKey)}
                className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all focus-visible:ring-2 focus-visible:ring-[#382b26] ${
                  isActive
                    ? 'bg-[#382b26] text-white shadow-sm'
                    : isPassed
                      ? 'bg-[#e2f1e6] text-[#22543d] hover:bg-[#d1ebd7]'
                      : 'bg-[#382b26]/5 text-[#78645b] hover:bg-[#382b26]/10'
                }`}
              >
                {labels[stageKey]}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={() => setShowClearConfirm(true)}
            className="text-[11px] font-semibold text-[#8c7468] hover:text-[#b91c1c] transition-colors"
          >
            Clear / New
          </button>
        </div>
      </div>

      {/* Storage full / disabled warning banner */}
      {!isStorageAvailable && (
        <div className="px-4 py-2 bg-[#fef2f2] border-b border-[#fecaca] text-[11px] text-[#991b1b] flex items-center justify-between">
          <span>Browser storage is unavailable. Your session is active in memory only.</span>
        </div>
      )}

      {/* 3. Main Stage Content Area */}
      <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
        {/* ========================================================= */}
        {/* STAGE A: LET IT OUT                                       */}
        {/* ========================================================= */}
        {session.stage === 'let-it-out' && (
          <div className="space-y-4">
            {/* Listener Welcome Card */}
            <div className="p-4 rounded-2xl bg-[#f5ede4] border border-[#382b26]/15 flex items-start gap-3 shadow-sm">
              <span className="text-xl mt-0.5">🌿</span>
              <div className="space-y-1">
                <p className="text-xs sm:text-sm text-[#382b26] font-medium leading-relaxed">
                  &ldquo;Take a slow breath. Dragonfly Pond is calm today. There&apos;s no pressure to explain everything or fix anything right now. What&apos;s on your mind?&rdquo;
                </p>
                <p className="text-[11px] text-[#78645b]">
                  Write freely in your own words. You can skip questions or write as little as you like.
                </p>
              </div>
            </div>

            {/* Optional Starter Prompts */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-[#78645b] uppercase tracking-wider">
                Optional prompts to help you start:
              </span>
              <div className="flex flex-wrap gap-2">
                {STARTER_PROMPTS.map((prompt, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleStarterPromptClick(prompt)}
                    className="px-3 py-1.5 rounded-xl bg-white border border-[#382b26]/15 hover:border-[#382b26]/40 hover:bg-[#fff9f2] text-xs font-medium text-[#4a3932] transition-colors focus-visible:ring-2 focus-visible:ring-[#382b26]"
                  >
                    + {prompt}
                  </button>
                ))}
              </div>
            </div>

            {/* Writing Textarea */}
            <div className="space-y-1.5">
              <label
                htmlFor="initial-thought-input"
                className="text-xs font-bold text-[#382b26] flex items-center justify-between"
              >
                <span>YOUR THOUGHTS</span>
                <span className="text-[10px] text-[#78645b] font-normal">
                  {session.initialThought.length > 0
                    ? `${session.initialThought.length} characters`
                    : 'Private space'}
                </span>
              </label>
              <textarea
                id="initial-thought-input"
                value={session.initialThought}
                onChange={e =>
                  setSession(prev => ({
                    ...prev,
                    initialThought: e.target.value,
                    updatedAt: Date.now(),
                  }))
                }
                rows={7}
                placeholder="Write whatever is on your mind, as little or as much as feels comfortable..."
                className="w-full p-3.5 rounded-2xl bg-white border-2 border-[#382b26]/25 focus:border-[#382b26] text-xs sm:text-sm text-[#2b201b] leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-[#382b26]/10 placeholder:text-[#a8968d]"
              />
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STAGE B: UNDERSTAND THE SITUATION                        */}
        {/* ========================================================= */}
        {session.stage === 'understand' && (
          <div className="space-y-5">
            {/* Listener Prompt */}
            <div className="p-4 rounded-2xl bg-[#f5ede4] border border-[#382b26]/15 flex items-start gap-3 shadow-sm">
              <span className="text-xl mt-0.5">🕊️</span>
              <div className="space-y-1">
                <p className="text-xs sm:text-sm text-[#382b26] font-medium leading-relaxed">
                  &ldquo;Looking closer at what happened helps untangle our interpretations from what we actually know. Answer any questions that feel helpful, and leave the rest.&rdquo;
                </p>
                <p className="text-[11px] text-[#78645b]">
                  We keep language neutral. No one is labeled, and there is no right or wrong response.
                </p>
              </div>
            </div>

            {/* Context from Stage A */}
            {session.initialThought.trim() && (
              <div className="p-3 rounded-xl bg-white border border-[#382b26]/15 space-y-1">
                <span className="text-[10px] font-bold text-[#78645b] uppercase tracking-wider">
                  What you shared earlier:
                </span>
                <p className="text-xs text-[#4a3932] italic line-clamp-2">
                  &ldquo;{session.initialThought}&rdquo;
                </p>
              </div>
            )}

            {/* 4 Reflection Question Fields */}
            <div className="space-y-4">
              {/* Question 1 */}
              <div className="p-3.5 rounded-2xl bg-white border border-[#382b26]/15 space-y-1.5 shadow-sm">
                <label
                  htmlFor="q-bothers-most"
                  className="text-xs font-bold text-[#382b26] flex items-center justify-between"
                >
                  <span>1. What part bothers you the most?</span>
                  <span className="text-[10px] text-[#78645b] font-normal">Optional</span>
                </label>
                <p className="text-[11px] text-[#78645b]">
                  Pinpointing the core point of hurt or frustration can make the feeling more manageable.
                </p>
                <textarea
                  id="q-bothers-most"
                  rows={2}
                  value={session.understandingResponses.bothersMost}
                  onChange={e => handleUnderstandingChange('bothersMost', e.target.value)}
                  placeholder="The part that stings most is..."
                  className="w-full p-2.5 rounded-xl bg-[#fffdfa] border border-[#382b26]/20 focus:border-[#382b26] text-xs text-[#2b201b] resize-none focus:outline-none"
                />
              </div>

              {/* Question 2 */}
              <div className="p-3.5 rounded-2xl bg-white border border-[#382b26]/15 space-y-1.5 shadow-sm">
                <label
                  htmlFor="q-known-vs-unsure"
                  className="text-xs font-bold text-[#382b26] flex items-center justify-between"
                >
                  <span>2. What do you know happened, and what are you still unsure about?</span>
                  <span className="text-[10px] text-[#78645b] font-normal">Optional</span>
                </label>
                <p className="text-[11px] text-[#78645b]">
                  Distinguish what you directly observed from things you might be guessing or waiting to find out.
                </p>
                <textarea
                  id="q-known-vs-unsure"
                  rows={2}
                  value={session.understandingResponses.knownVsUnsure}
                  onChange={e => handleUnderstandingChange('knownVsUnsure', e.target.value)}
                  placeholder="I know for sure that... but I do not know if..."
                  className="w-full p-2.5 rounded-xl bg-[#fffdfa] border border-[#382b26]/20 focus:border-[#382b26] text-xs text-[#2b201b] resize-none focus:outline-none"
                />
              </div>

              {/* Question 3 */}
              <div className="p-3.5 rounded-2xl bg-white border border-[#382b26]/15 space-y-1.5 shadow-sm">
                <label
                  htmlFor="q-wished-understood"
                  className="text-xs font-bold text-[#382b26] flex items-center justify-between"
                >
                  <span>3. What do you wish the other person understood?</span>
                  <span className="text-[10px] text-[#78645b] font-normal">Optional</span>
                </label>
                <p className="text-[11px] text-[#78645b]">
                  What would you communicate if you knew they were ready to listen calmly?
                </p>
                <textarea
                  id="q-wished-understood"
                  rows={2}
                  value={session.understandingResponses.wishedUnderstood}
                  onChange={e => handleUnderstandingChange('wishedUnderstood', e.target.value)}
                  placeholder="I wish they realized that..."
                  className="w-full p-2.5 rounded-xl bg-[#fffdfa] border border-[#382b26]/20 focus:border-[#382b26] text-xs text-[#2b201b] resize-none focus:outline-none"
                />
              </div>

              {/* Question 4 */}
              <div className="p-3.5 rounded-2xl bg-white border border-[#382b26]/15 space-y-1.5 shadow-sm">
                <label
                  htmlFor="q-interpretations"
                  className="text-xs font-bold text-[#382b26] flex items-center justify-between"
                >
                  <span>4. Is there anything you might be interpreting but cannot know for certain?</span>
                  <span className="text-[10px] text-[#78645b] font-normal">Optional</span>
                </label>
                <p className="text-[11px] text-[#78645b]">
                  Are there alternative, simpler explanations that do not assume bad intent?
                </p>
                <textarea
                  id="q-interpretations"
                  rows={2}
                  value={session.understandingResponses.interpretations}
                  onChange={e => handleUnderstandingChange('interpretations', e.target.value)}
                  placeholder="I might be assuming their silence means..."
                  className="w-full p-2.5 rounded-xl bg-[#fffdfa] border border-[#382b26]/20 focus:border-[#382b26] text-xs text-[#2b201b] resize-none focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STAGE C: SORT THE THOUGHTS                                */}
        {/* ========================================================= */}
        {session.stage === 'sort' && (
          <div className="space-y-5">
            {/* Listener Prompt */}
            <div className="p-4 rounded-2xl bg-[#f5ede4] border border-[#382b26]/15 flex items-start gap-3 shadow-sm">
              <span className="text-xl mt-0.5">🪨</span>
              <div className="space-y-1">
                <p className="text-xs sm:text-sm text-[#382b26] font-medium leading-relaxed">
                  &ldquo;Thoughts can feel heavy when they are all jumbled together. Let&apos;s gently place them into three quiet piles. Nothing is sorted automatically—you decide where each card belongs.&rdquo;
                </p>
              </div>
            </div>

            {/* Add Thought Card Form */}
            <form onSubmit={handleAddCard} className="p-4 rounded-2xl bg-white border-2 border-[#382b26]/20 space-y-3 shadow-sm">
              <div className="space-y-1">
                <label htmlFor="new-card-input" className="text-xs font-bold text-[#382b26]">
                  ADD A THOUGHT CARD
                </label>
                <div className="flex gap-2">
                  <input
                    id="new-card-input"
                    type="text"
                    value={newCardText}
                    onChange={e => setNewCardText(e.target.value)}
                    placeholder="Enter a thought, action, or worry to sort..."
                    className="flex-1 px-3.5 py-2 rounded-xl bg-[#fffdfa] border border-[#382b26]/25 focus:border-[#382b26] text-xs sm:text-sm text-[#2b201b] focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!newCardText.trim()}
                    className="px-4 py-2 rounded-xl bg-[#382b26] hover:bg-[#523e37] disabled:opacity-40 text-white font-bold text-xs transition-colors flex-shrink-0"
                  >
                    + Add Card
                  </button>
                </div>
              </div>

              {/* Category Radio Selectors */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                <span className="text-[11px] font-bold text-[#78645b]">Sort into:</span>
                <button
                  type="button"
                  onClick={() => setNewCardCategory('influence')}
                  className={`px-3 py-1 rounded-full font-bold text-xs border transition-all ${
                    newCardCategory === 'influence'
                      ? 'bg-[#dcfce7] border-[#15803d] text-[#14532d] shadow-sm'
                      : 'bg-white border-[#382b26]/20 text-[#635147] hover:bg-[#f7f5ef]'
                  }`}
                >
                  🟢 I can influence this
                </button>
                <button
                  type="button"
                  onClick={() => setNewCardCategory('waiting')}
                  className={`px-3 py-1 rounded-full font-bold text-xs border transition-all ${
                    newCardCategory === 'waiting'
                      ? 'bg-[#fef9c3] border-[#a16207] text-[#713f12] shadow-sm'
                      : 'bg-white border-[#382b26]/20 text-[#635147] hover:bg-[#f7f5ef]'
                  }`}
                >
                  🟡 I&apos;m waiting on this
                </button>
                <button
                  type="button"
                  onClick={() => setNewCardCategory('uncontrollable')}
                  className={`px-3 py-1 rounded-full font-bold text-xs border transition-all ${
                    newCardCategory === 'uncontrollable'
                      ? 'bg-[#f1f5f9] border-[#475569] text-[#1e293b] shadow-sm'
                      : 'bg-white border-[#382b26]/20 text-[#635147] hover:bg-[#f7f5ef]'
                  }`}
                >
                  ⚪ I can&apos;t control this
                </button>
              </div>
            </form>

            {/* Quick Suggestion Chips from Notes */}
            {suggestedSnippets.length > 0 && (
              <div className="space-y-1.5 p-3 rounded-2xl bg-[#f5ede4]/70 border border-[#382b26]/10">
                <span className="text-[11px] font-bold text-[#78645b] uppercase tracking-wider">
                  Pull a thought from your written notes:
                </span>
                <div className="flex flex-wrap gap-2">
                  {suggestedSnippets.map((snippet, idx) => (
                    <div
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-[#382b26]/15 text-xs text-[#382b26]"
                    >
                      <span className="truncate max-w-[220px]" title={snippet}>
                        &ldquo;{snippet}&rdquo;
                      </span>
                      <button
                        type="button"
                        onClick={() => handleAddSnippetAsCard(snippet, 'influence')}
                        className="px-1.5 py-0.5 rounded bg-[#dcfce7] text-[#14532d] hover:bg-[#bbf7d0] font-bold text-[10px]"
                        title="Add to 'I can influence'"
                      >
                        + Influence
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddSnippetAsCard(snippet, 'uncontrollable')}
                        className="px-1.5 py-0.5 rounded bg-[#f1f5f9] text-[#1e293b] hover:bg-[#e2e8f0] font-bold text-[10px]"
                        title="Add to 'Can't control'"
                      >
                        + Can&apos;t Control
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3 Categories Layout */}
            <div className="space-y-4">
              {/* Category 1: I Can Influence This */}
              <div className="p-4 rounded-2xl bg-[#f0fdf4] border-2 border-[#86efac]/80 space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#16a34a]" />
                    <h3 className="text-xs font-bold text-[#14532d] uppercase tracking-wider">
                      1. I can influence this ({influenceCards.length})
                    </h3>
                  </div>
                  <span className="text-[10px] text-[#166534] font-medium">
                    Actions, boundaries, choices, things I can communicate
                  </span>
                </div>

                {influenceCards.length === 0 ? (
                  <p className="text-xs text-[#15803d]/70 italic py-1">
                    No items here yet. What is one small thing you can decide or choose?
                  </p>
                ) : (
                  <div className="space-y-2">
                    {influenceCards.map(card => (
                      <div
                        key={card.id}
                        className="p-3 rounded-xl bg-white border border-[#86efac] flex items-center justify-between gap-3 shadow-xs"
                      >
                        {editingCardId === card.id ? (
                          <div className="flex-1 flex gap-2">
                            <input
                              type="text"
                              value={editingCardText}
                              onChange={e => setEditingCardText(e.target.value)}
                              className="flex-1 px-2.5 py-1 text-xs border rounded-lg focus:outline-none"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveEditCard(card.id)}
                              className="px-2 py-1 rounded bg-[#16a34a] text-white text-xs font-bold"
                            >
                              Save
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs font-medium text-[#2b201b] flex-1 leading-snug">
                            {card.text}
                          </span>
                        )}

                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => handleMoveCard(card.id, 'waiting')}
                            className="px-2 py-0.5 rounded-lg bg-[#fef9c3] hover:bg-[#fef08a] text-[#713f12] text-[10px] font-bold"
                            title="Move to 'Waiting on this'"
                          >
                            ➔ Waiting
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveCard(card.id, 'uncontrollable')}
                            className="px-2 py-0.5 rounded-lg bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#1e293b] text-[10px] font-bold"
                            title="Move to 'Can't control'"
                          >
                            ➔ Can&apos;t control
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStartEditCard(card)}
                            className="p-1 rounded text-[#78645b] hover:text-[#382b26] text-xs font-bold"
                            title="Edit card"
                          >
                            ✎
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCard(card.id)}
                            className="p-1 rounded text-[#a8968d] hover:text-[#b91c1c] text-xs font-bold"
                            title="Remove card"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Category 2: I'm Waiting On This */}
              <div className="p-4 rounded-2xl bg-[#fefce8] border-2 border-[#fde047]/80 space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#ca8a04]" />
                    <h3 className="text-xs font-bold text-[#713f12] uppercase tracking-wider">
                      2. I&apos;m waiting on this ({waitingCards.length})
                    </h3>
                  </div>
                  <span className="text-[10px] text-[#854d0e] font-medium">
                    Responses, upcoming events, or missing information
                  </span>
                </div>

                {waitingCards.length === 0 ? (
                  <p className="text-xs text-[#a16207]/70 italic py-1">
                    No items here yet. Is there an answer or date you are waiting to learn?
                  </p>
                ) : (
                  <div className="space-y-2">
                    {waitingCards.map(card => (
                      <div
                        key={card.id}
                        className="p-3 rounded-xl bg-white border border-[#fde047] flex items-center justify-between gap-3 shadow-xs"
                      >
                        {editingCardId === card.id ? (
                          <div className="flex-1 flex gap-2">
                            <input
                              type="text"
                              value={editingCardText}
                              onChange={e => setEditingCardText(e.target.value)}
                              className="flex-1 px-2.5 py-1 text-xs border rounded-lg focus:outline-none"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveEditCard(card.id)}
                              className="px-2 py-1 rounded bg-[#ca8a04] text-white text-xs font-bold"
                            >
                              Save
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs font-medium text-[#2b201b] flex-1 leading-snug">
                            {card.text}
                          </span>
                        )}

                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => handleMoveCard(card.id, 'influence')}
                            className="px-2 py-0.5 rounded-lg bg-[#dcfce7] hover:bg-[#bbf7d0] text-[#14532d] text-[10px] font-bold"
                            title="Move to 'I can influence'"
                          >
                            ➔ Influence
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveCard(card.id, 'uncontrollable')}
                            className="px-2 py-0.5 rounded-lg bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#1e293b] text-[10px] font-bold"
                            title="Move to 'Can't control'"
                          >
                            ➔ Can&apos;t control
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStartEditCard(card)}
                            className="p-1 rounded text-[#78645b] hover:text-[#382b26] text-xs font-bold"
                            title="Edit card"
                          >
                            ✎
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCard(card.id)}
                            className="p-1 rounded text-[#a8968d] hover:text-[#b91c1c] text-xs font-bold"
                            title="Remove card"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Category 3: I Can't Control This */}
              <div className="p-4 rounded-2xl bg-[#f8fafc] border-2 border-[#cbd5e1] space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#64748b]" />
                    <h3 className="text-xs font-bold text-[#1e293b] uppercase tracking-wider">
                      3. I can&apos;t control this ({uncontrollableCards.length})
                    </h3>
                  </div>
                  <span className="text-[10px] text-[#475569] font-medium">
                    Other people&apos;s choices, the past, external outcomes
                  </span>
                </div>

                {uncontrollableCards.length === 0 ? (
                  <p className="text-xs text-[#64748b]/70 italic py-1">
                    No items here yet. What part of this belongs to someone else or the past?
                  </p>
                ) : (
                  <div className="space-y-2">
                    {uncontrollableCards.map(card => (
                      <div
                        key={card.id}
                        className="p-3 rounded-xl bg-white border border-[#cbd5e1] flex items-center justify-between gap-3 shadow-xs"
                      >
                        {editingCardId === card.id ? (
                          <div className="flex-1 flex gap-2">
                            <input
                              type="text"
                              value={editingCardText}
                              onChange={e => setEditingCardText(e.target.value)}
                              className="flex-1 px-2.5 py-1 text-xs border rounded-lg focus:outline-none"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveEditCard(card.id)}
                              className="px-2 py-1 rounded bg-[#475569] text-white text-xs font-bold"
                            >
                              Save
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs font-medium text-[#2b201b] flex-1 leading-snug">
                            {card.text}
                          </span>
                        )}

                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => handleMoveCard(card.id, 'influence')}
                            className="px-2 py-0.5 rounded-lg bg-[#dcfce7] hover:bg-[#bbf7d0] text-[#14532d] text-[10px] font-bold"
                            title="Move to 'I can influence'"
                          >
                            ➔ Influence
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveCard(card.id, 'waiting')}
                            className="px-2 py-0.5 rounded-lg bg-[#fef9c3] hover:bg-[#fef08a] text-[#713f12] text-[10px] font-bold"
                            title="Move to 'Waiting on this'"
                          >
                            ➔ Waiting
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStartEditCard(card)}
                            className="p-1 rounded text-[#78645b] hover:text-[#382b26] text-xs font-bold"
                            title="Edit card"
                          >
                            ✎
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCard(card.id)}
                            className="p-1 rounded text-[#a8968d] hover:text-[#b91c1c] text-xs font-bold"
                            title="Remove card"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STAGE D: LEAVE WITH CLARITY                              */}
        {/* ========================================================= */}
        {session.stage === 'clarity' && (
          <div className="space-y-5">
            {/* Listener Prompt */}
            <div className="p-4 rounded-2xl bg-[#f5ede4] border border-[#382b26]/15 flex items-start gap-3 shadow-sm">
              <span className="text-xl mt-0.5">🌸</span>
              <div className="space-y-1">
                <p className="text-xs sm:text-sm text-[#382b26] font-medium leading-relaxed">
                  &ldquo;You gave your thoughts some space today. Here is what you sorted. You do not need to resolve everything all at once.&rdquo;
                </p>
                <p className="text-[11px] text-[#78645b]">
                  Choose any of the three endings below. All three are completely valid.
                </p>
              </div>
            </div>

            {/* Summary Review Grid */}
            <div className="space-y-3">
              {/* Core note snippet */}
              {session.initialThought.trim() && (
                <div className="p-3.5 rounded-2xl bg-white border border-[#382b26]/15 space-y-1 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#78645b] uppercase tracking-wider">
                      What was on your mind:
                    </span>
                    <button
                      type="button"
                      onClick={() => setStage('let-it-out')}
                      className="text-[11px] font-bold text-[#14532d] hover:underline"
                    >
                      Edit
                    </button>
                  </div>
                  <p className="text-xs text-[#2b201b] leading-relaxed">
                    {session.initialThought}
                  </p>
                </div>
              )}

              {/* What I can influence */}
              <div className="p-3.5 rounded-2xl bg-[#f0fdf4] border border-[#86efac] space-y-2 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#14532d] uppercase tracking-wider flex items-center gap-1.5">
                    <span>🟢</span> What you can influence ({influenceCards.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => setStage('sort')}
                    className="text-[11px] font-bold text-[#14532d] hover:underline"
                  >
                    Adjust
                  </button>
                </div>
                {influenceCards.length === 0 ? (
                  <p className="text-xs text-[#15803d]/70 italic">None listed</p>
                ) : (
                  <ul className="text-xs text-[#2b201b] space-y-1 pl-4 list-disc marker:text-[#16a34a]">
                    {influenceCards.map(c => (
                      <li key={c.id}>{c.text}</li>
                    ))}
                  </ul>
                )}
              </div>

              {/* What remains uncertain or outside control */}
              <div className="p-3.5 rounded-2xl bg-[#fffdfa] border border-[#cbd5e1] space-y-2 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#475569] uppercase tracking-wider flex items-center gap-1.5">
                    <span>⚪</span> What you wait on or cannot control ({waitingCards.length + uncontrollableCards.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => setStage('sort')}
                    className="text-[11px] font-bold text-[#475569] hover:underline"
                  >
                    Adjust
                  </button>
                </div>
                {waitingCards.length + uncontrollableCards.length === 0 ? (
                  <p className="text-xs text-[#64748b]/70 italic">None listed</p>
                ) : (
                  <ul className="text-xs text-[#2b201b] space-y-1 pl-4 list-disc marker:text-[#94a3b8]">
                    {waitingCards.map(c => (
                      <li key={c.id}>
                        <span className="text-[#a16207] font-semibold">[Waiting]</span> {c.text}
                      </li>
                    ))}
                    {uncontrollableCards.map(c => (
                      <li key={c.id}>
                        <span className="text-[#475569] font-semibold">[Can&apos;t control]</span> {c.text}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Three Equally Valid Endings */}
            <div className="p-4 rounded-2xl bg-white border-2 border-[#382b26]/20 space-y-3 shadow-sm">
              <span className="text-xs font-bold text-[#382b26] uppercase tracking-wider block">
                HOW WOULD YOU LIKE TO LEAVE THIS FOR NOW?
              </span>

              <div className="grid grid-cols-1 gap-2.5">
                {/* Option 1: Take a small step */}
                <label
                  className={`p-3 rounded-xl border-2 flex flex-col gap-1.5 cursor-pointer transition-all ${
                    session.endingType === 'small-step'
                      ? 'bg-[#f0fdf4] border-[#16a34a] text-[#14532d]'
                      : 'bg-white border-[#382b26]/15 hover:bg-[#fff9f2]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="ending-choice"
                      checked={session.endingType === 'small-step'}
                      onChange={() => {
                        soundEngine.playGumdropPop(520);
                        setSession(prev => ({ ...prev, endingType: 'small-step', updatedAt: Date.now() }));
                      }}
                      className="accent-[#16a34a]"
                    />
                    <span className="text-xs font-bold">1. Take a small step</span>
                  </div>
                  <p className="text-[11px] text-[#78645b] pl-5">
                    Choose one realistic action or boundary when you are ready.
                  </p>
                  {session.endingType === 'small-step' && (
                    <div className="pl-5 pt-1">
                      <input
                        type="text"
                        value={session.chosenStep}
                        onChange={e =>
                          setSession(prev => ({
                            ...prev,
                            chosenStep: e.target.value,
                            updatedAt: Date.now(),
                          }))
                        }
                        placeholder="e.g. Write a calm text, sleep on it, drink a glass of water..."
                        className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#16a34a]/40 text-xs text-[#2b201b] focus:outline-none"
                      />
                    </div>
                  )}
                </label>

                {/* Option 2: Think about it later */}
                <label
                  className={`p-3 rounded-xl border-2 flex flex-col gap-1 cursor-pointer transition-all ${
                    session.endingType === 'think-later'
                      ? 'bg-[#fefce8] border-[#ca8a04] text-[#713f12]'
                      : 'bg-white border-[#382b26]/15 hover:bg-[#fff9f2]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="ending-choice"
                      checked={session.endingType === 'think-later'}
                      onChange={() => {
                        soundEngine.playGumdropPop(520);
                        setSession(prev => ({ ...prev, endingType: 'think-later', updatedAt: Date.now() }));
                      }}
                      className="accent-[#ca8a04]"
                    />
                    <span className="text-xs font-bold">2. Think about it later</span>
                  </div>
                  <p className="text-[11px] text-[#78645b] pl-5">
                    Save your sorted reflection in your browser to return when you have more energy.
                  </p>
                </label>

                {/* Option 3: Leave it here for now */}
                <label
                  className={`p-3 rounded-xl border-2 flex flex-col gap-1 cursor-pointer transition-all ${
                    session.endingType === 'leave-here'
                      ? 'bg-[#f1f5f9] border-[#475569] text-[#1e293b]'
                      : 'bg-white border-[#382b26]/15 hover:bg-[#fff9f2]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="ending-choice"
                      checked={session.endingType === 'leave-here'}
                      onChange={() => {
                        soundEngine.playGumdropPop(520);
                        setSession(prev => ({ ...prev, endingType: 'leave-here', updatedAt: Date.now() }));
                      }}
                      className="accent-[#475569]"
                    />
                    <span className="text-xs font-bold">3. Leave it here for now</span>
                  </div>
                  <p className="text-[11px] text-[#78645b] pl-5">
                    Set these thoughts down by the pond without taking any action or feeling pressured to fix them.
                  </p>
                </label>
              </div>
            </div>

            {/* End Actions: Save, Copy, Finish */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#382b26]/10">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveToJournal}
                  className="px-3.5 py-2 rounded-xl bg-white border border-[#382b26]/30 hover:bg-[#f7f5ef] text-xs font-bold text-[#382b26] transition-colors shadow-xs"
                >
                  {hasSavedHistory ? '✓ Saved to Journal' : '💾 Save Reflection'}
                </button>
                <button
                  type="button"
                  onClick={handleCopySummary}
                  className="px-3.5 py-2 rounded-xl bg-white border border-[#382b26]/30 hover:bg-[#f7f5ef] text-xs font-bold text-[#382b26] transition-colors shadow-xs"
                >
                  {copiedSummary ? '✓ Copied to Clipboard' : '📋 Copy Summary'}
                </button>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-[#382b26] hover:bg-[#523e37] text-white font-bold text-xs transition-colors shadow-sm"
              >
                Return to Valley
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. Bottom Navigation Action Footer */}
      <div className="px-5 py-3 bg-[#f5ede4] border-t-2 border-[#382b26] flex items-center justify-between gap-3">
        {currentStageIndex > 0 ? (
          <button
            type="button"
            onClick={() => setStage(STAGE_ORDER[currentStageIndex - 1])}
            className="px-4 py-2 rounded-xl bg-white border border-[#382b26]/30 hover:bg-[#ede5dc] font-bold text-xs text-[#382b26] transition-colors"
          >
            ◄ Back
          </button>
        ) : (
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white border border-[#382b26]/30 hover:bg-[#ede5dc] font-bold text-xs text-[#78645b] transition-colors"
          >
            Leave without saving
          </button>
        )}

        {currentStageIndex < STAGE_ORDER.length - 1 ? (
          <div className="flex items-center gap-2">
            {session.stage === 'let-it-out' && (
              <button
                type="button"
                onClick={() => setStage('sort')}
                className="text-[11px] font-bold text-[#78645b] hover:text-[#382b26] underline"
              >
                Skip to Sorting
              </button>
            )}
            <button
              type="button"
              onClick={() => setStage(STAGE_ORDER[currentStageIndex + 1])}
              className="px-5 py-2 rounded-xl bg-[#2e5939] hover:bg-[#23432b] text-white font-bold text-xs transition-colors shadow-sm flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-[#382b26]"
            >
              <span>Next</span>
              <span>➔</span>
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#2e5939] hover:bg-[#23432b] text-white font-bold text-xs transition-colors shadow-sm focus-visible:ring-2 focus-visible:ring-[#382b26]"
          >
            Complete Reflection
          </button>
        )}
      </div>

      {/* ========================================================= */}
      {/* MODAL 1: PRIVACY & LOCAL STORAGE CONTROLS                 */}
      {/* ========================================================= */}
      {showPrivacyModal && (
        <div
          className="absolute inset-0 z-50 bg-[#1a130f]/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowPrivacyModal(false)}
        >
          <div
            className="bg-[#fffdf8] border-2 border-[#382b26] rounded-3xl p-5 max-w-md w-full shadow-2xl space-y-4 text-[#2b201b]"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#382b26]/15 pb-2">
              <h3 className="text-sm font-bold text-[#382b26] flex items-center gap-2">
                <span>🔒</span> Privacy &amp; Local Storage Notice
              </h3>
              <button
                type="button"
                onClick={() => setShowPrivacyModal(false)}
                className="w-6 h-6 rounded-full bg-[#382b26]/10 flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 text-xs leading-relaxed text-[#4a3932]">
              <p>
                <strong>100% on your device:</strong> Your reflections are stored strictly in your browser&apos;s local storage. They are never sent to external servers, cloud databases, analytics trackers, or third-party AI services.
              </p>
              <p>
                <strong>Unencrypted notice:</strong> Browser local storage is convenient but unencrypted. Anyone with access to this browser profile or device may be able to read saved data. Avoid saving highly sensitive credentials or private secrets.
              </p>
              <p>
                <strong>Your control:</strong> You can discard your active draft or permanently delete all saved reflections anytime using the controls below.
              </p>
            </div>

            <div className="pt-2 border-t border-[#382b26]/15 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowPrivacyModal(false);
                  setShowClearConfirm(true);
                }}
                className="px-3 py-1.5 rounded-xl border border-[#dc2626]/40 text-[#dc2626] hover:bg-[#fef2f2] text-xs font-bold transition-colors"
              >
                Erase All Listener Data
              </button>
              <button
                type="button"
                onClick={() => setShowPrivacyModal(false)}
                className="px-4 py-1.5 rounded-xl bg-[#382b26] text-white text-xs font-bold"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: CONFIRM CLEAR ALL DATA                           */}
      {/* ========================================================= */}
      {showClearConfirm && (
        <div
          className="absolute inset-0 z-50 bg-[#1a130f]/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowClearConfirm(false)}
        >
          <div
            className="bg-[#fffdf8] border-2 border-[#b91c1c] rounded-3xl p-5 max-w-sm w-full shadow-2xl space-y-3 text-[#2b201b]"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 text-[#b91c1c]">
              <span className="text-xl">⚠️</span>
              <h3 className="text-sm font-bold">Clear All Reflection Data?</h3>
            </div>
            <p className="text-xs text-[#4a3932] leading-relaxed">
              This will permanently erase your current reflection draft and all past entries saved in Listener&apos;s quiet journal on this browser.
            </p>
            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="px-3.5 py-1.5 rounded-xl border border-[#382b26]/30 text-xs font-bold text-[#382b26] hover:bg-[#ede5dc]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClearAllData}
                className="px-4 py-1.5 rounded-xl bg-[#b91c1c] hover:bg-[#991b1b] text-white text-xs font-bold shadow-sm"
              >
                Permanently Erase
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: CRISIS & HUMAN SUPPORT RESOURCES                 */}
      {/* ========================================================= */}
      {showCrisisModal && (
        <div
          className="absolute inset-0 z-50 bg-[#1a130f]/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowCrisisModal(false)}
        >
          <div
            className="bg-[#fffdf8] border-2 border-[#382b26] rounded-3xl p-5 max-w-md w-full shadow-2xl space-y-4 text-[#2b201b]"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#382b26]/15 pb-2">
              <h3 className="text-sm font-bold text-[#382b26] flex items-center gap-2">
                <span>🤍</span> Human Support &amp; Crisis Resources
              </h3>
              <button
                type="button"
                onClick={() => setShowCrisisModal(false)}
                className="w-6 h-6 rounded-full bg-[#382b26]/10 flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 text-xs leading-relaxed text-[#4a3932]">
              <p>
                <strong>You are never alone:</strong> Listener is a quiet reflective companion, but cannot replace genuine human care, trusted adults, or medical professionals.
              </p>
              <p>
                If you or someone you know is going through a difficult time or facing an immediate crisis, please connect with someone who can support you directly:
              </p>

              <div className="p-3 rounded-xl bg-[#f5ede4] border border-[#382b26]/15 space-y-1.5 text-[11px]">
                <div>
                  <strong>United States &amp; Canada:</strong> Call or text <strong>988</strong> (Suicide &amp; Crisis Lifeline, free &amp; confidential 24/7).
                </div>
                <div>
                  <strong>Crisis Text Line:</strong> Text <strong>HOME</strong> to <strong>741741</strong>.
                </div>
                <div>
                  <strong>United Kingdom:</strong> Call <strong>111</strong> (NHS) or <strong>116 123</strong> (Samaritans).
                </div>
                <div>
                  <strong>International:</strong> Visit <span className="font-semibold underline">befrienders.org</span> or <span className="font-semibold underline">findahelpline.com</span> to find free, local, confidential help worldwide.
                </div>
              </div>

              <p className="text-[11px] text-[#78645b]">
                Talking to a trusted family member, close friend, counselor, or teacher is often the strongest first step.
              </p>
            </div>

            <div className="pt-2 border-t border-[#382b26]/15 flex justify-end">
              <button
                type="button"
                onClick={() => setShowCrisisModal(false)}
                className="px-4 py-1.5 rounded-xl bg-[#382b26] text-white text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
