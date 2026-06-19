import { GeneratedImage } from '../types';
import { getDB } from './db';
import { createId } from '../utils/id';

export interface HistoryPaginatedResponse {
  items: GeneratedImage[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export const saveImageToHistory = async (image: GeneratedImage): Promise<void> => {
  const db = await getDB();
  await db.put('generatedAssets', {
    id: image.id || createId('history'),
    projectId: image.details?.projectId || null,
    artboardId: null,
    imageData: image.url,
    prompt: image.prompt || null,
    platform: image.details?.platform || null,
    designStyle: image.details?.style || null,
    tags: [],
    metaData: image.details || {},
    isFavorite: false,
    createdAt: new Date(image.timestamp || Date.now()).toISOString(),
  });
};

export const getHistory = async (): Promise<GeneratedImage[]> => {
  const db = await getDB();
  const all = await db.getAllFromIndex('generatedAssets', 'by-createdAt');
  return all.reverse().map(assetToImage);
};

export const getHistoryPaginated = async (page: number = 1, pageSize: number = 20): Promise<HistoryPaginatedResponse> => {
  const db = await getDB();
  const all = await db.getAllFromIndex('generatedAssets', 'by-createdAt');
  const reversed = all.reverse();
  const total = reversed.length;
  const start = (page - 1) * pageSize;
  const items = reversed.slice(start, start + pageSize).map(assetToImage);
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
  await db.delete('generatedAssets', id);
};

export const clearHistory = async (): Promise<void> => {
  const db = await getDB();
  await db.clear('generatedAssets');
};

function assetToImage(asset: any): GeneratedImage {
  return {
    id: asset.id,
    url: asset.imageData,
    prompt: asset.prompt || '',
    timestamp: new Date(asset.createdAt).getTime(),
    details: asset.metaData,
  };
}
