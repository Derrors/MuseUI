import type { ResolutionPreset } from '../../types';
import type { SkillConstants } from '../../skills/promptBuilders';
import type { GenerationConfigState } from './types';
import { getEffectiveResolution } from './config';

export const loadSkillPrompting = async () => {
  const [
    promptBuilders,
    CoverConstants,
    InfographicConstants,
    XHSConstants,
    ComicConstants,
    ArticleConstants,
    SlideConstants,
    LogoConstants,
    StickerConstants,
  ] = await Promise.all([
    import('../../skills/promptBuilders'),
    import('../../skills/cover-image/constants'),
    import('../../skills/infographic/constants'),
    import('../../skills/xhs-images/constants'),
    import('../../skills/comic/constants'),
    import('../../skills/article-illustrator/constants'),
    import('../../skills/slide-deck/constants'),
    import('../../skills/logo/constants'),
    import('../../skills/sticker-design/constants'),
  ]);

  const constants: SkillConstants = {
    coverImage: {
      types: CoverConstants.COVER_TYPES,
      palettes: CoverConstants.COVER_PALETTES,
      renderings: CoverConstants.COVER_RENDERINGS,
      texts: CoverConstants.COVER_TEXTS,
      moods: CoverConstants.COVER_MOODS,
      fonts: CoverConstants.COVER_FONTS,
    },
    infographic: {
      layouts: InfographicConstants.INFOGRAPHIC_LAYOUTS,
      styles: InfographicConstants.INFOGRAPHIC_STYLES,
    },
    xhsImages: {
      styles: XHSConstants.XHS_STYLES,
      layouts: XHSConstants.XHS_LAYOUTS,
      strategies: XHSConstants.XHS_STRATEGIES,
    },
    comic: {
      artStyles: ComicConstants.COMIC_ART_STYLES,
      tones: ComicConstants.COMIC_TONES,
      layouts: ComicConstants.COMIC_LAYOUTS,
      presets: ComicConstants.COMIC_PRESETS,
    },
    articleIllustrator: {
      types: ArticleConstants.ARTICLE_TYPES,
      styles: ArticleConstants.ARTICLE_STYLES,
      densities: ArticleConstants.ARTICLE_DENSITIES,
    },
    slideDeck: {
      presets: SlideConstants.SLIDE_PRESETS,
      audiences: SlideConstants.SLIDE_AUDIENCES,
    },
    logo: {
      types: LogoConstants.LOGO_TYPES,
      styles: LogoConstants.LOGO_STYLES,
      palettes: LogoConstants.LOGO_PALETTES,
      industries: LogoConstants.LOGO_INDUSTRIES,
      moods: LogoConstants.LOGO_MOODS,
    },
    stickerDesign: {
      styles: StickerConstants.STICKER_STYLES,
      shapes: StickerConstants.STICKER_SHAPES,
      themes: StickerConstants.STICKER_THEMES,
      sizes: StickerConstants.STICKER_SIZES,
      backgrounds: StickerConstants.STICKER_BACKGROUNDS,
    },
  };

  return { buildSkillPrompt: promptBuilders.buildSkillPrompt, constants };
};

export const resolveSkillResolution = (
  config: GenerationConfigState,
  skillType: string,
  skillConfig: any,
): ResolutionPreset => {
  let skillResolution = getEffectiveResolution(config);

  if (skillType === 'logo' && skillConfig.logo?.size) {
    const logoSizeMap: Record<string, { width: number; height: number }> = {
      '1:1': { width: 500, height: 500 },
      '4:3': { width: 600, height: 450 },
      '16:9': { width: 800, height: 450 },
      '3:4': { width: 450, height: 600 },
      '2:1': { width: 800, height: 400 },
    };
    const dims = logoSizeMap[skillConfig.logo.size] || logoSizeMap['1:1'];
    skillResolution = {
      id: `logo-${skillConfig.logo.size}`,
      name: `Logo ${skillConfig.logo.size}`,
      width: dims.width,
      height: dims.height,
      type: config.platform as any,
    };
  } else if (skillType === 'sticker-design' && skillConfig.stickerDesign?.aspect) {
    const stickerSizeMap: Record<string, { width: number; height: number }> = {
      '1:1': { width: 512, height: 512 },
      '3:4': { width: 450, height: 600 },
      '4:3': { width: 600, height: 450 },
      '9:16': { width: 450, height: 800 },
      '16:9': { width: 800, height: 450 },
    };
    const dims = stickerSizeMap[skillConfig.stickerDesign.aspect] || stickerSizeMap['1:1'];
    skillResolution = {
      id: `sticker-${skillConfig.stickerDesign.aspect}`,
      name: `Sticker ${skillConfig.stickerDesign.aspect}`,
      width: dims.width,
      height: dims.height,
      type: config.platform as any,
    };
  }

  return skillResolution;
};
