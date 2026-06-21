import { openDB, deleteDB, DBSchema, IDBPDatabase } from 'idb';
import type { GenerationTaskStatus, ImageAssetSource } from '../types';

interface MuseUIDB extends DBSchema {
  projects: {
    key: string;
    value: {
      id: string;
      name: string;
      studioType: 'ui-designer' | 'media-studio' | 'game-studio';
      description: string | null;
      thumbnailUrl: string | null;
      config: any;
      createdAt: string;
      updatedAt: string;
    };
    indexes: { 'by-updatedAt': string };
  };
  artboards: {
    key: string;
    value: {
      id: string;
      projectId: string;
      label: string;
      x: number;
      y: number;
      width: number;
      height: number;
      groupId: string | null;
      imageId: string | null;
    };
    indexes: { 'by-projectId': string };
  };
  generatedAssets: {
    key: string;
    value: {
      id: string;
      projectId: string | null;
      artboardId: string | null;
      imageId: string | null;
      imageData?: string;
      prompt: string | null;
      platform: string | null;
      designStyle: string | null;
      tags: string[];
      metaData: any;
      isFavorite: boolean;
      createdAt: string;
    };
    indexes: {
      'by-projectId': string;
      'by-artboardId': string;
      'by-createdAt': string;
      'by-imageId': string;
    };
  };
  imageAssets: {
    key: string;
    value: {
      id: string;
      dataUrl: string;
      hash: string;
      mimeType: string;
      width?: number;
      height?: number;
      source: ImageAssetSource;
      createdAt: string;
    };
    indexes: {
      'by-hash': string;
      'by-createdAt': string;
    };
  };
  imageThumbnails: {
    key: string;
    value: {
      id: string;
      imageId: string;
      dataUrl: string;
      width: number;
      height: number;
      version: number;
      createdAt: string;
    };
    indexes: {
      'by-imageId': string;
    };
  };
  generationTasks: {
    key: string;
    value: {
      id: string;
      status: GenerationTaskStatus;
      role: string;
      prompt: string;
      fullPrompt?: string;
      apiProfileId?: string | null;
      textModel?: string | null;
      imageModel?: string | null;
      inputImageIds: string[];
      outputImageIds: string[];
      outputAssetIds: string[];
      error?: string | null;
      createdAt: string;
      startedAt?: string;
      finishedAt?: string;
      elapsedMs?: number | null;
      projectId?: string | null;
      artboardId?: string | null;
      batchId?: string | null;
    };
    indexes: {
      'by-status': GenerationTaskStatus;
      'by-projectId': string;
      'by-artboardId': string;
      'by-batchId': string;
      'by-createdAt': string;
    };
  };
  layoutPresets: {
    key: string;
    value: {
      id: string;
      name: string;
      elements: any[];
      timestamp: number;
    };
  };
  fileHandles: {
    key: string;
    value: {
      id: string;
      handle: FileSystemDirectoryHandle;
    };
  };
}

let dbPromise: Promise<IDBPDatabase<MuseUIDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<MuseUIDB>> {
  if (!dbPromise) {
    dbPromise = openDB<MuseUIDB>('muse-ui-db', 5, {
      upgrade(db, _oldVersion, _newVersion, transaction) {
        if (!db.objectStoreNames.contains('projects')) {
          const projectStore = db.createObjectStore('projects', { keyPath: 'id' });
          projectStore.createIndex('by-updatedAt', 'updatedAt');
        }

        if (!db.objectStoreNames.contains('artboards')) {
          const artboardStore = db.createObjectStore('artboards', { keyPath: 'id' });
          artboardStore.createIndex('by-projectId', 'projectId');
        }

        const assetStore = db.objectStoreNames.contains('generatedAssets')
          ? transaction.objectStore('generatedAssets')
          : db.createObjectStore('generatedAssets', { keyPath: 'id' });
        if (!assetStore.indexNames.contains('by-projectId')) {
          assetStore.createIndex('by-projectId', 'projectId');
        }
        if (!assetStore.indexNames.contains('by-artboardId')) {
          assetStore.createIndex('by-artboardId', 'artboardId');
        }
        if (!assetStore.indexNames.contains('by-createdAt')) {
          assetStore.createIndex('by-createdAt', 'createdAt');
        }
        if (!assetStore.indexNames.contains('by-imageId')) {
          assetStore.createIndex('by-imageId', 'imageId');
        }

        if (!db.objectStoreNames.contains('imageAssets')) {
          const imageAssetStore = db.createObjectStore('imageAssets', { keyPath: 'id' });
          imageAssetStore.createIndex('by-hash', 'hash', { unique: true });
          imageAssetStore.createIndex('by-createdAt', 'createdAt');
        }

        if (!db.objectStoreNames.contains('imageThumbnails')) {
          const imageThumbnailStore = db.createObjectStore('imageThumbnails', { keyPath: 'id' });
          imageThumbnailStore.createIndex('by-imageId', 'imageId', { unique: true });
        }

        if (!db.objectStoreNames.contains('generationTasks')) {
          const generationTaskStore = db.createObjectStore('generationTasks', { keyPath: 'id' });
          generationTaskStore.createIndex('by-status', 'status');
          generationTaskStore.createIndex('by-projectId', 'projectId');
          generationTaskStore.createIndex('by-artboardId', 'artboardId');
          generationTaskStore.createIndex('by-batchId', 'batchId');
          generationTaskStore.createIndex('by-createdAt', 'createdAt');
        }

        if (!db.objectStoreNames.contains('layoutPresets')) {
          db.createObjectStore('layoutPresets', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('fileHandles')) {
          db.createObjectStore('fileHandles', { keyPath: 'id' });
        }
      },
      blocked() {
        console.warn('IndexedDB upgrade blocked. Please close other tabs with this app open.');
      },
      blocking() {
        // Close this connection to allow newer version to upgrade
        dbPromise?.then(db => db.close());
      },
    }).catch((error) => {
      // If version downgrade error, delete and recreate
      if (error.name === 'VersionError') {
        console.warn('IndexedDB version conflict detected. Resetting database...');
        dbPromise = null;
        return deleteDB('muse-ui-db').then(() => getDB());
      }
      throw error;
    });
  }
  return dbPromise;
}
