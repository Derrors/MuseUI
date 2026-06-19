
import React from 'react';
import { PLATFORMS, RESOLUTION_PRESETS, I18N } from '../constants';
import { PlatformType, ResolutionPreset, LangType } from '../types';

interface Props {
  selectedPlatform: PlatformType;
  selectedResolution: ResolutionPreset;
  onSelectPlatform: (p: PlatformType) => void;
  onSelectResolution: (d: ResolutionPreset) => void;
  customSize: { width: number; height: number; active: boolean };
  onCustomSizeChange: (size: { width: number; height: number; active: boolean }) => void;
  lang: LangType;
}

const PlatformSelector: React.FC<Props> = ({
  selectedPlatform,
  selectedResolution,
  onSelectPlatform,
  onSelectResolution,
  customSize,
  onCustomSizeChange,
  lang
}) => {
  
  const filteredResolutions = RESOLUTION_PRESETS.filter(d => d.type === selectedPlatform);
  const t = I18N[lang];

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-stone-600 dark:text-stone-400 mb-2">{t.platform}</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {PLATFORMS.map((p) => (
            <button
              key={p.id}
              onClick={() => onSelectPlatform(p.id)}
              className={`min-h-16 flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${
                selectedPlatform === p.id
                  ? 'bg-teal-50 dark:bg-teal-500/10 border-teal-500 text-teal-600 dark:text-teal-200'
                  : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 hover:border-stone-400 dark:hover:border-stone-600'
              }`}
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="w-6 h-6 mb-1" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor" 
                strokeWidth={1.5}
                dangerouslySetInnerHTML={{ __html: p.icon }}
              />
              <span className="text-xs font-semibold">{lang === 'zh' ? p.label_zh : p.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-600 dark:text-stone-400 mb-2">{t.resolution}</label>
        <select
          value={selectedResolution.id}
          onChange={(e) => {
            const res = filteredResolutions.find(d => d.id === e.target.value);
            if (res) onSelectResolution(res);
          }}
          disabled={customSize.active}
          className="w-full bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-200 text-sm rounded-lg focus:ring-teal-500 focus:border-teal-500 block p-2.5 disabled:opacity-50 disabled:bg-stone-100 dark:disabled:bg-stone-900"
        >
          {filteredResolutions.map(d => (
            <option key={d.id} value={d.id}>
              {lang === 'zh' && d.name_zh ? d.name_zh : d.name} ({d.width}x{d.height})
            </option>
          ))}
        </select>
      </div>

      <div className="p-4 bg-stone-50 dark:bg-stone-800/50 rounded-lg border border-stone-200 dark:border-stone-700">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-stone-700 dark:text-stone-300">{t.customRes}</label>
          <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
            <input 
              type="checkbox" 
              name="toggle" 
              id="custom-size-toggle" 
              checked={customSize.active}
              onChange={(e) => onCustomSizeChange({ ...customSize, active: e.target.checked })}
              className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer checked:right-0 right-5 border-stone-300 dark:border-stone-600"
              style={{ right: customSize.active ? '0' : '50%' }}
            />
            <label 
              htmlFor="custom-size-toggle" 
              className={`toggle-label block overflow-hidden h-5 rounded-full cursor-pointer ${customSize.active ? 'bg-teal-600' : 'bg-stone-300 dark:bg-stone-600'}`}
            ></label>
          </div>
        </div>
        
        {customSize.active && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-stone-500 mb-1">{t.width} (px)</label>
              <input
                type="number"
                value={customSize.width}
                onChange={(e) => onCustomSizeChange({ ...customSize, width: Number(e.target.value) })}
                className="w-full bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-600 text-stone-900 dark:text-stone-200 text-sm rounded px-2 py-1 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-stone-500 mb-1">{t.height} (px)</label>
              <input
                type="number"
                value={customSize.height}
                onChange={(e) => onCustomSizeChange({ ...customSize, height: Number(e.target.value) })}
                className="w-full bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-600 text-stone-900 dark:text-stone-200 text-sm rounded px-2 py-1 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlatformSelector;
