import { GeneratedImage, ImageAssetSource } from '../types';
import { createId } from '../utils/id';
import { getDB } from './db';
import { deleteImageAssetIfUnreferenced, getImageDataUrl, storeImageAsset } from './imageAssetService';

export interface HistoryPaginatedResponse {
  items: GeneratedImage[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

const inferImageSource = (image: GeneratedImage): ImageAssetSource => {
  if (image.details?.sticker) return 'sticker';
  if (image.id.startsWith('upload-')) return 'uploaded';
  if (image.id.startsWith('imported-')) return 'imported';
  return 'generated';
};

export const saveImageToHistory = async (image: GeneratedImage): Promise<GeneratedImage> => {
  const db = await getDB();
  const storedImage = image.url
    ? await storeImageAsset(image.url, inferImageSource(image))
    : undefined;
  const imageId = image.imageId || storedImage?.id || null;
  const id = image.id || createId('history');

  await db.put('generatedAssets', {
    id,
    projectId: image.details?.projectId || null,
    artboardId: null,
    imageId,
    prompt: image.prompt || null,
    platform: image.details?.platform || null,
    designStyle: image.details?.style || null,
    tags: [],
    metaData: image.details || {},
    isFavorite: false,
    createdAt: new Date(image.timestamp || Date.now()).toISOString(),
  });
  return { ...image, id, imageId: imageId || undefined };
};

export const getHistory = async (): Promise<GeneratedImage[]> => {
  const db = await getDB();
  const all = await db.getAllFromIndex('generatedAssets', 'by-createdAt');
  const images = await Promise.all(all.reverse().map(assetToImage));
  return images.filter(image => Boolean(image.url || image.details?.designSystem));
};

export const getHistoryPaginated = async (page: number = 1, pageSize: number = 20): Promise<HistoryPaginatedResponse> => {
  const db = await getDB();
  const all = await db.getAllFromIndex('generatedAssets', 'by-createdAt');
  const reversed = all.reverse();
  const total = reversed.length;
  const start = (page - 1) * pageSize;
  const rawItems = await Promise.all(reversed.slice(start, start + pageSize).map(assetToImage));
  const items = rawItems.filter(image => Boolean(image.url || image.details?.designSystem));
  return { items, total, page, pageSize, hasMore: start + pageSize < total };
};

export const getImageById = async (id: string): Promise<GeneratedImage | undefined> => {
  const db = await getDB();
  const asset = await db.get('generatedAssets', id);
  return asset ? assetToImage(asset) : undefined;
};

export const getAssetDetails = async (id: string): Promise<GeneratedImage | null> => {
  const db = await getDB();
  const asset = await db.get('generatedAssets', id);
  return asset ? assetToImage(asset) : null;
};

export const deleteFromHistory = async (id: string): Promise<void> => {
  const db = await getDB();
  const existing = await db.get('generatedAssets', id);
  await db.delete('generatedAssets', id);
  if (existing?.imageId) await deleteImageAssetIfUnreferenced(existing.imageId);
};

export const clearHistory = async (): Promise<void> => {
  const db = await getDB();
  await db.clear('generatedAssets');
  await db.clear('imageThumbnails');
  await db.clear('imageAssets');
  await db.clear('generationTasks');
};

async function assetToImage(asset: any): Promise<GeneratedImage> {
  const imageId = asset.imageId || undefined;
  const url = imageId ? (await getImageDataUrl(imageId)) || asset.imageData || '' : asset.imageData || '';

  return {
    id: asset.id,
    imageId,
    url,
    prompt: asset.prompt || '',
    timestamp: new Date(asset.createdAt).getTime(),
    details: asset.metaData,
  };
}
