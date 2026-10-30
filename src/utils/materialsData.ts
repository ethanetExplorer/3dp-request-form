import { Material } from '../types';

export const AVAILABLE_MATERIALS: Material[] = [
  // PLA Filaments ($4.50/hr machine rate, $28.00/kg -> $0.028/g)
  {
    id: 'pla-black',
    name: 'Standard PLA',
    type: 'PLA',
    colorName: 'Matte Black',
    colorHex: '#1E1E1E',
    textColor: '#FFFFFF',
    finish: 'Matte',
    density: 1.24,
    hourlyMachineRate: 4.50,
    costPerKg: 28.00,
    gramRate: 0.028,
    description: 'Crisp finish with minimal layer lines. Great for prototypes, display models, and general housings.',
    features: ['High dimensional accuracy', 'Eco-friendly bio-plastic', 'Low warpage']
  },
  {
    id: 'pla-white',
    name: 'Standard PLA',
    type: 'PLA',
    colorName: 'Pure White',
    colorHex: '#F3F4F6',
    textColor: '#1F2937',
    finish: 'Matte',
    density: 1.24,
    hourlyMachineRate: 4.50,
    costPerKg: 28.00,
    gramRate: 0.028,
    description: 'Bright, clean white surface. Ideal for medical mockups, architectural scale models, and paintable parts.',
    features: ['Easy to prime & paint', 'Clean aesthetic', 'Consistent finish']
  },
  {
    id: 'pla-grey',
    name: 'Standard PLA',
    type: 'PLA',
    colorName: 'Space Grey',
    colorHex: '#6B7280',
    textColor: '#FFFFFF',
    finish: 'Matte',
    density: 1.24,
    hourlyMachineRate: 4.50,
    costPerKg: 28.00,
    gramRate: 0.028,
    description: 'Neutral engineering grey. Best for inspecting mechanical fits and surface geometry.',
    features: ['High detail contrast', 'Industrial look', 'Uniform shade']
  },
  {
    id: 'pla-red',
    name: 'Standard PLA',
    type: 'PLA',
    colorName: 'Signal Red',
    colorHex: '#DC2626',
    textColor: '#FFFFFF',
    finish: 'Glossy',
    density: 1.24,
    hourlyMachineRate: 4.50,
    costPerKg: 28.00,
    gramRate: 0.028,
    description: 'Vibrant, high-visibility red. Great for safety brackets, handles, and eye-catching components.',
    features: ['High visibility', 'Rich pigmentation', 'Smooth sheen']
  },
  {
    id: 'pla-blue',
    name: 'Standard PLA',
    type: 'PLA',
    colorName: 'Cobalt Blue',
    colorHex: '#2563EB',
    textColor: '#FFFFFF',
    finish: 'Glossy',
    density: 1.24,
    hourlyMachineRate: 4.50,
    costPerKg: 28.00,
    gramRate: 0.028,
    description: 'Deep cobalt blue with rich saturation. Popular for electronic enclosures and robotics frames.',
    features: ['Vivid tone', 'High rigidity', 'Smooth walls']
  },
  {
    id: 'pla-orange',
    name: 'Standard PLA',
    type: 'PLA',
    colorName: 'Sunset Orange',
    colorHex: '#F97316',
    textColor: '#FFFFFF',
    finish: 'Glossy',
    density: 1.24,
    hourlyMachineRate: 4.50,
    costPerKg: 28.00,
    gramRate: 0.028,
    description: 'Bold orange shade. Excellent for tooling jigs, automotive markers, and hobby projects.',
    features: ['Crisp edges', 'High contrast', 'Consistent extrusion']
  },
  {
    id: 'pla-silk-silver',
    name: 'Silk PLA',
    type: 'PLA',
    colorName: 'Silk Silver',
    colorHex: '#94A3B8',
    textColor: '#0F172A',
    finish: 'Silk',
    density: 1.24,
    hourlyMachineRate: 4.50,
    costPerKg: 35.00,
    gramRate: 0.035,
    description: 'Glossy metallic luster mimicking brushed aluminum. Ideal for trophies and decorative shells.',
    features: ['Metallic shimmer', 'Conceals layer lines', 'Premium touch']
  },

  // PETG Filaments ($6.00/hr machine rate, $32.00/kg -> $0.032/g)
  {
    id: 'petg-black',
    name: 'Tough PETG',
    type: 'PETG',
    colorName: 'Jet Black',
    colorHex: '#18181B',
    textColor: '#FFFFFF',
    finish: 'Glossy',
    density: 1.27,
    hourlyMachineRate: 6.00,
    costPerKg: 32.00,
    gramRate: 0.032,
    description: 'Impact resistant, UV stable, and chemically inert. Perfect for functional outdoor and mechanical parts.',
    features: ['Heat resistant up to 75°C', 'Superior layer adhesion', 'Weather & UV stable']
  },
  {
    id: 'petg-clear',
    name: 'Tough PETG',
    type: 'PETG',
    colorName: 'Translucent Clear',
    colorHex: '#E2E8F0',
    textColor: '#0F172A',
    finish: 'Glossy',
    density: 1.27,
    hourlyMachineRate: 6.00,
    costPerKg: 32.00,
    gramRate: 0.032,
    description: 'Semi-transparent finish allowing light through. Great for diffuser lenses and fluid containers.',
    features: ['Light transmission', 'Moisture resistant', 'Food-contact safe grade']
  },
  {
    id: 'petg-orange',
    name: 'Tough PETG',
    type: 'PETG',
    colorName: 'Prusa Orange',
    colorHex: '#EA580C',
    textColor: '#FFFFFF',
    finish: 'Glossy',
    density: 1.27,
    hourlyMachineRate: 6.00,
    costPerKg: 32.00,
    gramRate: 0.032,
    description: 'Iconic mechanical orange. The industry standard for 3D printer parts and workshop fixtures.',
    features: ['High impact strength', 'Slightly flexible', 'Fatigue resistant']
  },
  {
    id: 'petg-blue',
    name: 'Tough PETG',
    type: 'PETG',
    colorName: 'Navy Blue',
    colorHex: '#1E3A8A',
    textColor: '#FFFFFF',
    finish: 'Glossy',
    density: 1.27,
    hourlyMachineRate: 6.00,
    costPerKg: 32.00,
    gramRate: 0.032,
    description: 'Deep mechanical navy. Resistant to water and household chemicals.',
    features: ['Chemical resistance', 'Durable flexural modulus', 'Heat resistant']
  },
  {
    id: 'petg-white',
    name: 'Tough PETG',
    type: 'PETG',
    colorName: 'Industrial White',
    colorHex: '#F8FAFC',
    textColor: '#1E293B',
    finish: 'Glossy',
    density: 1.27,
    hourlyMachineRate: 6.00,
    costPerKg: 32.00,
    gramRate: 0.032,
    description: 'Durable white PETG. Doesn\'t yellow in UV sunlight like standard PLA.',
    features: ['Outdoor durability', 'High tensile strength', 'Impact damping']
  }
];

export const COLOR_PALETTES = [
  { name: 'All Colours', hex: null },
  { name: 'Black', hex: '#1E1E1E' },
  { name: 'White', hex: '#F3F4F6' },
  { name: 'Grey', hex: '#6B7280' },
  { name: 'Red', hex: '#DC2626' },
  { name: 'Blue', hex: '#2563EB' },
  { name: 'Orange', hex: '#F97316' },
  { name: 'Silver', hex: '#94A3B8' },
  { name: 'Clear', hex: '#E2E8F0' }
];

export const BASE_SETUP_FEES: Record<string, number> = {
  PLA: 3.00,
  PETG: 4.00
};

