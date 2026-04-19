/**
 * User-facing color palette for the in-app color picker
 * (categories, tags, etc. — where the user picks a color to label something).
 *
 * This is a PRODUCT feature, not a design token system. These values are
 * raw hex intentionally — they're data, not theme. If you need to theme
 * the UI, use the design token system in src/styles/tokens/.
 */
export const paletteSwatches = [
  { hex: '#ef4444', name: 'Rosso' },
  { hex: '#f15a2a', name: 'Vermiglione' },
  { hex: '#f97316', name: 'Arancione' },
  { hex: '#f88512', name: 'Calendola' },
  { hex: '#f59e0b', name: 'Ambra' },
  { hex: '#eda809', name: 'Dorato' },
  { hex: '#eab308', name: 'Giallo' },
  { hex: '#b7bd0f', name: 'Chartreuse' },
  { hex: '#84cc16', name: 'Lime' },
  { hex: '#53c63a', name: 'Mela' },
  { hex: '#22C55E', name: 'Verde' },
  { hex: '#19c170', name: 'Verde Mare' },
  { hex: '#10b981', name: 'Smeraldo' },
  { hex: '#12b894', name: 'Turchese' },
  { hex: '#14b8a6', name: 'Verde Acqua' },
  { hex: '#0eb7ba', name: 'Acqua' },
  { hex: '#06b6d4', name: 'Ciano' },
  { hex: '#08aede', name: 'Azzurro' },
  { hex: '#0ea5e9', name: 'Celeste' },
  { hex: '#2494ef', name: 'Ceruleo' },
  { hex: '#3b82f6', name: 'Blu' },
  { hex: '#4f74f4', name: 'Blu Reale' },
  { hex: '#6366f1', name: 'Indaco' },
  { hex: '#7761f4', name: 'Pervinca' },
  { hex: '#8b5cf6', name: 'Viola' },
  { hex: '#9658f7', name: 'Ametista' },
  { hex: '#a855f7', name: 'Porpora' },
  { hex: '#be4df4', name: 'Orchidea' },
  { hex: '#d946ef', name: 'Fucsia' },
  { hex: '#e445c4', name: 'Magenta' },
  { hex: '#ec4899', name: 'Rosa' },
  { hex: '#f1447c', name: 'Rubino' },
  { hex: '#f43f5e', name: 'Rosa Antico' },
  { hex: '#f24151', name: 'Cremisi' },
  { hex: '#f04444', name: 'Scarlatto' },
  { hex: '#ef4444', name: 'Rosso' },
] as const;
