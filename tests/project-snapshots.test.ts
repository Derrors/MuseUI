import { describe, expect, it, vi } from 'vitest';
import {
  APP_CONFIG_SNAPSHOT_VERSION,
  buildProjectConfigSnapshot,
  restoreConfigSnapshot,
} from '../src/domain/projects/snapshots';

const createConfig = () => ({
  platform: 'mobile',
  resolution: { id: 'mobile', width: 390, height: 844 },
  customSize: { width: 390, height: 844, active: false },
  style: { id: 'modern', name: 'Modern' },
  customStyles: [],
  description: 'A',
  pageName: 'Home',
  keywords: [],
  enableDesignTokens: false,
  designTokens: {},
  background: { type: 'color', value: '#fff' },
  highQuality: false,
  forceChinese: false,
  promptLanguage: null,
  preferredImageApiId: null,
  designMdId: null,
  designMdContent: null,
  visualStyleId: null,
  visualStyleContent: null,
  layoutDensityId: null,
  layoutDensityContent: null,
  isBatchMode: false,
  batchOutputMode: 'separate',
  specMode: 'image',
  pages: [],
  activeRole: 'designer',
  mediaAspectRatio: '3:4',
  mediaResolution: { id: 'poster' },
  mediaType: 'poster',
  skillMode: false,
  activeSkill: null,
  skillConfig: null,
  setPlatform: vi.fn(),
  setResolution: vi.fn(),
  setCustomSize: vi.fn(),
  setCustomStyles: vi.fn(),
  setStyle: vi.fn(),
  setDescription: vi.fn(),
  setPageName: vi.fn(),
  setKeywords: vi.fn(),
  setEnableDesignTokens: vi.fn(),
  setDesignTokens: vi.fn(),
  setBackground: vi.fn(),
  setHighQuality: vi.fn(),
  setForceChinese: vi.fn(),
  setPromptLanguage: vi.fn(),
  setPreferredImageApiId: vi.fn(),
  setDesignMdId: vi.fn(),
  setDesignMdContent: vi.fn(),
  setVisualStyleId: vi.fn(),
  setVisualStyleContent: vi.fn(),
  setLayoutDensityId: vi.fn(),
  setLayoutDensityContent: vi.fn(),
  setIsBatchMode: vi.fn(),
  setBatchOutputMode: vi.fn(),
  setSpecMode: vi.fn(),
  setPages: vi.fn(),
  setMediaAspectRatio: vi.fn(),
  setMediaResolution: vi.fn(),
  setMediaType: vi.fn(),
  setActiveRole: vi.fn(),
  setSkillMode: vi.fn(),
  setActiveSkill: vi.fn(),
  setSkillConfig: vi.fn(),
});

const createCanvas = () => ({
  layoutImage: 'data:image/png;base64,layout',
  layoutElements: [{ id: 'el-1' }],
  updateLayoutImage: vi.fn(),
  setLayoutElements: vi.fn(),
});

describe('project config snapshots', () => {
  it('writes versioned project config snapshots', () => {
    const snapshot = buildProjectConfigSnapshot(createConfig(), createCanvas());

    expect(snapshot.version).toBe(APP_CONFIG_SNAPSHOT_VERSION);
    expect(snapshot.layoutImage).toBe('data:image/png;base64,layout');
    expect(snapshot.layoutElements).toEqual([{ id: 'el-1' }]);
  });

  it('restores legacy partial snapshots without requiring a version', () => {
    const config = createConfig();
    const canvas = createCanvas();

    restoreConfigSnapshot({
      description: 'Imported',
      promptLanguage: 'zh',
      preferredImageApiId: 'api-1',
      layoutImage: 'layout-2',
      layoutElements: [{ id: 'el-2' }],
    }, config, canvas);

    expect(config.setDescription).toHaveBeenCalledWith('Imported');
    expect(config.setPromptLanguage).toHaveBeenCalledWith('zh');
    expect(config.setPreferredImageApiId).toHaveBeenCalledWith('api-1');
    expect(canvas.updateLayoutImage).toHaveBeenCalledWith('layout-2');
    expect(canvas.setLayoutElements).toHaveBeenCalledWith([{ id: 'el-2' }]);
  });
});
