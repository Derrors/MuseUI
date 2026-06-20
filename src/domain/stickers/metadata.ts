import type {
  GeneratedImage,
  StickerAssetItem,
  StickerAssetMetadata,
  StickerDesignConfig,
} from '../../types';
import { createId } from '../../utils/id';
import { getStickerBackgroundStrategy, normalizeStickerConfig } from './prompting';

export interface StickerMetadataOptions {
  backgroundRemoved?: boolean;
  collectionItems?: StickerAssetItem[];
  splitMethod?: 'auto' | 'manual';
  error?: string;
}

export const createStickerMetadata = (
  config: StickerDesignConfig,
  options: StickerMetadataOptions = {},
): StickerAssetMetadata => {
  const normalized = normalizeStickerConfig(config);
  const strategy = getStickerBackgroundStrategy(normalized);

  return {
    kind: 'sticker',
    transparentWorkflow: strategy.transparentWorkflow,
    backgroundRemoved: options.backgroundRemoved ?? false,
    backgroundColor: strategy.transparentWorkflow ? strategy.promptBackgroundColor : undefined,
    hasStickerBorder: normalized.useStickerBorder,
    hasText: Boolean(normalized.textOverlay.enabled && normalized.textOverlay.content.trim()),
    hasReferenceImage: Boolean(normalized.referenceImage),
    layoutMode: normalized.layoutMode,
    isCollection: normalized.layoutMode === 'collection',
    collectionCount: normalized.layoutMode === 'collection' ? normalized.collection.count : undefined,
    collectionItems: options.collectionItems,
    splitMethod: options.splitMethod,
    sourceType: 'generated',
    error: options.error,
  };
};

export const isStickerImage = (image: GeneratedImage | null | undefined): boolean =>
  image?.details?.sticker?.kind === 'sticker';

export const withStickerMetadata = (
  image: GeneratedImage,
  sticker: StickerAssetMetadata,
): GeneratedImage => ({
  ...image,
  details: {
    ...image.details!,
    sticker,
  },
});

export const withStickerCollectionItems = (
  image: GeneratedImage,
  items: StickerAssetItem[],
  splitMethod: 'auto' | 'manual',
): GeneratedImage => ({
  ...image,
  details: {
    ...image.details!,
    sticker: {
      ...(image.details?.sticker ?? {
        kind: 'sticker',
        transparentWorkflow: false,
        hasStickerBorder: false,
        hasText: false,
        hasReferenceImage: false,
        layoutMode: 'collection',
        isCollection: true,
        sourceType: 'generated',
      }),
      kind: 'sticker',
      isCollection: true,
      collectionItems: items,
      collectionCount: items.length,
      splitMethod,
    },
  },
});

export const stickerItemToGeneratedImage = (
  parent: GeneratedImage,
  item: StickerAssetItem,
): GeneratedImage => {
  const source = item.splitSource;
  const width = source ? Math.max(1, source.box.maxX - source.box.minX + 1) : 512;
  const height = source ? Math.max(1, source.box.maxY - source.box.minY + 1) : 512;
  const parentSticker = parent.details?.sticker;

  return {
    id: createId('sticker'),
    url: item.url,
    prompt: item.prompt,
    timestamp: Date.now(),
    details: {
      ...(parent.details ?? {
        platform: 'sticker',
        style: 'Sticker',
        tokens: {} as any,
        fullPrompt: item.prompt,
      }),
      resolution: `${width}x${height}`,
      fullPrompt: parent.details?.fullPrompt ?? parent.prompt,
      sticker: {
        ...(parentSticker ?? {
          kind: 'sticker',
          transparentWorkflow: false,
          hasStickerBorder: false,
          hasText: false,
          hasReferenceImage: false,
          layoutMode: 'single',
          isCollection: false,
          sourceType: 'generated',
        }),
        kind: 'sticker',
        layoutMode: 'single',
        isCollection: false,
        collectionItems: undefined,
        collectionCount: undefined,
        splitMethod: item.splitMethod,
      },
    },
  };
};
