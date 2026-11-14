/**
 * This app's identity, in ONE place — the installable manifest and the share card
 * (Open Graph) read it (App Excellence Standard E11). The tab title stays in layout.tsx.
 */
export const APP_META = {
  name:        'TEC Life',
  shortName:   'Life',
  description: 'TEC Life — your personal life coach: build yourself, one step at a time',
  /** The page background — this app's dark `--tec-bg` (#101014, tec-design-tokens.css); also the browser chrome and splash colour. */
  themeColor:  '#101014',
} as const;
