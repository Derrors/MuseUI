import {
  CoverImageConfig, InfographicConfig, XHSImagesConfig,
  ComicConfig, ArticleIllustratorConfig, SlideDeckConfig,
  LogoConfig, StickerDesignConfig, SkillType
} from '../types';
import { buildStickerCraftPrompt } from '../domain/stickers/prompting';

// Placeholder imports - will be resolved once constants are migrated
// import { COVER_TYPES, COVER_PALETTES, COVER_RENDERINGS, COVER_TEXTS, COVER_MOODS, COVER_FONTS } from './cover-image/constants';
// import { INFOGRAPHIC_LAYOUTS, INFOGRAPHIC_STYLES } from './infographic/constants';
// import { XHS_STYLES, XHS_LAYOUTS, XHS_STRATEGIES } from './xhs-images/constants';
// import { COMIC_ART_STYLES, COMIC_TONES, COMIC_LAYOUTS, COMIC_PRESETS } from './comic/constants';
// import { ARTICLE_TYPES, ARTICLE_STYLES, ARTICLE_DENSITIES } from './article-illustrator/constants';
// import { SLIDE_PRESETS, SLIDE_AUDIENCES } from './slide-deck/constants';

// ============================================================
// Helper: resolve option by id from an array
// ============================================================
function findOption<T extends { id: string }>(arr: T[] | undefined, id: string): T | undefined {
  return arr?.find(o => o.id === id);
}

function getModifier(arr: { id: string; promptModifier?: string }[] | undefined, id: string): string {
  return findOption(arr, id)?.promptModifier ?? '';
}

// ============================================================
// 1. Cover Image Prompt Builder
// ============================================================
export function buildCoverImagePrompt(
  content: string,
  config: CoverImageConfig,
  constants: {
    types: any[];
    palettes: any[];
    renderings: any[];
    texts: any[];
    moods: any[];
    fonts: any[];
  }
): string {
  const typeMod = getModifier(constants.types, config.type);
  const paletteMod = getModifier(constants.palettes, config.palette);
  const renderingMod = getModifier(constants.renderings, config.rendering);
  const textMod = getModifier(constants.texts, config.text);
  const moodMod = getModifier(constants.moods, config.mood);
  const fontMod = getModifier(constants.fonts, config.font);

  return `
Create an elegant cover image for the following content.

TYPE: ${config.type}
${typeMod}

COLOR PALETTE: ${config.palette}
${paletteMod}

RENDERING STYLE: ${config.rendering}
${renderingMod}

TEXT LEVEL: ${config.text}
${textMod}

MOOD: ${config.mood}
${moodMod}

TYPOGRAPHY: ${config.font}
${fontMod}

COMPOSITION PRINCIPLES:
- 40-60% whitespace breathing room
- Visual anchor centered or offset left
- Simplified silhouettes for characters, NO realistic humans

CONTENT TO VISUALIZE:
${content}

${config.title ? `TITLE (must use exact): "${config.title}"` : ''}
${config.subtitle ? `SUBTITLE: "${config.subtitle}"` : ''}
  `.trim();
}

// ============================================================
// 2. Infographic Prompt Builder
// ============================================================
export function buildInfographicPrompt(
  content: string,
  config: InfographicConfig,
  constants: {
    layouts: any[];
    styles: any[];
  }
): string {
  const layoutMod = getModifier(constants.layouts, config.layout);
  const styleMod = getModifier(constants.styles, config.style);

  return `
Create a professional infographic.

LAYOUT: ${config.layout}
${layoutMod}

VISUAL STYLE: ${config.style}
${styleMod}

CORE PRINCIPLES:
- Preserve all source data verbatim—no summarization or rephrasing
- Structure for visual communication (headlines, labels, visual elements)
- Define learning objectives before structuring content

ASPECT RATIO: ${config.aspect}

CONTENT:
${content}
  `.trim();
}

// ============================================================
// 3. XHS Images Prompt Builder
// ============================================================
export function buildXHSImagesPrompt(
  content: string,
  config: XHSImagesConfig,
  pageIndex: number,
  constants: {
    styles: any[];
    layouts: any[];
    strategies: any[];
  },
  pageType: 'cover' | 'content' | 'ending' = 'content',
  refImage?: string
): { prompt: string; refImage?: string } {
  const styleMod = getModifier(constants.styles, config.style);
  const layoutMod = getModifier(constants.layouts, config.layout);
  const strategyMod = getModifier(constants.strategies, config.strategy);

  const pageTypeDesc = pageIndex === 0 ? 'COVER (first image - establishes visual anchor)' :
    pageType === 'ending' ? 'ENDING (call to action / summary)' :
    `CONTENT PAGE ${pageIndex}`;

  return {
    prompt: `
Create a Xiaohongshu (Little Red Book) infographic image.

PAGE TYPE: ${pageTypeDesc}
STYLE: ${config.style}
${styleMod}

LAYOUT: ${config.layout}
${layoutMod}

STRATEGY: ${config.strategy}
${strategyMod}

VISUAL CONSISTENCY:
${refImage ? '- Maintain visual consistency with the reference image (same color palette, illustration style, character design)' : '- This is the FIRST image. Establish the visual anchor for the entire series.'}

CONTENT:
${content}
    `.trim(),
    refImage
  };
}

// ============================================================
// 4. Comic Prompt Builder
// ============================================================
export function buildComicPrompt(
  content: string,
  config: ComicConfig,
  constants: {
    artStyles: any[];
    tones: any[];
    layouts: any[];
    presets: any[];
  },
  charRef?: string
): { prompt: string; charRef?: string } {
  const artMod = getModifier(constants.artStyles, config.art);
  const toneMod = getModifier(constants.tones, config.tone);
  const layoutMod = getModifier(constants.layouts, config.layout);
  const presetMod = config.preset !== 'custom' ? getModifier(constants.presets, config.preset) : '';

  return {
    prompt: `
Create a single knowledge comic image containing ${config.pageCount} panels arranged in a ${config.layout} layout.

ART STYLE: ${config.art}
${artMod}

TONE: ${config.tone}
${toneMod}

LAYOUT: ${config.layout} — ${config.pageCount} panels
${layoutMod}

${presetMod ? `PRESET RULES: ${config.preset}\n${presetMod}` : ''}

CHARACTER CONSISTENCY:
${charRef ? '- Maintain character designs from the character reference sheet' : '- Establish all character designs clearly and consistently across all panels.'}

PANEL COUNT: ${config.pageCount} panels within this single image.

CONTENT:
${content}
    `.trim(),
    charRef
  };
}

// ============================================================
// 5. Article Illustrator Prompt Builder
// ============================================================
export function buildArticleIllustratorPrompt(
  content: string,
  config: ArticleIllustratorConfig,
  constants: {
    types: any[];
    styles: any[];
    densities: any[];
  }
): string {
  const typeMod = getModifier(constants.types, config.type);
  const styleMod = getModifier(constants.styles, config.style);
  const densityMod = getModifier(constants.densities, config.density);

  const densityDesc = config.density === 'minimal' ? '1-2 illustration zones' :
    config.density === 'balanced' ? '3-5 illustration zones' :
    config.density === 'per-section' ? 'one illustration per major section' :
    '6+ illustration zones, dense and rich';

  return `
Create a single article illustration image.

TYPE: ${config.type}
${typeMod}

STYLE: ${config.style}
${styleMod}

DENSITY: ${config.density} — ${densityDesc}
${densityMod}

INSTRUCTION:
This is a SINGLE image. Incorporate ${densityDesc} within this one illustration, arranged to support the article structure.

METAPHOR RULE:
Visualize the underlying concept, NOT literal image.

CONTENT TO ILLUSTRATE:
${content}
  `.trim();
}

// ============================================================
// 6. Slide Deck Prompt Builder
// ============================================================
export function buildSlideDeckPrompt(
  content: string,
  config: SlideDeckConfig,
  slideIndex: number | undefined,
  constants: {
    presets: any[];
    audiences: any[];
  }
): string {
  const presetMod = getModifier(constants.presets, config.preset);
  const audienceMod = getModifier(constants.audiences, config.audience);

  // undefined slideIndex = single mode; 0 = batch first slide (COVER)
  const slideType = slideIndex === undefined ? 'SLIDE' :
    slideIndex === 0 ? 'COVER' : `SLIDE ${slideIndex + 1}`;

  return `
Create a slide deck image.

${slideType}

STYLE PRESET: ${config.preset}
${presetMod}

AUDIENCE: ${config.audience}
${audienceMod}

DESIGN PHILOSOPHY:
- Self-explanatory without verbal commentary
- Logical flow when scrolling
- All necessary context within each slide
- Optimized for social media sharing

CONTENT:
${content}
  `.trim();
}

// ============================================================
// 7. Logo Prompt Builder
// ============================================================
export function buildLogoPrompt(
  content: string,
  config: LogoConfig,
  constants: {
    types: any[];
    styles: any[];
    palettes: any[];
    industries: any[];
    moods: any[];
  }
): string {
  const typeMod = getModifier(constants.types, config.type);
  const styleMod = getModifier(constants.styles, config.style);
  const paletteMod = getModifier(constants.palettes, config.palette);
  const industryMod = getModifier(constants.industries, config.industry);
  const moodMod = getModifier(constants.moods, config.mood);

  const sizeMap: Record<string, string> = {
    '1:1': '500×500 pixels (square)',
    '4:3': '600×450 pixels (landscape)',
    '16:9': '800×450 pixels (wide)',
    '3:4': '450×600 pixels (portrait)',
    '2:1': '800×400 pixels (banner)',
  };
  const sizeDesc = sizeMap[config.size] || sizeMap['1:1'];

  return `
Design a professional logo for the brand "${config.brandName}".
${config.slogan ? `Brand slogan: "${config.slogan}".` : ''}

LOGO TYPE: ${config.type}
${typeMod}

VISUAL STYLE: ${config.style}
${styleMod}

COLOR PALETTE: ${config.palette}
${paletteMod}

INDUSTRY: ${config.industry}
${industryMod}

MOOD: ${config.mood}
${moodMod}

OUTPUT SIZE: ${config.size} aspect ratio, ${sizeDesc}

REQUIREMENTS:
- Clean, scalable vector-style output
- The logo should work on both light and dark backgrounds
- Ensure the brand name is legible and well-integrated
- Output as a single centered logo on a clean white background
- No mockups, no background scenes — just the logo mark itself

${content ? `ADDITIONAL CONTEXT:\n${content}` : ''}
  `.trim();
}

// ============================================================
// 8. Sticker Design Prompt Builder
// ============================================================
export function buildStickerDesignPrompt(
  content: string,
  config: StickerDesignConfig,
  constants: {
    styles: any[];
    shapes: any[];
    themes: any[];
    sizes: any[];
    backgrounds: any[];
  }
): string {
  return buildStickerCraftPrompt(content, config, constants);
}

// ============================================================
// Master dispatcher
// ============================================================
export interface SkillConstants {
  coverImage?: {
    types: any[];
    palettes: any[];
    renderings: any[];
    texts: any[];
    moods: any[];
    fonts: any[];
  };
  infographic?: {
    layouts: any[];
    styles: any[];
  };
  xhsImages?: {
    styles: any[];
    layouts: any[];
    strategies: any[];
  };
  comic?: {
    artStyles: any[];
    tones: any[];
    layouts: any[];
    presets: any[];
  };
  articleIllustrator?: {
    types: any[];
    styles: any[];
    densities: any[];
  };
  slideDeck?: {
    presets: any[];
    audiences: any[];
  };
  logo?: {
    types: any[];
    styles: any[];
    palettes: any[];
    industries: any[];
    moods: any[];
  };
  stickerDesign?: {
    styles: any[];
    shapes: any[];
    themes: any[];
    sizes: any[];
    backgrounds: any[];
  };
}

export function buildSkillPrompt(
  skillType: SkillType,
  content: string,
  config: any,
  constants: SkillConstants,
  meta?: { pageIndex?: number; slideIndex?: number; refImage?: string; charRef?: string; pageType?: 'cover' | 'content' | 'ending' }
): string | { prompt: string; refImage?: string; charRef?: string } {
  switch (skillType) {
    case 'cover-image':
      return buildCoverImagePrompt(content, config.coverImage, constants.coverImage!);
    case 'infographic':
      return buildInfographicPrompt(content, config.infographic, constants.infographic!);
    case 'xhs-images':
      return buildXHSImagesPrompt(content, config.xhsImages, meta?.pageIndex ?? 0, constants.xhsImages!, meta?.pageType, meta?.refImage);
    case 'comic':
      return buildComicPrompt(content, config.comic, constants.comic!, meta?.charRef);
    case 'article-illustrator':
      return buildArticleIllustratorPrompt(content, config.articleIllustrator, constants.articleIllustrator!);
    case 'slide-deck':
      return buildSlideDeckPrompt(content, config.slideDeck, meta?.slideIndex, constants.slideDeck!);
    case 'logo':
      return buildLogoPrompt(content, config.logo, constants.logo!);
    case 'sticker-design':
      return buildStickerDesignPrompt(content, config.stickerDesign, constants.stickerDesign!);
    default:
      throw new Error(`Unknown skill type: ${skillType}`);
  }
}
