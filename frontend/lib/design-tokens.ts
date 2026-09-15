/**
 * CredX Design Tokens
 * Single source of truth for all design values.
 * Never hardcode colors or spacing outside this file.
 */

export const colors = {
  // Brand
  navy:        '#0F2444',
  navyLight:   '#1A3660',
  blue:        '#1E6FD9',
  blueLight:   '#2E86EF',
  blueFaint:   '#EBF3FD',

  // Backgrounds
  bgBase:      '#F5F7FA',
  bgCard:      '#FFFFFF',
  bgMuted:     '#F1F5F9',
  bgNavy:      '#0F2444',

  // Text
  textPrimary:   '#0F172A',
  textSecondary: '#475569',
  textMuted:     '#94A3B8',
  textInverse:   '#FFFFFF',
  textNavy:      '#0F2444',

  // Semantic status
  greenBase:   '#16A34A',
  greenLight:  '#F0FDF4',
  greenBorder: '#BBF7D0',

  amberBase:   '#D97706',
  amberLight:  '#FFFBEB',
  amberBorder: '#FDE68A',

  redBase:     '#DC2626',
  redLight:    '#FEF2F2',
  redBorder:   '#FECACA',

  // Borders
  borderBase:  '#E2E8F0',
  borderStrong:'#CBD5E1',
} as const;

export const shadows = {
  sm:  '0 1px 3px rgba(15, 36, 68, 0.06), 0 1px 2px rgba(15, 36, 68, 0.04)',
  md:  '0 4px 12px rgba(15, 36, 68, 0.08), 0 2px 4px rgba(15, 36, 68, 0.04)',
  lg:  '0 8px 24px rgba(15, 36, 68, 0.10), 0 4px 8px rgba(15, 36, 68, 0.05)',
  xl:  '0 16px 40px rgba(15, 36, 68, 0.12)',
} as const;

export const radius = {
  sm:  '6px',
  md:  '10px',
  lg:  '14px',
  xl:  '18px',
  full:'9999px',
} as const;

export const typography = {
  fontSans: "'Inter', 'Geist', system-ui, -apple-system, sans-serif",
  sizeXs:   '11px',
  sizeSm:   '13px',
  sizeMd:   '14px',
  sizeLg:   '16px',
  sizeXl:   '20px',
  size2xl:  '24px',
  size3xl:  '30px',
  size4xl:  '36px',
  size5xl:  '48px',
} as const;

// Risk band semantic mapping
export const riskConfig = {
  Low: {
    label:       'Low Risk',
    color:       colors.greenBase,
    bgColor:     colors.greenLight,
    borderColor: colors.greenBorder,
    textColor:   colors.greenBase,
  },
  Medium: {
    label:       'Medium Risk',
    color:       colors.amberBase,
    bgColor:     colors.amberLight,
    borderColor: colors.amberBorder,
    textColor:   colors.amberBase,
  },
  High: {
    label:       'High Risk',
    color:       colors.redBase,
    bgColor:     colors.redLight,
    borderColor: colors.redBorder,
    textColor:   colors.redBase,
  },
} as const;

export type RiskBandKey = keyof typeof riskConfig;
