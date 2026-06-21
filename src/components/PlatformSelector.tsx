
import React from 'react';
import { PLATFORMS, RESOLUTION_PRESETS, I18N } from '../constants';
import { PlatformType, ResolutionPreset, LangType } from '../types';
import { Card, SelectField, SwitchField, Text, TextFieldControl } from './ui';

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
        <Text as="label" size="2" weight="medium" color="gray">{t.platform}</Text>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {PLATFORMS.map((p) => (
            <button
              key={p.id}
              onClick={() => onSelectPlatform(p.id)}
              className={`mt-2 min-h-16 flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${
                selectedPlatform === p.id
                  ? 'bg-[var(--accent-3)] border-[var(--accent-8)] text-[var(--accent-11)]'
                  : 'bg-[var(--color-panel-solid)] border-[var(--gray-5)] text-[var(--gray-11)] hover:border-[var(--gray-8)]'
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
        <SelectField
          label={t.resolution}
          value={selectedResolution.id}
          onValueChange={(value) => {
            const res = filteredResolutions.find(d => d.id === value);
            if (res) onSelectResolution(res);
          }}
          disabled={customSize.active}
          options={filteredResolutions.map(d => ({
            value: d.id,
            label: `${lang === 'zh' && d.name_zh ? d.name_zh : d.name} (${d.width}x${d.height})`,
          }))}
        />
      </div>

      <Card>
        <SwitchField
          label={t.customRes}
          checked={customSize.active}
          onCheckedChange={(checked) => onCustomSizeChange({ ...customSize, active: checked })}
        />
        
        {customSize.active && (
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <TextFieldControl
                label={`${t.width} (px)`}
                value={customSize.width}
                type="number"
                onValueChange={(value) => onCustomSizeChange({ ...customSize, width: Number(value) })}
              />
              <TextFieldControl
                label={`${t.height} (px)`}
                value={customSize.height}
                type="number"
                onValueChange={(value) => onCustomSizeChange({ ...customSize, height: Number(value) })}
              />
          </div>
        )}
      </Card>
    </div>
  );
};

export default PlatformSelector;
