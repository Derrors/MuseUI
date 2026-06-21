import type { ImageAsset, ImageAssetSource, ImageThumbnail } from '../types';
import { createId } from '../utils/id';
import { getDB } from './db';

const THUMBNAIL_VERSION = 1;
const THUMBNAIL_MAX_SIZE = 720;
const THUMBNAIL_QUALITY = 0.86;

const parseMimeType = (dataUrl: string): string => {
  const match = dataUrl.match(/^data:([^;]+);/);
  return match?.[1] || 'image/png';
};

const hashDataUrlFallback = (dataUrl: string): string => {
  let hash = 0x811c9dc5;
  for (let index = 0; index < dataUrl.length; index++) {
    hash ^= dataUrl.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `fallback-${(hash >>> 0).toString(16).padStart(8, '0')}-${dataUrl.length}`;
};

export const hashDataUrl = async (dataUrl: string): Promise<string> => {
  if (!globalThis.crypto?.subtle) return hashDataUrlFallback(dataUrl);
  const bytes = new TextEncoder().encode(dataUrl);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
};

const loadImageDimensions = (dataUrl: string): Promise<{ width?: number; height?: number }> => {
  if (typeof Image === 'undefined') return Promise.resolve({});
  return new Promise(resolve => {
    const img = new Image();
    const timeout = globalThis.setTimeout(() => resolve({}), 5000);
    img.onload = () => {
      globalThis.clearTimeout(timeout);
      resolve({
        width: img.naturalWidth || img.width,
        height: img.naturalHeight || img.height,
      });
    };
    img.onerror = () => {
      globalThis.clearTimeout(timeout);
      resolve({});
    };
    img.src = dataUrl;
  });
};

const createThumbnailDataUrl = async (asset: ImageAsset): Promise<ImageThumbnail | undefined> => {
  if (typeof document === 'undefined' || typeof Image === 'undefined') return undefined;
  return new Promise(resolve => {
    const image = new Image();
    image.onload = () => {
      const width = image.naturalWidth || image.width || asset.width || THUMBNAIL_MAX_SIZE;
      const height = image.naturalHeight || image.height || asset.height || THUMBNAIL_MAX_SIZE;
      const scale = Math.min(1, THUMBNAIL_MAX_SIZE / Math.max(width, height));
      const targetWidth = Math.max(1, Math.round(width * scale));
      const targetHeight = Math.max(1, Math.round(height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(undefined);
        return;
      }
      ctx.drawImage(image, 0, 0, targetWidth, targetHeight);
      resolve({
        id: createId('thumb'),
        imageId: asset.id,
        dataUrl: canvas.toDataURL('image/jpeg', THUMBNAIL_QUALITY),
        width: targetWidth,
        height: targetHeight,
        version: THUMBNAIL_VERSION,
        createdAt: new Date().toISOString(),
      });
    };
    image.onerror = () => resolve(undefined);
    image.src = asset.dataUrl;
  });
};

export const storeImageAsset = async (
  dataUrl: string,
  source: ImageAssetSource = 'generated',
): Promise<ImageAsset> => {
  const db = await getDB();
  const hash = await hashDataUrl(dataUrl);
  const existing = await db.getFromIndex('imageAssets', 'by-hash', hash);
  if (existing) return existing;

  const dimensions = await loadImageDimensions(dataUrl);
  const asset: ImageAsset = {
    id: createId('imgasset'),
    dataUrl,
    hash,
    mimeType: parseMimeType(dataUrl),
    width: dimensions.width,
    height: dimensions.height,
    source,
    createdAt: new Date().toISOString(),
  };

  try {
    await db.put('imageAssets', asset);
  } catch (error) {
    const duplicate = await db.getFromIndex('imageAssets', 'by-hash', hash);
    if (duplicate) return duplicate;
    throw error;
  }

  const thumbnail = await createThumbnailDataUrl(asset);
  if (thumbnail) await db.put('imageThumbnails', thumbnail);
  return asset;
};

export const getImageAsset = async (id: string): Promise<ImageAsset | undefined> => {
  const db = await getDB();
  return db.get('imageAssets', id);
};

export const getImageDataUrl = async (id: string): Promise<string | undefined> => {
  const asset = await getImageAsset(id);
  return asset?.dataUrl;
};

export const getOrCreateThumbnail = async (imageId: string): Promise<ImageThumbnail | undefined> => {
  const db = await getDB();
  const existing = await db.getFromIndex('imageThumbnails', 'by-imageId', imageId);
  if (existing?.version === THUMBNAIL_VERSION) return existing;

  const asset = await db.get('imageAssets', imageId);
  if (!asset) return undefined;
  const thumbnail = await createThumbnailDataUrl(asset);
  if (!thumbnail) return undefined;
  await db.put('imageThumbnails', thumbnail);
  return thumbnail;
};

export const deleteImageAssetIfUnreferenced = async (imageId: string): Promise<void> => {
  const db = await getDB();
  const refs = await db.getAllFromIndex('generatedAssets', 'by-imageId', imageId);
  if (refs.length > 0) return;
  const thumbnail = await db.getFromIndex('imageThumbnails', 'by-imageId', imageId);
  if (thumbnail) await db.delete('imageThumbnails', thumbnail.id);
  await db.delete('imageAssets', imageId);
};
