import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { DiscoveryRecord } from '../../types';
import { getDiscoveryDef } from '../../data/discoveries';
import { WORLD_ZONES } from '../../data/world';
import { soundEngine } from '../../audio/soundEngine';

interface FieldJournalProps {
  onClose: () => void;
  discoveries: Record<string, DiscoveryRecord>;
  onPanToWorldX: (x: number) => void;
  onSaveNote: (id: string, note: string) => void;
  onDeleteNote: (id: string) => void;
}

// Sample discoveries used strictly for testing when ?testDiscoveries=true is provided
const SAMPLE_TEST_DISCOVERIES: Record<string, DiscoveryRecord> = {
  'oak-hollow': {
    id: 'oak-hollow',
    title: 'Owl Hollow & Flood Tallies',
    desc: 'A sheltered knot in the oak’s trunk where a sleepy screech owl nests. Above the hollow, faint tally marks are carved into the bark.',
    icon: '🦉',
    timestamp: Date.now() - 3600000,
    locationName: 'Reading Meadows',
    zone: 'The Reading Meadows',
    worldX: 760,
    explorerRemark:
      'Look at the sap-sealed notches four inches above the hollow. Someone was measuring the brook’s spring flood levels sixty years ago.',
    timePhaseDiscovered: 'dusk',
    userNotes:
      'Counted 7 horizontal tally lines. The fourth line is worn smooth, like people touched it often.',
  },
  'well-quartz': {
    id: 'well-quartz',
    title: 'Bedrock Quartz Resonator',
    desc: 'An exposed vein of natural quartz inside the well shaft that rings with a clear harmonic tone when water droplets strike it.',
    icon: '💎',
    timestamp: Date.now() - 1800000,
    locationName: 'Meadow Spring',
    zone: 'The Reading Meadows',
    worldX: 1220,
    explorerRemark:
      'When the ridge wind changes direction, you can hear the well humming like a quiet tuning fork. That’s the quartz seam catching the air pressure.',
    timePhaseDiscovered: 'day',
    userNotes:
      'The pitch drops roughly half an octave when the bucket is submerged versus hanging empty.',
  },
  'trellis-moonflower': {
    id: 'trellis-moonflower',
    title: 'Night-Blooming Moonflower Vine',
    desc: 'A nocturnal vine nestled beside the trellis. Its pale silver blossoms stay coiled tight by day, but breathe open once dusk settles.',
    icon: '🌙',
    timestamp: Date.now() - 900000,
    locationName: 'Gardener’s Plot',
    zone: 'Sunflower Cottages & Gardens',
    worldX: 3040,
    explorerRemark:
      'Those spiral buds stay sealed tight under direct sunlight. Five minutes after dusk begins, the petals unstick with a faint whisper.',
    timePhaseDiscovered: 'dusk',
  },
  'lookout-spyglass': {
    id: 'lookout-spyglass',
    title: 'The Mountain Weather Spyglass',
    desc: 'A brass spyglass on a tripod aimed through a mountain pass, revealing distant clouds and soaring hawks riding the thermals.',
    icon: '☁️',
    timestamp: Date.now() - 300000,
    locationName: 'Western Cliff',
    zone: 'The Western Lookout Cliff',
    worldX: 4420,
    explorerRemark:
      'Look through the lens toward the notch in the third peak. That’s where the valley’s evening mist always originates.',
    timePhaseDiscovered: 'goldenHour',
    userNotes: 'Saw a kettle of red-tailed hawks circling over the notch right before sunset.',
  },
};

export const FieldJournal: React.FC<FieldJournalProps> = ({
  onClose,
  discoveries: propDiscoveries,
  onPanToWorldX,
  onSaveNote,
  onDeleteNote,
}) => {
  // Check for test data override in URL parameters
  const isTestMode = useMemo(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      return p.get('testDiscoveries') === 'true';
    }
    return false;
  }, []);

  const activeDiscoveries = useMemo(() => {
    if (isTestMode && Object.keys(propDiscoveries).length === 0) {
      return SAMPLE_TEST_DISCOVERIES;
    }
    return propDiscoveries;
  }, [isTestMode, propDiscoveries]);

  // Selected Zone Filter
  const [selectedZone, setSelectedZone] = useState<string>('all');
  // Search Query Filter
  const [searchQuery, setSearchQuery] = useState<string>('');
  // Filter by user notes
  const [filterOnlyNotes, setFilterOnlyNotes] = useState<boolean>(false);

  // Active Note Being Edited
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState<string>('');

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

  // Convert discoveries record into array merged with definition metadata
  const discoveredItems = useMemo(() => {
    const records = Object.values(activeDiscoveries);
    return records
      .map(rec => {
        const def = getDiscoveryDef(rec.id);
        return {
          id: rec.id,
          title: rec.title || def?.title || 'Unknown Landmark',
          desc: rec.desc || def?.desc || '',
          icon: rec.icon || def?.icon || '📍',
          locationName: rec.locationName || def?.locationName || 'The Valley',
          zone: rec.zone || def?.zone || 'The Countryside',
          worldX: rec.worldX ?? def?.worldX ?? 0,
          explorerRemark: rec.explorerRemark || def?.explorerRemark || '',
          timeHint: def?.timeHint,
          timePhaseDiscovered: rec.timePhaseDiscovered,
          timestamp: rec.timestamp,
          userNotes: rec.userNotes,
        };
      })
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [activeDiscoveries]);

  // Filtered discoveries list
  const filteredItems = useMemo(() => {
    return discoveredItems.filter(item => {
      if (selectedZone !== 'all' && item.zone !== selectedZone) {
        return false;
      }
      if (filterOnlyNotes && !item.userNotes?.trim()) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(query);
        const matchesDesc = item.desc.toLowerCase().includes(query);
        const matchesRemark = item.explorerRemark.toLowerCase().includes(query);
        const matchesNotes = item.userNotes?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc && !matchesRemark && !matchesNotes) {
          return false;
        }
      }
      return true;
    });
  }, [discoveredItems, selectedZone, filterOnlyNotes, searchQuery]);

  // Handlers for personal observations
  const handleStartEditNote = useCallback((id: string, currentNote?: string) => {
    setEditingNoteId(id);
    setNoteDraft(currentNote || '');
  }, []);

  const handleSaveNote = useCallback(
    (id: string) => {
      soundEngine.playGumdropPop(520);
      onSaveNote(id, noteDraft.trim());
      setEditingNoteId(null);
    },
    [noteDraft, onSaveNote]
  );

  const handleDeleteNote = useCallback(
    (id: string) => {
      soundEngine.playGumdropPop(380);
      onDeleteNote(id);
      if (editingNoteId === id) {
        setEditingNoteId(null);
      }
    },
    [editingNoteId, onDeleteNote]
  );

  const handlePanToDiscovery = useCallback(
    (worldX: number) => {
      soundEngine.playFlowerChime();
      onPanToWorldX(worldX);
      onClose();
    },
    [onPanToWorldX, onClose]
  );

  return (
    <div
      className="relative w-full max-w-3xl max-h-[90vh] bg-[#fffdfa] border-2 border-[#382b26] rounded-3xl shadow-2xl flex flex-col text-[#2b201b] overflow-hidden select-none"
      onClick={e => e.stopPropagation()}
      onPointerDown={e => e.stopPropagation()}
      style={{
        boxShadow: '0 20px 48px -12px rgba(56, 43, 38, 0.38)',
      }}
    >
      {/* 1. Header: Explorer Identity & Title */}
      <div className="p-4 sm:p-5 border-b-2 border-[#382b26]/15 bg-[#ecfdf5] flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#a2bb84] border-2 border-[#382b26] flex items-center justify-center text-xl shadow-xs">
            🔭
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-[#134e4a] leading-tight">
                Explorer&apos;s Field Journal
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-[#d1fae5] border border-[#a7f3d0] text-[#065f46] text-[10px] font-bold uppercase tracking-wider">
                Expedition Log
              </span>
            </div>
            <p className="text-xs text-[#4b5563] font-medium">
              Observations, quiet landmarks, and personal notes recorded from the countryside.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-[#382b26]/5 hover:bg-[#382b26]/15 text-[#382b26] flex items-center justify-center font-bold text-sm transition-colors"
          title="Close Journal (Escape)"
        >
          ✕
        </button>
      </div>

      {/* 2. Sub-Header: Zone Filters & Search (Only shown if user has made discoveries) */}
      {discoveredItems.length > 0 && (
        <div className="px-4 sm:px-6 py-2.5 bg-[#f9fafb] border-b border-[#382b26]/10 flex flex-wrap items-center justify-between gap-2.5 text-xs shrink-0">
          {/* Zone Selector */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-[#6b7280] uppercase tracking-wider">
              Zone:
            </span>
            <select
              value={selectedZone}
              onChange={e => setSelectedZone(e.target.value)}
              className="px-2.5 py-1 text-xs rounded-xl border border-[#382b26]/20 bg-white text-[#2b201b] font-medium focus:outline-none focus:ring-1 focus:ring-[#059669]"
            >
              <option value="all">All Zones ({discoveredItems.length})</option>
              {WORLD_ZONES.map(z => {
                const count = discoveredItems.filter(item => item.zone === z.name).length;
                if (count === 0) return null;
                return (
                  <option key={z.name} value={z.name}>
                    {z.icon} {z.name} ({count})
                  </option>
                );
              })}
            </select>

            {/* Filter by personal notes toggle */}
            <button
              type="button"
              onClick={() => setFilterOnlyNotes(prev => !prev)}
              className={`px-2.5 py-1 rounded-xl border text-[11px] font-bold transition-colors ${
                filterOnlyNotes
                  ? 'bg-[#065f46] text-white border-[#065f46]'
                  : 'bg-white hover:bg-[#f0fdf4] text-[#374151] border-[#382b26]/20'
              }`}
            >
              📝 With Notes
            </button>
          </div>

          {/* Search Box */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search discoveries or notes..."
              className="px-2.5 py-1 text-xs rounded-xl border border-[#382b26]/20 bg-white text-[#2b201b] placeholder:text-[#9ca3af] focus:outline-none focus:ring-1 focus:ring-[#059669]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-[10px] text-[#6b7280] hover:underline"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}

      {/* 3. Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {/* Case A: No discoveries made yet (Welcoming, encouraging invitation) */}
        {discoveredItems.length === 0 && (
          <div className="py-12 px-4 max-w-lg mx-auto text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-[#ecfdf5] border-2 border-[#10b981]/30 flex items-center justify-center text-3xl shadow-sm">
              🔭
            </div>
            <div className="space-y-2">
              <h3 className="text-base font-bold text-[#134e4a]">The Trail Lies Ahead</h3>
              <p className="text-xs text-[#4b5563] leading-relaxed">
                The valley holds many quiet secrets for those who take time to look—knots carved into
                ancient bark, resonant well acoustics, night-blooming vines, and wind markers along
                the high cliffs.
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#f0fdf4] border border-[#bbf7d0] text-xs text-[#065f46] italic">
              &ldquo;Keep your eyes open and wander freely. When you inspect something curious in
              the landscape, we&apos;ll record what you uncover right here.&rdquo;
              <span className="block text-[11px] font-bold text-[#047857] mt-1 not-italic">
                — Explorer
              </span>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-[#065f46] hover:bg-[#047857] text-white font-bold text-xs transition-colors shadow-xs"
              >
                Return to the Countryside ➔
              </button>
            </div>
          </div>
        )}

        {/* Case B: Discoveries exist, but filter yields 0 matches */}
        {discoveredItems.length > 0 && filteredItems.length === 0 && (
          <div className="py-8 text-center text-xs text-[#6b7280] space-y-2">
            <p>No discoveries match your current filter or search query.</p>
            <button
              type="button"
              onClick={() => {
                setSelectedZone('all');
                setFilterOnlyNotes(false);
                setSearchQuery('');
              }}
              className="font-bold text-[#065f46] underline"
            >
              Reset filters
            </button>
          </div>
        )}

        {/* Case C: Render Discovered Entries (Never shows undiscovered placeholders!) */}
        {filteredItems.length > 0 && (
          <div className="space-y-4">
            {filteredItems.map(item => {
              const isEditingNote = editingNoteId === item.id;

              return (
                <div
                  key={item.id}
                  className="p-4 sm:p-5 rounded-2xl bg-white border border-[#382b26]/15 hover:border-[#382b26]/30 shadow-xs space-y-3 transition-colors"
                >
                  {/* Top Bar: Icon, Title, Zone Badge, Pan Shortcut */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl mt-0.5">{item.icon}</span>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm sm:text-base font-bold text-[#1f2937] leading-tight">
                            {item.title}
                          </h4>
                          <span className="px-2 py-0.5 rounded-full bg-[#f3f4f6] text-[#4b5563] text-[10px] font-semibold">
                            {item.zone}
                          </span>
                          {item.timePhaseDiscovered && (
                            <span className="px-2 py-0.5 rounded-full bg-[#fef3c7] text-[#92400e] text-[10px] font-semibold capitalize">
                              {item.timePhaseDiscovered}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-[#6b7280] font-medium">
                          {item.locationName} &bull; Recorded{' '}
                          {new Date(item.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Pan to Location Shortcut Button */}
                    <button
                      type="button"
                      onClick={() => handlePanToDiscovery(item.worldX)}
                      className="px-3 py-1.5 rounded-xl bg-[#ecfdf5] hover:bg-[#d1fae5] border border-[#a7f3d0] text-[#065f46] text-xs font-bold transition-colors shrink-0 flex items-center gap-1.5 shadow-2xs"
                      title="Revisit this landmark in the world"
                    >
                      <span>🔭</span>
                      <span>Pan to Spot</span>
                    </button>
                  </div>

                  {/* Authored Natural Landmark Description */}
                  <p className="text-xs text-[#374151] leading-relaxed pl-1">{item.desc}</p>

                  {/* Explorer's Characterful Remark */}
                  {item.explorerRemark && (
                    <div className="p-3 rounded-xl bg-[#f0fdf4] border border-[#bbf7d0] text-xs text-[#065f46] space-y-1">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#047857]">
                        <span>Explorer remarks:</span>
                      </div>
                      <p className="italic leading-relaxed">&ldquo;{item.explorerRemark}&rdquo;</p>
                      {item.timeHint && (
                        <p className="text-[11px] text-[#059669] not-italic font-medium pt-0.5">
                          💡 {item.timeHint}
                        </p>
                      )}
                    </div>
                  )}

                  {/* User-Authored Personal Observations Section */}
                  <div className="pt-2 border-t border-[#382b26]/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-[#4b5563] flex items-center gap-1.5 uppercase tracking-wider">
                        <span>📝</span>
                        <span>Your Personal Observations</span>
                      </span>

                      {!isEditingNote && (
                        <button
                          type="button"
                          onClick={() => handleStartEditNote(item.id, item.userNotes)}
                          className="text-xs font-bold text-[#065f46] hover:underline"
                        >
                          {item.userNotes ? 'Edit Note' : '+ Add Note'}
                        </button>
                      )}
                    </div>

                    {/* If editing note */}
                    {isEditingNote ? (
                      <div className="space-y-2">
                        <textarea
                          value={noteDraft}
                          onChange={e => setNoteDraft(e.target.value)}
                          placeholder="Write your own field observation, question, or thought about this place..."
                          rows={3}
                          className="w-full p-2.5 text-xs rounded-xl border border-[#382b26]/25 bg-[#fffdfa] text-[#2b201b] focus:outline-none focus:ring-2 focus:ring-[#059669] resize-none"
                          autoFocus
                        />
                        <div className="flex items-center justify-between text-xs">
                          {item.userNotes ? (
                            <button
                              type="button"
                              onClick={() => handleDeleteNote(item.id)}
                              className="text-[#991b1b] hover:underline font-medium"
                            >
                              Delete note
                            </button>
                          ) : (
                            <div />
                          )}
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setEditingNoteId(null)}
                              className="px-2.5 py-1 rounded-lg text-[#6b7280] hover:bg-gray-100"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveNote(item.id)}
                              className="px-3 py-1.5 rounded-xl bg-[#065f46] hover:bg-[#047857] text-white font-bold shadow-2xs"
                            >
                              Save Observation
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : item.userNotes ? (
                      <div className="p-3 rounded-xl bg-[#fffbeb] border border-[#fef3c7] text-xs text-[#78350f] whitespace-pre-wrap leading-relaxed">
                        {item.userNotes}
                      </div>
                    ) : (
                      <p className="text-[11px] text-[#9ca3af] italic">
                        No personal notes recorded yet. Click &ldquo;+ Add Note&rdquo; to author your
                        own observations.
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Footer */}
      <div className="p-3.5 sm:px-6 border-t border-[#382b26]/15 bg-[#f9fafb] flex items-center justify-between text-xs text-[#6b7280] shrink-0">
        <span>
          {discoveredItems.length === 1
            ? '1 discovery recorded in this world'
            : `${discoveredItems.length} discoveries recorded in this world`}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-1.5 rounded-xl bg-[#382b26] hover:bg-[#523e37] text-white font-bold transition-colors"
        >
          Close Journal
        </button>
      </div>
    </div>
  );
};

export default FieldJournal;
