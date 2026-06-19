
import React from 'react';
import { MEDIA_ASPECT_RATIOS, MEDIA_RESOLUTIONS, MEDIA_TYPES } from '../constants';
import { LangType, MediaAspectRatio, MediaResolutionPreset, MediaType } from '../types';

interface Props {
  aspectRatio: MediaAspectRatio;
  resolution: MediaResolutionPreset;
  mediaType: MediaType;
  onAspectRatioChange: (r: MediaAspectRatio) => void;
  onResolutionChange: (r: MediaResolutionPreset) => void;
  onMediaTypeChange: (t: MediaType) => void;
  customSize: { width: number; height: number; active: boolean };
  onCustomSizeChange: (s: { width: number; height: number; active: boolean }) => void;
  lang: LangType;
}

const MediaSelector: React.FC<Props> = ({
  aspectRatio, resolution, mediaType,
  onAspectRatioChange, onResolutionChange, onMediaTypeChange,
  customSize, onCustomSizeChange, lang
}) => {
  const filteredResolutions = MEDIA_RESOLUTIONS.filter(r => r.ratio === aspectRatio);
  const isZh = lang === 'zh';

  return (
    <div className="space-y-5">
      {/* Aspect Ratio */}
      <div>
        <label className="block text-sm font-medium text-stone-600 dark:text-stone-400 mb-2">
          {isZh ? '画面比例' : 'Aspect Ratio'}
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {MEDIA_ASPECT_RATIOS.map(r => (
            <button
              key={r.id}
              onClick={() => onAspectRatioChange(r.id)}
              className={`min-h-14 flex flex-col items-center justify-center p-2 rounded-lg border transition-all ${
                aspectRatio === r.id
                  ? 'bg-teal-50 dark:bg-teal-500/10 border-teal-500 text-teal-600 dark:text-teal-300'
                  : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 hover:border-stone-400 dark:hover:border-stone-600'
              }`}
            >
              <RatioIcon ratio={r.id} active={aspectRatio === r.id} />
              <span className="text-[10px] font-semibold mt-1">{r.id}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Resolution */}
      <div>
        <label className="block text-sm font-medium text-stone-600 dark:text-stone-400 mb-2">
          {isZh ? '分辨率' : 'Resolution'}
        </label>
        <select
          value={resolution.id}
          onChange={(e) => {
            const res = filteredResolutions.find(r => r.id === e.target.value);
            if (res) onResolutionChange(res);
          }}
          disabled={customSize.active}
          className="w-full bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-200 text-sm rounded-lg focus:ring-teal-500 focus:border-teal-500 block p-2.5 disabled:opacity-50"
        >
          {filteredResolutions.map(r => (
            <option key={r.id} value={r.id}>
              {isZh ? r.name_zh : r.name} ({r.width}x{r.height})
            </option>
          ))}
        </select>
      </div>

      {/* Custom Size */}
      <div className="p-3 bg-stone-50 dark:bg-stone-800/50 rounded-lg border border-stone-200 dark:border-stone-700">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-stone-700 dark:text-stone-300">
            {isZh ? '自定义尺寸' : 'Custom Size'}
          </label>
          <div className="relative inline-block w-10 mr-2 align-middle select-none">
            <input
              type="checkbox"
              id="media-custom-toggle"
              checked={customSize.active}
              onChange={(e) => onCustomSizeChange({ ...customSize, active: e.target.checked })}
              className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer checked:right-0 right-5 border-stone-300 dark:border-stone-600"
              style={{ right: customSize.active ? '0' : '50%' }}
            />
            <label
              htmlFor="media-custom-toggle"
              className={`toggle-label block overflow-hidden h-5 rounded-full cursor-pointer ${customSize.active ? 'bg-teal-600' : 'bg-stone-300 dark:bg-stone-600'}`}
            />
          </div>
        </div>
        {customSize.active && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-stone-500 mb-1">{isZh ? '宽' : 'W'} (px)</label>
              <input type="number" value={customSize.width}
                onChange={(e) => onCustomSizeChange({ ...customSize, width: Number(e.target.value) })}
                className="w-full bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-600 text-stone-900 dark:text-stone-200 text-sm rounded px-2 py-1 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-stone-500 mb-1">{isZh ? '高' : 'H'} (px)</label>
              <input type="number" value={customSize.height}
                onChange={(e) => onCustomSizeChange({ ...customSize, height: Number(e.target.value) })}
                className="w-full bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-600 text-stone-900 dark:text-stone-200 text-sm rounded px-2 py-1 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
              />
            </div>
          </div>
        )}
      </div>

      <div className="h-px bg-stone-100 dark:bg-stone-800" />

      {/* Media Type */}
      <div>
        <label className="block text-sm font-medium text-stone-600 dark:text-stone-400 mb-2">
          {isZh ? '内容类型' : 'Content Type'}
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {MEDIA_TYPES.map(t => (
            <button
              key={t.id}
              onClick={() => onMediaTypeChange(t.id)}
              className={`px-3 py-2 rounded-lg border text-xs font-medium transition-all text-left ${
                mediaType === t.id
                  ? 'bg-teal-50 dark:bg-teal-500/10 border-teal-500 text-teal-600 dark:text-teal-300'
                  : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:border-stone-400 dark:hover:border-stone-600'
              }`}
            >
              {isZh ? t.name_zh : t.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const RatioIcon: React.FC<{ ratio: MediaAspectRatio; active: boolean }> = ({ ratio, active }) => {
  const dims: Record<MediaAspectRatio, [number, number]> = {
    '1:1': [16, 16],
    '3:4': [12, 16],
    '4:3': [16, 12],
    '9:16': [9, 16],
    '16:9': [16, 9],
    '2:3': [11, 16],
    '3:2': [16, 11],
  };
  const [w, h] = dims[ratio];
  const color = active ? 'stroke-teal-500' : 'stroke-current';
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className={color}>
      <rect
        x={(24 - w) / 2} y={(24 - h) / 2}
        width={w} height={h}
        rx="2" strokeWidth="1.5"
      />
    </svg>
  );
};

export default MediaSelector;
