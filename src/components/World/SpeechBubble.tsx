import React, { useEffect, useState } from 'react';
import type { CharacterDef, CharacterId } from '../../types';
import { CHARACTER_ACTIVITIES } from '../../data/activities';
import { getGroundY } from '../../utils/math';

interface SpeechBubbleProps {
  character: CharacterDef;
  worldX: number;
  quote: string;
  onDismiss: () => void;
  onStartActivity?: (characterId: CharacterId) => void;
}

export const SpeechBubble: React.FC<SpeechBubbleProps> = ({
  character,
  worldX,
  quote,
  onDismiss,
  onStartActivity,
}) => {
  const groundY = getGroundY(worldX);
  const [isHovered, setIsHovered] = useState(false);
  const activity = CHARACTER_ACTIVITIES[character.id];

  useEffect(() => {
    // If hovered or if an interactive activity is available, give user plenty of time
    if (isHovered) return;

    const timeoutMs = activity?.isImplemented ? 14000 : 7000;
    const timer = setTimeout(() => {
      onDismiss();
    }, timeoutMs);

    return () => clearTimeout(timer);
  }, [quote, onDismiss, isHovered, activity]);

  return (
    <div
      className="absolute z-40 select-none cursor-pointer"
      style={{
        left: `${worldX}px`,
        top: `${groundY - 55}px`,
        transform: 'translate(-50%, -100%)',
      }}
      onClick={e => {
        e.stopPropagation();
        onDismiss();
      }}
      onPointerDown={e => e.stopPropagation()}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className="relative w-64 sm:w-72 bg-[#fffdf8] border-2 border-[#382b26] rounded-2xl p-3.5 shadow-xl flex flex-col justify-center items-center text-center transition-colors hover:bg-[#fff9f0]"
        style={{
          boxShadow: '0 10px 28px -4px rgba(56, 43, 38, 0.28)',
        }}
      >
        {/* Header pill: Character Name + Role */}
        <div className="flex items-center gap-1.5 mb-1">
          <span
            className="w-2.5 h-2.5 rounded-full inline-block border border-[#382b26]/30"
            style={{ backgroundColor: character.palette.bodyTop }}
          />
          <span className="text-[11px] font-bold text-[#382b26] tracking-wide uppercase">
            {character.name}
          </span>
          <span className="text-[10px] text-[#78645b] font-medium">
            &bull; {character.role.split('&')[0]}
          </span>
        </div>

        {/* Dialogue quote */}
        <p className="text-[13px] leading-snug font-medium text-[#2b201b] font-sans">
          &ldquo;{quote}&rdquo;
        </p>

        {/* Meaningful Contextual Next Step Action Button */}
        {activity?.isImplemented && onStartActivity && (
          <button
            type="button"
            onClick={e => {
              e.stopPropagation();
              onStartActivity(character.id);
              onDismiss();
            }}
            className={`mt-2.5 flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl ${
              character.id === 'listener'
                ? 'bg-[#d1fae5] hover:bg-[#a7f3d0] text-[#064e3b]'
                : character.id === 'student'
                  ? 'bg-[#e0e7ff] hover:bg-[#c7d2fe] text-[#312e81]'
                  : character.id === 'ideas'
                    ? 'bg-[#fef3c7] hover:bg-[#fde68a] text-[#78350f]'
                    : character.id === 'gardener'
                      ? 'bg-[#dcfce7] hover:bg-[#bbf7d0] text-[#14532d]'
                      : character.id === 'inventor'
                        ? 'bg-[#fef3c7] hover:bg-[#fde68a] text-[#78350f]'
                        : character.id === 'comedian'
                          ? 'bg-[#ffe4e6] hover:bg-[#fecdd3] text-[#9f1239]'
                          : character.id === 'explorer'
                            ? 'bg-[#ecfdf5] hover:bg-[#d1fae5] text-[#065f46]'
                            : 'bg-[#f5f5f4] hover:bg-[#e7e5e4] text-[#1c1917]'
            } active:scale-95 font-bold text-xs shadow-sm border border-[#382b26]/30 transition-all focus-visible:ring-2 focus-visible:ring-[#382b26] focus-visible:outline-none`}
            title={`Open ${activity.title}`}
          >
            <span>{activity.actionIcon}</span>
            <span>{activity.actionLabel}</span>
            <span className="text-[10px] opacity-75">➔</span>
          </button>
        )}

        <span className="text-[9px] text-[#a39087] mt-1.5 font-semibold uppercase tracking-wider">
          Tap anywhere to dismiss
        </span>

        {/* Speech Bubble Tail Arrow */}
        <div
          className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-[#fffdf8] border-r-2 border-b-2 border-[#382b26] rotate-45"
          style={{ zIndex: 1 }}
        />
      </div>
    </div>
  );
};
