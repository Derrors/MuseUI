
import React, { useState } from 'react';
import { DesignTokens, LangType } from '../types';
import { I18N } from '../constants';

interface Props {
  tokens: DesignTokens;
  onChange: (tokens: DesignTokens) => void;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  lang: LangType;
}

const THEMES = [
  // --- Standard / Tech ---
  { name: 'Default Blue', colors: ['#3B82F6', '#FFFFFF', '#F59E0B', '#10B981'] },
  { name: 'Bold Tech', colors: ['#2563EB', '#F8FAFC', '#0F172A', '#64748B'] },
  { name: 'Corporate Navy', colors: ['#1E3A8A', '#FFFFFF', '#60A5FA', '#94A3B8'] },
  { name: 'SaaS Purple', colors: ['#6366F1', '#FAFAFA', '#4F46E5', '#312E81'] },
  { name: 'Slate Professional', colors: ['#475569', '#F1F5F9', '#334155', '#94A3B8'] },
  { name: 'High Contrast BW', colors: ['#000000', '#FFFFFF', '#000000', '#D4D4D4'] },

  // --- Warm / Earth ---
  { name: 'Amber Minimal', colors: ['#F59E0B', '#FFFBEB', '#78350F', '#92400E'] },
  { name: 'Caffeine', colors: ['#78350F', '#FFFCF5', '#92400E', '#B45309'] },
  { name: 'Terra Cotta', colors: ['#9A3412', '#FEF2F2', '#EA580C', '#78350F'] },
  { name: 'Vintage Paper', colors: ['#57534E', '#F5F5F4', '#44403C', '#A8A29E'] },
  { name: 'Claude', colors: ['#D97757', '#F5F2EE', '#5E4C46', '#8C7B75'] },
  { name: 'Gruvbox', colors: ['#FB4934', '#282828', '#FABD2F', '#B8BB26'] },

  // --- Cool / Nature ---
  { name: 'Kodama Grove', colors: ['#22C55E', '#F0FDF4', '#15803D', '#86EFAC'] },
  { name: 'Forest Deep', colors: ['#14532D', '#F0FDF4', '#166534', '#4ADE80'] },
  { name: 'Ocean Breeze', colors: ['#06B6D4', '#ECFEFF', '#0E7490', '#67E8F9'] },
  { name: 'Nordic Frost', colors: ['#5E81AC', '#ECEFF4', '#88C0D0', '#81A1C1'] },
  { name: 'Mint Chocolate', colors: ['#10B981', '#3E2C28', '#34D399', '#6EE7B7'] },
  { name: 'Midnight Rain', colors: ['#1E293B', '#0F172A', '#38BDF8', '#64748B'] },

  // --- Vibrant / Pop ---
  { name: 'Bubblegum', colors: ['#EC4899', '#FFF1F2', '#F472B6', '#FBCFE8'] },
  { name: 'Amethyst Haze', colors: ['#A855F7', '#FAF5FF', '#D946EF', '#6366F1'] },
  { name: 'Electric Lime', colors: ['#84CC16', '#1A2E05', '#BEF264', '#ECFCCB'] },
  { name: 'Solar Flare', colors: ['#EA580C', '#18181B', '#F97316', '#FDBA74'] },
  { name: 'Cyberpunk', colors: ['#FF00FF', '#000000', '#00FFFF', '#FFFF00'] },
  { name: 'Catppuccin', colors: ['#8AADF4', '#24273A', '#F5A97F', '#A6DA95'] },

  // --- Luxury / Soft ---
  { name: 'Elegant Luxury', colors: ['#1F2937', '#F9FAFB', '#D4AF37', '#4B5563'] },
  { name: 'Royal Gold', colors: ['#581C87', '#FAF5FF', '#FBBF24', '#7E22CE'] },
  { name: 'Lavender Mist', colors: ['#C084FC', '#F3E8FF', '#A855F7', '#E9D5FF'] },
  { name: 'Cherry Blossom', colors: ['#BE185D', '#FFF1F2', '#FB7185', '#FDA4AF'] },
  { name: 'Lemon Sorbet', colors: ['#EAB308', '#FEFCE8', '#FDE047', '#FEF08A'] },
  { name: 'Cosmic Night', colors: ['#6366F1', '#0F172A', '#EC4899', '#06B6D4'] },
];

const ColorInput = ({ label, value, onChangeVal, disabled }: { label: string, value: string, onChangeVal: (v: string) => void, disabled: boolean }) => (
  <div className={`flex items-center justify-between ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
    <label className="text-xs text-stone-600 dark:text-stone-400">{label}</label>
    <div className="flex items-center gap-2 relative">
      <input 
        type="text" 
        value={value}
        onChange={(e) => onChangeVal(e.target.value)}
        disabled={disabled}
        className="w-20 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-600 text-stone-800 dark:text-stone-200 text-xs rounded px-2 py-1 uppercase font-mono"
      />
      <div 
        className="w-6 h-6 rounded border border-stone-300 dark:border-stone-600 overflow-hidden relative cursor-pointer"
        style={{ backgroundColor: value }}
      >
        <input 
          type="color" 
          value={value}
          onChange={(e) => onChangeVal(e.target.value)}
          disabled={disabled}
          className="opacity-0 absolute inset-0 w-full h-full cursor-pointer p-0 border-0"
        />
      </div>
    </div>
  </div>
);

const DesignTokenSelector: React.FC<Props> = ({ tokens, onChange, enabled, onToggle, lang }) => {
  const t = I18N[lang];
  const [showThemes, setShowThemes] = useState(false);

  const applyTheme = (colors: string[]) => {
    onChange({
      ...tokens,
      primaryColor: colors[0],
      backgroundColor: colors[1],
      accentColor: colors[2],
      decorativeColor: colors[3]
    });
    setShowThemes(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <label className="block text-sm font-medium text-stone-400 dark:text-stone-500">{t.designTokens}</label>
            <span className="text-[10px] text-stone-400">{enabled ? (lang === 'zh' ? '已启用' : 'Enabled') : (lang === 'zh' ? '已禁用 (使用风格默认值)' : 'Disabled (Using Style Defaults)')}</span>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative inline-block w-8 align-middle select-none transition duration-200 ease-in">
                <input 
                type="checkbox" 
                name="tokens-toggle" 
                id="tokens-toggle" 
                checked={enabled}
                onChange={(e) => onToggle(e.target.checked)}
                className="toggle-checkbox absolute block w-4 h-4 rounded-full bg-white border-4 appearance-none cursor-pointer checked:right-0 right-4 border-stone-300 dark:border-stone-600"
                />
                <label 
                htmlFor="tokens-toggle" 
                className={`toggle-label block overflow-hidden h-4 rounded-full cursor-pointer ${enabled ? 'bg-teal-600' : 'bg-stone-300 dark:bg-stone-600'}`}
                ></label>
            </div>

            <div className="relative">
                <button 
                onClick={() => enabled && setShowThemes(!showThemes)}
                disabled={!enabled || tokens.aiColor}
                className={`text-xs flex items-center gap-1 px-2 py-1 rounded border transition-colors ${
                    enabled && !tokens.aiColor
                    ? 'text-teal-600 dark:text-teal-400 hover:text-teal-700 bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800/50'
                    : 'text-stone-400 border-stone-200 dark:border-stone-700 cursor-not-allowed opacity-50'
                }`}
                >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v11a3 3 0 106 0V4a2 2 0 00-2-2H4zm1 14a1 1 0 100-2 1 1 0 000 2zm5-1.757l4.9-4.9a2 2 0 000-2.828L13.485 5.1a2 2 0 00-2.828 0L10 5.757v8.486zM16 18H9.071l6-6H16a2 2 0 012 2v2a2 2 0 01-2 2z" clipRule="evenodd" />
                </svg>
                {lang === 'zh' ? '预设' : 'Presets'}
                </button>
                
                {showThemes && enabled && !tokens.aiColor && (
                    <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg shadow-xl z-50 max-h-80 overflow-y-auto custom-scrollbar">
                        {THEMES.map((theme, idx) => (
                            <button
                            key={idx}
                            onClick={() => applyTheme(theme.colors)}
                            className="w-full text-left px-3 py-2 hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center justify-between group"
                            >
                            <span className="text-xs text-stone-700 dark:text-stone-300 group-hover:text-stone-900 dark:group-hover:text-white truncate pr-2 w-24">{theme.name}</span>
                            <div className="flex gap-1 shrink-0">
                                {theme.colors.map(c => (
                                    <div key={c} className="w-3 h-3 rounded-full border border-stone-200 dark:border-stone-600" style={{ backgroundColor: c }}></div>
                                ))}
                            </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
          </div>
      </div>
      
      {enabled && (
        <div className="bg-stone-50 dark:bg-stone-800/40 p-3 rounded-lg border border-stone-200 dark:border-stone-700 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
            
            {/* AI Color Toggle */}
            <div className="flex items-center justify-between bg-cyan-50 dark:bg-cyan-900/10 p-2 rounded border border-cyan-100 dark:border-cyan-800/30">
                <div className="flex flex-col">
                    <label className="text-xs font-bold text-cyan-700 dark:text-cyan-300 flex items-center gap-1">
                        <span>✨</span> {t.aiAutoColors}
                    </label>
                    <span className="text-[9px] text-cyan-600/70 dark:text-cyan-400/70">{t.aiAutoColorsHint}</span>
                </div>
                <div className="relative inline-block w-8 align-middle select-none">
                    <input 
                    type="checkbox" 
                    checked={tokens.aiColor || false}
                    onChange={(e) => onChange({ ...tokens, aiColor: e.target.checked })}
                    className="toggle-checkbox absolute block w-4 h-4 rounded-full bg-white border-4 appearance-none cursor-pointer checked:right-0 right-4 border-cyan-200 dark:border-cyan-800"
                    />
                    <label 
                    className={`toggle-label block overflow-hidden h-4 rounded-full cursor-pointer ${tokens.aiColor ? 'bg-cyan-600' : 'bg-stone-300 dark:bg-stone-600'}`}
                    onClick={() => onChange({ ...tokens, aiColor: !tokens.aiColor })}
                    ></label>
                </div>
            </div>

            {!tokens.aiColor && (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-1">
                    <ColorInput 
                    label={t.primaryColor} 
                    value={tokens.primaryColor} 
                    onChangeVal={(v) => onChange({ ...tokens, primaryColor: v })}
                    disabled={!enabled} 
                    />
                    
                    <ColorInput 
                    label={t.bgColor} 
                    value={tokens.backgroundColor} 
                    onChangeVal={(v) => onChange({ ...tokens, backgroundColor: v })}
                    disabled={!enabled} 
                    />

                    <ColorInput 
                    label={t.accentColor} 
                    value={tokens.accentColor} 
                    onChangeVal={(v) => onChange({ ...tokens, accentColor: v })}
                    disabled={!enabled} 
                    />

                    <ColorInput 
                    label={t.decorativeColor} 
                    value={tokens.decorativeColor} 
                    onChangeVal={(v) => onChange({ ...tokens, decorativeColor: v })}
                    disabled={!enabled} 
                    />
                </div>
            )}

            <div className="h-px bg-stone-200 dark:bg-stone-700 my-2"></div>

            {/* Radius */}
            <div className={!enabled ? 'opacity-50 pointer-events-none' : ''}>
            <label className="text-xs text-stone-600 dark:text-stone-400 block mb-1">{t.radius}</label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1">
                {(['none', 'small', 'medium', 'large', 'full'] as const).map(r => (
                <button
                    key={r}
                    onClick={() => onChange({ ...tokens, borderRadius: r })}
                    disabled={!enabled}
                    className={`min-h-10 text-[10px] py-1 rounded border transition-colors ${
                    tokens.borderRadius === r 
                        ? 'bg-teal-500/20 border-teal-500 text-teal-600 dark:text-teal-200' 
                        : 'bg-white dark:bg-stone-800 border-stone-300 dark:border-stone-600 text-stone-600 dark:text-stone-400 hover:border-stone-500'
                    }`}
                    title={t.tokens[r]}
                >
                    <div className={`w-3 h-3 mx-auto mb-0.5 border border-current ${
                    r === 'none' ? 'rounded-none' : 
                    r === 'small' ? 'rounded-sm' : 
                    r === 'medium' ? 'rounded' : 
                    r === 'large' ? 'rounded-lg' : 'rounded-full'
                    }`}></div>
                </button>
                ))}
            </div>
            </div>

            {/* Spacing */}
            <div className={!enabled ? 'opacity-50 pointer-events-none' : ''}>
            <label className="text-xs text-stone-600 dark:text-stone-400 block mb-1">{t.spacing}</label>
            <div className="grid grid-cols-3 gap-1">
                {(['compact', 'comfortable', 'spacious'] as const).map(s => (
                    <button
                    key={s}
                    onClick={() => onChange({ ...tokens, spacing: s })}
                    disabled={!enabled}
                    className={`min-h-10 text-[10px] py-1 rounded border transition-colors ${
                    tokens.spacing === s
                        ? 'bg-teal-500/20 border-teal-500 text-teal-600 dark:text-teal-200' 
                        : 'bg-white dark:bg-stone-800 border-stone-300 dark:border-stone-600 text-stone-600 dark:text-stone-400 hover:border-stone-500'
                    }`}
                    >
                    {t.tokens[s]}
                    </button>
                ))}
            </div>
            </div>

        </div>
      )}
    </div>
  );
};

export default DesignTokenSelector;
