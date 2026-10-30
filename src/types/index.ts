import * as THREE from 'three';

export interface CustomerDetails {
  name: string;
  phone: string;
  email?: string;
  notes?: string;
}

export type ModelFormat = 'stl' | 'step';

export interface ModelData {
  id: string;
  name: string;
  fileSize: number;
  format: ModelFormat;
  geometry: THREE.BufferGeometry;
  dimensions: {
    x: number; // width in mm
    y: number; // depth in mm
    z: number; // height in mm
  };
  volume: number; // in cm³
  surfaceArea: number; // in cm²
  triangleCount: number;
}

export type MaterialType = 'PLA' | 'PETG';

export interface Material {
  id: string;
  name: string;
  type: MaterialType;
  colorName: string;
  colorHex: string;
  textColor?: string;
  finish: 'Matte' | 'Glossy' | 'Silk';
  density: number; // in g/cm³ (PLA: 1.24, PETG: 1.27)
  hourlyMachineRate: number; // $ per hour
  costPerKg: number; // $ per 1kg spool (e.g. 28.00)
  gramRate: number; // $ per gram (calculated as costPerKg / 1000)
  description: string;
  features: string[];
  inStock?: boolean;
  hasCustomRate?: boolean;
}

export type SlicerInfillPattern = 'Grid' | 'Gyroid' | 'Honeycomb' | 'Linear';
export type SlicerSupportType = 'none' | 'normal' | 'tree';
export type SlicerBedAdhesion = 'none' | 'skirt' | 'brim' | 'raft';
export type SlicerSpeedPreset = 'quality' | 'standard' | 'high_speed';

export type PrintMode = 'quality' | 'standard' | 'fast' | 'advanced' | string;

export interface LayerHeightOption {
  value: number;
  label: string;
  sub: string;
}

export const NOZZLE_LAYER_HEIGHTS: Record<number, LayerHeightOption[]> = {
  0.2: [
    { value: 0.06, label: '0.06 mm', sub: 'Ultra Detail' },
    { value: 0.08, label: '0.08 mm', sub: 'Fine' },
    { value: 0.10, label: '0.10 mm', sub: 'Standard' },
    { value: 0.14, label: '0.14 mm', sub: 'Draft' }
  ],
  0.4: [
    { value: 0.12, label: '0.12 mm', sub: 'Fine' },
    { value: 0.16, label: '0.16 mm', sub: 'Optimal' },
    { value: 0.20, label: '0.20 mm', sub: 'Standard' },
    { value: 0.28, label: '0.28 mm', sub: 'Draft' }
  ],
  0.6: [
    { value: 0.20, label: '0.20 mm', sub: 'Quality' },
    { value: 0.30, label: '0.30 mm', sub: 'Standard' },
    { value: 0.38, label: '0.38 mm', sub: 'Draft' },
    { value: 0.45, label: '0.45 mm', sub: 'Ultra Fast' }
  ],
  0.8: [
    { value: 0.32, label: '0.32 mm', sub: 'Quality' },
    { value: 0.44, label: '0.44 mm', sub: 'Standard' },
    { value: 0.54, label: '0.54 mm', sub: 'Draft' },
    { value: 0.64, label: '0.64 mm', sub: 'Ultra Fast' }
  ]
};

export interface SlicerSettings {
  nozzleSize?: number; // 0.2, 0.4, 0.6, 0.8 mm (default: 0.4)
  layerHeight: number; // e.g. 0.12, 0.20, 0.28 mm
  infillPercent: number; // 0 to 100%
  infillPattern: SlicerInfillPattern;
  wallLoops: number; // 2, 3, 4, 5
  supportType: SlicerSupportType;
  bedAdhesion: SlicerBedAdhesion;
  speedPreset: SlicerSpeedPreset;
}

export interface PrintEstimate {
  layerCount: number;
  filamentWeightGrams: number;
  filamentLengthMeters: number;
  printTimeHours: number;
  formattedTime: string;
  hourlyMachineRate: number;
  machineCost: number;
  materialCost: number;
  setupFee: number;
  totalCost: number;
}

export interface AdminPricingSettings {
  setupFee: number;
  additionalHourlyRate: number;
}

export interface AdminInfo {
  businessName: string;
  formDescription?: string;
  contactEmail: string;
  contactPhone: string;
  pickupLocation: string;
  paymentInstructions: string;
}

export interface PrintPreset {
  id: string;
  name: string;
  nozzleSize: number; // 0.2, 0.4, 0.6, 0.8 mm (exclusive to this nozzle)
  layerHeight: number;
  infillPercent: number;
  infillPattern: SlicerInfillPattern;
  wallLoops: number;
  supportType: SlicerSupportType;
  description?: string;
}

export interface SlicerPreset {
  layerHeight: number;
  infillPercent: number;
  infillPattern: SlicerInfillPattern;
  wallLoops: number;
  supportType: SlicerSupportType;
}

export interface AdminSettings {
  filaments: Material[];
  pricing: AdminPricingSettings;
  adminInfo: AdminInfo;
  presets: PrintPreset[];
  accentColor: string;
  theme: 'light' | 'dark';
  passwordHash: string;
}

export interface PrintJob {
  id: string;
  modelData: ModelData | null;
  isLoadingModel?: boolean;
  modelError?: string | null;
  slicerSettings: SlicerSettings;
  printMode: PrintMode;
  selectedMaterial: Material;
  quantity: number;
  estimate: PrintEstimate | null;
  instructions?: string;
  isCollapsed?: boolean;
}

