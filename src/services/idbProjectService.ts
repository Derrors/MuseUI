import { Artboard, GeneratedImage, StudioType } from '../types';
import { getDB } from './db';
import { createId } from '../utils/id';

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

    const mainAsset = sortedAssets.find(a => a.isFavorite) || sortedAssets[0];
    const image: GeneratedImage | undefined = mainAsset
      ? { id: mainAsset.id, url: mainAsset.imageData, prompt: mainAsset.prompt || '', timestamp: new Date(mainAsset.createdAt).getTime(), details: mainAsset.metaData }
      : undefined;

    const history: GeneratedImage[] = sortedAssets.map(a => ({
      id: a.id,
      url: a.imageData,
      prompt: a.prompt || '',
      timestamp: new Date(a.createdAt).getTime(),
      details: a.metaData,
    }));

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
        if (!img.id || !img.url) continue;
        const existing = await db.get('generatedAssets', img.id);
        if (existing) {
          // Update artboardId/projectId linkage
          await db.put('generatedAssets', { ...existing, artboardId: ab.id, projectId: id });
        } else {
          // Create new asset record — image was never persisted to IndexedDB
          await db.put('generatedAssets', {
            id: img.id,
            projectId: id,
            artboardId: ab.id,
            imageData: img.url,
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
  }
  await db.delete('projects', id);
};
