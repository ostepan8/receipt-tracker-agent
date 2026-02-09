export const colors = {
  // Primary colors
  primaryBlack: '#101820',
  primaryOrange: '#FF5C28',
  
  // Secondary colors
  secondaryOrange: '#FFC0A4',
  secondaryTeal: '#3ED0C3',
  
  // Accent colors
  accentGreen: '#B5E800',
  graphiteGray: '#5A5A5A',
  
  // Background
  backgroundCream: '#F0F3EF',
  
  // Status colors
  error: '#ef4444',
  success: '#22c55e',
} as const;

export type ColorKey = keyof typeof colors;
export type ColorValue = typeof colors[ColorKey];
