import React, { useState, useRef } from 'react';
import {
  Upload,
  FileCheck,
  AlertCircle,
  Clock,
  Layers,
  Box,
  Sliders,
  Check
} from 'lucide-react';
import {
  ModelData,
  SlicerSettings,
  Material,
  PrintEstimate,
  SlicerInfillPattern,
  PrintMode,
  NOZZLE_LAYER_HEIGHTS
} from '../types';
import { Viewer3D } from './Viewer3D';
import { useAdminSettings } from '../context/AdminSettingsContext';

interface Section2Props {
  modelData: ModelData | null;
  isLoading: boolean;
  error: string | null;
  onFileUpload: (file: File) => void;
  onSelectSample: (sampleId: string) => void;
  slicerSettings: SlicerSettings;
  onUpdateSettings: (settings: Partial<SlicerSettings>) => void;
  estimate: PrintEstimate | null;
  selectedMaterial: Material;
  printMode?: PrintMode;
  onChangePrintMode?: (mode: PrintMode) => void;
  onBatchFiles?: (files: File[]) => void;
}

// Visual depictions of authentic infill geometries
const INFILL_PATTERNS: {
  id: SlicerInfillPattern;
  name: string;
  svg: React.ReactNode;
}[] = [
  {
    id: 'Grid',
    name: 'Grid',
    svg: (
      <svg viewBox="0 0 40 40" className="w-8 h-8 stroke-current" fill="none" strokeWidth="1.5">
        <rect x="2" y="2" width="36" height="36" rx="3" strokeWidth="1" strokeDasharray="2 2" opacity="0.4" />
        <line x1="10" y1="4" x2="10" y2="36" />
        <line x1="20" y1="4" x2="20" y2="36" />
        <line x1="30" y1="4" x2="30" y2="36" />
        <line x1="4" y1="10" x2="36" y2="10" />
        <line x1="4" y1="20" x2="36" y2="20" />
        <line x1="4" y1="30" x2="36" y2="30" />
      </svg>
    )
  },
  {
    id: 'Gyroid',
    name: 'Gyroid',
    svg: (
      <svg viewBox="0 0 40 40" className="w-8 h-8 stroke-current" fill="none" strokeWidth="1.5">
        <rect x="2" y="2" width="36" height="36" rx="3" strokeWidth="1" strokeDasharray="2 2" opacity="0.4" />
        <path d="M 4 10 C 12 10, 12 22, 20 22 C 28 22, 28 10, 36 10" />
        <path d="M 4 20 C 12 20, 12 32, 20 32 C 28 32, 28 20, 36 20" />
        <path d="M 4 30 C 12 30, 12 40, 20 40 C 28 40, 28 30, 36 30" />
        <path d="M 4 0 C 12 0, 12 12, 20 12 C 28 12, 28 0, 36 0" />
      </svg>
    )
  },
  {
    id: 'Honeycomb',
    name: 'Honeycomb',
    svg: (
      <svg viewBox="0 0 40 40" className="w-8 h-8 stroke-current" fill="none" strokeWidth="1.5">
        <rect x="2" y="2" width="36" height="36" rx="3" strokeWidth="1" strokeDasharray="2 2" opacity="0.4" />
        <polygon points="12,7 20,2 28,7 28,17 20,22 12,17" />
        <polygon points="28,17 36,12 44,17 44,27 36,32 28,27" />
        <polygon points="12,27 20,22 28,27 28,37 20,42 12,37" />
        <polygon points="-4,17 4,12 12,17 12,27 4,32 -4,27" />
      </svg>
    )
  },
  {
    id: 'Linear',
    name: 'Linear',
    svg: (
      <svg viewBox="0 0 40 40" className="w-8 h-8 stroke-current" fill="none" strokeWidth="1.5">
        <rect x="2" y="2" width="36" height="36" rx="3" strokeWidth="1" strokeDasharray="2 2" opacity="0.4" />
        <line x1="4" y1="12" x2="12" y2="4" />
        <line x1="4" y1="22" x2="22" y2="4" />
        <line x1="4" y1="32" x2="32" y2="4" />
        <line x1="8" y1="36" x2="36" y2="8" />
        <line x1="18" y1="36" x2="36" y2="18" />
        <line x1="28" y1="36" x2="36" y2="28" />
      </svg>
    )
  }
];

export const Section2ModelSlicer: React.FC<Section2Props> = ({
  modelData,
  isLoading,
  error,
  onFileUpload,
  onSelectSample,
  slicerSettings,
  onUpdateSettings,
  estimate,
  selectedMaterial,
  printMode: controlledPrintMode,
  onChangePrintMode,
  onBatchFiles
}) => {
  const { settings, accentTextColor } = useAdminSettings();
  const isDark = settings.theme === 'dark';

  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 4-stage toggle: Quality, Standard, Fast, Advanced (controlled or uncontrolled)
  const [internalMode, setInternalMode] = useState<PrintMode>(controlledPrintMode || 'standard');
  const activePrintMode = controlledPrintMode !== undefined ? controlledPrintMode : internalMode;

  const currentNozzle = slicerSettings.nozzleSize || 0.4;
  const availableLayerHeights = NOZZLE_LAYER_HEIGHTS[currentNozzle] || NOZZLE_LAYER_HEIGHTS[0.4];

  // Presets exclusive to this nozzle
  const nozzlePresets = settings.presets.filter((p) => p.nozzleSize === currentNozzle);
  const activePreset = settings.presets.find(
    (p) => p.id === activePrintMode || (p.nozzleSize === currentNozzle && p.name.toLowerCase() === activePrintMode.toLowerCase())
  );

  const handleNozzleChange = (newNozzle: number) => {
    const targetHeights = NOZZLE_LAYER_HEIGHTS[newNozzle] || NOZZLE_LAYER_HEIGHTS[0.4];
    const isCurrentHeightValid = targetHeights.some((h) => Math.abs(h.value - slicerSettings.layerHeight) < 0.005);
    const defaultHeight = targetHeights.find((h) => h.sub.includes('Standard'))?.value || targetHeights[1]?.value || targetHeights[0].value;

    const presetsForNewNozzle = settings.presets.filter((p) => p.nozzleSize === newNozzle);
    const matchingPreset = presetsForNewNozzle.find((p) => p.name.toLowerCase().includes('standard')) || presetsForNewNozzle[0];

    if (activePrintMode !== 'advanced' && matchingPreset) {
      if (onChangePrintMode) {
        onChangePrintMode(matchingPreset.id);
      } else {
        setInternalMode(matchingPreset.id);
      }
      onUpdateSettings({
        nozzleSize: newNozzle,
        layerHeight: matchingPreset.layerHeight,
        infillPercent: matchingPreset.infillPercent,
        infillPattern: matchingPreset.infillPattern,
        wallLoops: matchingPreset.wallLoops,
        supportType: matchingPreset.supportType
      });
    } else {
      onUpdateSettings({
        nozzleSize: newNozzle,
        layerHeight: isCurrentHeightValid ? slicerSettings.layerHeight : defaultHeight
      });
    }
  };

  const handleModeSelect = (mode: string) => {
    if (onChangePrintMode) {
      onChangePrintMode(mode);
    } else {
      setInternalMode(mode);
    }
    if (mode === 'advanced') return;

    // Apply the preset's parameters
    const preset = settings.presets.find(
      (p) => p.id === mode || (p.nozzleSize === currentNozzle && p.name.toLowerCase() === mode.toLowerCase())
    );
    if (preset) {
      onUpdateSettings({
        nozzleSize: preset.nozzleSize,
        layerHeight: preset.layerHeight,
        infillPercent: preset.infillPercent,
        infillPattern: preset.infillPattern,
        wallLoops: preset.wallLoops,
        supportType: preset.supportType
      });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      if (files.length > 1 && onBatchFiles) {
        onBatchFiles(Array.from(files));
      } else {
        onFileUpload(files[0]);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      if (files.length > 1 && onBatchFiles) {
        onBatchFiles(Array.from(files));
      } else {
        onFileUpload(files[0]);
      }
    }
    e.target.value = '';
  };

  return (
    <div className={`rounded-xl border p-5 sm:p-6 shadow-xs space-y-4 transition-colors ${
      isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200/90'
    }`}>
      {/* Question Header */}
      <div>
        <h2 className={`text-base font-medium ${isDark ? 'text-white' : 'text-neutral-900'}`}>
          3D Model (STL or STEP) <span className="text-red-500">*</span>
        </h2>
      </div>

      {/* Upload Zone & Sample Picker */}
      <div className="space-y-3">
        <input
          ref={fileInputRef}
          type="file"
          accept=".stl,.step,.stp"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
            isDragOver
              ? 'border-neutral-400 bg-neutral-100 dark:bg-neutral-800'
              : isDark
                ? 'border-neutral-700 hover:border-neutral-500 bg-neutral-800/40 hover:bg-neutral-800/70'
                : 'border-neutral-300 hover:border-neutral-400 bg-neutral-50/50 hover:bg-neutral-50'
          }`}
        >
          <div className="flex flex-col items-center justify-center gap-1.5">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center transition-transform active:scale-95"
              style={{ backgroundColor: `${settings.accentColor}15`, color: settings.accentColor }}
            >
              <Upload className="w-5 h-5" />
            </div>
            <div className={`text-xs font-medium ${isDark ? 'text-neutral-200' : 'text-neutral-700'}`}>
              <span className="underline" style={{ color: settings.accentColor }}>Upload STL or STEP file</span>
              {' '}or drag & drop
            </div>
            <div className="text-[11px] text-neutral-400">
              Supports binary/ASCII STL, ISO 10303 STEP (.step, .stp)
            </div>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-xs text-red-700 dark:text-red-300">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Quick Sample Selector */}
        <div className="flex items-center gap-2 text-xs text-neutral-500 flex-wrap">
          <span className="text-[11px]">Or load sample:</span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { id: 'sample-gear', name: 'Spur Gear' },
              { id: 'sample-benchy', name: '3D Benchy' },
              { id: 'sample-drone', name: 'Drone Arm' },
              { id: 'sample-step-bearing', name: 'Bearing Mount (STEP)' }
            ].map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => onSelectSample(s.id)}
                className={`px-2 py-0.5 rounded text-[11px] border transition-colors ${
                  modelData?.id === s.id
                    ? 'font-medium'
                    : isDark
                      ? 'border-neutral-700 bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                      : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
                }`}
                style={
                  modelData?.id === s.id
                    ? { borderColor: settings.accentColor, color: settings.accentColor, backgroundColor: `${settings.accentColor}10` }
                    : {}
                }
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Active File Loaded Bar */}
      {modelData && (
        <div className={`p-3 rounded-lg border flex items-center justify-between text-xs ${
          isDark ? 'bg-neutral-800/60 border-neutral-700' : 'bg-neutral-50 border-neutral-200/80'
        }`}>
          <div className="flex items-center gap-2 min-w-0">
            <Box className="w-4 h-4 text-neutral-500 shrink-0" />
            <span className={`font-medium truncate ${isDark ? 'text-white' : 'text-neutral-900'}`}>
              {modelData.name}
            </span>
            <span className="text-neutral-400 font-mono text-[11px]">
              ({(modelData.fileSize / 1024).toFixed(0)} KB • {modelData.triangleCount.toLocaleString()} tris)
            </span>
          </div>
          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium shrink-0">
            <FileCheck className="w-3.5 h-3.5" /> Ready
          </span>
        </div>
      )}

      {/* 3D Model Viewer */}
      <div className={`rounded-xl overflow-hidden border ${
        isDark ? 'border-neutral-800 bg-neutral-950' : 'border-neutral-200 bg-neutral-50'
      }`}>
        <Viewer3D
          modelData={modelData}
          selectedMaterial={selectedMaterial}
          slicerSettings={slicerSettings}
        />
      </div>

      {/* Retained Summarised Hourly Print Cost Calculation (Directly Below 3D View) */}
      {estimate && (
        <div className={`rounded-xl p-4 border space-y-3 ${
          isDark ? 'bg-neutral-800/40 border-neutral-800' : 'bg-neutral-50/90 border-neutral-200'
        }`}>
          <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b ${
            isDark ? 'border-neutral-800' : 'border-neutral-200'
          }`}>
            <div>
              <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider block">
                Estimated Print Cost
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className={`text-2xl font-bold font-mono ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                  ${estimate.totalCost.toFixed(2)}
                </span>
                <span className="text-xs text-neutral-500">
                  ({selectedMaterial.type} • ${selectedMaterial.hourlyMachineRate.toFixed(2)}/hr)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono">
              <div>
                <span className="text-[10px] text-neutral-400 block uppercase font-sans font-medium">Time</span>
                <span className={`font-semibold flex items-center gap-1 ${isDark ? 'text-neutral-200' : 'text-neutral-800'}`}>
                  <Clock className="w-3 h-3 text-blue-500" />
                  {estimate.formattedTime}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-neutral-400 block uppercase font-sans font-medium">Filament</span>
                <span className={`font-semibold ${isDark ? 'text-neutral-200' : 'text-neutral-800'}`}>
                  {estimate.filamentWeightGrams}g
                </span>
              </div>
              <div>
                <span className="text-[10px] text-neutral-400 block uppercase font-sans font-medium">Layers</span>
                <span className={`font-semibold ${isDark ? 'text-neutral-200' : 'text-neutral-800'}`}>
                  {estimate.layerCount}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between text-[11px] text-neutral-500 font-mono gap-1">
            <span>Machine ({estimate.printTimeHours}h × ${selectedMaterial.hourlyMachineRate.toFixed(2)}): <strong>${estimate.machineCost.toFixed(2)}</strong></span>
            <span>Filament ({estimate.filamentWeightGrams}g): <strong>${estimate.materialCost.toFixed(2)}</strong></span>
            <span>Setup: <strong>${estimate.setupFee.toFixed(2)}</strong></span>
          </div>
        </div>
      )}

      {/* Dynamic Per-Nozzle Presets + Advanced Toggle */}
      <div className="pt-2 space-y-2">
        <div className="flex items-center justify-between">
          <label className={`block text-xs font-medium ${isDark ? 'text-neutral-200' : 'text-neutral-800'}`}>
            Print Quality & Speed
          </label>
          <span className="text-[11px] text-neutral-400 font-mono">
            {currentNozzle} mm nozzle
          </span>
        </div>

        <div
          className={`grid p-1 rounded-xl border gap-1 ${
            isDark ? 'bg-neutral-800/80 border-neutral-700' : 'bg-neutral-100 border-neutral-200'
          }`}
          style={{ gridTemplateColumns: `repeat(${Math.max(2, nozzlePresets.length + 1)}, minmax(0, 1fr))` }}
        >
          {nozzlePresets.map((preset) => {
            const isSelected =
              activePrintMode === preset.id ||
              (activePrintMode === preset.name.toLowerCase() && preset.nozzleSize === currentNozzle);

            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleModeSelect(preset.id)}
                className={`py-2 px-1 text-xs rounded-lg font-medium transition-all truncate text-center ${
                  isSelected
                    ? 'shadow-xs font-semibold'
                    : isDark
                      ? 'text-neutral-400 hover:text-white'
                      : 'text-neutral-600 hover:text-neutral-900'
                }`}
                style={
                  isSelected
                    ? { backgroundColor: settings.accentColor, color: accentTextColor }
                    : {}
                }
                title={`${preset.name} (${preset.layerHeight}mm • ${preset.infillPercent}% infill)`}
              >
                {preset.name}
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => handleModeSelect('advanced')}
            className={`py-2 px-1 text-xs rounded-lg font-medium transition-all text-center ${
              activePrintMode === 'advanced'
                ? 'shadow-xs font-semibold'
                : isDark
                  ? 'text-neutral-400 hover:text-white'
                  : 'text-neutral-600 hover:text-neutral-900'
            }`}
            style={
              activePrintMode === 'advanced'
                ? { backgroundColor: settings.accentColor, color: accentTextColor }
                : {}
            }
          >
            Advanced
          </button>
        </div>

        {/* Preset Description Pill when a preset is active */}
        {activePrintMode !== 'advanced' && (
          <div className="text-[11px] text-neutral-500 flex flex-wrap items-center justify-between gap-1 px-1">
            <span>
              Preset applied: <strong>{activePreset?.name || activePrintMode}</strong> ({slicerSettings.layerHeight}mm layer • {slicerSettings.infillPercent}% {slicerSettings.infillPattern} • {slicerSettings.wallLoops} walls)
            </span>
            <span className="text-neutral-400">Select Advanced to customize</span>
          </div>
        )}
      </div>

      {/* Advanced Slicer Settings Pane (Toggled ONLY when 'advanced' is chosen) */}
      {activePrintMode === 'advanced' && (
        <div className={`p-4 rounded-xl border space-y-4 text-xs transition-all ${
          isDark ? 'bg-neutral-800/50 border-neutral-700' : 'bg-neutral-50/70 border-neutral-200'
        }`}>
          <div className="flex items-center gap-1.5 font-medium pb-1 border-b border-neutral-200 dark:border-neutral-700">
            <Sliders className="w-3.5 h-3.5" style={{ color: settings.accentColor }} />
            <span>Custom Slicer Parameters</span>
          </div>

          {/* Infill Geometry with ACTUAL Infill Style Depictions */}
          <div>
            <label className={`font-medium block mb-2 ${isDark ? 'text-neutral-200' : 'text-neutral-800'}`}>
              Infill Pattern
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {INFILL_PATTERNS.map((pat) => {
                const isSelected = slicerSettings.infillPattern === pat.id;
                return (
                  <button
                    key={pat.id}
                    type="button"
                    onClick={() => onUpdateSettings({ infillPattern: pat.id })}
                    className={`p-2.5 rounded-lg border text-center transition-all flex flex-col items-center gap-1.5 ${
                      isSelected
                        ? 'shadow-xs font-semibold ring-1'
                        : isDark
                          ? 'border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
                          : 'border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700'
                    }`}
                    style={
                      isSelected
                        ? {
                            borderColor: settings.accentColor,
                            color: settings.accentColor,
                            backgroundColor: `${settings.accentColor}10`
                          }
                        : {}
                    }
                  >
                    <div className={isSelected ? '' : 'text-neutral-500'}>
                      {pat.svg}
                    </div>
                    <span className="text-[11px]">{pat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Infill Percentage Slider */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className={`font-medium ${isDark ? 'text-neutral-200' : 'text-neutral-800'}`}>
                Infill Density
              </label>
              <span className="font-mono text-xs font-semibold" style={{ color: settings.accentColor }}>
                {slicerSettings.infillPercent}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={slicerSettings.infillPercent}
              onChange={(e) => onUpdateSettings({ infillPercent: parseInt(e.target.value) })}
              className="w-full"
              style={{ accentColor: settings.accentColor }}
            />
          </div>

          {/* Nozzle Size Selection (0.2mm, 0.4mm, 0.6mm, 0.8mm) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className={`font-medium ${isDark ? 'text-neutral-200' : 'text-neutral-800'}`}>
                Nozzle Size
              </label>
              <span className="text-[11px] text-neutral-400 font-mono">
                {currentNozzle} mm
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { value: 0.2, label: '0.2 mm', sub: 'Fine Detail' },
                { value: 0.4, label: '0.4 mm', sub: 'Standard' },
                { value: 0.6, label: '0.6 mm', sub: 'High Flow' },
                { value: 0.8, label: '0.8 mm', sub: 'Max Speed' }
              ].map((nozzle) => {
                const isSelected = currentNozzle === nozzle.value;
                return (
                  <button
                    key={nozzle.value}
                    type="button"
                    onClick={() => handleNozzleChange(nozzle.value)}
                    className={`py-2 px-2.5 rounded-lg border text-center transition-all ${
                      isSelected
                        ? 'shadow-xs font-semibold'
                        : isDark
                          ? 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:bg-neutral-700'
                          : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                    }`}
                    style={
                      isSelected
                        ? {
                            backgroundColor: settings.accentColor,
                            borderColor: settings.accentColor,
                            color: accentTextColor
                          }
                        : {}
                    }
                  >
                    <div className="font-semibold text-xs">{nozzle.label}</div>
                    <div className="text-[10px] opacity-80">{nozzle.sub}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dynamic Layer Height for Selected Nozzle */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className={`font-medium ${isDark ? 'text-neutral-200' : 'text-neutral-800'}`}>
                Layer Height
              </label>
              <span className="text-[11px] text-neutral-400 font-mono">
                {slicerSettings.layerHeight} mm ({currentNozzle}mm nozzle)
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {availableLayerHeights.map((opt) => {
                const isSelected = slicerSettings.layerHeight === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onUpdateSettings({ layerHeight: opt.value })}
                    className={`py-2 px-2.5 rounded-lg border text-center transition-all ${
                      isSelected
                        ? 'shadow-xs font-semibold'
                        : isDark
                          ? 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:bg-neutral-700'
                          : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                    }`}
                    style={
                      isSelected
                        ? {
                            backgroundColor: settings.accentColor,
                            borderColor: settings.accentColor,
                            color: accentTextColor
                          }
                        : {}
                    }
                  >
                    <div className="font-semibold text-xs">{opt.label}</div>
                    <div className="text-[10px] opacity-80">
                      {opt.sub}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Wall Loops and Supports (Speed setting removed as requested!) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className={`font-medium block mb-1 ${isDark ? 'text-neutral-200' : 'text-neutral-800'}`}>
                Wall Loops (Shells)
              </label>
              <div className="grid grid-cols-4 gap-1">
                {[2, 3, 4, 5].map((loops) => {
                  const isSelected = slicerSettings.wallLoops === loops;
                  return (
                    <button
                      key={loops}
                      type="button"
                      onClick={() => onUpdateSettings({ wallLoops: loops })}
                      className={`py-1.5 text-xs rounded-lg border text-center font-medium transition-colors ${
                        isSelected
                          ? 'font-semibold shadow-2xs'
                          : isDark
                            ? 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:bg-neutral-700'
                            : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                      }`}
                      style={
                        isSelected
                          ? {
                              backgroundColor: settings.accentColor,
                              borderColor: settings.accentColor,
                              color: accentTextColor
                            }
                          : {}
                      }
                    >
                      {loops}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className={`font-medium block mb-1 ${isDark ? 'text-neutral-200' : 'text-neutral-800'}`}>
                Supports
              </label>
              <div className="grid grid-cols-3 gap-1">
                {[
                  { type: 'none', label: 'None' },
                  { type: 'tree', label: 'Tree' },
                  { type: 'normal', label: 'Normal' }
                ].map((sup) => {
                  const isSelected = slicerSettings.supportType === sup.type;
                  return (
                    <button
                      key={sup.type}
                      type="button"
                      onClick={() => onUpdateSettings({ supportType: sup.type as any })}
                      className={`py-1.5 text-xs rounded-lg border text-center font-medium transition-colors ${
                        isSelected
                          ? 'font-semibold shadow-2xs'
                          : isDark
                            ? 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:bg-neutral-700'
                            : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                      }`}
                      style={
                        isSelected
                          ? {
                              backgroundColor: settings.accentColor,
                              borderColor: settings.accentColor,
                              color: accentTextColor
                            }
                          : {}
                      }
                    >
                      {sup.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
