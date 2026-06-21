import { Artboard, GeneratedImage, ImageAssetSource, StudioType } from '../types';
import { getDB } from './db';
import { createId } from '../utils/id';
import { deleteImageAssetIfUnreferenced, getImageDataUrl, storeImageAsset } from './imageAssetService';

export interface Project {
  id: string;
  name: string;
  studioType: StudioType;
  description: string | null;
  thumbnailUrl: string | null;
  config: any;
  createdAt: string;
  updatedAt: string;
  _count?: { artboards: number };
  artboards?: Artboard[];
}

const normalizeProject = (p: any): Project => ({
  ...p,
  studioType: p.studioType || 'ui-designer',
});

const inferImageSource = (image: GeneratedImage): ImageAssetSource => {
  if (image.details?.sticker) return 'sticker';
  if (image.id.startsWith('upload-')) return 'uploaded';
  if (image.id.startsWith('imported-')) return 'imported';
  return 'generated';
};

const assetToImage = async (asset: any): Promise<GeneratedImage> => {
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
};

const persistImageReference = async (image: GeneratedImage): Promise<string | null> => {
  if (image.imageId) return image.imageId;
  if (!image.url) return null;
  const asset = await storeImageAsset(image.url, inferImageSource(image));
  return asset.id;
};

export const getProjects = async (): Promise<Project[]> => {
  const db = await getDB();
  const projects = await db.getAll('projects');
  const sorted = projects.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  const result: Project[] = [];
  for (const p of sorted) {
    const artboards = await db.getAllFromIndex('artboards', 'by-projectId', p.id);
    result.push({ ...normalizeProject(p), _count: { artboards: artboards.length } });
  }
  return result;
};

export const createProject = async (data: { name: string; studioType?: StudioType; description?: string; config?: any }): Promise<Project> => {
  const db = await getDB();
  const now = new Date().toISOString();
  const project: Project = {
    id: createId('project'),
    name: data.name,
    studioType: data.studioType || 'ui-designer',
    description: data.description || null,
    thumbnailUrl: null,
    config: data.config || {},
    createdAt: now,
    updatedAt: now,
  };
  await db.put('projects', project);
  return project;
};

export const getProjectById = async (id: string): Promise<Project> => {
  const db = await getDB();
  const project = await db.get('projects', id);
  if (!project) throw new Error('Project not found');

  const dbArtboards = await db.getAllFromIndex('artboards', 'by-projectId', id);
  const artboards: Artboard[] = [];

  for (const ab of dbArtboards) {
    const assets = await db.getAllFromIndex('generatedAssets', 'by-artboardId', ab.id);
    const sortedAssets = assets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const history = (await Promise.all(sortedAssets.map(assetToImage)))
      .filter(image => Boolean(image.url || image.details?.designSystem));
    const favoriteAsset = sortedAssets.find(a => a.isFavorite);
    const favoriteImage = favoriteAsset ? await assetToImage(favoriteAsset) : undefined;
    const image: GeneratedImage | undefined = favoriteImage || history[0];

    if (!image) continue;

    artboards.push({
      id: ab.id,
      x: ab.x,
      y: ab.y,
      width: ab.width,
      height: ab.height,
      groupId: ab.groupId || undefined,
      label: ab.label,
      image: image!,
      history,
    });
  }

  return { ...normalizeProject(project), artboards };
};

export const saveProject = async (
  id: string,
  data: { name?: string; description?: string; config?: any; artboards?: Artboard[]; thumbnailUrl?: string }
): Promise<Project> => {
  const db = await getDB();
  const existing = await db.get('projects', id);
  if (!existing) throw new Error('Project not found');

  const updated = {
    ...existing,
    ...(data.name !== undefined && { name: data.name }),
    ...(data.description !== undefined && { description: data.description }),
    ...(data.config !== undefined && { config: data.config }),
    ...(data.thumbnailUrl !== undefined && { thumbnailUrl: data.thumbnailUrl }),
    updatedAt: new Date().toISOString(),
  };
  await db.put('projects', updated);

  if (data.artboards) {
    const existingAbs = await db.getAllFromIndex('artboards', 'by-projectId', id);
    const incomingIds = new Set(data.artboards.map(ab => ab.id));

    for (const ab of existingAbs) {
      if (!incomingIds.has(ab.id)) {
        await db.delete('artboards', ab.id);
      }
    }

    for (const ab of data.artboards) {
      await db.put('artboards', {
        id: ab.id,
        projectId: id,
        label: ab.label,
        x: ab.x,
        y: ab.y,
        width: ab.width,
        height: ab.height,
        groupId: ab.groupId || null,
        imageId: ab.image?.id || null,
      });

      // Collect all images (current + history) that need persisting
      const allImages: typeof ab.history = [];
      if (ab.history && ab.history.length > 0) {
        allImages.push(...ab.history);
      } else if (ab.image) {
        allImages.push(ab.image);
      }

      for (const img of allImages) {
        if (!img.id || (!img.url && !img.imageId && !img.details?.designSystem)) continue;
        const imageId = await persistImageReference(img);
        const existing = await db.get('generatedAssets', img.id);
        if (existing) {
          // Update artboardId/projectId linkage
          await db.put('generatedAssets', {
            ...existing,
            artboardId: ab.id,
            projectId: id,
            imageId,
            prompt: img.prompt || existing.prompt || null,
            platform: img.details?.platform || existing.platform || null,
            designStyle: img.details?.style || existing.designStyle || null,
            metaData: img.details || existing.metaData || {},
          });
        } else {
          // Create new asset record — image was never persisted to IndexedDB.
          await db.put('generatedAssets', {
            id: img.id,
            projectId: id,
            artboardId: ab.id,
            imageId,
            prompt: img.prompt || null,
            platform: img.details?.platform || null,
            designStyle: img.details?.style || null,
            tags: [],
            metaData: img.details || {},
            isFavorite: false,
            createdAt: img.timestamp ? new Date(img.timestamp).toISOString() : new Date().toISOString(),
          });
        }
      }
    }
  }

  return getProjectById(id);
};

export const deleteProject = async (id: string): Promise<void> => {
  const db = await getDB();
  const artboards = await db.getAllFromIndex('artboards', 'by-projectId', id);
  for (const ab of artboards) {
    await db.delete('artboards', ab.id);
  }
  const assets = await db.getAllFromIndex('generatedAssets', 'by-projectId', id);
  for (const asset of assets) {
    await db.delete('generatedAssets', asset.id);
    if (asset.imageId) await deleteImageAssetIfUnreferenced(asset.imageId);
  }
  await db.delete('projects', id);
};
