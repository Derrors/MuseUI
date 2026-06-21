import React from 'react';
import { StickerDesignConfig, LangType, StickerCollectionConfig, StickerTextConfig } from '../../types';
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

const LAYOUT_MODES = [
  { id: 'single', label: 'Single', label_zh: '单张' },
  { id: 'three-views', label: '3 Views', label_zh: '三视图' },
  { id: 'collection', label: 'Sheet', label_zh: '集合' },
] as const;

const TEXT_FONTS = [
  { id: 'rounded', label: 'Rounded', label_zh: '圆润' },
  { id: 'bold', label: 'Bold', label_zh: '粗体' },
  { id: 'handwritten', label: 'Hand', label_zh: '手写' },
  { id: 'display', label: 'Display', label_zh: '展示' },
] as const;

const ensureText = (config: StickerDesignConfig): StickerTextConfig => ({
  enabled: false,
  content: '',
  font: 'rounded',
  hasBorder: true,
  ...config.textOverlay,
});

const ensureCollection = (config: StickerDesignConfig): StickerCollectionConfig => {
  const count = Math.max(2, Math.min(12, config.collection?.count ?? 6));
  return {
    count,
    itemPrompts: Array.from({ length: count }, (_, index) => config.collection?.itemPrompts?.[index] ?? ''),
  };
};

export const StickerDesignPanel: React.FC<Props> = ({ config, onChange, lang }) => {
  const update = (partial: Partial<StickerDesignConfig>) => {
    onChange({ ...config, ...partial });
  };

  const isZh = lang === 'zh';
  const textOverlay = ensureText(config);
  const collection = ensureCollection(config);
  const layoutMode = config.layoutMode ?? (config.size === 'sheet' ? 'collection' : 'single');
  const backgroundMode = config.backgroundMode ?? (config.background === 'transparent' ? 'transparent' : 'keep');
  const useStickerBorder = config.useStickerBorder ?? true;
  const allowFacialFeatures = config.allowFacialFeatures ?? true;

  const updateText = (partial: Partial<StickerTextConfig>) => {
    update({ textOverlay: { ...textOverlay, ...partial } });
  };

  const updateCollection = (partial: Partial<StickerCollectionConfig>) => {
    update({ collection: { ...collection, ...partial } });
  };

  const updateCollectionCount = (count: number) => {
    const safeCount = Math.max(2, Math.min(12, count));
    updateCollection({
      count: safeCount,
      itemPrompts: Array.from({ length: safeCount }, (_, index) => collection.itemPrompts[index] ?? ''),
    });
  };

  const updateCollectionItem = (index: number, value: string) => {
    const itemPrompts = [...collection.itemPrompts];
    itemPrompts[index] = value;
    updateCollection({ itemPrompts });
  };

  const handleReferenceUpload = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => update({ referenceImage: reader.result as string });
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-4">
      {/* Production Mode */}
      <div>
        <label className="block text-xs font-medium text-stone-500 dark:text-stone-400 mb-1.5">
          {isZh ? '生产模式' : 'Production Mode'}
        </label>
        <div className="grid grid-cols-3 gap-1.5">
          {LAYOUT_MODES.map((mode) => (
            <button
              key={mode.id}
              onClick={() => update({
                layoutMode: mode.id,
                size: mode.id === 'collection' ? 'sheet' : config.size === 'sheet' ? 'medium' : config.size,
              })}
              className={`min-h-10 px-2 py-1.5 text-xs rounded-lg border transition-colors ${
                layoutMode === mode.id
                  ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400'
                  : 'border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:border-stone-300 dark:hover:border-stone-600'
              }`}
            >
              {isZh ? mode.label_zh : mode.label}
            </button>
          ))}
        </div>
      </div>

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
        onSelect={(id) => update({
          size: id as any,
          layoutMode: id === 'sheet' ? 'collection' : layoutMode === 'collection' ? 'single' : layoutMode,
        })}
        lang={lang}
        options={toOptions(STICKER_SIZES)}
        label="Size"
        label_zh="尺寸"
        favoritesKey="sticker-size-favorites"
      />

      {/* Background Mode */}
      <div className="rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900/40 p-3 space-y-3">
        <div className="grid grid-cols-2 gap-1.5">
          {[
            { id: 'transparent', label: 'Transparent PNG', label_zh: '透明 PNG' },
            { id: 'keep', label: 'Keep Background', label_zh: '保留背景' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => update({
                backgroundMode: item.id as any,
                background: item.id === 'transparent' ? 'transparent' : (config.background === 'transparent' ? 'white' : config.background),
              })}
              className={`min-h-10 px-2 py-1.5 text-xs rounded-lg border transition-colors ${
                backgroundMode === item.id
                  ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400'
                  : 'border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:border-stone-300 dark:hover:border-stone-600'
              }`}
            >
              {isZh ? item.label_zh : item.label}
            </button>
          ))}
        </div>

        {backgroundMode === 'keep' && (
          <DesignMdSelector
            selectedId={config.background === 'transparent' ? 'white' : config.background}
            onSelect={(id) => update({ background: id as any })}
            lang={lang}
            options={toOptions(STICKER_BACKGROUNDS.filter(bg => bg.id !== 'transparent'))}
            label="Background"
            label_zh="背景"
            favoritesKey="sticker-background-favorites"
          />
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <label className="flex items-center justify-between gap-3 rounded-lg border border-stone-200 dark:border-stone-700 px-3 py-2">
            <span className="text-xs font-medium text-stone-600 dark:text-stone-300">{isZh ? '白色模切边' : 'White Border'}</span>
            <input
              type="checkbox"
              checked={useStickerBorder}
              onChange={(e) => update({ useStickerBorder: e.target.checked })}
              className="h-4 w-4 accent-teal-500"
            />
          </label>
          <label className="flex items-center justify-between gap-3 rounded-lg border border-stone-200 dark:border-stone-700 px-3 py-2">
            <span className="text-xs font-medium text-stone-600 dark:text-stone-300">{isZh ? '允许面部特征' : 'Facial Features'}</span>
            <input
              type="checkbox"
              checked={allowFacialFeatures}
              onChange={(e) => update({ allowFacialFeatures: e.target.checked })}
              className="h-4 w-4 accent-teal-500"
            />
          </label>
        </div>
      </div>

      {/* Text Overlay */}
      <div className="rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900/40 p-3 space-y-3">
        <label className="flex items-center justify-between gap-3">
          <span className="text-xs font-medium text-stone-600 dark:text-stone-300">{isZh ? '文字叠加' : 'Text Overlay'}</span>
          <input
            type="checkbox"
            checked={textOverlay.enabled}
            onChange={(e) => updateText({ enabled: e.target.checked })}
            className="h-4 w-4 accent-teal-500"
          />
        </label>
        {textOverlay.enabled && (
          <div className="space-y-2">
            <input
              type="text"
              value={textOverlay.content}
              onChange={(e) => updateText({ content: e.target.value })}
              placeholder={isZh ? '贴纸上的文字...' : 'Text on sticker...'}
              className="w-full px-3 py-2 text-sm rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                value={textOverlay.font}
                onChange={(e) => updateText({ font: e.target.value as any })}
                className="px-3 py-2 text-sm rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-200"
              >
                {TEXT_FONTS.map(font => (
                  <option key={font.id} value={font.id}>{isZh ? font.label_zh : font.label}</option>
                ))}
              </select>
              <label className="flex items-center justify-between gap-2 rounded-lg border border-stone-200 dark:border-stone-700 px-3 py-2">
                <span className="text-xs text-stone-600 dark:text-stone-300">{isZh ? '文字描边' : 'Text Border'}</span>
                <input
                  type="checkbox"
                  checked={textOverlay.hasBorder}
                  onChange={(e) => updateText({ hasBorder: e.target.checked })}
                  className="h-4 w-4 accent-teal-500"
                />
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Reference Image */}
      <div className="rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900/40 p-3 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-medium text-stone-600 dark:text-stone-300">{isZh ? '参考图' : 'Reference Image'}</span>
          <label className="cursor-pointer px-3 py-1.5 rounded-lg text-xs font-semibold bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900/50">
            {config.referenceImage ? (isZh ? '替换' : 'Replace') : (isZh ? '上传' : 'Upload')}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleReferenceUpload(e.target.files?.[0])}
            />
          </label>
        </div>
        {config.referenceImage && (
          <div className="flex items-center gap-3">
            <img src={config.referenceImage} alt="" className="h-16 w-16 rounded-lg object-cover border border-stone-200 dark:border-stone-700" />
            <button
              onClick={() => update({ referenceImage: null })}
              className="px-3 py-2 rounded-lg text-xs font-semibold border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:border-red-300 hover:text-red-500"
            >
              {isZh ? '移除' : 'Remove'}
            </button>
          </div>
        )}
      </div>

      {/* Collection Items */}
      {layoutMode === 'collection' && (
        <div className="rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900/40 p-3 space-y-3">
          <div>
            <label className="block text-xs font-medium text-stone-500 dark:text-stone-400 mb-1.5">
              {isZh ? '贴纸数量' : 'Sticker Count'}
            </label>
            <input
              type="number"
              min={2}
              max={12}
              value={collection.count}
              onChange={(e) => updateCollectionCount(Number(e.target.value) || 2)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
            />
          </div>
          <div className="space-y-2">
            {collection.itemPrompts.map((item, index) => (
              <input
                key={index}
                type="text"
                value={item}
                onChange={(e) => updateCollectionItem(index, e.target.value)}
                placeholder={isZh ? `子贴纸 ${index + 1} 主题` : `Item ${index + 1} theme`}
                className="w-full px-3 py-2 text-sm rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
              />
            ))}
          </div>
        </div>
      )}

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
