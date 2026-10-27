import React, { useEffect } from 'react';
import type { CharacterId } from '../../types';
import { CHARACTERS } from '../../data/characters';
import { CHARACTER_ACTIVITIES } from '../../data/activities';
import { StudentNotebook } from './StudentNotebook';
import { QuietCorner } from './QuietCorner';
import { IdeaGarden } from './IdeaGarden';
import { LivingGarden } from './LivingGarden';
import { ClockworkWorkshop } from './ClockworkWorkshop';
import { ComedianStage } from './ComedianStage';
import type { DayNightState } from '../../types';
import type { GardenPlantRecord, PlantSpeciesId } from '../../types/garden';
import type { ClockworkState, MechanismModuleId } from '../../types/clockwork';
import type { ComedianState, AcrobaticMove } from '../../types/comedian';

interface CharacterActivityModalProps {
  characterId: CharacterId;
  onClose: () => void;
  gardenPlants?: Record<string, GardenPlantRecord>;
  dayNight?: DayNightState;
  selectedPlotId?: string | null;
  onSelectPlot?: (plotId: string) => void;
  onPlantSeed?: (plotId: string, speciesId: PlantSpeciesId) => void;
  onWaterPlant?: (plotId: string) => void;
  onTendPlant?: (plotId: string) => void;
  onRemovePlant?: (plotId: string) => void;
  onFocusPlotInWorld?: (worldX: number) => void;
  // Clockwork props
  clockworkState?: ClockworkState;
  selectedClockworkModuleId?: MechanismModuleId;
  onSelectClockworkModule?: (moduleId: MechanismModuleId) => void;
  onInstallClockworkGear?: (moduleId: MechanismModuleId, gearId: string) => void;
  onTuneClockworkParameter?: (moduleId: MechanismModuleId, value: number) => void;
  onToggleClockworkEngage?: (moduleId: MechanismModuleId) => void;
  onLubricateClockwork?: (moduleId: MechanismModuleId) => void;
  onFocusClockworkInWorld?: (worldX: number) => void;
  // Comedian props
  comedianState?: ComedianState;
  onToggleComedianProp?: (propId: string) => void;
  onSolveComedianRiddle?: (riddleId: string) => void;
  onPerformComedianRoutine?: (routine: AcrobaticMove[]) => void;
  onFocusComedianStageInWorld?: () => void;
}

export const CharacterActivityModal: React.FC<CharacterActivityModalProps> = ({
  characterId,
  onClose,
  gardenPlants = {},
  dayNight,
  selectedPlotId = null,
  onSelectPlot = () => {},
  onPlantSeed = () => {},
  onWaterPlant = () => {},
  onTendPlant = () => {},
  onRemovePlant = () => {},
  onFocusPlotInWorld = () => {},
  // Clockwork defaults
  clockworkState,
  selectedClockworkModuleId = 'windmill-drive',
  onSelectClockworkModule = () => {},
  onInstallClockworkGear = () => {},
  onTuneClockworkParameter = () => {},
  onToggleClockworkEngage = () => {},
  onLubricateClockwork = () => {},
  onFocusClockworkInWorld = () => {},
  // Comedian defaults
  comedianState,
  onToggleComedianProp = () => {},
  onSolveComedianRiddle = () => {},
  onPerformComedianRoutine = () => {},
  onFocusComedianStageInWorld = () => {},
}) => {
  const character = CHARACTERS[characterId];
  const activityConfig = CHARACTER_ACTIVITIES[characterId];

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!character) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#1a130f]/40 backdrop-blur-[2px] transition-opacity select-none"
      onClick={onClose}
      onPointerDown={e => e.stopPropagation()}
      onTouchStart={e => e.stopPropagation()}
    >
      {/* Student's Custom Activity */}
      {characterId === 'student' && <StudentNotebook onClose={onClose} />}

      {/* Listener's Custom Activity: The Quiet Corner */}
      {characterId === 'listener' && <QuietCorner onClose={onClose} />}

      {/* Ideas' Custom Activity: The Idea Garden */}
      {characterId === 'ideas' && <IdeaGarden onClose={onClose} />}

      {/* Gardener's Custom Activity: The Living Garden */}
      {characterId === 'gardener' && dayNight && (
        <LivingGarden
          plants={gardenPlants}
          dayNight={dayNight}
          selectedPlotId={selectedPlotId}
          onSelectPlot={onSelectPlot}
          onPlantSeed={onPlantSeed}
          onWaterPlant={onWaterPlant}
          onTendPlant={onTendPlant}
          onRemovePlant={onRemovePlant}
          onFocusPlotInWorld={onFocusPlotInWorld}
          onClose={onClose}
        />
      )}

      {/* Inventor's Custom Activity: The Clockwork Workshop */}
      {characterId === 'inventor' && clockworkState && dayNight && (
        <ClockworkWorkshop
          clockwork={clockworkState}
          dayNight={dayNight}
          selectedModuleId={selectedClockworkModuleId}
          onSelectModule={onSelectClockworkModule}
          onInstallGear={onInstallClockworkGear}
          onTuneParameter={onTuneClockworkParameter}
          onToggleEngage={onToggleClockworkEngage}
          onLubricate={onLubricateClockwork}
          onFocusModuleInWorld={onFocusClockworkInWorld}
          onClose={onClose}
        />
      )}

      {/* Comedian's Custom Activity: The Footbridge Stage */}
      {characterId === 'comedian' && comedianState && dayNight && (
        <ComedianStage
          comedianState={comedianState}
          dayNight={dayNight}
          onToggleProp={onToggleComedianProp}
          onSolveRiddle={onSolveComedianRiddle}
          onPerformRoutine={onPerformComedianRoutine}
          onFocusStageInWorld={onFocusComedianStageInWorld}
          onClose={onClose}
        />
      )}

      {/* Fallback for other characters whose activities are upcoming in future milestones */}
      {characterId !== 'student' &&
        characterId !== 'listener' &&
        characterId !== 'ideas' &&
        characterId !== 'gardener' &&
        characterId !== 'inventor' &&
        characterId !== 'comedian' &&
        characterId !== 'explorer' && (
          <div
            className="relative w-full max-w-md bg-[#fffdfa] border-2 border-[#382b26] rounded-3xl p-6 shadow-2xl space-y-4 text-[#2b201b]"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span
                  className="w-10 h-10 rounded-2xl flex items-center justify-center border-2 border-[#382b26] text-xl shadow-sm"
                  style={{ backgroundColor: character.palette.bodyTop }}
                >
                  {activityConfig?.actionIcon || '✨'}
                </span>
                <div>
                  <h3 className="text-base font-bold text-[#382b26]">
                    {activityConfig?.title || character.name}
                  </h3>
                  <p className="text-xs text-[#78645b] font-medium">
                    {character.role}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-[#382b26]/5 hover:bg-[#382b26]/15 text-[#382b26] flex items-center justify-center font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="bg-[#f7efe6] border border-[#382b26]/15 rounded-2xl p-4 space-y-2">
              <p className="text-xs text-[#382b26] leading-relaxed">
                {activityConfig?.teaserDescription || character.bio}
              </p>
              <div className="inline-block px-2.5 py-1 rounded-full bg-[#382b26]/10 text-[#382b26] text-[10px] font-bold uppercase tracking-wider">
                Activity in Development
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-[#382b26] hover:bg-[#523e37] text-white font-bold text-xs transition-colors"
              >
                Return to Valley
              </button>
            </div>
          </div>
        )}
    </div>
  );
};
