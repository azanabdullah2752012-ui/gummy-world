import React from 'react';

export interface WorldHUDProps {
  isMuted: boolean;
  onToggleSound: () => void;
  onOpenJournal: () => void;
  // optional compatibility props
  dayNight?: unknown;
  onSetTimeProgress?: (p: number) => void;
  camX?: number;
  viewportWidth?: number;
  maxCamX?: number;
  characters?: unknown;
  onPanToWorldX?: (worldX: number) => void;
  onFocusCharacter?: (id: string) => void;
  discoveriesCount?: number;
}

/** Minimal Sound Control and Exploration Journal button */
export const WorldHUD: React.FC<WorldHUDProps> = ({
  isMuted,
  onToggleSound,
  onOpenJournal,
}) => {
  return (
    <div className="fixed top-3 right-3 z-30 pointer-events-auto select-none">
      {/* Sound toggle */}
      <button
        onClick={onToggleSound}
        className="flex items-center justify-center w-10 h-10 rounded-full bg-[#261d18]/65 hover:bg-[#261d18]/85 text-white/90 backdrop-blur-md border border-white/25 shadow-md transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
        title={isMuted ? 'Sound is Off — Click to play ambience' : 'Sound is On — Click to mute'}
        aria-label={isMuted ? 'Sound is Off' : 'Sound is On'}
      >
        <span className="text-base select-none">{isMuted ? '🔇' : '🔊'}</span>
      </button>
      {/* Journal button */}
      <button
        onClick={onOpenJournal}
        className="flex items-center justify-center w-10 h-10 rounded-full bg-[#261d18]/65 hover:bg-[#261d18]/85 text-white/90 backdrop-blur-md border border-white/25 shadow-md transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none ml-2"
        title="Open Exploration Journal"
        aria-label="Open Exploration Journal"
      >
        <span className="text-base select-none">📓</span>
      </button>
    </div>
  );
};
