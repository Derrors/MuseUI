
import React from 'react';
import { MEDIA_ASPECT_RATIOS, MEDIA_RESOLUTIONS, MEDIA_TYPES } from '../constants';
import { LangType, MediaAspectRatio, MediaResolutionPreset, MediaType } from '../types';
import { Card, SelectField, SwitchField, Text, TextFieldControl } from './ui';

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
        <Text as="label" size="2" weight="medium" color="gray">
          {isZh ? '画面比例' : 'Aspect Ratio'}
        </Text>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {MEDIA_ASPECT_RATIOS.map(r => (
            <button
              key={r.id}
              onClick={() => onAspectRatioChange(r.id)}
              className={`min-h-14 flex flex-col items-center justify-center p-2 rounded-lg border transition-all ${
                aspectRatio === r.id
                  ? 'bg-[var(--accent-3)] border-[var(--accent-8)] text-[var(--accent-11)]'
                  : 'bg-[var(--color-panel-solid)] border-[var(--gray-5)] text-[var(--gray-11)] hover:border-[var(--gray-8)]'
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
        <SelectField
          label={isZh ? '分辨率' : 'Resolution'}
          value={resolution.id}
          onValueChange={(value) => {
            const res = filteredResolutions.find(r => r.id === value);
            if (res) onResolutionChange(res);
          }}
          disabled={customSize.active}
          options={filteredResolutions.map(r => ({
            value: r.id,
            label: `${isZh ? r.name_zh : r.name} (${r.width}x${r.height})`,
          }))}
        />
      </div>

      {/* Custom Size */}
      <Card>
        <SwitchField
          label={isZh ? '自定义尺寸' : 'Custom Size'}
          checked={customSize.active}
          onCheckedChange={(checked) => onCustomSizeChange({ ...customSize, active: checked })}
        />
        {customSize.active && (
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <TextFieldControl
              label={`${isZh ? '宽' : 'W'} (px)`}
              type="number"
              value={customSize.width}
              onValueChange={(value) => onCustomSizeChange({ ...customSize, width: Number(value) })}
            />
            <TextFieldControl
              label={`${isZh ? '高' : 'H'} (px)`}
              type="number"
              value={customSize.height}
              onValueChange={(value) => onCustomSizeChange({ ...customSize, height: Number(value) })}
            />
          </div>
        )}
      </Card>

      <div className="h-px bg-stone-100 dark:bg-stone-800" />

      {/* Media Type */}
      <div>
        <Text as="label" size="2" weight="medium" color="gray">
          {isZh ? '内容类型' : 'Content Type'}
        </Text>
        <div className="grid grid-cols-2 gap-1.5">
          {MEDIA_TYPES.map(t => (
            <button
              key={t.id}
              onClick={() => onMediaTypeChange(t.id)}
              className={`px-3 py-2 rounded-lg border text-xs font-medium transition-all text-left ${
                mediaType === t.id
                  ? 'bg-[var(--accent-3)] border-[var(--accent-8)] text-[var(--accent-11)]'
                  : 'bg-[var(--color-panel-solid)] border-[var(--gray-5)] text-[var(--gray-11)] hover:border-[var(--gray-8)]'
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
  const color = active ? 'stroke-[var(--accent-10)]' : 'stroke-current';
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
