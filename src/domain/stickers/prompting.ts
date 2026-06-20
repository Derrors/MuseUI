import type {
  StickerBackground,
  StickerBackgroundMode,
  StickerDesignConfig,
  StickerLayoutMode,
  StickerTextConfig,
} from '../../types';

interface StickerOption {
  id: string;
  promptModifier?: string;
}

interface StickerPromptConstants {
  styles?: StickerOption[];
  shapes?: StickerOption[];
  themes?: StickerOption[];
  sizes?: StickerOption[];
  backgrounds?: StickerOption[];
}

export interface StickerBackgroundStrategy {
  transparentWorkflow: boolean;
  promptBackgroundColor: 'black' | 'white';
}

const DEFAULT_TEXT: StickerTextConfig = {
  enabled: false,
  content: '',
  font: 'rounded',
  hasBorder: true,
};

const getModifier = (arr: StickerOption[] | undefined, id: string): string =>
  arr?.find(option => option.id === id)?.promptModifier ?? '';

export const normalizeStickerConfig = (config: StickerDesignConfig): Required<StickerDesignConfig> => {
  const layoutMode: StickerLayoutMode = config.layoutMode ?? (config.size === 'sheet' ? 'collection' : 'single');
  const backgroundMode: StickerBackgroundMode =
    config.backgroundMode ?? (config.background === 'transparent' ? 'transparent' : 'keep');
  const count = Math.max(2, Math.min(12, config.collection?.count ?? (layoutMode === 'collection' ? 6 : 1)));
  const itemPrompts = Array.from({ length: count }, (_, index) => config.collection?.itemPrompts?.[index] ?? '');

  return {
    ...config,
    layoutMode,
    backgroundMode,
    useStickerBorder: config.useStickerBorder ?? true,
    allowFacialFeatures: config.allowFacialFeatures ?? true,
    textOverlay: { ...DEFAULT_TEXT, ...config.textOverlay },
    referenceImage: config.referenceImage ?? null,
    collection: { count, itemPrompts },
  };
};

export const getStickerBackgroundStrategy = (config: StickerDesignConfig): StickerBackgroundStrategy => {
  const normalized = normalizeStickerConfig(config);
  const transparentWorkflow = normalized.backgroundMode === 'transparent';
  return {
    transparentWorkflow,
    promptBackgroundColor: normalized.useStickerBorder ? 'black' : 'white',
  };
};

const describeLegacyBackground = (background: StickerBackground, modifier: string): string => {
  if (background === 'transparent') {
    return 'Final asset target: transparent PNG-style sticker. Keep the background perfectly flat and removable.';
  }
  return `${modifier}\nKeep the background as part of the final artwork.`;
};

const buildLayoutInstruction = (config: ReturnType<typeof normalizeStickerConfig>): string => {
  if (config.layoutMode === 'three-views') {
    return `
LAYOUT MODE: THREE-VIEW STICKER REFERENCE
- Create one cohesive character/object shown in three views: front, side, and back.
- Arrange the three views horizontally with equal spacing.
- Keep proportions, colors, accessories, and line weight consistent across all views.
- Each view must remain a usable die-cut sticker silhouette.
`.trim();
  }

  if (config.layoutMode === 'collection') {
    const prompts = config.collection.itemPrompts
      .map((item, index) => item.trim() ? `${index + 1}. ${item.trim()}` : `${index + 1}. Variation ${index + 1} of the same theme`)
      .join('\n');

    return `
LAYOUT MODE: STICKER COLLECTION
- Create exactly ${config.collection.count} separate sticker assets on one sheet.
- Use a clean grid with generous spacing; stickers must not touch or overlap.
- Keep the art style, palette, border treatment, and scale consistent.
- Make each sticker easy to split into an individual transparent PNG later.
- Collection item directions:
${prompts}
`.trim();
  }

  return `
LAYOUT MODE: SINGLE STICKER
- Create one centered sticker asset only.
- Leave generous margin around the sticker for clean cropping.
- The sticker must be self-contained, print-ready, and visually complete.
`.trim();
};

const buildTextInstruction = (text: StickerTextConfig): string => {
  if (!text.enabled || !text.content.trim()) return 'TEXT: No text overlay unless it is naturally part of the requested subject.';
  return `
TEXT OVERLAY:
- Include the exact text: "${text.content.trim()}"
- Font direction: ${text.font}
- ${text.hasBorder ? 'Add a readable outline/border around the text.' : 'Do not add a separate text outline.'}
- Keep the text clear at sticker size and do not let it cover the main face or focal detail.
`.trim();
};

export const buildStickerCraftPrompt = (
  content: string,
  config: StickerDesignConfig,
  constants: StickerPromptConstants,
): string => {
  const normalized = normalizeStickerConfig(config);
  const styleMod = getModifier(constants.styles, normalized.style);
  const shapeMod = getModifier(constants.shapes, normalized.shape);
  const themeMod = getModifier(constants.themes, normalized.theme);
  const sizeMod = getModifier(constants.sizes, normalized.size);
  const backgroundMod = getModifier(constants.backgrounds, normalized.background);
  const bgStrategy = getStickerBackgroundStrategy(normalized);
  const subject = normalized.subjectName.trim() || content.trim() || 'a cute, memorable sticker subject';
  const expression = normalized.expression.trim();

  const backgroundInstruction = bgStrategy.transparentWorkflow
    ? `
TRANSPARENT PNG WORKFLOW:
- Generate the sticker on a pure ${bgStrategy.promptBackgroundColor} background (#${bgStrategy.promptBackgroundColor === 'black' ? '000000' : 'FFFFFF'}).
- The background must be perfectly flat, with no texture, shadows, gradients, scenery, or pattern.
- Keep the sticker edges crisp so the ${bgStrategy.promptBackgroundColor} background can be removed after generation.
`.trim()
    : describeLegacyBackground(normalized.background, backgroundMod);

  return `
You are a professional sticker asset designer. Create a production-quality sticker image using the exact requirements below.

SUBJECT:
${subject}
${content.trim() && normalized.subjectName.trim() ? `Additional context: ${content.trim()}` : ''}
${expression ? `Expression or mood: ${expression}` : ''}
${normalized.referenceImage ? 'REFERENCE IMAGE: Use the provided reference image as the subject/style anchor while still producing a clean sticker asset.' : ''}

STYLE:
${styleMod}

SHAPE:
${shapeMod}

THEME:
${themeMod}

SIZE FORMAT:
${sizeMod}

${buildLayoutInstruction(normalized)}

BORDER:
${normalized.useStickerBorder
  ? '- Add a clean white die-cut sticker border around each sticker. Keep it continuous and thick enough for printing.'
  : '- Do not add an external white sticker border. Preserve the natural silhouette with clean edges.'}

FACIAL FEATURES:
${normalized.allowFacialFeatures
  ? '- Facial features are allowed when the subject naturally has a face. Make expressions readable and charming.'
  : '- Do not add eyes, mouth, or facial features unless they are explicitly part of the source subject.'}

${buildTextInstruction(normalized.textOverlay)}

BACKGROUND:
${backgroundInstruction}

STRICT OUTPUT RULES:
- No mockup photos, product packaging, watermarks, signatures, UI controls, or app chrome.
- No complex scene background unless background mode explicitly keeps a presentation background.
- No realistic photographic humans; use stylized illustration only.
- Keep all stickers fully inside the frame with margin.
- Crisp printable details, high contrast, clean silhouette, vibrant color separation.
`.trim();
};
