export const designSystem = {
  colors: {
    primary: {
      green: '#22C55E',
      greenLight: '#16A34A',
      greenDark: '#15803D',
    },
    neutral: {
      white: '#FFFFFF',
      gray50: '#F9FAFB',
      gray100: '#F3F4F6',
      gray200: '#E5E7EB',
      gray300: '#D1D5DB',
      gray400: '#9CA3AF',
      gray500: '#6B7280',
      gray600: '#4B5563',
      gray700: '#374151',
      gray800: '#1F2937',
      gray900: '#111827',
    },
    dark: {
      background: '#0A0A0A',
      surface: '#121212',
      surfaceLight: '#1E1E1E',
      border: '#2A2A2A',
      borderLight: '#333333',
      textPrimary: '#FFFFFF',
      textSecondary: '#A0A0A0',
      highlight: '#2B2B2B',
    },
    accent: {
      blue: '#3B82F6',
      purple: '#8B5CF6',
      orange: '#F97316',
    },
    semantic: {
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      info: '#06B6D4',
    },
    chart: {
      primary: '#22C55E',
      secondary: '#555555',
      grid: { light: '#E5E7EB', dark: '#272727' },
      text: '#A0A0A0',
      avgLine: { light: '#9CA3AF', dark: '#555555' },
    },
  },
  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.2)',
    base: '0 2px 4px rgba(0, 0, 0, 0.25), 0 1px 2px rgba(0, 0, 0, 0.15)',
    md: '0 4px 6px rgba(0, 0, 0, 0.3), 0 2px 4px rgba(0, 0, 0, 0.2)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.4), 0 4px 6px rgba(0, 0, 0, 0.3)',
    xl: '0 20px 25px rgba(0, 0, 0, 0.5), 0 10px 10px rgba(0, 0, 0, 0.4)',
    glow: '0 0 10px rgba(34, 197, 94, 0.2)',
  },
};

export const colors = [
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
];

export const cardStyle =
  'bg-white border border-[#E5E7EB] dark:bg-[#121212] dark:border-[#2A2A2A] rounded-xl shadow-base transition-all hover:shadow-md dark:shadow-glow';
export const widgetStyle = cardStyle;
export const widgetTitleStyle = 'text-[#111827] dark:text-white text-base font-semibold';
export const section_style =
  'section-enter scroll-mt-24 md:scroll-mt-28 pt-20 sm:pt-24 lg:pt-32 pb-16 sm:pb-20 lg:pb-24 px-4 sm:px-6 lg:px-8';
