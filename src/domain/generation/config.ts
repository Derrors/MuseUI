import type { GenerationConfig } from '../../types';
import type { GenerationConfigState } from './types';

export const getAspectRatio = (width: number, height: number): string => {
  const ratio = width / height;
  if (ratio >= 1.7) return '16:9';
  if (ratio >= 1.3) return '4:3';
  if (ratio >= 0.9) return '1:1';
  if (ratio >= 0.7) return '3:4';
  return '9:16';
};

export const getEffectiveResolution = (config: GenerationConfigState) => (
  config.activeRole === 'media' && config.mediaResolution
    ? {
        id: config.mediaResolution.id,
        name: config.mediaResolution.name,
        width: config.mediaResolution.width,
        height: config.mediaResolution.height,
        type: config.platform as any,
      }
    : config.resolution
);

export const getMediaFields = (config: GenerationConfigState) => ({
  activeRole: config.activeRole as any,
  mediaAspectRatio: config.mediaAspectRatio as any,
  mediaType: config.mediaType as any,
});

export const createGenerationConfig = (
  config: GenerationConfigState,
  overrides: Partial<GenerationConfig> = {},
): GenerationConfig => {
  const effectiveResolution = overrides.resolution || getEffectiveResolution(config);

  return {
    platform: config.platform,
    resolution: effectiveResolution,
    customSize: config.customSize,
    style: config.style,
    description: config.description,
    pageName: config.pageName || 'Screen',
    keywords: config.keywords,
    highQuality: config.highQuality,
    enableDesignTokens: config.enableDesignTokens,
    designTokens: config.designTokens,
    background: config.background,
    forceChinese: config.forceChinese,
    promptLanguage: config.promptLanguage,
    preferredImageApiId: config.preferredImageApiId,
    batchOutputMode: config.batchOutputMode,
    specMode: config.specMode,
    designMd: config.designMdContent || undefined,
    visualStyle: config.visualStyleContent || undefined,
    layoutDensity: config.layoutDensityContent || undefined,
    ...getMediaFields(config),
    ...overrides,
  };
};
