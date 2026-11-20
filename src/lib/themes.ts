export type ColorThemeId = 'cyber-emerald' | 'biotech-sapphire' | 'clean-platinum' | 'royal-amethyst';

export interface ColorTheme {
  id: ColorThemeId;
  name: string;
  tagline: string;
  isDark: boolean;
  accentColor: string;
  previewColors: string[]; // for UI swatches
  classes: {
    bg: string;
    header: string;
    card: string;
    cardHoverBorder: string;
    textPrimary: string;
    textSecondary: string;
    accentText: string;
    accentBg: string;
    accentBorder: string;
    primaryBtn: string;
    secondaryBtn: string;
    tableHeaderBg: string;
    tableRowHover: string;
    tableBorder: string;
    phoneHeader: string;
    phoneChatBg: string;
    bubblePatient: string;
    bubbleAssistant: string;
    glow1: string;
    glow2: string;
  };
}

export const COLOR_THEMES: Record<ColorThemeId, ColorTheme> = {
  'cyber-emerald': {
    id: 'cyber-emerald',
    name: 'Cyber Emerald',
    tagline: 'Futuristic Obsidian & Luminous Mint',
    isDark: true,
    accentColor: '#10b981',
    previewColors: ['#070b14', '#10b981', '#06b6d4'],
    classes: {
      bg: 'bg-[#070b14] text-slate-100',
      header: 'bg-[#0b101c]/90 border-slate-800/80',
      card: 'bg-[#101726]/85 border-slate-800/90 shadow-xl shadow-black/40',
      cardHoverBorder: 'hover:border-emerald-500/50',
      textPrimary: 'text-white',
      textSecondary: 'text-slate-400',
      accentText: 'text-emerald-400',
      accentBg: 'bg-emerald-500/10',
      accentBorder: 'border-emerald-500/30',
      primaryBtn: 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-500/25',
      secondaryBtn: 'bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800',
      tableHeaderBg: 'bg-slate-900/90 text-slate-400',
      tableRowHover: 'hover:bg-slate-900/60',
      tableBorder: 'border-slate-800',
      phoneHeader: 'bg-[#202c33]',
      phoneChatBg: 'bg-[#0b141a]',
      bubblePatient: 'bg-[#005c4b] text-white',
      bubbleAssistant: 'bg-[#202c33] text-slate-100 border-[#2a3942]',
      glow1: 'bg-emerald-600/15',
      glow2: 'bg-cyan-600/15',
    }
  },
  'biotech-sapphire': {
    id: 'biotech-sapphire',
    name: 'Biotech Sapphire',
    tagline: 'High-Tech Deep Navy & Electric Sky',
    isDark: true,
    accentColor: '#3b82f6',
    previewColors: ['#060c1a', '#3b82f6', '#38bdf8'],
    classes: {
      bg: 'bg-[#060c1a] text-slate-100',
      header: 'bg-[#0a1329]/90 border-blue-900/40',
      card: 'bg-[#0d1a38]/85 border-blue-900/50 shadow-xl shadow-black/40',
      cardHoverBorder: 'hover:border-blue-500/50',
      textPrimary: 'text-white',
      textSecondary: 'text-blue-300/70',
      accentText: 'text-sky-400',
      accentBg: 'bg-blue-500/10',
      accentBorder: 'border-blue-500/30',
      primaryBtn: 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-blue-500/25',
      secondaryBtn: 'bg-blue-950/80 border-blue-800 text-blue-200 hover:bg-blue-900',
      tableHeaderBg: 'bg-[#081229] text-blue-300',
      tableRowHover: 'hover:bg-[#0a1733]/80',
      tableBorder: 'border-blue-900/60',
      phoneHeader: 'bg-[#0f1d3d]',
      phoneChatBg: 'bg-[#081024]',
      bubblePatient: 'bg-[#1d4ed8] text-white',
      bubbleAssistant: 'bg-[#0f1d3d] text-slate-100 border-blue-800/60',
      glow1: 'bg-blue-600/20',
      glow2: 'bg-cyan-500/15',
    }
  },
  'clean-platinum': {
    id: 'clean-platinum',
    name: 'Clinical Platinum',
    tagline: 'Crisp Hospital White & Alpine Teal',
    isDark: false,
    accentColor: '#0d9488',
    previewColors: ['#f8fafc', '#0d9488', '#2563eb'],
    classes: {
      bg: 'bg-[#f8fafc] text-slate-800',
      header: 'bg-white/95 border-slate-200 shadow-xs',
      card: 'bg-white border-slate-200 shadow-xs shadow-slate-200/50',
      cardHoverBorder: 'hover:border-teal-500/50',
      textPrimary: 'text-slate-900',
      textSecondary: 'text-slate-500',
      accentText: 'text-teal-700',
      accentBg: 'bg-teal-50',
      accentBorder: 'border-teal-200',
      primaryBtn: 'bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white shadow-teal-500/20',
      secondaryBtn: 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200',
      tableHeaderBg: 'bg-slate-50 text-slate-600',
      tableRowHover: 'hover:bg-slate-50/90',
      tableBorder: 'border-slate-200',
      phoneHeader: 'bg-[#075e54]',
      phoneChatBg: 'bg-[#efeae2]/85',
      bubblePatient: 'bg-[#dcf8c6] text-slate-900',
      bubbleAssistant: 'bg-white text-slate-800 border-slate-200',
      glow1: 'bg-teal-500/5',
      glow2: 'bg-blue-500/5',
    }
  },
  'royal-amethyst': {
    id: 'royal-amethyst',
    name: 'Royal Amethyst',
    tagline: 'Luxury Velvet Midnight & Bright Violet',
    isDark: true,
    accentColor: '#a855f7',
    previewColors: ['#0b0714', '#a855f7', '#ec4899'],
    classes: {
      bg: 'bg-[#0b0714] text-slate-100',
      header: 'bg-[#120b20]/90 border-purple-900/40',
      card: 'bg-[#170e2b]/85 border-purple-900/50 shadow-xl shadow-black/40',
      cardHoverBorder: 'hover:border-purple-500/50',
      textPrimary: 'text-white',
      textSecondary: 'text-purple-300/70',
      accentText: 'text-purple-400',
      accentBg: 'bg-purple-500/10',
      accentBorder: 'border-purple-500/30',
      primaryBtn: 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-purple-500/25',
      secondaryBtn: 'bg-purple-950/80 border-purple-800 text-purple-200 hover:bg-purple-900',
      tableHeaderBg: 'bg-[#100921] text-purple-300',
      tableRowHover: 'hover:bg-[#150b2c]/80',
      tableBorder: 'border-purple-900/60',
      phoneHeader: 'bg-[#1e1038]',
      phoneChatBg: 'bg-[#0f071c]',
      bubblePatient: 'bg-[#7e22ce] text-white',
      bubbleAssistant: 'bg-[#1a0e30] text-slate-100 border-purple-800/60',
      glow1: 'bg-purple-600/20',
      glow2: 'bg-pink-600/15',
    }
  }
};
