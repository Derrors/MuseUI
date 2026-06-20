import { describe, expect, it } from 'vitest';
import { createGenerationConfig, getAspectRatio, getEffectiveResolution } from '../src/domain/generation/config';
import { createGeneratedImage } from '../src/domain/generation/images';
import { resolveSkillResolution } from '../src/domain/generation/skillPrompting';

const baseConfig: any = {
  platform: 'mobile',
  resolution: { id: 'mobile', name: 'Mobile', width: 390, height: 844, type: 'mobile' },
  customSize: { width: 390, height: 844, active: false },
  style: { id: 'modern', name: 'Modern' },
  description: 'Task',
  pageName: 'Home',
  keywords: ['card'],
  highQuality: false,
  enableDesignTokens: false,
  designTokens: {
    primaryColor: '#000000',
    backgroundColor: '#ffffff',
    accentColor: '#00ffff',
    decorativeColor: '#ff00ff',
    borderRadius: 'medium',
    spacing: 'comfortable',
  },
  background: { type: 'color', value: '#ffffff' },
  forceChinese: false,
  promptLanguage: null,
  preferredImageApiId: null,
  batchOutputMode: 'separate',
  specMode: 'image',
  designMdContent: 'design',
  visualStyleContent: 'visual',
  layoutDensityContent: 'layout',
  activeRole: 'designer',
  mediaAspectRatio: '3:4',
  mediaType: 'poster',
};

describe('generation domain helpers', () => {
  it('derives coarse aspect ratios from canvas dimensions', () => {
    expect(getAspectRatio(1920, 1080)).toBe('16:9');
    expect(getAspectRatio(1024, 768)).toBe('4:3');
    expect(getAspectRatio(1024, 1024)).toBe('1:1');
    expect(getAspectRatio(768, 1024)).toBe('3:4');
    expect(getAspectRatio(390, 844)).toBe('9:16');
  });

  it('creates a full generation config from app state and overrides', () => {
    const config = createGenerationConfig(baseConfig, { pageName: 'Settings', keywords: [] });

    expect(config).toMatchObject({
      platform: 'mobile',
      pageName: 'Settings',
      keywords: [],
      designMd: 'design',
      visualStyle: 'visual',
      layoutDensity: 'layout',
    });
  });

  it('uses media resolution when media mode is active', () => {
    const mediaResolution = { id: 'poster', name: 'Poster', width: 1080, height: 1440, ratio: '3:4' };
    expect(getEffectiveResolution({ ...baseConfig, activeRole: 'media', mediaResolution })).toMatchObject({
      id: 'poster',
      width: 1080,
      height: 1440,
      type: 'mobile',
    });
  });

  it('resolves skill-specific output dimensions before prompt generation', () => {
    expect(resolveSkillResolution(baseConfig, 'logo', { logo: { size: '16:9' } })).toMatchObject({
      id: 'logo-16:9',
      width: 800,
      height: 450,
    });
    expect(resolveSkillResolution(baseConfig, 'sticker-design', { stickerDesign: { aspect: '1:1' } })).toMatchObject({
      id: 'sticker-1:1',
      width: 512,
      height: 512,
    });
  });

  it('keeps generated image details canonical when extra details contain config objects', () => {
    const image = createGeneratedImage(
      {
        id: 'img-1',
        url: 'data:image/png;base64,abc',
        prompt: 'final prompt',
        timestamp: 100,
      },
      { width: 390, height: 844 },
      createGenerationConfig(baseConfig),
      {
        batchId: 'batch-1',
        details: {
          resolution: baseConfig.resolution,
          fullPrompt: 'stale prompt',
        } as any,
      },
    );

    expect(image.details?.resolution).toBe('390x844');
    expect(image.details?.fullPrompt).toBe('final prompt');
    expect(image.details?.batchId).toBe('batch-1');
  });
});
