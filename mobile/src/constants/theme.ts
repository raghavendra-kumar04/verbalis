/**
 * Verbalis Design Tokens
 * Direct translation from DESIGN.md and Stitch HTML components
 */

export const Colors = {
  light: {
    // Canvas & Surfaces
    background: '#faf9fb',
    surface: '#faf9fb',
    surfaceDim: '#dbd9dc',
    surfaceBright: '#faf9fb',
    surfaceContainerLowest: '#ffffff',
    surfaceContainerLow: '#f5f3f5',
    surfaceContainer: '#efedf0',
    surfaceContainerHigh: '#e9e8ea',
    surfaceContainerHighest: '#e3e2e4',
    
    // Text & Ink
    textPrimary: '#1b1c1e',
    textSecondary: '#464555',
    textTertiary: '#777586',
    onSurface: '#1b1c1e',
    onSurfaceVariant: '#464555',
    
    // Brand & Accents
    primary: '#4233cc',
    primaryContainer: '#5b50e5',
    onPrimary: '#ffffff',
    onPrimaryContainer: '#e8e4ff',
    primaryFixed: '#e3dfff',
    primaryFixedDim: '#c4c0ff',
    onPrimaryFixed: '#120068',
    
    secondary: '#4648d4',
    secondaryContainer: '#6063ee',
    onSecondary: '#ffffff',
    secondaryFixed: '#e1e0ff',
    secondaryFixedDim: '#c0c1ff',
    
    tertiary: '#4c4f59',
    tertiaryContainer: '#646772',
    onTertiary: '#ffffff',
    
    // Outlines & Borders
    outline: '#777586',
    outlineVariant: '#c8c4d7',
    borderSubdued: '#e5e7eb',
    
    // Semantics
    success: '#10b981',
    successTint: '#ecfdf5',
    successBorder: '#a7f3d0',
    successText: '#065f46',
    
    caution: '#f59e0b',
    cautionTint: '#fffbeb',
    cautionBorder: '#fde68a',
    cautionText: '#92400e',
    
    error: '#ba1a1a',
    errorContainer: '#ffdad6',
    onError: '#ffffff',
    critical: '#ef4444',
    criticalTint: '#fef2f2',
    criticalBorder: '#fecaca',
    criticalText: '#991b1b',
  },
  dark: {
    background: '#0f1012',
    surface: '#18191c',
    surfaceDim: '#121316',
    surfaceBright: '#222429',
    surfaceContainerLowest: '#0b0c0e',
    surfaceContainerLow: '#18191c',
    surfaceContainer: '#222429',
    surfaceContainerHigh: '#2a2d33',
    surfaceContainerHighest: '#33363e',
    
    textPrimary: '#f3f4f6',
    textSecondary: '#9ca3af',
    textTertiary: '#6b7280',
    onSurface: '#f3f4f6',
    onSurfaceVariant: '#9ca3af',
    
    primary: '#6366f1',
    primaryContainer: '#5b50e5',
    onPrimary: '#ffffff',
    onPrimaryContainer: '#e8e4ff',
    primaryFixed: '#312e81',
    primaryFixedDim: '#1e1b4b',
    onPrimaryFixed: '#c7d2fe',
    
    secondary: '#818cf8',
    secondaryContainer: '#4f46e5',
    onSecondary: '#ffffff',
    secondaryFixed: '#3730a3',
    secondaryFixedDim: '#1e1b4b',
    
    tertiary: '#9ca3af',
    tertiaryContainer: '#374151',
    onTertiary: '#ffffff',
    
    outline: '#4b5563',
    outlineVariant: '#2d3037',
    borderSubdued: '#2d3037',
    
    success: '#34d399',
    successTint: '#064e3b',
    successBorder: '#059669',
    successText: '#6ee7b7',
    
    caution: '#fbbf24',
    cautionTint: '#78350f',
    cautionBorder: '#d97706',
    cautionText: '#fde68a',
    
    error: '#f87171',
    errorContainer: '#7f1d1d',
    onError: '#ffffff',
    critical: '#f87171',
    criticalTint: '#450a0a',
    criticalBorder: '#b91c1c',
    criticalText: '#fca5a5',
  }
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
  gutter: 16,
  margin: 20,
};

export const BorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 9999,
};

export const Typography = {
  fontFamily: 'Inter',
  sizes: {
    headlineXl: { fontSize: 32, lineHeight: 40, fontWeight: '700' as const },
    headlineLg: { fontSize: 26, lineHeight: 34, fontWeight: '600' as const },
    headlineMd: { fontSize: 20, lineHeight: 26, fontWeight: '600' as const },
    headlineSm: { fontSize: 17, lineHeight: 22, fontWeight: '600' as const },
    bodyLg: { fontSize: 16, lineHeight: 24, fontWeight: '400' as const },
    bodyMd: { fontSize: 14, lineHeight: 21, fontWeight: '400' as const },
    bodySm: { fontSize: 13, lineHeight: 18, fontWeight: '400' as const },
    labelLg: { fontSize: 14, lineHeight: 18, fontWeight: '600' as const },
    labelMd: { fontSize: 12, lineHeight: 16, fontWeight: '500' as const },
    labelSm: { fontSize: 11, lineHeight: 14, fontWeight: '600' as const },
    metric: { fontSize: 40, lineHeight: 46, fontWeight: '700' as const },
  }
};
