/**
 * Application-wide color constants for consistent UI.
 * SunarKhata theme: gold accent + dark primary for headings/labels.
 */
export const APP_COLORS = {
  /** Primary gold - use for all Gold metal/category UI (dashboard, charts, header, etc.) */
  gold: '#D4AF37',
  /** Softer gold for backgrounds and subtle accents */
  goldSoft: '#f7e8c4',
  /** Dark gold for text on light gold backgrounds */
  goldDark: '#6B5A2E',
  /** Theme primary - headings, column names, labels (replaces blue/purple) */
  themePrimary: '#2e2d47',
  /** SunarKhata popup/modal header background */
  themeHeaderBg: 'rgba(89, 12, 22, 1)',
} as const;
