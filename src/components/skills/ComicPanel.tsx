import React from 'react';
import { ComicConfig, LangType } from '../../types';
import DesignMdSelector, { SelectorOption } from '../DesignMdSelector';
import { Text } from '../ui';

interface Props {
  config: ComicConfig;
  onChange: (config: ComicConfig) => void;
  lang: LangType;
}

const toOptions = (arr: any[]): SelectorOption[] => arr.map(t => ({
  id: t.id, name: t.name, name_zh: t.name_zh,
  description: t.description || '', description_zh: t.description_zh || '',
  content: t.promptModifier || ''
}));

const COMIC_ARTS = [
  { id: 'ligne-claire', name: 'Ligne Claire', name_zh: '清线', description: 'Uniform lines, flat colors', promptModifier: '' },
  { id: 'manga', name: 'Manga', name_zh: '日漫', description: 'Large eyes, expressive', promptModifier: '' },
  { id: 'realistic', name: 'Realistic', name_zh: '写实', description: 'Digital painting', promptModifier: '' },
  { id: 'ink-brush', name: 'Ink Brush', name_zh: '水墨', description: 'Chinese brush strokes', promptModifier: '' },
  { id: 'chalk', name: 'Chalk', name_zh: '粉笔', description: 'Chalkboard aesthetic', promptModifier: '' },
];

const COMIC_TONES = [
  { id: 'neutral', name: 'Neutral', name_zh: '中性', description: 'Balanced, educational', promptModifier: '' },
  { id: 'warm', name: 'Warm', name_zh: '温馨', description: 'Nostalgic, personal', promptModifier: '' },
  { id: 'dramatic', name: 'Dramatic', name_zh: '戏剧', description: 'High contrast, intense', promptModifier: '' },
  { id: 'romantic', name: 'Romantic', name_zh: '浪漫', description: 'Soft, beautiful', promptModifier: '' },
  { id: 'energetic', name: 'Energetic', name_zh: '活力', description: 'Bright, dynamic', promptModifier: '' },
  { id: 'vintage', name: 'Vintage', name_zh: '复古', description: 'Historical, aged', promptModifier: '' },
  { id: 'action', name: 'Action', name_zh: '动作', description: 'Speed lines, impact', promptModifier: '' },
];

const COMIC_LAYOUTS = [
  { id: 'standard', name: 'Standard', name_zh: '标准', description: 'Regular grid', promptModifier: '' },
  { id: 'cinematic', name: 'Cinematic', name_zh: '电影感', description: 'Wide panels', promptModifier: '' },
  { id: 'dense', name: 'Dense', name_zh: '高密度', description: 'Many panels', promptModifier: '' },
  { id: 'splash', name: 'Splash', name_zh: '跨页', description: 'Full page spread', promptModifier: '' },
  { id: 'mixed', name: 'Mixed', name_zh: '混合', description: 'Varied layouts', promptModifier: '' },
  { id: 'webtoon', name: 'Webtoon', name_zh: '条漫', description: 'Vertical scroll', promptModifier: '' },
];

const COMIC_PRESETS = [
  { id: 'custom', name: 'Custom', name_zh: '自定义', description: 'Manual art + tone', promptModifier: '' },
  { id: 'ohmsha', name: 'Ohmsha', name_zh: '欧姆社', description: 'Educational manga', promptModifier: '' },
  { id: 'wuxia', name: 'Wuxia', name_zh: '武侠', description: 'Martial arts', promptModifier: '' },
  { id: 'shoujo', name: 'Shoujo', name_zh: '少女', description: 'Romance manga', promptModifier: '' },
];

const COMIC_ASPECTS = [
  { id: '3:4', name: 'Portrait', name_zh: '竖版', description: 'Manga standard', promptModifier: '' },
  { id: '4:3', name: 'Landscape', name_zh: '横版', description: 'Western comics', promptModifier: '' },
  { id: '16:9', name: 'Widescreen', name_zh: '宽屏', description: 'Cinematic', promptModifier: '' },
];

export const ComicPanel: React.FC<Props> = ({ config, onChange, lang }) => {
  const update = (partial: Partial<ComicConfig>) => {
    onChange({ ...config, ...partial });
  };

  return (
    <div className="space-y-4">
      <DesignMdSelector
        selectedId={config.preset}
        onSelect={(id: string | null) => id && update({ preset: id as any })}
        lang={lang}
        options={toOptions(COMIC_PRESETS)}
        label="Preset" label_zh="预设风格"
        showPreview={false} showClear={false} confirmOnSelect
        favoritesKey="skill-comic-preset"
      />

      {config.preset === 'custom' && (
        <>
          <DesignMdSelector
            selectedId={config.art}
            onSelect={(id: string | null) => id && update({ art: id as any })}
            lang={lang}
            options={toOptions(COMIC_ARTS)}
            label="Art Style" label_zh="画风"
            showPreview={false} showClear={false} confirmOnSelect
            favoritesKey="skill-comic-art"
          />

          <DesignMdSelector
            selectedId={config.tone}
            onSelect={(id: string | null) => id && update({ tone: id as any })}
            lang={lang}
            options={toOptions(COMIC_TONES)}
            label="Tone" label_zh="基调"
            showPreview={false} showClear={false} confirmOnSelect
            favoritesKey="skill-comic-tone"
          />
        </>
      )}

      <DesignMdSelector
        selectedId={config.layout}
        onSelect={(id: string | null) => id && update({ layout: id as any })}
        lang={lang}
        options={toOptions(COMIC_LAYOUTS)}
        label="Layout" label_zh="排版"
        showPreview={false} showClear={false} confirmOnSelect
        favoritesKey="skill-comic-layout"
      />

      <DesignMdSelector
        selectedId={config.aspect}
        onSelect={(id: string | null) => id && update({ aspect: id as any })}
        lang={lang}
        options={toOptions(COMIC_ASPECTS)}
        label="Aspect" label_zh="宽高比"
        showPreview={false} showClear={false} confirmOnSelect
        favoritesKey="skill-comic-aspect"
      />

      <div className="space-y-2">
        <Text as="label" size="1" weight="bold" color="gray">
          {lang === 'zh' ? '页数' : 'Page Count'}
        </Text>
        <input
          type="range"
          min={3}
          max={20}
          value={config.pageCount}
          onChange={(e) => update({ pageCount: parseInt(e.target.value) })}
          className="w-full accent-[var(--accent-9)]"
        />
        <div className="flex justify-between text-[10px] text-stone-400">
          <span>3</span>
          <span className="font-bold text-[var(--accent-11)]">{config.pageCount}</span>
          <span>20</span>
        </div>
      </div>
    </div>
  );
};
