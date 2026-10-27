import React, { useState, useEffect, useCallback } from 'react';
import type { StudentSession, UnderstandingLevel, CompletedLessonRecord } from '../../types/activity';
import { soundEngine } from '../../audio/soundEngine';

const STORAGE_SESSION_KEY = 'gummy_student_session';
const STORAGE_HISTORY_KEY = 'gummy_student_history';

const SUGGESTED_TOPICS = [
  'Photosynthesis',
  'How Airplanes Fly',
  'Event Loops in Code',
  'Supply and Demand',
  'Why the Sky is Blue',
  'The Doppler Effect',
];

const INITIAL_SECTIONS: StudentSession['sections'] = {
  concept: {
    id: 'concept',
    title: '1. Simple Concept',
    prompt: 'Explain what this is in your own words, as if teaching a beginner.',
    helperText: 'Avoid technical jargon. If you can explain it simply, you understand it deeply.',
    studentQuestion: 'What does this idea actually mean in plain, everyday language?',
    userInput: '',
    understanding: 'confident',
  },
  mechanism: {
    id: 'mechanism',
    title: '2. How it Works',
    prompt: 'What is the cause-and-effect mechanism behind it?',
    helperText: "Focus on the step-by-step 'why'. What makes it tick under the surface?",
    studentQuestion: 'What happens first, and what causes the next step to happen?',
    userInput: '',
    understanding: 'confident',
  },
  analogy: {
    id: 'analogy',
    title: '3. Everyday Analogy',
    prompt: 'Provide a real-world example or comparison.',
    helperText: 'Compare it to something familiar from nature or daily life to create a vivid mental image.',
    studentQuestion: 'What is an everyday comparison that makes this click instantly?',
    userInput: '',
    understanding: 'confident',
  },
  connection: {
    id: 'connection',
    title: '4. Connections & Questions',
    prompt: 'Connect this to another concept and note what you still wonder about.',
    helperText: 'Knowledge is a web. What does this relate to, and where does your curiosity lead next?',
    studentQuestion: 'How does this tie into something else you know, and what remains mysterious?',
    userInput: '',
    understanding: 'confident',
  },
};

interface StudentNotebookProps {
  onClose: () => void;
}

export const StudentNotebook: React.FC<StudentNotebookProps> = ({ onClose }) => {
  // Load initial session or create fresh
  const [session, setSession] = useState<StudentSession>(() => {
    let base: StudentSession = {
      id: `lesson-${Date.now()}`,
      topic: '',
      currentStep: 0,
      sections: { ...INITIAL_SECTIONS },
      startedAt: Date.now(),
      updatedAt: Date.now(),
      isCompleted: false,
    };
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_SESSION_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.sections) {
            base = parsed;
          }
        }
      } catch {}

      const p = new URLSearchParams(window.location.search);
      const stepParam = p.get('step');
      if (stepParam !== null) {
        const stepNum = parseInt(stepParam, 10);
        if (!isNaN(stepNum) && stepNum >= 0 && stepNum <= 5) {
          base = {
            ...base,
            topic: base.topic || 'Photosynthesis',
            currentStep: stepNum,
            sections:
              stepNum === 5 && !base.sections.concept.userInput
                ? {
                    concept: {
                      ...base.sections.concept,
                      userInput:
                        'Plants take light from the sun, water from the soil, and carbon dioxide from the air to make their own food (sugar) while releasing clean oxygen for us to breathe.',
                      understanding: 'confident',
                    },
                    mechanism: {
                      ...base.sections.mechanism,
                      userInput:
                        'Chlorophyll molecules inside chloroplasts absorb photons. Light reactions split water into protons and oxygen, synthesizing ATP and NADPH. The Calvin cycle then uses these energy carriers to fix CO2 into glucose.',
                      understanding: 'revisit',
                    },
                    analogy: {
                      ...base.sections.analogy,
                      userInput:
                        'Think of a leaf as a miniature solar bakery: sunlight is the oven heat, water and carbon dioxide are the raw flour and water, and the loaf coming out of the oven is sweet energy glucose.',
                      understanding: 'confident',
                    },
                    connection: {
                      ...base.sections.connection,
                      userInput:
                        'Connects to cellular respiration in animals, which is the exact reverse reaction! I still wonder how deep-sea hydrothermal vent creatures produce energy through chemosynthesis without any sunlight.',
                      understanding: 'revisit',
                    },
                  }
                : base.sections,
          };
        }
      }
    }
    return base;
  });

  const [hasSavedHistory, setHasSavedHistory] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);

  // Sync session changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(session));
    } catch {}
  }, [session]);

  const updateSectionInput = (sectionId: keyof StudentSession['sections'], value: string) => {
    setSession(prev => ({
      ...prev,
      updatedAt: Date.now(),
      sections: {
        ...prev.sections,
        [sectionId]: {
          ...prev.sections[sectionId],
          userInput: value,
        },
      },
    }));
  };

  const updateSectionUnderstanding = (
    sectionId: keyof StudentSession['sections'],
    level: UnderstandingLevel
  ) => {
    soundEngine.playGumdropPop(520);
    setSession(prev => ({
      ...prev,
      updatedAt: Date.now(),
      sections: {
        ...prev.sections,
        [sectionId]: {
          ...prev.sections[sectionId],
          understanding: level,
        },
      },
    }));
  };

  const handleStartTopic = (topicName: string) => {
    if (!topicName.trim()) return;
    soundEngine.playFlowerChime();
    setSession(prev => ({
      ...prev,
      topic: topicName.trim(),
      currentStep: 1,
      updatedAt: Date.now(),
    }));
  };

  const handleNextStep = () => {
    soundEngine.playLeafRustle();
    setSession(prev => {
      const next = prev.currentStep + 1;
      return {
        ...prev,
        currentStep: next,
        isCompleted: next >= 5,
        updatedAt: Date.now(),
      };
    });
  };

  const handlePrevStep = () => {
    soundEngine.playLeafRustle();
    setSession(prev => ({
      ...prev,
      currentStep: Math.max(0, prev.currentStep - 1),
      updatedAt: Date.now(),
    }));
  };

  const handleJumpToStep = (stepIdx: number) => {
    soundEngine.playLeafRustle();
    setSession(prev => ({
      ...prev,
      currentStep: stepIdx,
      updatedAt: Date.now(),
    }));
  };

  const handleSaveToNotebook = useCallback(() => {
    soundEngine.playFlowerChime();
    const confidentItems: string[] = [];
    const revisitItems: string[] = [];

    (Object.keys(session.sections) as (keyof StudentSession['sections'])[]).forEach(key => {
      const sec = session.sections[key];
      if (sec.understanding === 'confident') {
        confidentItems.push(sec.title);
      } else {
        revisitItems.push(`${sec.title}: ${sec.studentQuestion}`);
      }
    });

    const record: CompletedLessonRecord = {
      id: session.id,
      topic: session.topic,
      completedAt: Date.now(),
      confidentCount: confidentItems.length,
      revisitCount: revisitItems.length,
      summary: {
        concept: session.sections.concept.userInput,
        mechanism: session.sections.mechanism.userInput,
        analogy: session.sections.analogy.userInput,
        connection: session.sections.connection.userInput,
      },
      revisitItems,
    };

    try {
      const raw = localStorage.getItem(STORAGE_HISTORY_KEY);
      const list: CompletedLessonRecord[] = raw ? JSON.parse(raw) : [];
      const updated = [record, ...list.filter(item => item.id !== record.id)];
      localStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(updated.slice(0, 20)));
      setHasSavedHistory(true);
    } catch {}
  }, [session]);

  const handleClearSession = () => {
    if (window.confirm("Clear this study notebook and start fresh with a new topic?")) {
      try {
        localStorage.removeItem(STORAGE_SESSION_KEY);
      } catch {}
      setSession({
        id: `lesson-${Date.now()}`,
        topic: '',
        currentStep: 0,
        sections: { ...INITIAL_SECTIONS },
        startedAt: Date.now(),
        updatedAt: Date.now(),
        isCompleted: false,
      });
      setHasSavedHistory(false);
      setCopiedSummary(false);
    }
  };

  const handleCopySummary = () => {
    const markdown = `# Study Summary: ${session.topic}
*Learned with Student Gumdrop on ${new Date(session.updatedAt).toLocaleDateString()}*

## 1. Simple Concept
${session.sections.concept.userInput || '*(Not recorded)*'}
- Status: ${session.sections.concept.understanding === 'confident' ? '🟢 Confident' : '🟡 Revisit'}

## 2. Underlying Mechanism
${session.sections.mechanism.userInput || '*(Not recorded)*'}
- Status: ${session.sections.mechanism.understanding === 'confident' ? '🟢 Confident' : '🟡 Revisit'}

## 3. Real-World Analogy
${session.sections.analogy.userInput || '*(Not recorded)*'}
- Status: ${session.sections.analogy.understanding === 'confident' ? '🟢 Confident' : '🟡 Revisit'}

## 4. Connections & Questions
${session.sections.connection.userInput || '*(Not recorded)*'}
- Status: ${session.sections.connection.understanding === 'confident' ? '🟢 Confident' : '🟡 Revisit'}
`;
    navigator.clipboard?.writeText(markdown);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  // Section keys list
  const sectionKeys: (keyof StudentSession['sections'])[] = ['concept', 'mechanism', 'analogy', 'connection'];

  return (
    <div
      className="relative w-full max-w-2xl bg-[#fffdfa] border-2 border-[#382b26] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] text-[#2b201b]"
      style={{
        boxShadow: '0 20px 50px rgba(40, 28, 22, 0.35)',
      }}
      onClick={e => e.stopPropagation()}
      onPointerDown={e => e.stopPropagation()}
    >
      {/* ─── Header: Student Character Banner & Close ─── */}
      <div className="bg-[#f5eee3] border-b-2 border-[#382b26]/20 px-5 py-3.5 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          {/* Student Vector Icon Avatar */}
          <div className="w-10 h-10 rounded-2xl bg-[#9aa8db] border-2 border-[#382b26] flex items-center justify-center shadow-sm relative flex-shrink-0">
            <svg width="28" height="24" viewBox="0 0 100 80" className="overflow-visible">
              <path
                d="M 12 70 C 12 28, 28 8, 50 8 C 72 8, 88 28, 88 70 C 88 74, 12 74, 12 70 Z"
                fill="#b5c0e6"
                stroke="#382b26"
                strokeWidth="6"
              />
              {/* Brass Spectacles */}
              <circle cx="36" cy="38" r="14" fill="#ffffff" stroke="#d4af37" strokeWidth="4" />
              <circle cx="64" cy="38" r="14" fill="#ffffff" stroke="#d4af37" strokeWidth="4" />
              <line x1="50" y1="38" x2="50" y2="38" stroke="#d4af37" strokeWidth="4" />
              <circle cx="36" cy="38" r="4" fill="#382b26" />
              <circle cx="64" cy="38" r="4" fill="#382b26" />
            </svg>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-[#382b26] tracking-tight">
                Student&apos;s Study Notebook
              </h2>
              {session.topic && (
                <span className="px-2 py-0.5 rounded-full bg-[#dbe2f8] text-[#2c375c] text-[11px] font-bold">
                  {session.topic}
                </span>
              )}
            </div>
            <p className="text-xs text-[#78645b] font-medium">
              Teach Student a concept out loud to solidify your understanding
            </p>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-[#382b26]/5 hover:bg-[#382b26]/15 text-[#382b26] flex items-center justify-center font-bold text-sm transition-colors focus-visible:ring-2 focus-visible:ring-[#382b26] focus-visible:outline-none"
          title="Close notebook (progress is saved locally)"
          aria-label="Close notebook"
        >
          ✕
        </button>
      </div>

      {/* ─── Stepped Progress Indicator ─── */}
      {session.topic && (
        <div className="bg-[#faf5ec] border-b border-[#382b26]/10 px-5 py-2 flex items-center justify-between text-xs overflow-x-auto flex-shrink-0">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => handleJumpToStep(0)}
              className={`px-2 py-0.5 rounded-lg font-bold text-[11px] transition-colors ${
                session.currentStep === 0
                  ? 'bg-[#382b26] text-white'
                  : 'text-[#6b584f] hover:bg-[#ebdcc8]'
              }`}
            >
              Topic
            </button>

            {sectionKeys.map((key, idx) => {
              const stepNumber = idx + 1;
              const sec = session.sections[key];
              const isFilled = sec.userInput.trim().length > 0;
              const isCurrent = session.currentStep === stepNumber;

              return (
                <button
                  key={key}
                  onClick={() => handleJumpToStep(stepNumber)}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-lg font-bold text-[11px] transition-colors ${
                    isCurrent
                      ? 'bg-[#382b26] text-white'
                      : isFilled
                      ? 'bg-[#e2edd8] text-[#2d521d] hover:bg-[#d4e4c7]'
                      : 'text-[#6b584f] hover:bg-[#ebdcc8]'
                  }`}
                  title={sec.title}
                >
                  <span>{stepNumber}</span>
                  {isFilled && (
                    <span className="text-[10px]">
                      {sec.understanding === 'confident' ? '🟢' : '🟡'}
                    </span>
                  )}
                </button>
              );
            })}

            <button
              onClick={() => handleJumpToStep(5)}
              className={`px-2 py-0.5 rounded-lg font-bold text-[11px] transition-colors ${
                session.currentStep === 5
                  ? 'bg-[#382b26] text-white'
                  : 'text-[#6b584f] hover:bg-[#ebdcc8]'
              }`}
            >
              Summary
            </button>
          </div>

          <button
            onClick={handleClearSession}
            className="text-[11px] text-[#9c8479] hover:text-[#b71c1c] font-semibold transition-colors ml-2 flex-shrink-0"
            title="Reset and start a new topic"
          >
            Clear / New
          </button>
        </div>
      )}

      {/* ─── Main Content Area (Scrollable) ─── */}
      <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
        {/* ════════════════════════════════════════════════════════════════
            STEP 0: PICK A TOPIC TO TEACH
        ════════════════════════════════════════════════════════════════ */}
        {session.currentStep === 0 && (
          <div className="space-y-4">
            <div className="bg-[#f0f4fa] border-2 border-[#b5c0e6] rounded-2xl p-4 flex gap-3 items-start">
              <span className="text-2xl select-none">✏️</span>
              <div>
                <p className="text-sm font-semibold text-[#2c375c] leading-relaxed">
                  &ldquo;I have my hand-stitched notebook ready! What concept, mechanism, or idea would
                  you like to teach me today?&rdquo;
                </p>
                <p className="text-xs text-[#52638f] mt-1">
                  Choose any concept from science, engineering, philosophy, math, or daily life.
                </p>
              </div>
            </div>

            <div>
              <label
                htmlFor="topic-input"
                className="block text-xs font-bold text-[#382b26] uppercase tracking-wider mb-1.5"
              >
                Subject or Concept to Teach
              </label>
              <div className="flex gap-2">
                <input
                  id="topic-input"
                  type="text"
                  value={session.topic}
                  onChange={e => setSession(prev => ({ ...prev, topic: e.target.value }))}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleStartTopic(session.topic);
                  }}
                  placeholder="e.g. How Airplanes Fly, Photosynthesis, Binary Search..."
                  className="flex-1 px-3.5 py-2.5 rounded-xl border-2 border-[#382b26]/30 bg-white text-sm text-[#2b201b] focus:border-[#382b26] focus:outline-none focus:ring-2 focus:ring-[#9aa8db]/50 placeholder-[#a39087]"
                />
                <button
                  onClick={() => handleStartTopic(session.topic)}
                  disabled={!session.topic.trim()}
                  className="px-5 py-2.5 rounded-xl bg-[#382b26] hover:bg-[#523e37] disabled:opacity-40 text-white font-bold text-sm transition-colors focus-visible:ring-2 focus-visible:ring-[#382b26] focus-visible:outline-none flex-shrink-0"
                >
                  Begin Lesson ➔
                </button>
              </div>
            </div>

            {/* Topic Ideas */}
            <div>
              <span className="text-xs font-bold text-[#78645b] block mb-2">
                Curious ideas to explore:
              </span>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_TOPICS.map(item => (
                  <button
                    key={item}
                    onClick={() => handleStartTopic(item)}
                    className="px-3 py-1.5 rounded-xl bg-[#f4ece1] hover:bg-[#e8decb] text-[#382b26] text-xs font-semibold border border-[#382b26]/15 transition-colors focus-visible:ring-2 focus-visible:ring-[#382b26] focus-visible:outline-none"
                  >
                    + {item}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════
            STEPS 1 to 4: THE FOUR PROMPTS
        ════════════════════════════════════════════════════════════════ */}
        {session.currentStep >= 1 && session.currentStep <= 4 && (
          (() => {
            const currentKey = sectionKeys[session.currentStep - 1];
            const sec = session.sections[currentKey];

            return (
              <div className="space-y-4">
                {/* Student's Prompt Card */}
                <div className="bg-[#f0f4fa] border-2 border-[#b5c0e6] rounded-2xl p-4 flex gap-3 items-start">
                  <span className="text-2xl select-none">👓</span>
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#2c375c] uppercase tracking-wider">
                        {sec.title} &bull; {session.topic}
                      </span>
                      <span className="text-[11px] text-[#52638f] font-mono font-medium">
                        Step {session.currentStep} of 4
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-[#2c375c] leading-snug">
                      &ldquo;{sec.studentQuestion}&rdquo;
                    </p>
                    <p className="text-xs text-[#52638f] leading-relaxed">
                      {sec.helperText}
                    </p>
                  </div>
                </div>

                {/* Explanation Textarea */}
                <div>
                  <label
                    htmlFor={`section-${currentKey}`}
                    className="block text-xs font-bold text-[#382b26] uppercase tracking-wider mb-1.5"
                  >
                    Your Explanation in Simple Words
                  </label>
                  <textarea
                    id={`section-${currentKey}`}
                    rows={5}
                    value={sec.userInput}
                    onChange={e => updateSectionInput(currentKey, e.target.value)}
                    placeholder="Write your explanation here as if talking directly to Student..."
                    className="w-full px-3.5 py-3 rounded-xl border-2 border-[#382b26]/30 bg-white text-sm leading-relaxed text-[#2b201b] focus:border-[#382b26] focus:outline-none focus:ring-2 focus:ring-[#9aa8db]/50 placeholder-[#a39087]"
                  />
                  <div className="flex justify-between items-center text-[11px] text-[#78645b] mt-1">
                    <span>
                      {sec.userInput.trim().length > 0
                        ? `${sec.userInput.trim().split(/\s+/).length} words`
                        : 'Take your time to write clearly.'}
                    </span>
                    <span>Self-assessment below</span>
                  </div>
                </div>

                {/* Confidence & Revisit Self-Assessment Controls */}
                <div className="bg-[#fbf7f0] border border-[#382b26]/15 rounded-2xl p-3.5 space-y-2">
                  <span className="block text-xs font-bold text-[#382b26]">
                    How confident are you with this part of the explanation?
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => updateSectionUnderstanding(currentKey, 'confident')}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border-2 text-xs font-bold transition-all ${
                        sec.understanding === 'confident'
                          ? 'border-[#2e7d32] bg-[#e8f5e9] text-[#1b5e20] shadow-sm'
                          : 'border-[#382b26]/20 bg-white hover:bg-[#f4ece1] text-[#5c4a40]'
                      }`}
                    >
                      <span className="text-base">🟢</span>
                      <div className="text-left">
                        <div>Clear & Confident</div>
                        <div className="text-[10px] font-normal opacity-80">
                          I can teach this smoothly
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => updateSectionUnderstanding(currentKey, 'revisit')}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border-2 text-xs font-bold transition-all ${
                        sec.understanding === 'revisit'
                          ? 'border-[#f57f17] bg-[#fffde7] text-[#f57f17] shadow-sm'
                          : 'border-[#382b26]/20 bg-white hover:bg-[#f4ece1] text-[#5c4a40]'
                      }`}
                    >
                      <span className="text-base">🟡</span>
                      <div className="text-left">
                        <div>Want to Revisit</div>
                        <div className="text-[10px] font-normal opacity-80">
                          Fuzzy or need to look up details
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={handlePrevStep}
                    className="px-4 py-2 rounded-xl border-2 border-[#382b26]/25 hover:bg-[#f4ece1] text-[#382b26] text-xs font-bold transition-colors"
                  >
                    ◀ Back
                  </button>

                  <button
                    onClick={handleNextStep}
                    disabled={sec.userInput.trim().length === 0}
                    className="px-5 py-2.5 rounded-xl bg-[#382b26] hover:bg-[#523e37] disabled:opacity-40 text-white font-bold text-xs transition-colors focus-visible:ring-2 focus-visible:ring-[#382b26] focus-visible:outline-none flex items-center gap-1.5"
                  >
                    <span>{session.currentStep === 4 ? 'Review Summary ➔' : 'Next Step ➔'}</span>
                  </button>
                </div>
              </div>
            );
          })()
        )}

        {/* ════════════════════════════════════════════════════════════════
            STEP 5: SUMMARY & REFLECTION LEDGER
        ════════════════════════════════════════════════════════════════ */}
        {session.currentStep === 5 && (
          <div className="space-y-5">
            {/* Celebration Note */}
            <div className="bg-[#eaf4ec] border-2 border-[#81c784] rounded-2xl p-4 flex gap-3 items-start">
              <span className="text-2xl select-none">🎉</span>
              <div>
                <h3 className="text-sm font-bold text-[#1b5e20]">
                  Notebook Entry Complete: &ldquo;{session.topic}&rdquo;
                </h3>
                <p className="text-xs text-[#2e7d32] mt-0.5 leading-relaxed">
                  Student Gumdrop jotted down every point in their notes. Review your self-reflections
                  below to see what is solid and what to revisit!
                </p>
              </div>
            </div>

            {/* Structured Insights Ledger */}
            <div className="border-2 border-[#382b26]/20 rounded-2xl bg-white divide-y divide-[#382b26]/10 overflow-hidden shadow-sm">
              {sectionKeys.map((key, i) => {
                const sec = session.sections[key];
                return (
                  <div key={key} className="p-4 space-y-1.5 hover:bg-[#faf6ee] transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#382b26]">
                          {sec.title}
                        </span>
                        <span
                          className={`px-2 py-0.2 rounded-full text-[10px] font-bold ${
                            sec.understanding === 'confident'
                              ? 'bg-[#e8f5e9] text-[#1b5e20]'
                              : 'bg-[#fffde7] text-[#f57f17]'
                          }`}
                        >
                          {sec.understanding === 'confident' ? '🟢 Confident' : '🟡 Revisit'}
                        </span>
                      </div>
                      <button
                        onClick={() => handleJumpToStep(i + 1)}
                        className="text-[11px] text-[#7084c7] hover:underline font-bold"
                      >
                        Edit
                      </button>
                    </div>

                    <p className="text-xs text-[#382b26] leading-relaxed whitespace-pre-wrap font-sans">
                      {sec.userInput || <em className="text-[#a39087]">No explanation entered yet.</em>}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Targeted Study Plan / Revisit Checklist */}
            {(() => {
              const revisitList = sectionKeys.filter(k => session.sections[k].understanding === 'revisit');
              const confidentList = sectionKeys.filter(k => session.sections[k].understanding === 'confident');

              return (
                <div className="bg-[#fbf7f0] border border-[#382b26]/20 rounded-2xl p-4 space-y-3">
                  <h4 className="text-xs font-bold text-[#382b26] uppercase tracking-wider flex items-center gap-1.5">
                    <span>📋</span>
                    <span>Your Learning Takeaway</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="bg-white border border-[#81c784]/40 rounded-xl p-3 space-y-1">
                      <div className="font-bold text-[#1b5e20] flex items-center gap-1">
                        <span>🟢 Solid Mastery ({confidentList.length})</span>
                      </div>
                      <p className="text-[11px] text-[#4a5e44] leading-snug">
                        {confidentList.length > 0
                          ? confidentList.map(k => session.sections[k].title).join(', ')
                          : 'No sections marked confident yet.'}
                      </p>
                    </div>

                    <div className="bg-white border border-[#f57f17]/40 rounded-xl p-3 space-y-1">
                      <div className="font-bold text-[#e65100] flex items-center gap-1">
                        <span>🟡 Next Study Focus ({revisitList.length})</span>
                      </div>
                      <p className="text-[11px] text-[#734f37] leading-snug">
                        {revisitList.length > 0
                          ? revisitList.map(k => session.sections[k].title).join(', ')
                          : 'Everything marked confident! Great job.'}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Action Cluster */}
            <div className="flex flex-wrap gap-2.5 items-center justify-between pt-1">
              <div className="flex gap-2">
                <button
                  onClick={handleSaveToNotebook}
                  className="px-4 py-2 rounded-xl bg-[#2e7d32] hover:bg-[#256629] text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <span>{hasSavedHistory ? '✓ Saved!' : '💾 Save Entry'}</span>
                </button>

                <button
                  onClick={handleCopySummary}
                  className="px-4 py-2 rounded-xl bg-[#f4ece1] hover:bg-[#e8decb] text-[#382b26] font-bold text-xs border border-[#382b26]/20 transition-colors"
                >
                  {copiedSummary ? '✓ Copied Markdown' : '📋 Copy Notes'}
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleClearSession}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-[#8d322b] hover:bg-[#fbeae8] transition-colors"
                >
                  Start New Topic
                </button>

                <button
                  onClick={onClose}
                  className="px-5 py-2 rounded-xl bg-[#382b26] hover:bg-[#523e37] text-white font-bold text-xs transition-colors shadow-sm"
                >
                  Return to Valley ➔
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
