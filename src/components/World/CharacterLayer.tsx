import React from 'react';
import type { CharacterLiveState } from '../../types';
import { CHARACTERS } from '../../data/characters';
import { GumdropCharacter } from './GumdropCharacter';
import { WORLD_WIDTH } from '../../utils/math';

interface CharacterLayerProps {
  charactersState: Record<string, CharacterLiveState>;
  cursorWorldX: number | null;
  cursorWorldY: number | null;
  onCharacterClick: (id: string) => void;
}

export const CharacterLayer: React.FC<CharacterLayerProps> = ({
  charactersState,
  cursorWorldX,
  cursorWorldY,
  onCharacterClick,
}) => {
  return (
    <svg
      className="w-full h-full absolute inset-0 overflow-visible pointer-events-auto select-none"
      viewBox={`0 0 ${WORLD_WIDTH} 900`}
      preserveAspectRatio="none"
    >
      {/* Render all 8 Gumdrops */}
      {Object.keys(CHARACTERS).map(id => {
        const def = CHARACTERS[id];
        const live = charactersState[id];
        if (!live) return null;

        return (
          <GumdropCharacter
            key={id}
            def={def}
            live={live}
            cursorWorldX={cursorWorldX}
            cursorWorldY={cursorWorldY}
            onCharacterClick={onCharacterClick}
          />
        );
      })}
    </svg>
  );
};
