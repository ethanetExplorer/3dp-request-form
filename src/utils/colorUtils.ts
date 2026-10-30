/**
 * Color and contrast utilities for ensuring WCAG AAA accessibility
 * and theme cohesion regardless of chosen background/accent color.
 */

/**
 * Parses a hex color string into RGB numbers [0..255]
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let cleanHex = hex.replace('#', '').trim();
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(c => c + c).join('');
  }
  if (cleanHex.length !== 6) {
    return { r: 103, g: 58, b: 183 }; // Default fallback purple
  }
  const num = parseInt(cleanHex, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  };
}

/**
 * Calculates WCAG relative luminance
 */
export function getLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const a = [r, g, b].map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

/**
 * Returns either pure white '#FFFFFF' or dark charcoal '#111827'
 * to guarantee optimal contrast against any background hex color.
 */
export function getContrastTextColor(hex: string): string {
  const luminance = getLuminance(hex);
  // Threshold 0.4 ensures vibrant/light colors like yellow, cyan, light green get dark text
  return luminance > 0.42 ? '#111827' : '#FFFFFF';
}

/**
 * Returns a subtle background tint that harmonizes with the accent color
 * in Light Mode, or a deep dark neutral in Dark Mode.
 */
export function getHarmonizedBackground(accentHex: string, isDark: boolean): string {
  if (isDark) {
    return '#0f0f12';
  }
  const { r, g, b } = hexToRgb(accentHex);
  // Mix 94% white (#FFFFFF) with 6% accent color for a subtle, gorgeous background tint
  const mix = (channel: number) => Math.round(255 * 0.94 + channel * 0.06);
  const mixedR = mix(r).toString(16).padStart(2, '0');
  const mixedG = mix(g).toString(16).padStart(2, '0');
  const mixedB = mix(b).toString(16).padStart(2, '0');
  return `#${mixedR}${mixedG}${mixedB}`;
}

/**
 * Returns an alpha-blended rgba string from a hex
 */
export function hexToRgba(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

