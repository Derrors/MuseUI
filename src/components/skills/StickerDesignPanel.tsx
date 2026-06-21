import React from 'react';
import { StickerDesignConfig, LangType } from '../../types';
import DesignMdSelector, { SelectorOption } from '../DesignMdSelector';
import { Text, TextFieldControl } from '../ui';

interface Props {
  config: StickerDesignConfig;
  onChange: (config: StickerDesignConfig) => void;
  lang: LangType;
}

const toOptions = (arr: any[]): SelectorOption[] => arr.map(t => ({
  id: t.id, name: t.name, name_zh: t.name_zh,
  description: t.description || '', description_zh: t.description_zh || '',
  content: t.promptModifier || ''
}));

const STICKER_STYLES = [
  { id: 'flat', name: 'Flat Illustration', name_zh: '扁平插画', description: 'Minimalist flat with thick white borders' },
  { id: 'chibi', name: 'Chibi / Kawaii', name_zh: 'Q版萌系', description: 'Cute oversized head, big eyes' },
  { id: 'puffy-3d', name: 'Puffy 3D', name_zh: '立体膨胀', description: '3D inflated with glossy highlights' },
  { id: 'enamel-pin', name: 'Enamel Pin', name_zh: '珐琅别针', description: 'Hard enamel with metallic outlines' },
  { id: 'chrome-badge', name: 'Chrome Badge', name_zh: '镀铬徽章', description: 'Futuristic chrome metallic finish' },
  { id: 'die-cut', name: 'Die-Cut Vinyl', name_zh: '模切 Vinyl', description: 'Bold outlines, street art style' },
  { id: 'vintage', name: 'Vintage Retro', name_zh: '复古怀旧', description: 'Distressed textures, retro colors' },
];

const STICKER_SHAPES = [
  { id: 'custom', name: 'Custom Shape', name_zh: '自定义形状', description: 'Follows natural contour' },
  { id: 'circle', name: 'Circle', name_zh: '圆形', description: 'Perfect circular format' },
  { id: 'square', name: 'Square', name_zh: '方形', description: 'Clean square with sharp corners' },
  { id: 'rounded', name: 'Rounded Rectangle', name_zh: '圆角矩形', description: 'Soft rounded corners' },
  { id: 'star', name: 'Star', name_zh: '星形', description: 'Star-shaped for highlights' },
  { id: 'heart', name: 'Heart', name_zh: '心形', description: 'Heart-shaped for affection' },
];

const STICKER_THEMES = [
  { id: 'character', name: 'Character', name_zh: '角色', description: 'A specific character or persona' },
  { id: 'emoji', name: 'Emoji / Expression', name_zh: '表情符号', description: 'Emotional reactions and moods' },
  { id: 'text-quote', name: 'Text / Quote', name_zh: '文字语录', description: 'Typography-based with slogans' },
  { id: 'object', name: 'Object / Item', name_zh: '物品物件', description: 'Everyday objects stylized' },
  { id: 'animal', name: 'Animal', name_zh: '动物', description: 'Cute or stylized animals' },
  { id: 'food', name: 'Food', name_zh: '食物', description: 'Appetizing food illustrations' },
  { id: 'nature', name: 'Nature', name_zh: '自然', description: 'Plants, flowers, celestial' },
];

const STICKER_SIZES = [
  { id: 'small', name: 'Small (1-2")', name_zh: '小型 (2.5-5cm)', description: 'Compact for phone cases' },
  { id: 'medium', name: 'Medium (2-3")', name_zh: '中型 (5-7.5cm)', description: 'Standard for laptops' },
  { id: 'large', name: 'Large (3-4")', name_zh: '大型 (7.5-10cm)', description: 'Statement size' },
  { id: 'sheet', name: 'Sticker Sheet', name_zh: '贴纸集合', description: 'Multiple stickers on one page' },
];

const STICKER_BACKGROUNDS = [
  { id: 'transparent', name: 'Transparent', name_zh: '透明背景', description: 'PNG-style transparent' },
  { id: 'white', name: 'White', name_zh: '白色背景', description: 'Clean white product photo' },
  { id: 'colored', name: 'Colored', name_zh: '彩色背景', description: 'Solid colored backdrop' },
  { id: 'pattern', name: 'Patterned', name_zh: '图案背景', description: 'Decorative pattern' },
];

const ASPECT_RATIOS = [
  { id: '1:1', label: '1:1' },
  { id: '3:4', label: '3:4' },
  { id: '4:3', label: '4:3' },
  { id: '9:16', label: '9:16' },
  { id: '16:9', label: '16:9' },
];

export const StickerDesignPanel: React.FC<Props> = ({ config, onChange, lang }) => {
  const update = (partial: Partial<StickerDesignConfig>) => {
    onChange({ ...config, ...partial });
  };

  const isZh = lang === 'zh';

  return (
    <div className="space-y-4">
      {/* Subject Name */}
      <div>
        <TextFieldControl
          label={isZh ? '主题名称' : 'Subject Name'}
          value={config.subjectName}
          onValueChange={(value) => update({ subjectName: value })}
          placeholder={isZh ? '输入贴纸主题...' : 'Enter sticker subject...'}
        />
      </div>

      {/* Expression / Mood */}
      <div>
        <TextFieldControl
          label={isZh ? '表情/情绪（可选）' : 'Expression / Mood (optional)'}
          value={config.expression}
          onValueChange={(value) => update({ expression: value })}
          placeholder={isZh ? '例如：开心、生气、惊讶...' : 'e.g., happy, angry, surprised...'}
        />
      </div>

      {/* Style */}
      <DesignMdSelector
        selectedId={config.style}
        onSelect={(id) => update({ style: id as any })}
        lang={lang}
        options={toOptions(STICKER_STYLES)}
        label="Sticker Style"
        label_zh="贴纸风格"
        favoritesKey="sticker-style-favorites"
      />

      {/* Shape */}
      <DesignMdSelector
        selectedId={config.shape}
        onSelect={(id) => update({ shape: id as any })}
        lang={lang}
        options={toOptions(STICKER_SHAPES)}
        label="Shape"
        label_zh="形状"
        favoritesKey="sticker-shape-favorites"
      />

      {/* Theme */}
      <DesignMdSelector
        selectedId={config.theme}
        onSelect={(id) => update({ theme: id as any })}
        lang={lang}
        options={toOptions(STICKER_THEMES)}
        label="Theme"
        label_zh="主题"
        favoritesKey="sticker-theme-favorites"
      />

      {/* Size */}
      <DesignMdSelector
        selectedId={config.size}
        onSelect={(id) => update({ size: id as any })}
        lang={lang}
        options={toOptions(STICKER_SIZES)}
        label="Size"
        label_zh="尺寸"
        favoritesKey="sticker-size-favorites"
      />

      {/* Background */}
      <DesignMdSelector
        selectedId={config.background}
        onSelect={(id) => update({ background: id as any })}
        lang={lang}
        options={toOptions(STICKER_BACKGROUNDS)}
        label="Background"
        label_zh="背景"
        favoritesKey="sticker-background-favorites"
      />

      {/* Aspect Ratio */}
      <div>
        <Text as="label" size="1" weight="bold" color="gray">
          {isZh ? '比例' : 'Aspect Ratio'}
        </Text>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
          {ASPECT_RATIOS.map((r) => (
            <button
              key={r.id}
              onClick={() => update({ aspect: r.id as any })}
              className={`min-h-10 px-2 py-1.5 text-xs rounded-lg border transition-colors ${
                config.aspect === r.id
                  ? 'border-[var(--accent-8)] bg-[var(--accent-3)] text-[var(--accent-11)]'
                  : 'border-[var(--gray-5)] text-[var(--gray-11)] hover:border-[var(--gray-8)]'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
