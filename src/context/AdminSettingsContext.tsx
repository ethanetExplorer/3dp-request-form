import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  AdminSettings,
  AdminPricingSettings,
  AdminInfo,
  Material,
  PrintPreset
} from '../types';
import { AVAILABLE_MATERIALS } from '../utils/materialsData';
import {
  getContrastTextColor,
  getHarmonizedBackground,
  hexToRgba
} from '../utils/colorUtils';
import { DEFAULT_ADMIN_PASSWORD_HASH } from '../utils/auth';

const STORAGE_KEY = '3dp_admin_settings_v1';

export const DEFAULT_PRINT_PRESETS: PrintPreset[] = [
  // 0.2mm Nozzle Presets (Fine Detail)
  {
    id: 'preset-02-ultra',
    name: 'Ultra Detail',
    nozzleSize: 0.2,
    layerHeight: 0.08,
    infillPercent: 20,
    infillPattern: 'Gyroid',
    wallLoops: 4,
    supportType: 'none',
    description: 'Maximum resolution for miniatures, jewelry, and intricate engravings.'
  },
  {
    id: 'preset-02-fine',
    name: 'Fine Detail',
    nozzleSize: 0.2,
    layerHeight: 0.12,
    infillPercent: 20,
    infillPattern: 'Grid',
    wallLoops: 3,
    supportType: 'none',
    description: 'Crisp text and sharp small features with reduced print time.'
  },

  // 0.4mm Nozzle Presets (Standard Baseline)
  {
    id: 'preset-04-quality',
    name: 'Quality',
    nozzleSize: 0.4,
    layerHeight: 0.12,
    infillPercent: 25,
    infillPattern: 'Gyroid',
    wallLoops: 4,
    supportType: 'none',
    description: 'High surface smoothness and tight tolerances.'
  },
  {
    id: 'preset-04-standard',
    name: 'Standard',
    nozzleSize: 0.4,
    layerHeight: 0.20,
    infillPercent: 20,
    infillPattern: 'Grid',
    wallLoops: 3,
    supportType: 'none',
    description: 'Ideal everyday balance of mechanical strength, finish, and print speed.'
  },
  {
    id: 'preset-04-fast',
    name: 'Fast',
    nozzleSize: 0.4,
    layerHeight: 0.28,
    infillPercent: 15,
    infillPattern: 'Linear',
    wallLoops: 2,
    supportType: 'none',
    description: 'Rapid prototyping when functional geometry matters more than layer lines.'
  },

  // 0.6mm Nozzle Presets (High Flow / Functional)
  {
    id: 'preset-06-quality',
    name: 'High Flow Quality',
    nozzleSize: 0.6,
    layerHeight: 0.24,
    infillPercent: 25,
    infillPattern: 'Gyroid',
    wallLoops: 3,
    supportType: 'none',
    description: 'Strong layer bonding with good definition for structural parts.'
  },
  {
    id: 'preset-06-standard',
    name: 'High Flow Standard',
    nozzleSize: 0.6,
    layerHeight: 0.32,
    infillPercent: 20,
    infillPattern: 'Grid',
    wallLoops: 3,
    supportType: 'none',
    description: 'Fast functional enclosures, brackets, and jigs with thick solid walls.'
  },
  {
    id: 'preset-06-speed',
    name: 'High Speed',
    nozzleSize: 0.6,
    layerHeight: 0.40,
    infillPercent: 15,
    infillPattern: 'Linear',
    wallLoops: 2,
    supportType: 'none',
    description: 'Maximum volumetric flow for large volume prints.'
  },

  // 0.8mm Nozzle Presets (Heavy Duty / Max Speed)
  {
    id: 'preset-08-standard',
    name: 'Structural Heavy',
    nozzleSize: 0.8,
    layerHeight: 0.40,
    infillPercent: 25,
    infillPattern: 'Grid',
    wallLoops: 3,
    supportType: 'none',
    description: 'Ultra-tough impact-resistant parts with heavy extruded beads.'
  },
  {
    id: 'preset-08-fast',
    name: 'Max Speed Draft',
    nozzleSize: 0.8,
    layerHeight: 0.50,
    infillPercent: 15,
    infillPattern: 'Linear',
    wallLoops: 2,
    supportType: 'none',
    description: 'Blazing fast draft print for oversized models and concept validation.'
  }
];

export const DEFAULT_ADMIN_SETTINGS: AdminSettings = {
  filaments: AVAILABLE_MATERIALS.map(m => ({ ...m, inStock: true })),
  pricing: {
    setupFee: 3.00,
    additionalHourlyRate: 0.00
  },
  adminInfo: {
    businessName: '3D Print Lab Studio',
    formDescription: 'Submit one or multiple 3D models for <b>automated slicing</b> and <i>instant quotation</i>.',
    contactEmail: 'orders@3dprintlab.com',
    contactPhone: '+1 (555) 019-2834',
    pickupLocation: 'Engineering Hub B2, Rapid Prototyping Workshop',
    paymentInstructions: 'Payment upon pickup or via bank transfer / Venmo / PayNow.'
  },
  presets: DEFAULT_PRINT_PRESETS,
  accentColor: '#673ab7',
  theme: 'light',
  passwordHash: DEFAULT_ADMIN_PASSWORD_HASH
};

interface AdminSettingsContextType {
  settings: AdminSettings;
  accentTextColor: string;
  harmonizedBg: string;
  updateSettings: (partial: Partial<AdminSettings>) => void;
  updatePricing: (pricing: Partial<AdminPricingSettings>) => void;
  updateAdminInfo: (info: Partial<AdminInfo>) => void;
  addPreset: (preset: Omit<PrintPreset, 'id'>) => void;
  updatePreset: (id: string, preset: Partial<PrintPreset>) => void;
  deletePreset: (id: string) => void;
  resetPresets: () => void;
  updateFilament: (id: string, updated: Partial<Material>) => void;
  addFilament: (filament: Material) => void;
  deleteFilament: (id: string) => void;
  resetFilaments: () => void;
  resetToDefaults: () => void;
}

const AdminSettingsContext = createContext<AdminSettingsContextType | null>(null);

export const AdminSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AdminSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);

        // Migrate presets if stored as legacy object
        let presets: PrintPreset[] = DEFAULT_PRINT_PRESETS;
        if (Array.isArray(parsed.presets) && parsed.presets.length > 0) {
          presets = parsed.presets;
        } else if (parsed.presets && typeof parsed.presets === 'object') {
          // Legacy object { quality: ..., standard: ..., fast: ... }
          presets = DEFAULT_PRINT_PRESETS.map(p => {
            if (p.id === 'preset-04-quality' && parsed.presets.quality) {
              return { ...p, ...parsed.presets.quality, nozzleSize: 0.4 };
            }
            if (p.id === 'preset-04-standard' && parsed.presets.standard) {
              return { ...p, ...parsed.presets.standard, nozzleSize: 0.4 };
            }
            if (p.id === 'preset-04-fast' && parsed.presets.fast) {
              return { ...p, ...parsed.presets.fast, nozzleSize: 0.4 };
            }
            return p;
          });
        }

        // Migrate pricing ensuring additionalHourlyRate and setupFee exist
        const mergedPricing: AdminPricingSettings = {
          setupFee: typeof parsed.pricing?.setupFee === 'number'
            ? parsed.pricing.setupFee
            : DEFAULT_ADMIN_SETTINGS.pricing.setupFee,
          additionalHourlyRate: typeof parsed.pricing?.additionalHourlyRate === 'number'
            ? parsed.pricing.additionalHourlyRate
            : DEFAULT_ADMIN_SETTINGS.pricing.additionalHourlyRate
        };

        // Migrate filaments ensuring costPerKg and gramRate are linked
        const rawFilaments = Array.isArray(parsed.filaments) && parsed.filaments.length > 0
          ? parsed.filaments
          : DEFAULT_ADMIN_SETTINGS.filaments;

        const migratedFilaments: Material[] = rawFilaments.map((mat: any) => {
          const costPerKg = typeof mat.costPerKg === 'number' && mat.costPerKg > 0
            ? mat.costPerKg
            : Number(((mat.gramRate ?? 0.03) * 1000).toFixed(2));
          const gramRate = typeof mat.gramRate === 'number' && mat.gramRate > 0
            ? mat.gramRate
            : Number((costPerKg / 1000).toFixed(4));
          return {
            ...mat,
            costPerKg,
            gramRate
          };
        });

        // Deep merge with defaults to ensure all fields exist
        return {
          ...DEFAULT_ADMIN_SETTINGS,
          ...parsed,
          pricing: mergedPricing,
          adminInfo: { ...DEFAULT_ADMIN_SETTINGS.adminInfo, ...(parsed.adminInfo || {}) },
          presets,
          filaments: migratedFilaments
        };
      }
    } catch (e) {
      console.warn('Failed to parse admin settings from localStorage, using defaults', e);
    }
    return DEFAULT_ADMIN_SETTINGS;
  });

  // Calculate guaranteed contrast text color and harmonized page background
  const accentTextColor = useMemo(
    () => getContrastTextColor(settings.accentColor),
    [settings.accentColor]
  );

  const harmonizedBg = useMemo(
    () => getHarmonizedBackground(settings.accentColor, settings.theme === 'dark'),
    [settings.accentColor, settings.theme]
  );

  // Save to localStorage whenever settings change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save admin settings to localStorage', e);
    }
  }, [settings]);

  // Apply theme & accent color to DOM
  useEffect(() => {
    const root = document.documentElement;

    // Apply accent CSS variables
    root.style.setProperty('--accent-color', settings.accentColor);
    root.style.setProperty('--accent-contrast-text', accentTextColor);
    root.style.setProperty('--accent-light', hexToRgba(settings.accentColor, 0.12));
    root.style.setProperty('--accent-border', hexToRgba(settings.accentColor, 0.35));
    root.style.setProperty('--page-bg', harmonizedBg);

    // Apply dark class to <html>
    if (settings.theme === 'dark') {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
  }, [settings.accentColor, settings.theme, accentTextColor, harmonizedBg]);

  const updateSettings = (partial: Partial<AdminSettings>) => {
    setSettings(prev => ({ ...prev, ...partial }));
  };

  const updatePricing = (pricing: Partial<AdminPricingSettings>) => {
    setSettings(prev => ({
      ...prev,
      pricing: { ...prev.pricing, ...pricing }
    }));
  };

  const updateAdminInfo = (info: Partial<AdminInfo>) => {
    setSettings(prev => ({
      ...prev,
      adminInfo: { ...prev.adminInfo, ...info }
    }));
  };

  const addPreset = (newPreset: Omit<PrintPreset, 'id'>) => {
    const id = `preset-${Date.now()}`;
    setSettings(prev => ({
      ...prev,
      presets: [...prev.presets, { ...newPreset, id }]
    }));
  };

  const updatePreset = (id: string, updated: Partial<PrintPreset>) => {
    setSettings(prev => ({
      ...prev,
      presets: prev.presets.map(p => (p.id === id ? { ...p, ...updated } : p))
    }));
  };

  const deletePreset = (id: string) => {
    setSettings(prev => ({
      ...prev,
      presets: prev.presets.filter(p => p.id !== id)
    }));
  };

  const resetPresets = () => {
    setSettings(prev => ({
      ...prev,
      presets: DEFAULT_PRINT_PRESETS
    }));
  };

  const updateFilament = (id: string, updated: Partial<Material>) => {
    setSettings(prev => ({
      ...prev,
      filaments: prev.filaments.map(m => m.id === id ? { ...m, ...updated } : m)
    }));
  };

  const addFilament = (filament: Material) => {
    setSettings(prev => ({
      ...prev,
      filaments: [...prev.filaments, filament]
    }));
  };

  const deleteFilament = (id: string) => {
    setSettings(prev => ({
      ...prev,
      filaments: prev.filaments.filter(m => m.id !== id)
    }));
  };

  const resetFilaments = () => {
    setSettings(prev => ({
      ...prev,
      filaments: DEFAULT_ADMIN_SETTINGS.filaments
    }));
  };

  const resetToDefaults = () => {
    setSettings(DEFAULT_ADMIN_SETTINGS);
  };

  return (
    <AdminSettingsContext.Provider
      value={{
        settings,
        accentTextColor,
        harmonizedBg,
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
      }}
    >
      {children}
    </AdminSettingsContext.Provider>
  );
};

export const useAdminSettings = () => {
  const context = useContext(AdminSettingsContext);
  if (!context) {
    throw new Error('useAdminSettings must be used within an AdminSettingsProvider');
  }
  return context;
};
