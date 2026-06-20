import JSZip from 'jszip';
import type { GeneratedImage, StickerAssetItem } from '../../types';
import { isStickerImage } from './metadata';

export interface StickerDownloadItem {
  filename: string;
  url: string;
}

const sanitizeFilename = (value: string): string =>
  value
    .trim()
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80) || 'sticker';

export const stickerItemFilename = (image: GeneratedImage, item?: StickerAssetItem, index = 0): string => {
  const base = sanitizeFilename(image.prompt || image.details?.originalDescription || 'sticker');
  if (!item) return `${base}.png`;
  return `${base}-item-${String(index + 1).padStart(2, '0')}.png`;
};

export const getStickerDownloadItems = (image: GeneratedImage): StickerDownloadItem[] => {
  const items: StickerDownloadItem[] = [{ filename: stickerItemFilename(image), url: image.url }];
  if (!isStickerImage(image)) return items;

  const collectionItems = image.details?.sticker?.collectionItems ?? [];
  collectionItems.forEach((item, index) => {
    items.push({
      filename: stickerItemFilename(image, item, index),
      url: item.url,
    });
  });
  return items;
};

const dataUrlToBlob = async (url: string): Promise<Blob> => {
  const response = await fetch(url);
  return response.blob();
};

export const buildStickerZipBlob = async (image: GeneratedImage): Promise<Blob> => {
  const zip = new JSZip();
  const items = getStickerDownloadItems(image);
  for (const item of items) {
    zip.file(item.filename, await dataUrlToBlob(item.url));
  }
  return zip.generateAsync({ type: 'blob' });
};
