import React, { useState } from 'react';
import {
  Settings,
  Layers,
  DollarSign,
  Palette,
  User,
  Check,
  Plus,
  Trash2,
  ArrowLeft,
  Sun,
  Moon,
  RotateCcw,
  Sparkles,
  Box,
  Sliders,
  CheckCircle2,
  Info,
  LogOut,
  KeyRound,
  ShieldCheck,
  Eye,
  EyeOff,
  AlertCircle,
  Pencil,
  X,
  Clock,
  Link2,
  Unlink2
} from 'lucide-react';
import { useAdminSettings } from '../context/AdminSettingsContext';
import { Material, MaterialType, PrintPreset, NOZZLE_LAYER_HEIGHTS, SlicerInfillPattern, SlicerSupportType } from '../types';
import { navigate } from '../router';
import { DemoNotice } from './DemoNotice';
import { RichTextEditor } from './RichTextEditor';
import {
  clearAuthenticatedSession,
  verifyPassword,
  hashPassword,
  DEFAULT_ADMIN_PASSWORD_HASH
} from '../utils/auth';

const PRESET_ACCENT_COLORS = [
  { name: 'Google Purple', hex: '#673ab7' },
  { name: 'Classic Indigo', hex: '#4f46e5' },
  { name: 'Ocean Blue', hex: '#2563eb' },
  { name: 'Emerald Green', hex: '#059669' },
  { name: 'Ruby Rose', hex: '#e11d48' },
  { name: 'Warm Amber', hex: '#d97706' },
  { name: 'Charcoal Dark', hex: '#1f2937' }
];

interface AdminPanelProps {
  onLogout?: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onLogout }) => {
  const {
    settings,
    accentTextColor,
    updateSettings,
    updatePricing,
    updateAdminInfo,
    addPreset,
    updatePreset,
    deletePreset,
    resetPresets,
    updateFilament,
    addFilament,
    deleteFilament,
    resetFilaments,
    resetToDefaults
  } = useAdminSettings();

  const [activeTab, setActiveTab] = useState<
    'filaments' | 'presets' | 'business' | 'theme'
  >('filaments');

  const [saveToast, setSaveToast] = useState(false);

  // Filament modal & editing state
  const [showFilamentModal, setShowFilamentModal] = useState(false);
  const [filamentModalMode, setFilamentModalMode] = useState<'add' | 'edit'>('add');
  const [editingFilamentId, setEditingFilamentId] = useState<string | null>(null);
  const [filamentFormData, setFilamentFormData] = useState<{
    name: string;
    type: MaterialType;
    colorName: string;
    colorHex: string;
    finish: 'Matte' | 'Glossy' | 'Silk';
    costPerKgInput: string;
    hourlyMachineRateInput: string;
    inStock: boolean;
    description: string;
  }>({
    name: '',
    type: 'PLA',
    colorName: '',
    colorHex: '#3b82f6',
    finish: 'Matte',
    costPerKgInput: '28.00',
    hourlyMachineRateInput: '4.50',
    inStock: true,
    description: ''
  });

  const triggerSaveNotification = () => {
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2000);
  };

  // Print Presets per-nozzle state
  const [selectedNozzleTab, setSelectedNozzleTab] = useState<number | 'all'>('all');
  const [showPresetModal, setShowPresetModal] = useState(false);
  const [presetModalMode, setPresetModalMode] = useState<'add' | 'edit'>('add');
  const [editingPresetId, setEditingPresetId] = useState<string | null>(null);
  const [presetFormData, setPresetFormData] = useState<{
    name: string;
    nozzleSize: number;
    layerHeight: number;
    infillPercent: number;
    infillPattern: SlicerInfillPattern;
    wallLoops: number;
    supportType: SlicerSupportType;
    description: string;
  }>({
    name: '',
    nozzleSize: 0.4,
    layerHeight: 0.20,
    infillPercent: 20,
    infillPattern: 'Grid',
    wallLoops: 3,
    supportType: 'none',
    description: ''
  });

  const handleOpenAddPreset = (defaultNozzle?: number) => {
    const nozzle = typeof defaultNozzle === 'number'
      ? defaultNozzle
      : (selectedNozzleTab !== 'all' ? selectedNozzleTab : 0.4);
    const validHeights = NOZZLE_LAYER_HEIGHTS[nozzle] || NOZZLE_LAYER_HEIGHTS[0.4];
    const defaultHeight = validHeights.find((h) => h.sub.includes('Standard'))?.value || validHeights[1]?.value || validHeights[0].value;

    setPresetModalMode('add');
    setEditingPresetId(null);
    setPresetFormData({
      name: '',
      nozzleSize: nozzle,
      layerHeight: defaultHeight,
      infillPercent: 20,
      infillPattern: 'Grid',
      wallLoops: 3,
      supportType: 'none',
      description: ''
    });
    setShowPresetModal(true);
  };

  const handleOpenEditPreset = (preset: PrintPreset) => {
    setPresetModalMode('edit');
    setEditingPresetId(preset.id);
    setPresetFormData({
      name: preset.name,
      nozzleSize: preset.nozzleSize,
      layerHeight: preset.layerHeight,
      infillPercent: preset.infillPercent,
      infillPattern: preset.infillPattern,
      wallLoops: preset.wallLoops,
      supportType: preset.supportType,
      description: preset.description || ''
    });
    setShowPresetModal(true);
  };

  const handlePresetFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!presetFormData.name.trim()) return;

    if (presetModalMode === 'add') {
      addPreset({
        name: presetFormData.name.trim(),
        nozzleSize: presetFormData.nozzleSize,
        layerHeight: presetFormData.layerHeight,
        infillPercent: presetFormData.infillPercent,
        infillPattern: presetFormData.infillPattern,
        wallLoops: presetFormData.wallLoops,
        supportType: presetFormData.supportType,
        description: presetFormData.description.trim()
      });
    } else if (presetModalMode === 'edit' && editingPresetId) {
      updatePreset(editingPresetId, {
        name: presetFormData.name.trim(),
        nozzleSize: presetFormData.nozzleSize,
        layerHeight: presetFormData.layerHeight,
        infillPercent: presetFormData.infillPercent,
        infillPattern: presetFormData.infillPattern,
        wallLoops: presetFormData.wallLoops,
        supportType: presetFormData.supportType,
        description: presetFormData.description.trim()
      });
    }

    setShowPresetModal(false);
    triggerSaveNotification();
  };

  const handleDeletePreset = (preset: PrintPreset) => {
    if (window.confirm(`Are you sure you want to delete preset "${preset.name}" for ${preset.nozzleSize}mm nozzle?`)) {
      deletePreset(preset.id);
      triggerSaveNotification();
    }
  };

  // Password change state
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPwInputs, setShowPwInputs] = useState(false);
  const [pwStatus, setPwStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isChangingPw, setIsChangingPw] = useState(false);

  const handleLogout = () => {
    clearAuthenticatedSession();
    if (onLogout) {
      onLogout();
    } else {
      navigate('/adminpanel');
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwStatus(null);

    if (!currentPw) {
      setPwStatus({ type: 'error', message: 'Please enter your current password.' });
      return;
    }
    if (!newPw || newPw.length < 4) {
      setPwStatus({ type: 'error', message: 'New password must be at least 4 characters long.' });
      return;
    }
    if (newPw !== confirmPw) {
      setPwStatus({ type: 'error', message: 'New passwords do not match.' });
      return;
    }

    setIsChangingPw(true);
    try {
      const activeHash = settings.passwordHash || DEFAULT_ADMIN_PASSWORD_HASH;
      const isCurrentValid = await verifyPassword(currentPw, activeHash);
      if (!isCurrentValid) {
        setPwStatus({ type: 'error', message: 'Current password is incorrect.' });
        setIsChangingPw(false);
        return;
      }

      const newHash = await hashPassword(newPw);
      updateSettings({ passwordHash: newHash });
      triggerSaveNotification();
      setPwStatus({ type: 'success', message: 'Admin password changed successfully!' });
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
      setTimeout(() => setPwStatus(null), 4000);
    } catch {
      setPwStatus({ type: 'error', message: 'Failed to update password.' });
    } finally {
      setIsChangingPw(false);
    }
  };

  const handleOpenAddModal = () => {
    setFilamentModalMode('add');
    setEditingFilamentId(null);
    setFilamentFormData({
      name: '',
      type: 'PLA',
      colorName: '',
      colorHex: '#3b82f6',
      finish: 'Matte',
      costPerKgInput: '28.00',
      hourlyMachineRateInput: '4.50',
      inStock: true,
      description: ''
    });
    setShowFilamentModal(true);
  };

  const handleOpenEditModal = (mat: Material) => {
    setFilamentModalMode('edit');
    setEditingFilamentId(mat.id);

    const costKg = mat.costPerKg ?? Number((mat.gramRate * 1000).toFixed(2));

    setFilamentFormData({
      name: mat.name,
      type: mat.type,
      colorName: mat.colorName,
      colorHex: mat.colorHex,
      finish: mat.finish || 'Matte',
      costPerKgInput: costKg.toFixed(2),
      hourlyMachineRateInput: mat.hourlyMachineRate.toFixed(2),
      inStock: mat.inStock ?? true,
      description: mat.description || ''
    });
    setShowFilamentModal(true);
  };

  const handleFilamentFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!filamentFormData.colorName?.trim()) return;

    const costPerKg = parseFloat(filamentFormData.costPerKgInput) || 28.0;
    const gramRate = Number((costPerKg / 1000).toFixed(4));
    const hourlyRate = parseFloat(filamentFormData.hourlyMachineRateInput) || 4.5;
    const density = filamentFormData.type === 'PETG' ? 1.27 : 1.24;
    const name = filamentFormData.name.trim() || filamentFormData.colorName.trim();

    if (filamentModalMode === 'add') {
      const id = `mat-${Date.now()}`;
      const material: Material = {
        id,
        name,
        type: filamentFormData.type || 'PLA',
        colorName: filamentFormData.colorName.trim(),
        colorHex: filamentFormData.colorHex || '#3b82f6',
        finish: filamentFormData.finish || 'Matte',
        density,
        hourlyMachineRate: hourlyRate,
        costPerKg,
        gramRate,
        description: filamentFormData.description.trim() || `Filament in ${filamentFormData.colorName.trim()}`,
        features: ['Reliable bed adhesion', 'Precision extrusion'],
        inStock: filamentFormData.inStock
      };
      addFilament(material);
    } else if (filamentModalMode === 'edit' && editingFilamentId) {
      updateFilament(editingFilamentId, {
        name,
        type: filamentFormData.type,
        colorName: filamentFormData.colorName.trim(),
        colorHex: filamentFormData.colorHex || '#3b82f6',
        finish: filamentFormData.finish,
        density,
        hourlyMachineRate: hourlyRate,
        costPerKg,
        gramRate,
        description: filamentFormData.description.trim(),
        inStock: filamentFormData.inStock
      });
    }

    setShowFilamentModal(false);
    triggerSaveNotification();
  };

  const isDark = settings.theme === 'dark';

  return (
    <div className={`min-h-screen transition-colors duration-200 ${
      isDark ? 'bg-neutral-950 text-neutral-100' : 'bg-neutral-100 text-neutral-900'
    }`}>
      {/* Top Navigation Bar */}
      <header className={`sticky top-0 z-30 border-b backdrop-blur-md transition-colors ${
        isDark ? 'bg-neutral-900/90 border-neutral-800' : 'bg-white/90 border-neutral-200'
      }`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className={`p-2 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium ${
                isDark ? 'hover:bg-neutral-800 text-neutral-300' : 'hover:bg-neutral-100 text-neutral-600'
              }`}
              title="Return to Public Form"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Form</span>
            </button>
            <div className="h-5 w-px bg-neutral-300 dark:bg-neutral-700" />
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shadow-2xs transition-colors"
                style={{ backgroundColor: settings.accentColor, color: accentTextColor }}
              >
                <Settings className="w-4 h-4" />
              </div>
              <div>
                <h1 className="text-sm font-semibold tracking-tight">Admin Console</h1>
                <p className="text-[11px] text-neutral-500">Filaments, Pricing & Slicer Configurations</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {saveToast && (
              <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-md">
                <CheckCircle2 className="w-3.5 h-3.5" /> Saved
              </span>
            )}

            <button
              type="button"
              onClick={() => updateSettings({ theme: isDark ? 'light' : 'dark' })}
              className={`p-2 rounded-lg border transition-colors ${
                isDark
                  ? 'border-neutral-700 bg-neutral-800 text-amber-400 hover:bg-neutral-700'
                  : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
              }`}
              title="Toggle Light / Dark Mode"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4 text-neutral-600" />}
            </button>

            <button
              type="button"
              onClick={() => {
                if (confirm('Reset all admin settings to original system defaults?')) {
                  resetToDefaults();
                  triggerSaveNotification();
                }
              }}
              className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors flex items-center gap-1.5 ${
                isDark
                  ? 'border-neutral-700 hover:bg-neutral-800 text-neutral-400'
                  : 'border-neutral-200 hover:bg-neutral-50 text-neutral-600'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset Defaults</span>
            </button>

            <button
              onClick={() => navigate('/')}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg shadow-2xs transition-transform active:scale-95"
              style={{ backgroundColor: settings.accentColor, color: accentTextColor }}
            >
              View Live Form
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors flex items-center gap-1.5 ${
                isDark
                  ? 'border-neutral-700 hover:bg-neutral-800 text-neutral-300 hover:text-white'
                  : 'border-neutral-200 hover:bg-neutral-50 text-neutral-700 hover:text-neutral-900'
              }`}
              title="Sign out of Admin Panel"
            >
              <LogOut className="w-3.5 h-3.5 text-red-500" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin Content Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        <DemoNotice />
        {/* Navigation Tabs */}
        <div className="flex overflow-x-auto no-scrollbar gap-1.5 p-1 rounded-xl bg-neutral-200/70 dark:bg-neutral-900 border border-neutral-300/50 dark:border-neutral-800 mb-6">
          {[
            { id: 'filaments', label: 'Filament Inventory & Pricing', icon: Layers, count: settings.filaments.length },
            { id: 'presets', label: 'Print Presets', icon: Sliders },
            { id: 'business', label: 'Personal & Business', icon: User },
            { id: 'theme', label: 'Theme & Accent', icon: Palette }
          ].map((tab) => {
            const Icon = tab.icon;
            const isCurrent = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all shrink-0 ${
                  isCurrent
                    ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs font-semibold'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
                style={isCurrent ? { color: settings.accentColor } : {}}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isCurrent
                      ? 'bg-neutral-100 dark:bg-neutral-700 text-neutral-900 dark:text-white'
                      : 'bg-neutral-300/60 dark:bg-neutral-800 text-neutral-500'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* TAB 1: FILAMENTS INVENTORY & PRICING */}
        {activeTab === 'filaments' && (
          <div className="space-y-4">
            {/* Global Pricing Factors Card */}
            <div className={`p-4 rounded-xl border space-y-3 ${
              isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'
            }`}>
              <div className="flex items-center justify-between pb-2.5 border-b border-neutral-200 dark:border-neutral-800">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-emerald-500/10 text-emerald-500">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold">General Pricing Factors</h3>
                    <p className="text-[11px] text-neutral-400">
                      Standard factors applied to all print jobs alongside individual filament costs.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-0.5">
                {/* Setup Fee */}
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Setup / Preparation Fee ($)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 font-mono text-xs">$</span>
                    <input
                      type="number"
                      step="0.50"
                      min="0"
                      value={settings.pricing.setupFee}
                      onChange={(e) => {
                        updatePricing({ setupFee: parseFloat(e.target.value) || 0 });
                        triggerSaveNotification();
                      }}
                      className={`w-full pl-7 pr-3 py-1.5 text-xs rounded-lg border outline-none font-mono ${
                        isDark ? 'bg-neutral-800 border-neutral-700 text-white' : 'bg-neutral-50 border-neutral-300 text-neutral-900'
                      }`}
                    />
                  </div>
                  <span className="text-[10px] text-neutral-400 mt-1 block">
                    Flat rate applied per item/job for slicing, machine setup, and bed preparation.
                  </span>
                </div>

                {/* Additional Hourly Rate */}
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Additional Hourly Rate ($/hr)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 font-mono text-xs">$</span>
                    <input
                      type="number"
                      step="0.25"
                      min="0"
                      value={settings.pricing.additionalHourlyRate}
                      onChange={(e) => {
                        updatePricing({ additionalHourlyRate: parseFloat(e.target.value) || 0 });
                        triggerSaveNotification();
                      }}
                      className={`w-full pl-7 pr-10 py-1.5 text-xs rounded-lg border outline-none font-mono ${
                        isDark ? 'bg-neutral-800 border-neutral-700 text-white' : 'bg-neutral-50 border-neutral-300 text-neutral-900'
                      }`}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-neutral-400">/hr</span>
                  </div>
                  <span className="text-[10px] text-neutral-400 mt-1 block">
                    Additional hourly surcharge added to machine time across all jobs.
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 pt-2">
              <div>
                <h2 className="text-base font-semibold">Available Filaments & Materials</h2>
                <p className="text-xs text-neutral-500">
                  Control materials available for clients to pick, stock statuses, and individual rates.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Reset filament catalog back to factory defaults?')) {
                      resetFilaments();
                      triggerSaveNotification();
                    }
                  }}
                  className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                    isDark ? 'border-neutral-800 hover:bg-neutral-900 text-neutral-400' : 'border-neutral-200 hover:bg-neutral-50 text-neutral-600'
                  }`}
                >
                  Reset Filaments
                </button>
                <button
                  type="button"
                  onClick={handleOpenAddModal}
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-xs transition-transform active:scale-95"
                  style={{ backgroundColor: settings.accentColor, color: accentTextColor }}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Filament</span>
                </button>
              </div>
            </div>

            {/* Filaments Grid / Table */}
            <div className={`rounded-xl border overflow-hidden shadow-xs ${
              isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'
            }`}>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className={`border-b font-medium uppercase tracking-wider text-[10px] ${
                    isDark ? 'bg-neutral-800/60 border-neutral-800 text-neutral-400' : 'bg-neutral-50 border-neutral-200 text-neutral-500'
                  }`}>
                    <tr>
                      <th className="py-3 px-4">Filament / Color</th>
                      <th className="py-3 px-3">Type</th>
                      <th className="py-3 px-3">Cost / 1kg</th>
                      <th className="py-3 px-3">Machine Rate</th>
                      <th className="py-3 px-3">Stock Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                    {settings.filaments.map((mat) => (
                      <tr
                        key={mat.id}
                        className={`transition-colors ${
                          isDark ? 'hover:bg-neutral-800/40' : 'hover:bg-neutral-50/70'
                        }`}
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-5 h-5 rounded-full border border-black/15 shadow-2xs shrink-0"
                              style={{ backgroundColor: mat.colorHex }}
                            />
                            <div>
                              <div className="font-medium">{mat.name}</div>
                              <div className="text-[11px] text-neutral-500">{mat.colorName}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            mat.type === 'PLA'
                              ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                              : 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                          }`}>
                            {mat.type}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono font-medium">
                          <div className="flex items-center gap-1.5">
                            <span>${(mat.costPerKg ?? (mat.gramRate * 1000)).toFixed(2)}/kg</span>
                            <span className="text-[10px] text-neutral-400 font-normal">(${mat.gramRate.toFixed(3)}/g)</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 font-mono font-medium">
                          <span>${mat.hourlyMachineRate.toFixed(2)}/hr</span>
                        </td>
                        <td className="py-3 px-3">
                          <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={mat.inStock ?? true}
                              onChange={(e) => {
                                updateFilament(mat.id, { inStock: e.target.checked });
                                triggerSaveNotification();
                              }}
                              className="w-4 h-4 rounded border-neutral-300 dark:border-neutral-700 cursor-pointer"
                              style={{ accentColor: settings.accentColor }}
                            />
                            <span className={`text-[11px] font-medium ${
                              (mat.inStock ?? true)
                                ? isDark ? 'text-emerald-400' : 'text-emerald-600'
                                : 'text-neutral-400 line-through'
                            }`}>
                              {(mat.inStock ?? true) ? 'In Stock' : 'Out of Stock'}
                            </span>
                          </label>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(mat)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                isDark
                                  ? 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                              }`}
                              title={`Edit ${mat.name} (${mat.colorName})`}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Delete ${mat.name} (${mat.colorName})?`)) {
                                  deleteFilament(mat.id);
                                  triggerSaveNotification();
                                }
                              }}
                              className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                              title="Delete filament"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Filament Add/Edit Modal */}
            {showFilamentModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
                <div className={`w-full max-w-lg p-6 rounded-2xl border shadow-xl max-h-[92vh] overflow-y-auto ${
                  isDark ? 'bg-neutral-900 border-neutral-800 text-neutral-100' : 'bg-white border-neutral-200 text-neutral-900'
                }`}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-base font-semibold">
                        {filamentModalMode === 'add' ? 'Add New Filament' : 'Edit Filament Information'}
                      </h3>
                      <p className="text-xs text-neutral-500">
                        {filamentModalMode === 'add'
                          ? 'Configure a new material color and custom charging rates.'
                          : `Modify pricing, specs, and details for ${filamentFormData.name || filamentFormData.colorName}.`}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowFilamentModal(false)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        isDark ? 'hover:bg-neutral-800 text-neutral-400 hover:text-white' : 'hover:bg-neutral-100 text-neutral-500 hover:text-neutral-900'
                      }`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form onSubmit={handleFilamentFormSubmit} className="space-y-4 text-xs">
                    {/* Filament Name */}
                    <div>
                      <label className="block font-medium mb-1">Filament Name</label>
                      <input
                        type="text"
                        value={filamentFormData.name}
                        onChange={(e) => setFilamentFormData({ ...filamentFormData, name: e.target.value })}
                        placeholder="e.g. Standard PLA, Silk Dual-Color PLA"
                        className={`w-full px-3 py-2 rounded-lg border outline-none ${
                          isDark ? 'bg-neutral-800 border-neutral-700 text-white' : 'bg-neutral-50 border-neutral-300 text-neutral-900'
                        }`}
                      />
                    </div>


                    {/* Color Name and Color Hex */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-medium mb-1">Color Name *</label>
                        <input
                          type="text"
                          required
                          value={filamentFormData.colorName}
                          onChange={(e) => setFilamentFormData({ ...filamentFormData, colorName: e.target.value })}
                          placeholder="e.g. Signal Red, Emerald Green"
                          className={`w-full px-3 py-2 rounded-lg border outline-none ${
                            isDark ? 'bg-neutral-800 border-neutral-700 text-white' : 'bg-neutral-50 border-neutral-300 text-neutral-900'
                          }`}
                        />
                      </div>

                      <div>
                        <label className="block font-medium mb-1">Color Swatch & Hex</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={filamentFormData.colorHex}
                            onChange={(e) => setFilamentFormData({ ...filamentFormData, colorHex: e.target.value })}
                            className="w-9 h-9 rounded-lg cursor-pointer border-0 bg-transparent p-0 shrink-0"
                          />
                          <input
                            type="text"
                            value={filamentFormData.colorHex}
                            onChange={(e) => setFilamentFormData({ ...filamentFormData, colorHex: e.target.value })}
                            className={`w-full px-3 py-2 rounded-lg border outline-none font-mono ${
                              isDark ? 'bg-neutral-800 border-neutral-700 text-white' : 'bg-neutral-50 border-neutral-300 text-neutral-900'
                            }`}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Pricing Section Card: 1kg Spool Cost + Hourly Machine Rate */}
                    <div className={`p-4 rounded-xl border space-y-3.5 ${
                      isDark ? 'bg-neutral-800/40 border-neutral-800' : 'bg-neutral-50 border-neutral-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 font-medium">
                          <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Filament Pricing & Rates</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* 1kg Spool Cost Input */}
                        <div>
                          <label className="block font-medium mb-1">Cost of Filament (1kg Spool) *</label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 font-mono font-medium">$</span>
                            <input
                              type="number"
                              step="0.50"
                              min="0"
                              required
                              value={filamentFormData.costPerKgInput}
                              onChange={(e) => setFilamentFormData(prev => ({ ...prev, costPerKgInput: e.target.value }))}
                              placeholder="28.00"
                              className={`w-full pl-7 pr-12 py-2 rounded-lg border outline-none font-mono ${
                                isDark ? 'bg-neutral-800 border-neutral-700 text-white' : 'bg-white border-neutral-300 text-neutral-900'
                              }`}
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-neutral-400">/kg</span>
                          </div>
                          <span className="text-[10px] text-neutral-400 mt-0.5 block">
                            Cost of 1kg (1,000g) spool of this filament
                          </span>
                        </div>

                        {/* Hourly Machine Rate */}
                        <div>
                          <label className="block font-medium mb-1">Hourly Machine Rate ($/hr) *</label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 font-mono font-medium">$</span>
                            <input
                              type="number"
                              step="0.25"
                              min="0"
                              required
                              value={filamentFormData.hourlyMachineRateInput}
                              onChange={(e) => setFilamentFormData(prev => ({ ...prev, hourlyMachineRateInput: e.target.value }))}
                              placeholder="4.50"
                              className={`w-full pl-7 pr-10 py-2 rounded-lg border outline-none font-mono font-medium ${
                                isDark ? 'bg-neutral-800 border-neutral-700 text-white' : 'bg-white border-neutral-300 text-neutral-900'
                              }`}
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-neutral-400">/hr</span>
                          </div>
                          <span className="text-[10px] text-neutral-400 mt-0.5 block">
                            Rate charged per hour of print time
                          </span>
                        </div>
                      </div>

                      {/* Automatically Calculated Per-Gram Rate */}
                      {(() => {
                        const kgVal = parseFloat(filamentFormData.costPerKgInput);
                        const gramCalc = !isNaN(kgVal) && kgVal > 0 ? (kgVal / 1000) : 0;
                        return (
                          <div className={`p-2.5 rounded-lg border text-xs flex items-center justify-between gap-3 ${
                            isDark ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-300' : 'bg-emerald-50/80 border-emerald-200 text-emerald-800'
                          }`}>
                            <div className="flex items-center gap-2">
                              <Sparkles className="w-4 h-4 shrink-0 text-emerald-500" />
                              <div>
                                <span className="font-semibold block text-[11px]">Calculated Gram Rate</span>
                                <span className="text-[10px] opacity-80">
                                  ${kgVal > 0 ? kgVal.toFixed(2) : '0.00'} ÷ 1,000g = <span className="font-mono font-bold">${gramCalc.toFixed(4)}</span>/g
                                </span>
                              </div>
                            </div>
                            <div className="font-mono text-xs font-bold shrink-0">
                              ${gramCalc.toFixed(4)}/g
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Stock Status Checkbox */}
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={filamentFormData.inStock}
                        onChange={(e) => setFilamentFormData({ ...filamentFormData, inStock: e.target.checked })}
                        className="rounded border-neutral-300 dark:border-neutral-700 accent-purple-600 w-3.5 h-3.5 cursor-pointer"
                      />
                      <span>In Stock (visible and selectable by customers)</span>
                    </label>

                    {/* Description (Optional) */}
                    <div>
                      <label className="block font-medium mb-1">Description (Optional)</label>
                      <input
                        type="text"
                        value={filamentFormData.description}
                        onChange={(e) => setFilamentFormData({ ...filamentFormData, description: e.target.value })}
                        placeholder="e.g. Excellent layer adhesion and high impact strength."
                        className={`w-full px-3 py-2 rounded-lg border outline-none ${
                          isDark ? 'bg-neutral-800 border-neutral-700 text-white' : 'bg-neutral-50 border-neutral-300 text-neutral-900'
                        }`}
                      />
                    </div>

                    {/* Footer Buttons */}
                    <div className="flex justify-end gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-800">
                      <button
                        type="button"
                        onClick={() => setShowFilamentModal(false)}
                        className={`px-3 py-2 rounded-lg border text-xs font-medium ${
                          isDark ? 'border-neutral-700 hover:bg-neutral-800 text-neutral-300' : 'border-neutral-300 hover:bg-neutral-100 text-neutral-700'
                        }`}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-lg text-xs font-semibold shadow-xs transition-transform active:scale-95"
                        style={{ backgroundColor: settings.accentColor, color: accentTextColor }}
                      >
                        {filamentModalMode === 'add' ? 'Create Filament' : 'Save Changes'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}



        {/* TAB 3: PRINT MODE PRESETS (PER-NOZZLE) */}
        {activeTab === 'presets' && (
          <div className="space-y-5">
            {/* Header & Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold">Print Presets by Nozzle</h2>
                <p className="text-xs text-neutral-500">
                  Configure slicing presets per nozzle diameter. Every preset is strictly exclusive to its assigned nozzle size.
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Reset all presets across all nozzles to factory defaults?')) {
                      resetPresets();
                      triggerSaveNotification();
                    }
                  }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors flex items-center gap-1.5 ${
                    isDark
                      ? 'border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
                      : 'border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700'
                  }`}
                  title="Reset to factory preset defaults"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Defaults</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenAddPreset()}
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-xs transition-transform active:scale-95"
                  style={{ backgroundColor: settings.accentColor, color: accentTextColor }}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Preset</span>
                </button>
              </div>
            </div>

            {/* Nozzle Filter Tabs */}
            <div className={`p-1 rounded-xl border flex flex-wrap gap-1 ${
              isDark ? 'bg-neutral-800/60 border-neutral-700' : 'bg-neutral-100 border-neutral-200'
            }`}>
              <button
                type="button"
                onClick={() => setSelectedNozzleTab('all')}
                className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all ${
                  selectedNozzleTab === 'all'
                    ? 'shadow-xs font-semibold'
                    : isDark
                      ? 'text-neutral-400 hover:text-white'
                      : 'text-neutral-600 hover:text-neutral-900'
                }`}
                style={
                  selectedNozzleTab === 'all'
                    ? { backgroundColor: settings.accentColor, color: accentTextColor }
                    : {}
                }
              >
                All Nozzles ({settings.presets.length})
              </button>

              {[0.2, 0.4, 0.6, 0.8].map((nozzle) => {
                const count = settings.presets.filter((p) => p.nozzleSize === nozzle).length;
                const isSelected = selectedNozzleTab === nozzle;
                return (
                  <button
                    key={nozzle}
                    type="button"
                    onClick={() => setSelectedNozzleTab(nozzle)}
                    className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all ${
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
                  >
                    {nozzle} mm ({count})
                  </button>
                );
              })}
            </div>

            {/* Presets Grid */}
            {(() => {
              const displayedPresets = selectedNozzleTab === 'all'
                ? settings.presets
                : settings.presets.filter((p) => p.nozzleSize === selectedNozzleTab);

              if (displayedPresets.length === 0) {
                return (
                  <div className={`p-8 rounded-xl border text-center space-y-3 ${
                    isDark ? 'bg-neutral-900/50 border-neutral-800' : 'bg-neutral-50 border-neutral-200'
                  }`}>
                    <Sliders className="w-8 h-8 mx-auto text-neutral-400 opacity-60" />
                    <p className="text-xs text-neutral-500">
                      No presets configured for {selectedNozzleTab === 'all' ? 'any nozzle' : `${selectedNozzleTab} mm nozzle`}.
                    </p>
                    <button
                      type="button"
                      onClick={() => handleOpenAddPreset(typeof selectedNozzleTab === 'number' ? selectedNozzleTab : 0.4)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg inline-flex items-center gap-1.5"
                      style={{ backgroundColor: settings.accentColor, color: accentTextColor }}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add First Preset for {typeof selectedNozzleTab === 'number' ? `${selectedNozzleTab}mm` : 'Nozzle'}</span>
                    </button>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {displayedPresets.map((preset) => {
                    const validHeights = NOZZLE_LAYER_HEIGHTS[preset.nozzleSize] || NOZZLE_LAYER_HEIGHTS[0.4];

                    return (
                      <div
                        key={preset.id}
                        className={`p-4 rounded-xl border space-y-3 flex flex-col justify-between ${
                          isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'
                        }`}
                      >
                        <div className="space-y-3">
                          {/* Card Header */}
                          <div className="flex items-start justify-between pb-2 border-b border-neutral-200 dark:border-neutral-800">
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-xs">{preset.name}</h3>
                                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">
                                  {preset.nozzleSize} mm
                                </span>
                              </div>
                              {preset.description && (
                                <p className="text-[11px] text-neutral-500 mt-1 line-clamp-2">
                                  {preset.description}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-1 shrink-0 ml-2">
                              <button
                                type="button"
                                onClick={() => handleOpenEditPreset(preset)}
                                className={`p-1.5 rounded-md transition-colors ${
                                  isDark ? 'hover:bg-neutral-800 text-neutral-400 hover:text-white' : 'hover:bg-neutral-100 text-neutral-500 hover:text-neutral-900'
                                }`}
                                title="Edit Preset"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeletePreset(preset)}
                                className={`p-1.5 rounded-md transition-colors ${
                                  isDark ? 'hover:bg-red-950/40 text-neutral-400 hover:text-red-400' : 'hover:bg-red-50 text-neutral-500 hover:text-red-600'
                                }`}
                                title="Delete Preset"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Quick Inline Controls */}
                          <div className="space-y-2.5">
                            <div>
                              <label className="block text-[11px] font-medium mb-1">
                                Layer Height ({preset.nozzleSize}mm nozzle)
                              </label>
                              <select
                                value={preset.layerHeight}
                                onChange={(e) => {
                                  updatePreset(preset.id, { layerHeight: parseFloat(e.target.value) });
                                  triggerSaveNotification();
                                }}
                                className={`w-full px-2.5 py-1.5 text-xs rounded-lg border outline-none ${
                                  isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-neutral-50 border-neutral-300'
                                }`}
                              >
                                {validHeights.map((h) => (
                                  <option key={h.value} value={h.value}>
                                    {h.label} ({h.sub})
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <label className="text-[11px] font-medium">Infill Density</label>
                                <span className="font-mono text-xs font-semibold" style={{ color: settings.accentColor }}>
                                  {preset.infillPercent}%
                                </span>
                              </div>
                              <input
                                type="range"
                                min="0"
                                max="100"
                                step="5"
                                value={preset.infillPercent}
                                onChange={(e) => {
                                  updatePreset(preset.id, { infillPercent: parseInt(e.target.value) });
                                  triggerSaveNotification();
                                }}
                                className="w-full"
                                style={{ accentColor: settings.accentColor }}
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[11px] font-medium mb-1">Infill Pattern</label>
                                <select
                                  value={preset.infillPattern}
                                  onChange={(e) => {
                                    updatePreset(preset.id, { infillPattern: e.target.value as SlicerInfillPattern });
                                    triggerSaveNotification();
                                  }}
                                  className={`w-full px-2 py-1.5 text-xs rounded-lg border outline-none ${
                                    isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-neutral-50 border-neutral-300'
                                  }`}
                                >
                                  <option value="Grid">Grid</option>
                                  <option value="Gyroid">Gyroid</option>
                                  <option value="Honeycomb">Honeycomb</option>
                                  <option value="Linear">Linear</option>
                                </select>
                              </div>

                              <div>
                                <label className="block text-[11px] font-medium mb-1">Supports</label>
                                <select
                                  value={preset.supportType}
                                  onChange={(e) => {
                                    updatePreset(preset.id, { supportType: e.target.value as SlicerSupportType });
                                    triggerSaveNotification();
                                  }}
                                  className={`w-full px-2 py-1.5 text-xs rounded-lg border outline-none ${
                                    isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-neutral-50 border-neutral-300'
                                  }`}
                                >
                                  <option value="none">None</option>
                                  <option value="tree">Tree</option>
                                  <option value="normal">Normal</option>
                                </select>
                              </div>
                            </div>

                            <div>
                              <label className="block text-[11px] font-medium mb-1">Wall Loops</label>
                              <div className="grid grid-cols-5 gap-1">
                                {[1, 2, 3, 4, 5].map((loops) => (
                                  <button
                                    key={loops}
                                    type="button"
                                    onClick={() => {
                                      updatePreset(preset.id, { wallLoops: loops });
                                      triggerSaveNotification();
                                    }}
                                    className={`py-1 text-xs rounded border text-center transition-colors ${
                                      preset.wallLoops === loops
                                        ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-semibold'
                                        : 'border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                                    }`}
                                  >
                                    {loops}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            {/* ADD / EDIT PRESET MODAL */}
            {showPresetModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
                <div className={`w-full max-w-lg p-6 rounded-2xl border shadow-xl max-h-[92vh] overflow-y-auto ${
                  isDark ? 'bg-neutral-900 border-neutral-800 text-neutral-100' : 'bg-white border-neutral-200 text-neutral-900'
                }`}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-base font-semibold">
                        {presetModalMode === 'add' ? 'Add New Print Preset' : 'Edit Print Preset'}
                      </h3>
                      <p className="text-xs text-neutral-500">
                        {presetModalMode === 'add'
                          ? 'Create a slicing preset exclusive to a specific nozzle.'
                          : `Adjust slicing parameters for "${presetFormData.name}".`}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPresetModal(false)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        isDark ? 'hover:bg-neutral-800 text-neutral-400 hover:text-white' : 'hover:bg-neutral-100 text-neutral-500 hover:text-neutral-900'
                      }`}
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handlePresetFormSubmit} className="space-y-4 text-xs">
                    {/* Preset Name */}
                    <div>
                      <label className="block font-medium mb-1">Preset Name *</label>
                      <input
                        type="text"
                        required
                        value={presetFormData.name}
                        onChange={(e) => setPresetFormData({ ...presetFormData, name: e.target.value })}
                        placeholder="e.g. Ultra Detail, Fast Draft, Structural Heavy"
                        className={`w-full px-3 py-2 rounded-lg border outline-none font-medium ${
                          isDark ? 'bg-neutral-800 border-neutral-700 text-white' : 'bg-neutral-50 border-neutral-300 text-neutral-900'
                        }`}
                      />
                    </div>

                    {/* Nozzle Size (Strictly Exclusive) */}
                    <div>
                      <label className="block font-medium mb-1">
                        Assigned Nozzle (Exclusive) *
                      </label>
                      <p className="text-[11px] text-neutral-400 mb-2">
                        Presets are exclusive to one nozzle. Select the nozzle diameter this preset configures:
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                          { value: 0.2, label: '0.2 mm', desc: 'Fine Detail' },
                          { value: 0.4, label: '0.4 mm', desc: 'Standard' },
                          { value: 0.6, label: '0.6 mm', desc: 'High Flow' },
                          { value: 0.8, label: '0.8 mm', desc: 'Max Speed' }
                        ].map((nozzle) => {
                          const isSelected = presetFormData.nozzleSize === nozzle.value;
                          return (
                            <button
                              key={nozzle.value}
                              type="button"
                              onClick={() => {
                                const validHeights = NOZZLE_LAYER_HEIGHTS[nozzle.value] || NOZZLE_LAYER_HEIGHTS[0.4];
                                const isCurrentValid = validHeights.some((h) => Math.abs(h.value - presetFormData.layerHeight) < 0.005);
                                const nextHeight = isCurrentValid
                                  ? presetFormData.layerHeight
                                  : (validHeights.find((h) => h.sub.includes('Standard'))?.value || validHeights[1]?.value || validHeights[0].value);

                                setPresetFormData({
                                  ...presetFormData,
                                  nozzleSize: nozzle.value,
                                  layerHeight: nextHeight
                                });
                              }}
                              className={`p-2.5 rounded-lg border text-center transition-all ${
                                isSelected
                                  ? 'shadow-xs font-semibold ring-1'
                                  : isDark
                                    ? 'border-neutral-700 bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                                    : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
                              }`}
                              style={
                                isSelected
                                  ? {
                                      borderColor: settings.accentColor,
                                      color: settings.accentColor,
                                      backgroundColor: `${settings.accentColor}12`
                                    }
                                  : {}
                              }
                            >
                              <div className="font-semibold text-xs">{nozzle.label}</div>
                              <div className="text-[10px] opacity-75">{nozzle.desc}</div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Layer Height (Nozzle-Adapted) */}
                    <div>
                      <label className="block font-medium mb-1">
                        Layer Height (for {presetFormData.nozzleSize}mm nozzle) *
                      </label>
                      <select
                        value={presetFormData.layerHeight}
                        onChange={(e) => setPresetFormData({ ...presetFormData, layerHeight: parseFloat(e.target.value) })}
                        className={`w-full px-3 py-2 rounded-lg border outline-none ${
                          isDark ? 'bg-neutral-800 border-neutral-700 text-white' : 'bg-neutral-50 border-neutral-300 text-neutral-900'
                        }`}
                      >
                        {(NOZZLE_LAYER_HEIGHTS[presetFormData.nozzleSize] || NOZZLE_LAYER_HEIGHTS[0.4]).map((h) => (
                          <option key={h.value} value={h.value}>
                            {h.label} ({h.sub})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Infill Density */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-medium">Infill Density *</label>
                        <span className="font-mono text-xs font-semibold" style={{ color: settings.accentColor }}>
                          {presetFormData.infillPercent}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={presetFormData.infillPercent}
                        onChange={(e) => setPresetFormData({ ...presetFormData, infillPercent: parseInt(e.target.value) })}
                        className="w-full"
                        style={{ accentColor: settings.accentColor }}
                      />
                    </div>

                    {/* Infill Pattern & Supports */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-medium mb-1">Infill Pattern</label>
                        <select
                          value={presetFormData.infillPattern}
                          onChange={(e) => setPresetFormData({ ...presetFormData, infillPattern: e.target.value as SlicerInfillPattern })}
                          className={`w-full px-3 py-2 rounded-lg border outline-none ${
                            isDark ? 'bg-neutral-800 border-neutral-700 text-white' : 'bg-neutral-50 border-neutral-300 text-neutral-900'
                          }`}
                        >
                          <option value="Grid">Grid</option>
                          <option value="Gyroid">Gyroid</option>
                          <option value="Honeycomb">Honeycomb</option>
                          <option value="Linear">Linear</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-medium mb-1">Support Type</label>
                        <select
                          value={presetFormData.supportType}
                          onChange={(e) => setPresetFormData({ ...presetFormData, supportType: e.target.value as SlicerSupportType })}
                          className={`w-full px-3 py-2 rounded-lg border outline-none ${
                            isDark ? 'bg-neutral-800 border-neutral-700 text-white' : 'bg-neutral-50 border-neutral-300 text-neutral-900'
                          }`}
                        >
                          <option value="none">None</option>
                          <option value="tree">Tree Supports</option>
                          <option value="normal">Normal Supports</option>
                        </select>
                      </div>
                    </div>

                    {/* Wall Loops */}
                    <div>
                      <label className="block font-medium mb-1">Wall Loops (Perimeters)</label>
                      <div className="grid grid-cols-6 gap-1.5">
                        {[1, 2, 3, 4, 5, 6].map((loops) => (
                          <button
                            key={loops}
                            type="button"
                            onClick={() => setPresetFormData({ ...presetFormData, wallLoops: loops })}
                            className={`py-1.5 text-xs rounded border text-center transition-colors ${
                              presetFormData.wallLoops === loops
                                ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-semibold'
                                : 'border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                            }`}
                          >
                            {loops}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Description Note */}
                    <div>
                      <label className="block font-medium mb-1">Preset Description (Optional)</label>
                      <input
                        type="text"
                        value={presetFormData.description}
                        onChange={(e) => setPresetFormData({ ...presetFormData, description: e.target.value })}
                        placeholder="e.g. Recommended for everyday brackets, jigs, and toys"
                        className={`w-full px-3 py-2 rounded-lg border outline-none ${
                          isDark ? 'bg-neutral-800 border-neutral-700 text-white' : 'bg-neutral-50 border-neutral-300 text-neutral-900'
                        }`}
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-200 dark:border-neutral-800">
                      <button
                        type="button"
                        onClick={() => setShowPresetModal(false)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          isDark ? 'hover:bg-neutral-800 text-neutral-300' : 'hover:bg-neutral-100 text-neutral-700'
                        }`}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 font-semibold rounded-lg shadow-xs transition-transform active:scale-95"
                        style={{ backgroundColor: settings.accentColor, color: accentTextColor }}
                      >
                        {presetModalMode === 'add' ? 'Create Preset' : 'Save Changes'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: PERSONAL & BUSINESS INFO */}
        {activeTab === 'business' && (
          <div className="space-y-4 max-w-2xl">
            <div>
              <h2 className="text-base font-semibold">Admin Personal & Business Details</h2>
              <p className="text-xs text-neutral-500">
                Information presented to clients upon order submission for payment and collection.
              </p>
            </div>

            <div className={`p-5 rounded-xl border space-y-4 ${
              isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'
            }`}>
              <div>
                <label className="block text-xs font-medium mb-1">Business / Admin Name (Form Title)</label>
                <input
                  type="text"
                  value={settings.adminInfo.businessName}
                  onChange={(e) => {
                    updateAdminInfo({ businessName: e.target.value });
                    triggerSaveNotification();
                  }}
                  className={`w-full px-3 py-2 text-xs rounded-lg border outline-none ${
                    isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-neutral-50 border-neutral-300'
                  }`}
                />
              </div>

              {/* Form Description with Rich Text Options (Bold, Italic, Underline) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium">Form Description</label>
                  <span className="text-[11px] text-neutral-400">
                    Supports Bold (⌘B), Italic (⌘I), Underline (⌘U)
                  </span>
                </div>
                <RichTextEditor
                  value={settings.adminInfo.formDescription ?? 'Submit one or multiple 3D models for <b>automated slicing</b> and <i>instant quotation</i>.'}
                  onChange={(html) => {
                    updateAdminInfo({ formDescription: html });
                    triggerSaveNotification();
                  }}
                  placeholder="Enter form description and guidelines..."
                  isDark={isDark}
                  accentColor={settings.accentColor}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1">Contact Email</label>
                  <input
                    type="email"
                    value={settings.adminInfo.contactEmail}
                    onChange={(e) => {
                      updateAdminInfo({ contactEmail: e.target.value });
                      triggerSaveNotification();
                    }}
                    className={`w-full px-3 py-2 text-xs rounded-lg border outline-none ${
                      isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-neutral-50 border-neutral-300'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1">Contact Phone</label>
                  <input
                    type="tel"
                    value={settings.adminInfo.contactPhone}
                    onChange={(e) => {
                      updateAdminInfo({ contactPhone: e.target.value });
                      triggerSaveNotification();
                    }}
                    className={`w-full px-3 py-2 text-xs rounded-lg border outline-none ${
                      isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-neutral-50 border-neutral-300'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">Pickup Workshop / Location</label>
                <input
                  type="text"
                  value={settings.adminInfo.pickupLocation}
                  onChange={(e) => {
                    updateAdminInfo({ pickupLocation: e.target.value });
                    triggerSaveNotification();
                  }}
                  placeholder="e.g. Lab B2 Engineering Workshop"
                  className={`w-full px-3 py-2 text-xs rounded-lg border outline-none ${
                    isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-neutral-50 border-neutral-300'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">Payment Instructions & Notes</label>
                <textarea
                  rows={3}
                  value={settings.adminInfo.paymentInstructions}
                  onChange={(e) => {
                    updateAdminInfo({ paymentInstructions: e.target.value });
                    triggerSaveNotification();
                  }}
                  placeholder="e.g. Venmo to @user or cash upon collection."
                  className={`w-full px-3 py-2 text-xs rounded-lg border outline-none ${
                    isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-neutral-50 border-neutral-300'
                  }`}
                />
              </div>
            </div>

            {/* Admin Password & Security Settings Card */}
            <div className={`p-5 rounded-xl border space-y-4 ${
              isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <h3 className="text-xs font-semibold">Admin Authentication & Password</h3>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-neutral-100 dark:bg-neutral-800 text-neutral-500">
                  SHA-256 Protected
                </span>
              </div>
              <p className="text-xs text-neutral-500">
                Change the admin password required to access the Admin Panel console.
              </p>

              {pwStatus && (
                <div
                  className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                    pwStatus.type === 'success'
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                      : 'bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400'
                  }`}
                >
                  {pwStatus.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  )}
                  <span>{pwStatus.message}</span>
                </div>
              )}

              <form onSubmit={handlePasswordChange} className="space-y-3 pt-1">
                <div>
                  <label className="block text-xs font-medium mb-1">Current Password</label>
                  <div className="relative">
                    <input
                      type={showPwInputs ? 'text' : 'password'}
                      value={currentPw}
                      onChange={(e) => setCurrentPw(e.target.value)}
                      placeholder="Enter current password..."
                      className={`w-full pl-3 pr-10 py-2 text-xs rounded-lg border outline-none ${
                        isDark ? 'bg-neutral-800 border-neutral-700 text-white' : 'bg-neutral-50 border-neutral-300'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwInputs(!showPwInputs)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                    >
                      {showPwInputs ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1">New Password</label>
                    <input
                      type={showPwInputs ? 'text' : 'password'}
                      value={newPw}
                      onChange={(e) => setNewPw(e.target.value)}
                      placeholder="At least 4 characters..."
                      className={`w-full px-3 py-2 text-xs rounded-lg border outline-none ${
                        isDark ? 'bg-neutral-800 border-neutral-700 text-white' : 'bg-neutral-50 border-neutral-300'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1">Confirm New Password</label>
                    <input
                      type={showPwInputs ? 'text' : 'password'}
                      value={confirmPw}
                      onChange={(e) => setConfirmPw(e.target.value)}
                      placeholder="Re-type new password..."
                      className={`w-full px-3 py-2 text-xs rounded-lg border outline-none ${
                        isDark ? 'bg-neutral-800 border-neutral-700 text-white' : 'bg-neutral-50 border-neutral-300'
                      }`}
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <span className="text-[11px] text-neutral-400">
                    Default key was: <code className="font-mono">admin123</code>
                  </span>
                  <button
                    type="submit"
                    disabled={isChangingPw || !currentPw || !newPw || !confirmPw}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 disabled:opacity-40 transition-transform active:scale-95"
                    style={{ backgroundColor: settings.accentColor, color: accentTextColor }}
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>{isChangingPw ? 'Updating...' : 'Update Password'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* TAB 5: THEME & ACCENT COLOUR */}
        {activeTab === 'theme' && (
          <div className="space-y-4 max-w-2xl">
            <div>
              <h2 className="text-base font-semibold">Theme & Accent Colour Customization</h2>
              <p className="text-xs text-neutral-500">
                Customize the public request form and admin panel appearance.
              </p>
            </div>

            <div className={`p-5 rounded-xl border space-y-5 ${
              isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'
            }`}>
              {/* Light / Dark Mode Toggle */}
              <div>
                <label className="block text-xs font-medium mb-2">UI Theme Mode</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      updateSettings({ theme: 'light' });
                      triggerSaveNotification();
                    }}
                    className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-medium transition-all ${
                      !isDark
                        ? 'border-neutral-900 bg-white text-neutral-900 shadow-xs ring-2 ring-neutral-900/10'
                        : 'border-neutral-800 bg-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <Sun className="w-4 h-4 text-amber-500" />
                    <span>Light Mode (Google Form Style)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      updateSettings({ theme: 'dark' });
                      triggerSaveNotification();
                    }}
                    className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-medium transition-all ${
                      isDark
                        ? 'border-white bg-neutral-800 text-white shadow-xs ring-2 ring-white/10'
                        : 'border-neutral-200 bg-neutral-50 text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    <Moon className="w-4 h-4 text-purple-400" />
                    <span>Dark Mode (Engineering Studio)</span>
                  </button>
                </div>
              </div>

              {/* Accent Colour Picker */}
              <div className="border-t border-neutral-200 dark:border-neutral-800 pt-4">
                <label className="block text-xs font-medium mb-2">Accent Colour</label>
                <div className="flex items-center gap-3 mb-3">
                  <input
                    type="color"
                    value={settings.accentColor}
                    onChange={(e) => {
                      updateSettings({ accentColor: e.target.value });
                      triggerSaveNotification();
                    }}
                    className="w-12 h-12 rounded-xl cursor-pointer border-0 bg-transparent p-0"
                  />
                  <div>
                    <input
                      type="text"
                      value={settings.accentColor}
                      onChange={(e) => {
                        updateSettings({ accentColor: e.target.value });
                        triggerSaveNotification();
                      }}
                      className={`w-32 px-3 py-1.5 text-xs rounded-lg border outline-none font-mono ${
                        isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-neutral-50 border-neutral-300'
                      }`}
                    />
                    <span className="text-[11px] text-neutral-400 block mt-0.5">
                      Selected branding highlight
                    </span>
                  </div>
                </div>

                {/* Quick Presets */}
                <div>
                  <span className="text-[11px] text-neutral-500 block mb-1.5">Preset Swatches:</span>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_ACCENT_COLORS.map((preset) => (
                      <button
                        key={preset.hex}
                        type="button"
                        onClick={() => {
                          updateSettings({ accentColor: preset.hex });
                          triggerSaveNotification();
                        }}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs transition-transform active:scale-95 ${
                          settings.accentColor.toLowerCase() === preset.hex.toLowerCase()
                            ? 'ring-2 ring-offset-2 ring-neutral-400 dark:ring-offset-neutral-900 font-semibold'
                            : 'hover:opacity-90'
                        } ${isDark ? 'border-neutral-700 bg-neutral-800' : 'border-neutral-200 bg-white'}`}
                      >
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-black/15 shadow-2xs"
                          style={{ backgroundColor: preset.hex }}
                        />
                        <span>{preset.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
