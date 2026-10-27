import React, { useState, useEffect } from 'react';
import type { DayNightState } from '../../types';
import type { GardenPlantRecord, PlantSpeciesId } from '../../types/garden';
import { GARDEN_PLOTS, GARDEN_SPECIES } from '../../data/garden';
import { soundEngine } from '../../audio/soundEngine';

interface LivingGardenProps {
  plants: Record<string, GardenPlantRecord>;
  dayNight: DayNightState;
  selectedPlotId: string | null;
  onSelectPlot: (plotId: string) => void;
  onPlantSeed: (plotId: string, speciesId: PlantSpeciesId) => void;
  onWaterPlant: (plotId: string) => void;
  onTendPlant: (plotId: string) => void;
  onRemovePlant: (plotId: string) => void;
  onFocusPlotInWorld: (worldX: number) => void;
  onClose: () => void;
}

export const LivingGarden: React.FC<LivingGardenProps> = ({
  plants,
  dayNight: _dayNight,
  selectedPlotId,
  onSelectPlot,
  onPlantSeed,
  onWaterPlant,
  onTendPlant,
  onRemovePlant,
  onFocusPlotInWorld,
  onClose,
}) => {
  // If no plot selected, default to the first empty plot or plot-1
  const activePlotId =
    selectedPlotId ||
    GARDEN_PLOTS.find(p => !plants[p.id])?.id ||
    GARDEN_PLOTS[0].id;

  const activePlot = GARDEN_PLOTS.find(p => p.id === activePlotId) || GARDEN_PLOTS[0];
  const currentPlant = plants[activePlot.id];
  const currentSpecies = currentPlant ? GARDEN_SPECIES[currentPlant.speciesId] : null;

  // State for confirming plant removal
  const [confirmClear, setConfirmClear] = useState<string | null>(null);

  // Filter seed catalog tab
  const [selectedSeedId, setSelectedSeedId] = useState<PlantSpeciesId>('sunflower');

  // Handle selecting plot
  const handleSelect = (plotId: string) => {
    onSelectPlot(plotId);
    setConfirmClear(null);
    const plot = GARDEN_PLOTS.find(p => p.id === plotId);
    if (plot) {
      onFocusPlotInWorld(plot.worldX);
    }
  };

  const handlePlant = (speciesId: PlantSpeciesId) => {
    onPlantSeed(activePlot.id, speciesId);
    soundEngine.playFlowerChime();
  };

  const handleWater = () => {
    if (!currentPlant) return;
    onWaterPlant(activePlot.id);
    soundEngine.playWaterRipple();
  };

  const handleTend = () => {
    if (!currentPlant) return;
    onTendPlant(activePlot.id);
    soundEngine.playLeafRustle();
  };

  const handleClear = () => {
    if (!currentPlant) return;
    if (confirmClear !== activePlot.id) {
      setConfirmClear(activePlot.id);
      return;
    }
    onRemovePlant(activePlot.id);
    setConfirmClear(null);
    soundEngine.playLeafRustle();
  };

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const isRecentlyWatered =
    currentPlant && currentPlant.lastWateredAt
      ? now - currentPlant.lastWateredAt < 120000
      : false;

  const STAGE_ORDER = ['seed', 'sprout', 'growing', 'mature'] as const;

  return (
    <div
      className="relative w-full max-w-3xl bg-[#fffdf9] border-2 border-[#382b26] rounded-3xl shadow-2xl p-4 sm:p-6 text-[#2b201b] select-none max-h-[90vh] overflow-y-auto flex flex-col gap-4"
      onClick={e => e.stopPropagation()}
      onPointerDown={e => e.stopPropagation()}
      onTouchStart={e => e.stopPropagation()}
    >
      {/* 1. Header Bar: Identity & Dismiss */}
      <div className="flex items-start justify-between border-b border-[#382b26]/15 pb-3">
        <div className="flex items-center gap-3">
          <span className="w-11 h-11 rounded-2xl flex items-center justify-center border-2 border-[#382b26] text-2xl shadow-sm bg-[#7ebc84]">
            🌱
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-[#382b26]">
                Gardener&apos;s Living Garden
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-[#388e3c]/15 text-[#2e7d32] text-[10px] font-bold uppercase tracking-wider">
                Valley Beds
              </span>
            </div>
            <p className="text-xs text-[#78645b] font-medium">
              Terraced hillside plots beside Sunflower Cottage
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-[#382b26]/5 hover:bg-[#382b26]/15 text-[#382b26] flex items-center justify-center font-bold text-base transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#382b26]"
          aria-label="Close Potting Bench"
        >
          ✕
        </button>
      </div>

      {/* 2. Terraced Bed Selector Strip */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-[#78645b] uppercase tracking-wider">
            Select Garden Bed
          </span>
          <span className="text-[11px] text-[#78645b]">
            {Object.keys(plants).length} of {GARDEN_PLOTS.length} beds planted
          </span>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {GARDEN_PLOTS.map(plot => {
            const plant = plants[plot.id];
            const spec = plant ? GARDEN_SPECIES[plant.speciesId] : null;
            const isSelected = plot.id === activePlot.id;

            return (
              <button
                key={plot.id}
                type="button"
                onClick={() => handleSelect(plot.id)}
                className={`p-2.5 rounded-2xl border-2 text-left flex flex-col justify-between transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#382b26] ${
                  isSelected
                    ? 'border-[#2e7d32] bg-[#f0fdf4] shadow-sm'
                    : 'border-[#382b26]/15 bg-[#fffaf2] hover:bg-[#fff5e6]'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-[10px] font-bold text-[#78645b]">
                    Bed {plot.index + 1}
                  </span>
                  <span className="text-xs">{spec ? spec.icon : '🪨'}</span>
                </div>
                <div className="mt-1 truncate">
                  <p className="text-[11px] font-bold text-[#2b201b] truncate">
                    {spec ? spec.name.split(' ')[0] : 'Open Soil'}
                  </p>
                  <p className="text-[9px] text-[#78645b] capitalize">
                    {plant ? plant.stage : 'Available'}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Main Workspace for the Active Bed */}
      <div className="bg-[#f7f3ec] border border-[#382b26]/15 rounded-2xl p-4 flex flex-col gap-4">
        {/* Bed Location Subhead */}
        <div className="flex items-center justify-between border-b border-[#382b26]/10 pb-2">
          <div>
            <h3 className="text-sm font-bold text-[#382b26]">
              {activePlot.label} (World X: {activePlot.worldX})
            </h3>
            <p className="text-xs text-[#78645b]">{activePlot.zoneDescription}</p>
          </div>
          <button
            type="button"
            onClick={() => onFocusPlotInWorld(activePlot.worldX)}
            className="text-xs text-[#2e7d32] hover:underline font-semibold flex items-center gap-1"
          >
            <span>Pan camera to bed</span>
            <span>↗</span>
          </button>
        </div>

        {/* EITHER SEED SELECTION OR PLANT CARE */}
        {currentPlant && currentSpecies ? (
          /* ── ALREADY PLANTED: CARE & STAGES ── */
          <div className="flex flex-col gap-4">
            {/* Plant Snapshot Card */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#fffdf9] p-3.5 rounded-xl border border-[#382b26]/10">
              <div className="flex items-center gap-3">
                <span className="w-12 h-12 rounded-xl flex items-center justify-center text-3xl border border-[#382b26]/15 bg-[#fefce8]">
                  {currentSpecies.icon}
                </span>
                <div>
                  <h4 className="text-sm font-bold text-[#2b201b]">
                    {currentSpecies.name}
                  </h4>
                  <p className="text-xs text-[#78645b] italic">
                    {currentSpecies.botanicalName} &bull; {currentSpecies.category}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isRecentlyWatered
                          ? 'bg-[#dbeafe] text-[#1e40af]'
                          : 'bg-[#fef3c7] text-[#92400e]'
                      }`}
                    >
                      {isRecentlyWatered ? '💧 Moist Loam' : '☀️ Needs Water'}
                    </span>
                    <span className="text-[10px] text-[#78645b]">
                      Cared {currentPlant.waterCount} times
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Care Buttons */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleWater}
                  className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb]"
                  title="Water this plant to nourish roots and promote growth"
                >
                  <span>💧</span>
                  <span>Water Soil</span>
                </button>

                <button
                  type="button"
                  onClick={handleTend}
                  className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-[#15803d] hover:bg-[#166534] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#15803d]"
                  title="Loosen soil, clear weeds, and sing to the plant"
                >
                  <span>🌿</span>
                  <span>Tend Bed</span>
                </button>
              </div>
            </div>

            {/* Growth Stages Timeline */}
            <div className="flex flex-col gap-2 bg-[#fffdf9] p-3.5 rounded-xl border border-[#382b26]/10">
              <span className="text-[11px] font-bold text-[#78645b] uppercase tracking-wider">
                Lifecycle Progression
              </span>

              <div className="grid grid-cols-4 gap-2">
                {STAGE_ORDER.map((stageKey, idx) => {
                  const stageDetail = currentSpecies.stages[stageKey];
                  const currentIdx = STAGE_ORDER.indexOf(currentPlant.stage);
                  const isDone = idx < currentIdx;
                  const isCurrent = idx === currentIdx;

                  return (
                    <div
                      key={stageKey}
                      className={`p-2 rounded-xl border flex flex-col justify-between ${
                        isCurrent
                          ? 'border-[#2e7d32] bg-[#f0fdf4]'
                          : isDone
                            ? 'border-[#382b26]/20 bg-[#f8fafc]'
                            : 'border-[#382b26]/10 bg-[#fafaf9] opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-bold text-[#78645b]">
                          {stageDetail.stageLabel}
                        </span>
                        {isDone ? (
                          <span className="text-[10px] text-[#2e7d32] font-bold">✓</span>
                        ) : isCurrent ? (
                          <span className="text-[10px] text-[#2e7d32] font-bold">●</span>
                        ) : null}
                      </div>
                      <p className="text-[11px] font-bold text-[#2b201b] capitalize mt-1">
                        {stageKey}
                      </p>
                      <p className="text-[9px] text-[#78645b] mt-0.5 line-clamp-2">
                        {stageDetail.name}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Current Stage Description */}
              <div className="text-xs text-[#2b201b] bg-[#f7efe6] p-2.5 rounded-lg border border-[#382b26]/10 mt-1">
                <span className="font-bold">Current State: </span>
                {currentSpecies.stages[currentPlant.stage].description}
              </div>
            </div>

            {/* Botanical Care Note & Clearing Action */}
            <div className="flex items-center justify-between pt-1">
              <p className="text-xs text-[#78645b]">
                <span className="font-semibold text-[#382b26]">Gardener&apos;s Tip: </span>
                {currentSpecies.careTip}
              </p>

              {confirmClear === activePlot.id ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#b91c1c]">Clear this bed?</span>
                  <button
                    type="button"
                    onClick={handleClear}
                    className="px-2.5 py-1 rounded-lg bg-[#b91c1c] text-white text-xs font-bold hover:bg-[#991b1b]"
                  >
                    Confirm
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmClear(null)}
                    className="px-2 py-1 rounded-lg bg-gray-200 text-[#382b26] text-xs font-medium"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-xs text-[#78645b] hover:text-[#b91c1c] underline font-medium"
                >
                  Uproot / Clear Bed
                </button>
              )}
            </div>
          </div>
        ) : (
          /* ── OPEN BED: SEED SELECTION ── */
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#78645b] uppercase tracking-wider">
                Select Seed Packet to Plant
              </span>
              <span className="text-xs text-[#2e7d32] font-semibold">
                Warm compost prepared
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {(Object.keys(GARDEN_SPECIES) as PlantSpeciesId[]).map(specId => {
                const spec = GARDEN_SPECIES[specId];
                const isSelected = selectedSeedId === specId;

                return (
                  <button
                    key={specId}
                    type="button"
                    onClick={() => setSelectedSeedId(specId)}
                    aria-pressed={isSelected}
                    className={`p-3 rounded-2xl border-2 flex items-start gap-3 cursor-pointer transition-all text-left w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2e7d32] ${
                      isSelected
                        ? 'border-[#2e7d32] bg-[#f0fdf4] shadow-sm'
                        : 'border-[#382b26]/15 bg-[#fffdf9] hover:bg-[#fffaf2]'
                    }`}
                  >
                    <span className="w-10 h-10 rounded-xl flex items-center justify-center text-2xl border border-[#382b26]/15 bg-[#fefce8] shrink-0">
                      {spec.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-[#2b201b] truncate">
                          {spec.name}
                        </h4>
                        <span className="text-[9px] text-[#78645b] font-medium shrink-0">
                          {spec.sunRequirement}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#78645b] italic truncate">
                        {spec.botanicalName}
                      </p>
                      <p className="text-[10px] text-[#382b26] mt-1 line-clamp-2 leading-relaxed">
                        {spec.summary}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Planting CTA */}
            <div className="flex items-center justify-between pt-2 border-t border-[#382b26]/10">
              <div className="text-xs text-[#78645b]">
                Will plant{' '}
                <span className="font-bold text-[#382b26]">
                  {GARDEN_SPECIES[selectedSeedId].name}
                </span>{' '}
                into {activePlot.label}
              </div>

              <button
                type="button"
                onClick={() => handlePlant(selectedSeedId)}
                className="px-5 py-2.5 rounded-xl bg-[#2e7d32] hover:bg-[#1b5e20] text-white font-bold text-xs flex items-center gap-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2e7d32]"
              >
                <span>🌱</span>
                <span>Plant Seed in Bed</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. Bottom Footer: Return to Valley */}
      <div className="flex items-center justify-between border-t border-[#382b26]/15 pt-2">
        <p className="text-[11px] text-[#78645b]">
          Plants develop naturally over time and with watering. No punitive decay.
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
