import { describe, expect, it } from 'vitest';
import {
  buildStickerCraftPrompt,
  createStickerMetadata,
  getStickerBackgroundStrategy,
  normalizeStickerConfig,
} from '../src/domain/stickers';
import type { StickerDesignConfig } from '../src/types';

const baseStickerConfig: StickerDesignConfig = {
  style: 'flat',
  shape: 'custom',
  theme: 'character',
  size: 'medium',
  background: 'transparent',
  subjectName: 'holiday cat',
  expression: 'sleepy but cheerful',
  aspect: '1:1',
};

const constants = {
  styles: [{ id: 'flat', promptModifier: 'flat sticker style' }],
  shapes: [{ id: 'custom', promptModifier: 'custom die cut shape' }],
  themes: [{ id: 'character', promptModifier: 'character theme' }],
  sizes: [{ id: 'medium', promptModifier: 'medium sticker size' }],
  backgrounds: [{ id: 'transparent', promptModifier: 'transparent background' }],
};

describe('sticker domain', () => {
  it('normalizes legacy sticker configs with StickerCraft workflow defaults', () => {
    const normalized = normalizeStickerConfig(baseStickerConfig);

    expect(normalized.layoutMode).toBe('single');
    expect(normalized.backgroundMode).toBe('transparent');
    expect(normalized.useStickerBorder).toBe(true);
    expect(normalized.allowFacialFeatures).toBe(true);
    expect(normalized.textOverlay.enabled).toBe(false);
    expect(normalized.collection.count).toBe(2);
  });

  it('uses black removable background for transparent white-border stickers', () => {
    expect(getStickerBackgroundStrategy(baseStickerConfig)).toEqual({
      transparentWorkflow: true,
      promptBackgroundColor: 'black',
    });

    expect(getStickerBackgroundStrategy({ ...baseStickerConfig, useStickerBorder: false })).toEqual({
      transparentWorkflow: true,
      promptBackgroundColor: 'white',
    });
  });

  it('builds prompts for collection, text overlay, and reference-image stickers', () => {
    const prompt = buildStickerCraftPrompt('Dragon boat festival icons', {
      ...baseStickerConfig,
      layoutMode: 'collection',
      size: 'sheet',
      referenceImage: 'data:image/png;base64,abc',
      textOverlay: {
        enabled: true,
        content: '端午快乐',
        font: 'rounded',
        hasBorder: true,
      },
      collection: {
        count: 4,
        itemPrompts: ['rice dumpling', 'dragon boat', 'mugwort', 'festival mascot'],
      },
    }, constants);

    expect(prompt).toContain('STICKER COLLECTION');
    expect(prompt).toContain('exactly 4 separate sticker assets');
    expect(prompt).toContain('REFERENCE IMAGE');
    expect(prompt).toContain('端午快乐');
    expect(prompt).toContain('pure black background');
  });

  it('creates sticker metadata for generated assets', () => {
    const metadata = createStickerMetadata({
      ...baseStickerConfig,
      layoutMode: 'collection',
      collection: { count: 6, itemPrompts: [] },
      textOverlay: { enabled: true, content: 'Hi', font: 'bold', hasBorder: true },
      referenceImage: 'data:image/png;base64,abc',
    }, { backgroundRemoved: true, splitMethod: 'auto' });

    expect(metadata).toMatchObject({
      kind: 'sticker',
      transparentWorkflow: true,
      backgroundRemoved: true,
      backgroundColor: 'black',
      hasStickerBorder: true,
      hasText: true,
      hasReferenceImage: true,
      layoutMode: 'collection',
      isCollection: true,
      collectionCount: 6,
      splitMethod: 'auto',
    });
  });
});
