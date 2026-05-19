import { openDB, deleteDB, DBSchema, IDBPDatabase } from 'idb';

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
      imageData: string;
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
    dbPromise = openDB<MuseUIDB>('muse-ui-db', 4, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('projects')) {
          const projectStore = db.createObjectStore('projects', { keyPath: 'id' });
          projectStore.createIndex('by-updatedAt', 'updatedAt');
        }

        if (!db.objectStoreNames.contains('artboards')) {
          const artboardStore = db.createObjectStore('artboards', { keyPath: 'id' });
          artboardStore.createIndex('by-projectId', 'projectId');
        }

        if (!db.objectStoreNames.contains('generatedAssets')) {
          const assetStore = db.createObjectStore('generatedAssets', { keyPath: 'id' });
          assetStore.createIndex('by-projectId', 'projectId');
          assetStore.createIndex('by-artboardId', 'artboardId');
          assetStore.createIndex('by-createdAt', 'createdAt');
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
