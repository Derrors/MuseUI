import React from 'react';
import { LogoConfig, LangType } from '../../types';
import DesignMdSelector, { SelectorOption } from '../DesignMdSelector';
import { Text, TextFieldControl } from '../ui';

interface Props {
  config: LogoConfig;
  onChange: (config: LogoConfig) => void;
  lang: LangType;
}

const toOptions = (arr: any[]): SelectorOption[] => arr.map(t => ({
  id: t.id, name: t.name, name_zh: t.name_zh,
  description: t.description || '', description_zh: t.description_zh || '',
  content: t.promptModifier || ''
}));

const LOGO_TYPES = [
  { id: 'wordmark', name: 'Wordmark', name_zh: '文字标识', description: 'Brand name as logo' },
  { id: 'lettermark', name: 'Lettermark', name_zh: '字母标识', description: 'Initials / monogram' },
  { id: 'icon', name: 'Icon', name_zh: '图标标识', description: 'Standalone symbol' },
  { id: 'combination', name: 'Combination', name_zh: '组合标识', description: 'Icon + text lockup' },
  { id: 'emblem', name: 'Emblem', name_zh: '徽章标识', description: 'Text in shape' },
  { id: 'mascot', name: 'Mascot', name_zh: '吉祥物', description: 'Character logo' },
  { id: 'abstract', name: 'Abstract', name_zh: '抽象标识', description: 'Geometric form' },
];

const LOGO_STYLES = [
  { id: 'flat', name: 'Flat', name_zh: '扁平', description: 'Solid fills, no effects' },
  { id: 'gradient', name: 'Gradient', name_zh: '渐变', description: 'Color transitions' },
  { id: '3d', name: '3D', name_zh: '立体', description: 'Lighting & depth' },
  { id: 'line-art', name: 'Line Art', name_zh: '线条', description: 'Outlines only' },
  { id: 'geometric', name: 'Geometric', name_zh: '几何', description: 'Precise primitives' },
  { id: 'hand-drawn', name: 'Hand-Drawn', name_zh: '手绘', description: 'Organic strokes' },
  { id: 'vintage', name: 'Vintage', name_zh: '复古', description: 'Retro & distressed' },
  { id: 'pixel', name: 'Pixel', name_zh: '像素', description: 'Pixel art style' },
];

const LOGO_PALETTES = [
  { id: 'monochrome', name: 'Monochrome', name_zh: '单色', description: 'Black/white or single color' },
  { id: 'dual-tone', name: 'Dual Tone', name_zh: '双色', description: 'Two colors + white' },
  { id: 'colorful', name: 'Colorful', name_zh: '多彩', description: '3-5 distinct colors' },
  { id: 'gradient-colors', name: 'Gradient', name_zh: '渐变色', description: 'Smooth blends' },
  { id: 'earth-tones', name: 'Earth', name_zh: '大地色', description: 'Natural warm tones' },
  { id: 'pastel', name: 'Pastel', name_zh: '柔和色', description: 'Soft desaturated' },
  { id: 'bold-contrast', name: 'Bold', name_zh: '高对比', description: 'High saturation' },
];

const LOGO_INDUSTRIES = [
  { id: 'tech', name: 'Tech', name_zh: '科技', description: 'Software / SaaS' },
  { id: 'food', name: 'Food', name_zh: '餐饮', description: 'Restaurant / F&B' },
  { id: 'fashion', name: 'Fashion', name_zh: '时尚', description: 'Apparel / beauty' },
  { id: 'sports', name: 'Sports', name_zh: '运动', description: 'Fitness / outdoor' },
  { id: 'education', name: 'Education', name_zh: '教育', description: 'School / training' },
  { id: 'health', name: 'Health', name_zh: '健康', description: 'Medical / wellness' },
  { id: 'finance', name: 'Finance', name_zh: '金融', description: 'Banking / insurance' },
  { id: 'creative', name: 'Creative', name_zh: '创意', description: 'Design / art / media' },
  { id: 'eco', name: 'Eco', name_zh: '环保', description: 'Green / sustainable' },
  { id: 'general', name: 'General', name_zh: '通用', description: 'No specific industry' },
];

const LOGO_MOODS = [
  { id: 'playful', name: 'Playful', name_zh: '活泼', description: 'Fun & youthful' },
  { id: 'professional', name: 'Professional', name_zh: '专业', description: 'Reliable & trustworthy' },
  { id: 'elegant', name: 'Elegant', name_zh: '优雅', description: 'Refined & premium' },
  { id: 'bold', name: 'Bold', name_zh: '大胆', description: 'Strong & impactful' },
  { id: 'minimal', name: 'Minimal', name_zh: '极简', description: 'Restrained & clean' },
  { id: 'friendly', name: 'Friendly', name_zh: '友好', description: 'Warm & approachable' },
];

const LOGO_SIZES = [
  { id: '1:1', label: '1:1' },
  { id: '4:3', label: '4:3' },
  { id: '16:9', label: '16:9' },
  { id: '3:4', label: '3:4' },
  { id: '2:1', label: '2:1' },
];

export const LogoPanel: React.FC<Props> = ({ config, onChange, lang }) => {
  const update = (partial: Partial<LogoConfig>) => {
    onChange({ ...config, ...partial });
  };

  const isZh = lang === 'zh';

  return (
    <div className="space-y-4">
      {/* Brand Name */}
      <div>
        <TextFieldControl
          label={isZh ? '品牌名称' : 'Brand Name'}
          value={config.brandName}
          onValueChange={(value) => update({ brandName: value })}
          placeholder={isZh ? '输入品牌名称...' : 'Enter brand name...'}
        />
      </div>

      {/* Slogan */}
      <div>
        <TextFieldControl
          label={isZh ? '标语（可选）' : 'Slogan (optional)'}
          value={config.slogan}
          onValueChange={(value) => update({ slogan: value })}
          placeholder={isZh ? '输入品牌标语...' : 'Enter brand slogan...'}
        />
      </div>

      {/* Logo Type */}
      <DesignMdSelector
        selectedId={config.type}
        onSelect={(id) => update({ type: id as any })}
        lang={lang}
        options={toOptions(LOGO_TYPES)}
        label="Logo Type"
        label_zh="Logo 类型"
        favoritesKey="logo-type-favorites"
      />

      {/* Visual Style */}
      <DesignMdSelector
        selectedId={config.style}
        onSelect={(id) => update({ style: id as any })}
        lang={lang}
        options={toOptions(LOGO_STYLES)}
        label="Visual Style"
        label_zh="视觉风格"
        favoritesKey="logo-style-favorites"
      />

      {/* Color Palette */}
      <DesignMdSelector
        selectedId={config.palette}
        onSelect={(id) => update({ palette: id as any })}
        lang={lang}
        options={toOptions(LOGO_PALETTES)}
        label="Color Palette"
        label_zh="配色方案"
        favoritesKey="logo-palette-favorites"
      />

      {/* Industry */}
      <DesignMdSelector
        selectedId={config.industry}
        onSelect={(id) => update({ industry: id as any })}
        lang={lang}
        options={toOptions(LOGO_INDUSTRIES)}
        label="Industry"
        label_zh="行业场景"
        favoritesKey="logo-industry-favorites"
      />

      {/* Mood */}
      <DesignMdSelector
        selectedId={config.mood}
        onSelect={(id) => update({ mood: id as any })}
        lang={lang}
        options={toOptions(LOGO_MOODS)}
        label="Mood"
        label_zh="气质调性"
        favoritesKey="logo-mood-favorites"
      />

      {/* Size */}
      <div>
        <Text as="label" size="1" weight="bold" color="gray">
          {isZh ? '尺寸' : 'Size'}
        </Text>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
          {LOGO_SIZES.map((s) => (
            <button
              key={s.id}
              onClick={() => update({ size: s.id as any })}
              className={`min-h-10 px-2 py-1.5 text-xs rounded-lg border transition-colors ${
                config.size === s.id
                  ? 'border-[var(--accent-8)] bg-[var(--accent-3)] text-[var(--accent-11)]'
                  : 'border-[var(--gray-5)] text-[var(--gray-11)] hover:border-[var(--gray-8)]'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
