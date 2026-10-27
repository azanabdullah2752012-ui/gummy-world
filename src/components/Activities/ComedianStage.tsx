import React, { useState } from 'react';
import type { DayNightState } from '../../types';
import type { ComedianState, AcrobaticMove } from '../../types/comedian';
import { VALLEY_RIDDLES, WHIMSICAL_PROPS } from '../../data/comedian';
import { soundEngine } from '../../audio/soundEngine';

interface ComedianStageProps {
  comedianState: ComedianState;
  dayNight: DayNightState;
  onToggleProp: (propId: string) => void;
  onSolveRiddle: (riddleId: string) => void;
  onPerformRoutine: (routine: AcrobaticMove[]) => void;
  onFocusStageInWorld: () => void;
  onClose: () => void;
}

export const ComedianStage: React.FC<ComedianStageProps> = ({
  comedianState,
  dayNight: _dayNight,
  onToggleProp,
  onSolveRiddle,
  onPerformRoutine,
  onFocusStageInWorld,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'riddles' | 'acrobatics' | 'props'>('riddles');
  const [riddleIndex, setRiddleIndex] = useState(comedianState.activeRiddleIndex || 0);
  const [showPunchline, setShowPunchline] = useState(false);
  const [customRoutine, setCustomRoutine] = useState<AcrobaticMove[]>(comedianState.routine || ['squash', 'somersault', 'bowtie-spin']);

  const currentRiddle = VALLEY_RIDDLES[riddleIndex];

  const handleNextRiddle = () => {
    setShowPunchline(false);
    setRiddleIndex(prev => (prev + 1) % VALLEY_RIDDLES.length);
    soundEngine.playLeafRustle();
  };

  const handleRevealPunchline = () => {
    setShowPunchline(true);
    onSolveRiddle(currentRiddle.id);
    soundEngine.playGumdropPop(659.25);
  };

  const toggleMove = (move: AcrobaticMove) => {
    if (customRoutine.includes(move)) {
      if (customRoutine.length > 1) {
        setCustomRoutine(prev => prev.filter(m => m !== move));
      }
    } else {
      if (customRoutine.length < 5) {
        setCustomRoutine(prev => [...prev, move]);
      }
    }
  };

  const handleExecuteRoutine = () => {
    onPerformRoutine(customRoutine);
    soundEngine.playFlowerChime();
    onFocusStageInWorld();
    onClose();
  };

  const ALL_MOVES: { id: AcrobaticMove; label: string; icon: string; desc: string }[] = [
    { id: 'squash', label: 'Deep Squash & Pop', icon: '🔽', desc: 'Flattens to 0.70x then leaps high into the air.' },
    { id: 'somersault', label: 'Acrobatic Flip', icon: '🔄', desc: 'Complete rotational cartwheel landing on two feet.' },
    { id: 'bowtie-spin', label: 'Bowtie Whirlwind', icon: '🎀', desc: 'Spins polka-dot bowtie like an airplane propeller.' },
    { id: 'pratfall', label: 'Goofy Pratfall Hop', icon: '💫', desc: 'Dramatic stumble hop that ends in a cheerful wobble.' },
    { id: 'happy-hop', label: 'Bouncy Waddle Loop', icon: '🤹', desc: 'Rhythmic waddling hops with left-right tilting.' },
  ];

  return (
    <div
      className="relative w-full max-w-3xl bg-[#fffdf9] border-2 border-[#382b26] rounded-3xl shadow-2xl p-4 sm:p-6 text-[#2b201b] select-none max-h-[90vh] overflow-y-auto flex flex-col gap-4"
      onClick={e => e.stopPropagation()}
      onPointerDown={e => e.stopPropagation()}
      onTouchStart={e => e.stopPropagation()}
    >
      {/* 1. Header Bar: Comedian Identity & Close */}
      <div className="flex items-start justify-between border-b border-[#382b26]/15 pb-3">
        <div className="flex items-center gap-3">
          <span className="w-11 h-11 rounded-2xl flex items-center justify-center border-2 border-[#382b26] text-2xl shadow-sm bg-[#e889a2]">
            🎭
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-[#382b26]">
                Comedian&apos;s Footbridge Stage
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-[#f43f5e]/15 text-[#be123c] text-[10px] font-bold uppercase tracking-wider">
                Valley Whimsy
              </span>
            </div>
            <p className="text-xs text-[#78645b] font-medium">
              Acrobatic waddles, playful riddles, and mechanical brook surprises
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-[#382b26]/5 hover:bg-[#382b26]/15 text-[#382b26] flex items-center justify-center font-bold text-base transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#382b26]"
          aria-label="Close Stage"
        >
          ✕
        </button>
      </div>

      {/* 2. Mode Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#382b26]/10 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('riddles')}
          className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#382b26] ${
            activeTab === 'riddles'
              ? 'bg-[#e889a2] text-white shadow-sm'
              : 'bg-[#f4f4f5] text-[#52525b] hover:bg-[#e4e4e7]'
          }`}
        >
          <span>🃏</span>
          <span>Valley Riddles</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('acrobatics')}
          className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#382b26] ${
            activeTab === 'acrobatics'
              ? 'bg-[#e889a2] text-white shadow-sm'
              : 'bg-[#f4f4f5] text-[#52525b] hover:bg-[#e4e4e7]'
          }`}
        >
          <span>🎪</span>
          <span>Acrobatic Choreography</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('props')}
          className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#382b26] ${
            activeTab === 'props'
              ? 'bg-[#e889a2] text-white shadow-sm'
              : 'bg-[#f4f4f5] text-[#52525b] hover:bg-[#e4e4e7]'
          }`}
        >
          <span>🎈</span>
          <span>Brook Stage Props</span>
        </button>
      </div>

      {/* 3. Tab Contents */}
      {activeTab === 'riddles' && (
        <div className="bg-[#f7f3ec] border border-[#382b26]/15 rounded-2xl p-4 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-[#382b26]/10 pb-2">
            <div>
              <span className="text-[10px] font-bold text-[#be123c] uppercase tracking-wider">
                Riddle {riddleIndex + 1} of {VALLEY_RIDDLES.length} &bull; {currentRiddle.topic}
              </span>
              <h3 className="text-sm font-bold text-[#2b201b] mt-0.5">
                The Valley Chuckle Card
              </h3>
            </div>
            <button
              type="button"
              onClick={handleNextRiddle}
              className="text-xs text-[#be123c] hover:underline font-semibold flex items-center gap-1"
            >
              <span>Next Riddle</span>
              <span>➔</span>
            </button>
          </div>

          {/* Riddle Card */}
          <div className="bg-[#fffdf9] p-5 rounded-2xl border border-[#382b26]/15 shadow-sm flex flex-col gap-3 text-center">
            <span className="text-3xl">🎀</span>
            <p className="text-base sm:text-lg font-bold text-[#2b201b] leading-relaxed">
              &ldquo;{currentRiddle.setup}&rdquo;
            </p>

            {showPunchline ? (
              <div className="bg-[#fdf2f8] border border-[#f43f5e]/20 p-3.5 rounded-xl flex flex-col gap-1.5 animate-fadeIn">
                <p className="text-sm sm:text-base font-bold text-[#be123c]">
                  &ldquo;{currentRiddle.punchline}&rdquo;
                </p>
                <p className="text-xs text-[#78645b] italic">
                  {currentRiddle.audienceReaction}
                </p>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleRevealPunchline}
                className="mx-auto mt-2 px-5 py-2.5 rounded-xl bg-[#be123c] hover:bg-[#9f1239] text-white font-bold text-xs flex items-center gap-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#be123c]"
              >
                <span>✨</span>
                <span>Reveal Punchline!</span>
              </button>
            )}
          </div>
        </div>
      )}

      {activeTab === 'acrobatics' && (
        <div className="bg-[#f7f3ec] border border-[#382b26]/15 rounded-2xl p-4 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-[#382b26]/10 pb-2">
            <div>
              <h3 className="text-sm font-bold text-[#382b26]">
                Choreograph Comedian&apos;s Routine
              </h3>
              <p className="text-xs text-[#78645b]">
                Select sequence of moves for Comedian to perform on the world stage
              </p>
            </div>
            <span className="text-xs font-bold text-[#be123c]">
              {customRoutine.length} moves selected
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {ALL_MOVES.map(move => {
              const isSelected = customRoutine.includes(move.id);
              const orderIndex = customRoutine.indexOf(move.id);

              return (
                <button
                  key={move.id}
                  type="button"
                  onClick={() => toggleMove(move.id)}
                  className={`p-3 rounded-2xl border-2 text-left flex items-start gap-3 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#be123c] ${
                    isSelected
                      ? 'border-[#be123c] bg-[#fdf2f8] shadow-sm'
                      : 'border-[#382b26]/15 bg-[#fffdf9] hover:bg-[#fffaf2]'
                  }`}
                >
                  <span className="text-2xl shrink-0">{move.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-[#2b201b]">{move.label}</h4>
                      {isSelected && (
                        <span className="w-5 h-5 rounded-full bg-[#be123c] text-white font-bold text-[10px] flex items-center justify-center">
                          {orderIndex + 1}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#78645b] mt-0.5 leading-relaxed">{move.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-[#382b26]/10">
            <span className="text-xs text-[#78645b]">
              Watch live squash & stretch waddles right in the valley
            </span>
            <button
              type="button"
              onClick={handleExecuteRoutine}
              className="px-5 py-2.5 rounded-xl bg-[#be123c] hover:bg-[#9f1239] text-white font-bold text-xs flex items-center gap-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#be123c]"
            >
              <span>🎪</span>
              <span>Perform Live on Stage! ➔</span>
            </button>
          </div>
        </div>
      )}

      {activeTab === 'props' && (
        <div className="bg-[#f7f3ec] border border-[#382b26]/15 rounded-2xl p-4 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-[#382b26]/10 pb-2">
            <div>
              <h3 className="text-sm font-bold text-[#382b26]">
                Brook Proscenium Stage Props
              </h3>
              <p className="text-xs text-[#78645b]">
                Toggle mechanical stage gadgets visible along the brook ($X = 1380$)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {WHIMSICAL_PROPS.map(prop => {
              const isActive = comedianState.activeProps[prop.id];

              return (
                <div
                  key={prop.id}
                  className="p-3.5 rounded-2xl border border-[#382b26]/15 bg-[#fffdf9] flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl shrink-0">{prop.icon}</span>
                    <div>
                      <h4 className="text-xs font-bold text-[#2b201b]">{prop.name}</h4>
                      <p className="text-[11px] text-[#78645b]">{prop.effect}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onToggleProp(prop.id)}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 ${
                      isActive
                        ? 'bg-[#dcfce7] text-[#166534] hover:bg-[#bbf7d0]'
                        : 'bg-[#f4f4f5] text-[#71717a] hover:bg-[#e4e4e7]'
                    }`}
                  >
                    {isActive ? 'Active' : 'Off'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Footer */}
      <div className="flex items-center justify-between border-t border-[#382b26]/15 pt-2">
        <p className="text-[11px] text-[#78645b]">
          A laugh a day keeps the valley spirits sunny and lighthearted.
        </p>

        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-xl bg-[#382b26] hover:bg-[#523e37] text-white font-bold text-xs transition-colors"
        >
          Return to Valley
        </button>
      </div>
    </div>
  );
};
