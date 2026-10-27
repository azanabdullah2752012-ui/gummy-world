import React from 'react';
import type { DiscoveryRecord } from '../../types';
import { FieldJournal } from '../Activities/FieldJournal';

interface JournalDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  discoveries: Record<string, DiscoveryRecord>;
  onFocusCharacter?: (id: string) => void;
  onPanToWorldX?: (x: number) => void;
  onSaveNote?: (id: string, note: string) => void;
  onDeleteNote?: (id: string) => void;
}

export const JournalDrawer: React.FC<JournalDrawerProps> = ({
  isOpen,
  onClose,
  discoveries,
  onPanToWorldX,
  onSaveNote,
  onDeleteNote,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#1a130f]/40 backdrop-blur-[2px] transition-opacity select-none"
      onClick={onClose}
      onPointerDown={e => e.stopPropagation()}
      onTouchStart={e => e.stopPropagation()}
    >
      <FieldJournal
        onClose={onClose}
        discoveries={discoveries}
        onPanToWorldX={onPanToWorldX || (() => {})}
        onSaveNote={onSaveNote || (() => {})}
        onDeleteNote={onDeleteNote || (() => {})}
      />
    </div>
  );
};

export default JournalDrawer;
