import React, { useEffect } from 'react';
import type { DiscoveryRecord } from '../../types';

interface DiscoveryToastProps {
  discovery: DiscoveryRecord;
  onDismiss: () => void;
  onOpenJournal: (discoveryId: string) => void;
}

export const DiscoveryToast: React.FC<DiscoveryToastProps> = ({
  discovery,
  onDismiss,
  onOpenJournal,
}) => {
  // Auto-dismiss after 9 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 9000);
    return () => clearTimeout(timer);
  }, [discovery, onDismiss]);

  return (
    <div
      className="fixed bottom-24 sm:bottom-20 left-1/2 -translate-x-1/2 z-40 w-[92vw] max-w-lg bg-[#fffdf8] border-2 border-[#382b26] rounded-2xl p-4 shadow-xl text-[#382b26] select-none pointer-events-auto transition-all animate-in fade-in slide-in-from-bottom-3 duration-300"
      style={{
        boxShadow: '0 12px 32px -4px rgba(56, 43, 38, 0.35)',
      }}
      onClick={e => e.stopPropagation()}
      onPointerDown={e => e.stopPropagation()}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="text-2xl mt-0.5">{discovery.icon}</span>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold text-[#065f46] bg-[#d1fae5] px-2 py-0.5 rounded-full uppercase tracking-wider">
                Discovery Uncovered
              </span>
              <span className="text-xs text-[#6b7280] font-medium">
                {discovery.locationName || discovery.zone}
              </span>
            </div>
            <h4 className="text-sm font-bold text-[#1f2937] leading-tight">
              {discovery.title}
            </h4>
            <p className="text-xs text-[#4b5563] leading-snug">
              {discovery.desc}
            </p>

            {discovery.explorerRemark && (
              <div className="pt-1.5 text-xs text-[#065f46] italic leading-relaxed">
                &ldquo;{discovery.explorerRemark}&rdquo;
                <span className="not-italic text-[10px] font-bold text-[#047857] ml-1">
                  — Explorer
                </span>
              </div>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={onDismiss}
          className="w-7 h-7 rounded-full bg-[#382b26]/5 hover:bg-[#382b26]/15 text-[#382b26] flex items-center justify-center font-bold text-xs shrink-0 transition-colors"
          title="Dismiss notification"
        >
          ✕
        </button>
      </div>

      <div className="mt-3 pt-2.5 border-t border-[#382b26]/10 flex items-center justify-between text-xs">
        <span className="text-[11px] text-[#6b7280]">Saved to your Field Journal</span>
        <button
          type="button"
          onClick={() => {
            onOpenJournal(discovery.id);
            onDismiss();
          }}
          className="px-3 py-1.5 rounded-xl bg-[#065f46] hover:bg-[#047857] text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-2xs"
        >
          <span>📖</span>
          <span>Open Field Journal</span>
        </button>
      </div>
    </div>
  );
};

export default DiscoveryToast;
