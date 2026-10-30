import React from 'react';
import { Box } from 'lucide-react';
import { PrintEstimate } from '../types';
import { useAdminSettings } from '../context/AdminSettingsContext';

interface HeaderProps {
  totalCost?: number;
  estimate?: PrintEstimate | null;
}

export const Header: React.FC<HeaderProps> = ({ totalCost, estimate }) => {
  const { settings, accentTextColor } = useAdminSettings();
  const isDark = settings.theme === 'dark';

  const displayedCost = totalCost !== undefined ? totalCost : estimate ? estimate.totalCost : null;

  return (
    <header className={`sticky top-0 z-30 w-full backdrop-blur-md border-b transition-colors ${
      isDark ? 'bg-neutral-900/90 border-neutral-800' : 'bg-white/90 border-neutral-200'
    }`}>
      <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shadow-2xs transition-colors"
            style={{ backgroundColor: settings.accentColor, color: accentTextColor }}
          >
            <Box className="w-4 h-4" />
          </div>
          <div>
            <h1 className={`text-sm font-semibold tracking-tight ${
              isDark ? 'text-neutral-100' : 'text-neutral-900'
            }`}>
              {settings.adminInfo.businessName || '3D Printing Request'}
            </h1>
          </div>
        </div>

        {/* Estimated cost of print on its own without any additional text */}
        <div>
          {displayedCost !== null && displayedCost > 0 && (
            <span className={`font-mono text-base font-bold tracking-tight ${
              isDark ? 'text-neutral-100' : 'text-neutral-900'
            }`}>
              ${displayedCost.toFixed(2)}
            </span>
          )}
        </div>
      </div>
    </header>
  );
};
