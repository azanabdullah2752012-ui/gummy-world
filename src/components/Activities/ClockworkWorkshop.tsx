import React from 'react';
import type { DayNightState } from '../../types';
import type { ClockworkState, MechanismModuleId } from '../../types/clockwork';
import { GEAR_PARTS, MECHANISM_MODULES } from '../../data/clockwork';
import { soundEngine } from '../../audio/soundEngine';

interface ClockworkWorkshopProps {
  clockwork: ClockworkState;
  dayNight: DayNightState;
  selectedModuleId: MechanismModuleId;
  onSelectModule: (moduleId: MechanismModuleId) => void;
  onInstallGear: (moduleId: MechanismModuleId, gearId: string) => void;
  onTuneParameter: (moduleId: MechanismModuleId, value: number) => void;
  onToggleEngage: (moduleId: MechanismModuleId) => void;
  onLubricate: (moduleId: MechanismModuleId) => void;
  onFocusModuleInWorld: (worldX: number) => void;
  onClose: () => void;
}

export const ClockworkWorkshop: React.FC<ClockworkWorkshopProps> = ({
  clockwork,
  dayNight: _dayNight,
  selectedModuleId,
  onSelectModule,
  onInstallGear,
  onTuneParameter,
  onToggleEngage,
  onLubricate,
  onFocusModuleInWorld,
  onClose,
}) => {
  const activeModule = MECHANISM_MODULES.find(m => m.id === selectedModuleId) || MECHANISM_MODULES[0];
  const activeState = clockwork.installed[activeModule.id];
  const activeGear = GEAR_PARTS[activeState?.installedGearId || activeModule.defaultGearId] || GEAR_PARTS['brass-spur'];

  const handleTune = (val: number) => {
    onTuneParameter(activeModule.id, val);
  };

  const handleLubricate = () => {
    onLubricate(activeModule.id);
    soundEngine.playWindmillClick();
  };

  const handleToggle = () => {
    onToggleEngage(activeModule.id);
    soundEngine.playWindmillClick();
  };

  // Calculate overall kinetic transmission efficiency
  const engagedCount = Object.values(clockwork.installed).filter(s => s.isEngaged).length;
  const avgLube = Math.round(
    (Object.values(clockwork.installed).reduce((acc, s) => acc + s.lubricationLevel, 0) / 4) * 100
  );

  return (
    <div
      className="relative w-full max-w-3xl bg-[#fffdf9] border-2 border-[#382b26] rounded-3xl shadow-2xl p-4 sm:p-6 text-[#2b201b] select-none max-h-[90vh] overflow-y-auto flex flex-col gap-4"
      onClick={e => e.stopPropagation()}
      onPointerDown={e => e.stopPropagation()}
      onTouchStart={e => e.stopPropagation()}
    >
      {/* 1. Header Bar: Inventor Identity & Close */}
      <div className="flex items-start justify-between border-b border-[#382b26]/15 pb-3">
        <div className="flex items-center gap-3">
          <span className="w-11 h-11 rounded-2xl flex items-center justify-center border-2 border-[#382b26] text-2xl shadow-sm bg-[#d98b68]">
            ⚙️
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-[#382b26]">
                Inventor&apos;s Clockwork Rig
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-[#d8a44b]/20 text-[#854d0e] text-[10px] font-bold uppercase tracking-wider">
                Ridge Workshop
              </span>
            </div>
            <p className="text-xs text-[#78645b] font-medium">
              Kinetic power grid & gear transmissions along the windmill ridge
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-[#382b26]/5 hover:bg-[#382b26]/15 text-[#382b26] flex items-center justify-center font-bold text-base transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#382b26]"
          aria-label="Close Workshop"
        >
          ✕
        </button>
      </div>

      {/* 2. Mechanism Modules Selector Strip */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-[#78645b] uppercase tracking-wider">
            Gantry Mechanism Stations
          </span>
          <span className="text-[11px] text-[#78645b]">
            {engagedCount} of 4 mechanisms engaged &bull; {avgLube}% bearing lubrication
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {MECHANISM_MODULES.map(mod => {
            const state = clockwork.installed[mod.id];
            const gear = GEAR_PARTS[state?.installedGearId || mod.defaultGearId];
            const isSelected = mod.id === activeModule.id;

            return (
              <button
                key={mod.id}
                type="button"
                onClick={() => {
                  onSelectModule(mod.id);
                  onFocusModuleInWorld(mod.worldOffset.x);
                }}
                className={`p-2.5 rounded-2xl border-2 text-left flex flex-col justify-between transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#382b26] ${
                  isSelected
                    ? 'border-[#b45309] bg-[#fffbeb] shadow-sm'
                    : 'border-[#382b26]/15 bg-[#fffaf2] hover:bg-[#fff5e6]'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-[10px] font-bold text-[#78645b] truncate">
                    {mod.name.split(' ')[0]}
                  </span>
                  <span className="text-xs">
                    {state?.isEngaged ? '🟢' : '⚪'}
                  </span>
                </div>
                <div className="mt-1 truncate">
                  <p className="text-[11px] font-bold text-[#2b201b] truncate">
                    {mod.title.split(' ')[0]}
                  </p>
                  <p className="text-[9px] text-[#78645b] truncate">
                    {gear.name.split(' ')[1]} ({state?.tuneValue} {mod.tuneParameterUnit})
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Active Mechanism Workbench */}
      <div className="bg-[#f7f3ec] border border-[#382b26]/15 rounded-2xl p-4 flex flex-col gap-4">
        {/* Module Subhead */}
        <div className="flex items-center justify-between border-b border-[#382b26]/10 pb-2">
          <div>
            <h3 className="text-sm font-bold text-[#382b26]">
              {activeModule.name} (Gantry $X = {activeModule.worldOffset.x}$)
            </h3>
            <p className="text-xs text-[#78645b]">{activeModule.description}</p>
          </div>
          <button
            type="button"
            onClick={() => onFocusModuleInWorld(activeModule.worldOffset.x)}
            className="text-xs text-[#b45309] hover:underline font-semibold flex items-center gap-1"
          >
            <span>Pan camera to gantry</span>
            <span>↗</span>
          </button>
        </div>

        {/* Mechanism Status Card */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#fffdf9] p-3.5 rounded-xl border border-[#382b26]/10">
          <div className="flex items-center gap-3">
            <span
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl border border-[#382b26]/15"
              style={{ backgroundColor: activeGear.color + '33' }}
            >
              ⚙️
            </span>
            <div>
              <h4 className="text-sm font-bold text-[#2b201b]">
                {activeGear.name}
              </h4>
              <p className="text-xs text-[#78645b]">
                {activeGear.teeth} Teeth &bull; {activeGear.material.toUpperCase()} &bull; Friction Ratio {activeGear.frictionRatio}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    activeState.isEngaged
                      ? 'bg-[#dcfce7] text-[#166534]'
                      : 'bg-[#f4f4f5] text-[#52525b]'
                  }`}
                >
                  {activeState.isEngaged ? 'Engaged & Spinning' : 'Disengaged'}
                </span>
                <span className="text-[10px] text-[#78645b]">
                  Lube: {Math.round(activeState.lubricationLevel * 100)}%
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleToggle}
              className={`flex-1 sm:flex-none px-3.5 py-2 rounded-xl text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 ${
                activeState.isEngaged
                  ? 'bg-[#78350f] hover:bg-[#592607] focus-visible:ring-[#78350f]'
                  : 'bg-[#15803d] hover:bg-[#166534] focus-visible:ring-[#15803d]'
              }`}
            >
              <span>{activeState.isEngaged ? '⏸ Disengage' : '▶ Engage Clutch'}</span>
            </button>

            <button
              type="button"
              onClick={handleLubricate}
              className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-[#d97706] hover:bg-[#b45309] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d97706]"
              title="Apply mineral clockwork oil to reduce friction and eliminate squeaks"
            >
              <span>🛢️ Oil Bearing</span>
            </button>
          </div>
        </div>

        {/* Gear Part Replacer Shelf */}
        <div className="flex flex-col gap-2">
          <span className="text-[11px] font-bold text-[#78645b] uppercase tracking-wider">
            Switch Installed Gear Wheel
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {Object.values(GEAR_PARTS).map(part => {
              const isCurrent = activeState.installedGearId === part.id;
              return (
                <button
                  key={part.id}
                  type="button"
                  onClick={() => {
                    onInstallGear(activeModule.id, part.id);
                    soundEngine.playWindmillClick();
                  }}
                  className={`p-2 rounded-xl border text-left flex flex-col justify-between transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#382b26] ${
                    isCurrent
                      ? 'border-[#b45309] bg-[#fffbeb] shadow-sm'
                      : 'border-[#382b26]/10 bg-[#fffdf9] hover:bg-[#fffaf2]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="w-4 h-4 rounded-full border border-[#382b26]/30" style={{ backgroundColor: part.color }} />
                    <span className="text-[9px] font-bold text-[#78645b]">{part.teeth}T</span>
                  </div>
                  <p className="text-[10px] font-bold text-[#2b201b] mt-1 truncate">{part.material.toUpperCase()}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Mechanism Tuning Slider */}
        <div className="bg-[#fffdf9] p-3.5 rounded-xl border border-[#382b26]/10 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#78645b] uppercase tracking-wider">
              {activeModule.tuneParameterName}
            </span>
            <span className="text-xs font-bold text-[#b45309]">
              {activeState.tuneValue} {activeModule.tuneParameterUnit}
            </span>
          </div>
          <input
            type="range"
            min={activeModule.tuneMin}
            max={activeModule.tuneMax}
            step={activeModule.tuneParameterUnit === 'x' ? 0.1 : 1}
            value={activeState.tuneValue}
            onChange={e => handleTune(parseFloat(e.target.value))}
            className="w-full accent-[#b45309] cursor-pointer"
          />
          <p className="text-xs text-[#78645b]">
            <span className="font-semibold text-[#382b26]">Functional Effect: </span>
            {activeModule.effectDescription}
          </p>
        </div>
      </div>

      {/* 4. Footer */}
      <div className="flex items-center justify-between border-t border-[#382b26]/15 pt-2">
        <p className="text-[11px] text-[#78645b]">
          Inventor&apos;s mechanisms run in real-time with the mountain windmill. Zero jitter.
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
