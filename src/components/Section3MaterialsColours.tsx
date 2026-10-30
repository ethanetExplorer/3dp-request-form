import React, { useState, useMemo } from 'react';
import {
  Check,
  Filter,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Material, MaterialType, PrintEstimate } from '../types';
import { COLOR_PALETTES } from '../utils/materialsData';
import { useAdminSettings } from '../context/AdminSettingsContext';
import { getContrastTextColor } from '../utils/colorUtils';

interface Section3Props {
  selectedMaterial: Material;
  onSelectMaterial: (material: Material) => void;
  estimate?: PrintEstimate | null;
}

export const Section3MaterialsColours: React.FC<Section3Props> = ({
  selectedMaterial,
  onSelectMaterial
}) => {
  const { settings, accentTextColor } = useAdminSettings();
  const isDark = settings.theme === 'dark';

  // Collapsible filter: collapsed by default
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [materialFilter, setMaterialFilter] = useState<'ALL' | MaterialType>('ALL');
  const [colorFilter, setColorFilter] = useState<string>('All Colours');

  // Filter materials based on material type, color, and in-stock status
  const filteredMaterials = useMemo(() => {
    return settings.filaments
      .filter((mat) => mat.inStock !== false)
      .filter((mat) => {
        const matchType = materialFilter === 'ALL' || mat.type === materialFilter;
        const matchColor =
          colorFilter === 'All Colours' ||
          mat.colorName.toLowerCase().includes(colorFilter.toLowerCase()) ||
          (colorFilter === 'Black' && mat.colorName.toLowerCase().includes('black')) ||
          (colorFilter === 'White' && mat.colorName.toLowerCase().includes('white')) ||
          (colorFilter === 'Grey' && (mat.colorName.toLowerCase().includes('grey') || mat.colorName.toLowerCase().includes('silver'))) ||
          (colorFilter === 'Clear' && mat.colorName.toLowerCase().includes('clear'));
        return matchType && matchColor;
      });
  }, [settings.filaments, materialFilter, colorFilter]);

  const hasActiveFilters = materialFilter !== 'ALL' || colorFilter !== 'All Colours';

  return (
    <div className={`rounded-xl border p-5 sm:p-6 shadow-xs space-y-4 transition-colors ${
      isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200/90'
    }`}>
      {/* Question Header */}
      <div className="flex items-center justify-between">
        <h2 className={`text-base font-medium ${isDark ? 'text-white' : 'text-neutral-900'}`}>
          Material & Colour <span className="text-red-500">*</span>
        </h2>
        <span className="text-xs text-neutral-400">
          Selected: <strong className={isDark ? 'text-neutral-200' : 'text-neutral-800'}>{selectedMaterial.type} {selectedMaterial.colorName}</strong>
        </span>
      </div>

      {/* Collapsible Filter Bar (Collapsed by default) */}
      <div className="pt-1">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`inline-flex items-center gap-1.5 text-xs font-medium py-1 transition-colors ${
              isDark ? 'text-neutral-300 hover:text-white' : 'text-neutral-700 hover:text-neutral-900'
            }`}
          >
            <Filter className="w-3.5 h-3.5 text-neutral-400" />
            <span>Filter materials & colours</span>
            {hasActiveFilters && (
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: settings.accentColor }}
              />
            )}
            {isFilterOpen ? (
              <ChevronUp className="w-3.5 h-3.5 text-neutral-400 ml-0.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-neutral-400 ml-0.5" />
            )}
          </button>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => {
                setMaterialFilter('ALL');
                setColorFilter('All Colours');
              }}
              className="text-xs hover:underline font-medium"
              style={{ color: settings.accentColor }}
            >
              Reset filters
            </button>
          )}
        </div>

        {/* Collapsible Filter Content */}
        {isFilterOpen && (
          <div className={`mt-3 p-3.5 rounded-xl border space-y-3 text-xs ${
            isDark ? 'bg-neutral-800/60 border-neutral-700' : 'bg-neutral-50/80 border-neutral-200'
          }`}>
            {/* Material Filter */}
            <div>
              <span className={`font-medium block mb-1.5 ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                Material:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: 'ALL', label: 'All' },
                  { id: 'PLA', label: 'PLA' },
                  { id: 'PETG', label: 'PETG' }
                ].map((item) => {
                  const isSelected = materialFilter === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setMaterialFilter(item.id as any)}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                        isSelected
                          ? 'shadow-2xs'
                          : isDark
                            ? 'bg-neutral-850 border-neutral-700 text-neutral-300 hover:bg-neutral-800'
                            : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                      }`}
                      style={
                        isSelected
                          ? { backgroundColor: settings.accentColor, borderColor: settings.accentColor, color: accentTextColor }
                          : {}
                      }
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Colour Palette Swatches Filter */}
            <div>
              <span className={`font-medium block mb-1.5 ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                Colour:
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                {COLOR_PALETTES.map((color) => {
                  const isSelected = colorFilter === color.name;
                  return (
                    <button
                      key={color.name}
                      type="button"
                      onClick={() => setColorFilter(color.name)}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-md border text-xs font-medium transition-colors ${
                        isSelected
                          ? 'shadow-2xs'
                          : isDark
                            ? 'bg-neutral-850 border-neutral-700 text-neutral-300 hover:bg-neutral-800'
                            : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                      }`}
                      style={
                        isSelected
                          ? { backgroundColor: settings.accentColor, borderColor: settings.accentColor, color: accentTextColor }
                          : {}
                      }
                    >
                      {color.hex && (
                        <span
                          className="w-2.5 h-2.5 rounded-full border border-black/15 shrink-0"
                          style={{ backgroundColor: color.hex }}
                        />
                      )}
                      <span>{color.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Compact Spool Selection Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
        {filteredMaterials.map((mat) => {
          const isSelected = selectedMaterial.id === mat.id;

          return (
            <button
              key={mat.id}
              type="button"
              onClick={() => onSelectMaterial(mat)}
              className={`p-3 rounded-lg border text-left transition-all flex items-center justify-between gap-3 ${
                isSelected
                  ? 'shadow-2xs'
                  : isDark
                    ? 'border-neutral-800 bg-neutral-850/60 hover:bg-neutral-800 hover:border-neutral-700'
                    : 'border-neutral-200 hover:border-neutral-300 bg-white hover:bg-neutral-50/60'
              }`}
              style={
                isSelected
                  ? {
                      borderColor: settings.accentColor,
                      backgroundColor: `${settings.accentColor}12`
                    }
                  : {}
              }
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {/* Color Swatch with contrast-calculated checkmark */}
                <div
                  className="w-6 h-6 rounded-full border border-black/15 shadow-2xs shrink-0 flex items-center justify-center"
                  style={{ backgroundColor: mat.colorHex }}
                >
                  {isSelected && (
                    <Check
                      className="w-3.5 h-3.5"
                      style={{ color: getContrastTextColor(mat.colorHex) }}
                    />
                  )}
                </div>

                <div className="min-w-0">
                  <div className={`text-xs font-medium truncate ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                    {mat.name}
                  </div>
                  <div className="text-[11px] text-neutral-400 font-mono">
                    <span className={`font-semibold ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>{mat.type}</span> • ${(mat.hourlyMachineRate + (settings.pricing.additionalHourlyRate || 0)).toFixed(2)}/hr
                  </div>
                </div>
              </div>

              {/* Radio Indicator */}
              <div
                className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                  isSelected
                    ? ''
                    : isDark
                      ? 'border-neutral-700 bg-neutral-800'
                      : 'border-neutral-300 bg-white'
                }`}
                style={
                  isSelected
                    ? { backgroundColor: settings.accentColor, borderColor: settings.accentColor }
                    : {}
                }
              >
                {isSelected && (
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: accentTextColor }}
                  />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {filteredMaterials.length === 0 && (
        <div className={`p-6 text-center text-xs rounded-lg border border-dashed ${
          isDark
            ? 'bg-neutral-800/40 border-neutral-700 text-neutral-400'
            : 'bg-neutral-50 border-neutral-200 text-neutral-500'
        }`}>
          No materials match active filter.
        </div>
      )}
    </div>
  );
};
