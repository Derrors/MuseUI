import React from 'react';
import { CoverImageConfig, LangType } from '../../types';
import DesignMdSelector, { SelectorOption } from '../DesignMdSelector';
import { Text, TextFieldControl } from '../ui';

interface Props {
  config: CoverImageConfig;
  onChange: (config: CoverImageConfig) => void;
  lang: LangType;
}

const toOptions = (arr: any[]): SelectorOption[] => arr.map(t => ({
  id: t.id, name: t.name, name_zh: t.name_zh,
  description: t.description || '', description_zh: t.description_zh || '',
  content: t.promptModifier || ''
}));

const COVER_TYPES = [
  { id: 'hero', name: 'Hero', name_zh: '主视觉', description: 'Bold focal point', promptModifier: '' },
  { id: 'conceptual', name: 'Conceptual', name_zh: '概念型', description: 'Abstract idea visualization', promptModifier: '' },
  { id: 'typography', name: 'Typography', name_zh: '文字型', description: 'Text as main element', promptModifier: '' },
  { id: 'metaphor', name: 'Metaphor', name_zh: '隐喻型', description: 'Visual metaphor', promptModifier: '' },
  { id: 'scene', name: 'Scene', name_zh: '场景型', description: 'Environmental scene', promptModifier: '' },
  { id: 'minimal', name: 'Minimal', name_zh: '极简型', description: 'Ultra minimal', promptModifier: '' },
];

const COVER_PALETTES = [
  { id: 'warm', name: 'Warm', name_zh: '暖色', description: 'Orange, gold, terracotta', promptModifier: '' },
  { id: 'elegant', name: 'Elegant', name_zh: '优雅', description: 'Sophisticated muted', promptModifier: '' },
  { id: 'cool', name: 'Cool', name_zh: '冷色', description: 'Blue, teal, gray', promptModifier: '' },
  { id: 'dark', name: 'Dark', name_zh: '暗色', description: 'Deep, moody', promptModifier: '' },
  { id: 'earth', name: 'Earth', name_zh: '大地', description: 'Natural tones', promptModifier: '' },
  { id: 'vivid', name: 'Vivid', name_zh: '鲜艳', description: 'High saturation', promptModifier: '' },
  { id: 'pastel', name: 'Pastel', name_zh: ' pastel', description: 'Soft pastels', promptModifier: '' },
  { id: 'mono', name: 'Mono', name_zh: '单色', description: 'Black and white', promptModifier: '' },
  { id: 'retro', name: 'Retro', name_zh: '复古', description: 'Vintage tones', promptModifier: '' },
];

const COVER_RENDERINGS = [
  { id: 'flat-vector', name: 'Flat Vector', name_zh: '扁平矢量', description: 'Clean vector art', promptModifier: '' },
  { id: 'hand-drawn', name: 'Hand Drawn', name_zh: '手绘', description: 'Organic hand drawn', promptModifier: '' },
  { id: 'painterly', name: 'Painterly', name_zh: '油画', description: 'Brush strokes', promptModifier: '' },
  { id: 'digital', name: 'Digital', name_zh: '数字', description: 'Digital art', promptModifier: '' },
  { id: 'pixel', name: 'Pixel', name_zh: '像素', description: 'Pixel art', promptModifier: '' },
  { id: 'chalk', name: 'Chalk', name_zh: '粉笔', description: 'Chalk texture', promptModifier: '' },
];

const COVER_TEXTS = [
  { id: 'none', name: 'No Text', name_zh: '纯视觉', description: 'Visual only', promptModifier: '' },
  { id: 'title-only', name: 'Title Only', name_zh: '仅标题', description: 'Main title', promptModifier: '' },
  { id: 'title-subtitle', name: 'Title + Subtitle', name_zh: '标题+副标题', description: 'Two levels', promptModifier: '' },
  { id: 'text-rich', name: 'Text Rich', name_zh: '丰富文字', description: 'Tags and labels', promptModifier: '' },
];

const COVER_MOODS = [
  { id: 'subtle', name: 'Subtle', name_zh: '柔和', description: 'Low contrast', promptModifier: '' },
  { id: 'balanced', name: 'Balanced', name_zh: '平衡', description: 'Medium contrast', promptModifier: '' },
  { id: 'bold', name: 'Bold', name_zh: '强烈', description: 'High contrast', promptModifier: '' },
];

const COVER_FONTS = [
  { id: 'clean', name: 'Clean', name_zh: '简洁', description: 'Sans-serif', promptModifier: '' },
  { id: 'handwritten', name: 'Handwritten', name_zh: '手写', description: 'Script style', promptModifier: '' },
  { id: 'serif', name: 'Serif', name_zh: '衬线', description: 'Classic serif', promptModifier: '' },
  { id: 'display', name: 'Display', name_zh: '装饰', description: 'Bold decorative', promptModifier: '' },
];

const COVER_ASPECTS = [
  { id: '16:9', name: '16:9 Widescreen', name_zh: '16:9 宽屏' },
  { id: '2.35:1', name: '2.35:1 Cinematic', name_zh: '2.35:1 电影' },
  { id: '4:3', name: '4:3 Standard', name_zh: '4:3 标准' },
  { id: '3:2', name: '3:2 Photo', name_zh: '3:2 照片' },
  { id: '1:1', name: '1:1 Square', name_zh: '1:1 方形' },
  { id: '3:4', name: '3:4 Portrait', name_zh: '3:4 竖版' },
];

export const CoverImagePanel: React.FC<Props> = ({ config, onChange, lang }) => {
  const update = (partial: Partial<CoverImageConfig>) => {
    onChange({ ...config, ...partial });
  };

  return (
    <div className="space-y-4">
      <DesignMdSelector
        selectedId={config.type}
        onSelect={(id: string | null) => id && update({ type: id as any })}
        lang={lang}
        options={toOptions(COVER_TYPES)}
        label="Type" label_zh="类型"
        showPreview={false} showClear={false} confirmOnSelect
        favoritesKey="skill-cover-type"
      />

      <DesignMdSelector
        selectedId={config.palette}
        onSelect={(id: string | null) => id && update({ palette: id as any })}
        lang={lang}
        options={toOptions(COVER_PALETTES)}
        label="Palette" label_zh="色板"
        showPreview={false} showClear={false} confirmOnSelect
        favoritesKey="skill-cover-palette"
      />

      <DesignMdSelector
        selectedId={config.rendering}
        onSelect={(id: string | null) => id && update({ rendering: id as any })}
        lang={lang}
        options={toOptions(COVER_RENDERINGS)}
        label="Rendering" label_zh="渲染风格"
        showPreview={false} showClear={false} confirmOnSelect
        favoritesKey="skill-cover-rendering"
      />

      <DesignMdSelector
        selectedId={config.text}
        onSelect={(id: string | null) => id && update({ text: id as any })}
        lang={lang}
        options={toOptions(COVER_TEXTS)}
        label="Text Level" label_zh="文字层级"
        showPreview={false} showClear={false} confirmOnSelect
        favoritesKey="skill-cover-text"
      />

      {(config.text === 'title-only' || config.text === 'title-subtitle' || config.text === 'text-rich') && (
        <div className="space-y-2">
          <Text as="label" size="1" weight="bold" color="gray">
            {lang === 'zh' ? '标题' : 'Title'}
          </Text>
          <TextFieldControl
            value={config.title}
            onValueChange={(value) => update({ title: value })}
            placeholder={lang === 'zh' ? '输入封面标题...' : 'Enter cover title...'}
          />
          {config.text === 'title-subtitle' && (
            <TextFieldControl
              value={config.subtitle}
              onValueChange={(value) => update({ subtitle: value })}
              placeholder={lang === 'zh' ? '副标题...' : 'Subtitle...'}
            />
          )}
        </div>
      )}

      <DesignMdSelector
        selectedId={config.mood}
        onSelect={(id: string | null) => id && update({ mood: id as any })}
        lang={lang}
        options={toOptions(COVER_MOODS)}
        label="Mood" label_zh="氛围"
        showPreview={false} showClear={false} confirmOnSelect
        favoritesKey="skill-cover-mood"
      />

      <DesignMdSelector
        selectedId={config.font}
        onSelect={(id: string | null) => id && update({ font: id as any })}
        lang={lang}
        options={toOptions(COVER_FONTS)}
        label="Font" label_zh="字体"
        showPreview={false} showClear={false} confirmOnSelect
        favoritesKey="skill-cover-font"
      />

      <DesignMdSelector
        selectedId={config.aspect}
        onSelect={(id: string | null) => id && update({ aspect: id as any })}
        lang={lang}
        options={toOptions(COVER_ASPECTS)}
        label="Aspect Ratio" label_zh="宽高比"
        showPreview={false} showClear={false} confirmOnSelect
        favoritesKey="skill-cover-aspect"
      />
    </div>
  );
};
