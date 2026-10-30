import React from 'react';
import { Send, Clock, AlertCircle } from 'lucide-react';
import { Material, PrintEstimate } from '../types';

interface MobileStickyBarProps {
  estimate: PrintEstimate | null;
  selectedMaterial: Material;
  onSubmit: () => void;
  isValid: boolean;
}

export const MobileStickyBar: React.FC<MobileStickyBarProps> = ({
  estimate,
  selectedMaterial,
  onSubmit,
  isValid
}) => {
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-neutral-200/90 px-4 py-3 shadow-lg">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">
            Estimated Total
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono text-neutral-900">
              {estimate ? `$${estimate.totalCost.toFixed(2)}` : '--'}
            </span>
            {estimate && (
              <span className="text-xs text-neutral-500 flex items-center gap-1">
                <Clock className="w-3 h-3 text-neutral-400" />
                <span>{estimate.formattedTime}</span>
              </span>
            )}
          </div>
          <div className="text-[10px] text-neutral-500 truncate max-w-[150px]">
            {selectedMaterial.type} • {selectedMaterial.colorName}
          </div>
        </div>

        <button
          type="button"
          onClick={onSubmit}
          className="flex-1 max-w-[200px] flex items-center justify-center gap-2 py-3 px-4 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-all active:scale-[0.98]"
        >
          <span>Submit Request</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

