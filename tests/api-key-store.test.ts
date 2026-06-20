import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getAPISettings,
  getEnabledImageAPIs,
  getEnabledTextAPIs,
  saveAPISettings,
} from '../src/services/apiKeyStore';
import { APIConfig } from '../src/types';

const API_SETTINGS_KEY = 'muse-ui-api-settings';

const createMemoryStorage = () => {
  const values = new Map<string, string>();
  return {
    getItem: vi.fn((key: string) => values.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      values.set(key, value);
    }),
    removeItem: vi.fn((key: string) => {
      values.delete(key);
    }),
    clear: vi.fn(() => {
      values.clear();
    }),
  };
};

const baseApi = (overrides: Partial<APIConfig>): APIConfig => ({
  id: 'api_1',
  name: 'Primary',
  provider: 'openai',
  baseUrl: 'https://api.example.com/v1',
  apiKey: 'sk-test',
  textModel: 'gpt-5.4',
  imageModel: 'gpt-image-2',
  enabled: true,
  textEnabled: true,
  imageEnabled: true,
  imageMode: 'auto',
  ...overrides,
});

describe('API settings profile storage', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createMemoryStorage());
  });

  it('stores and reads pure profile settings', () => {
    saveAPISettings({
      profiles: [baseApi({ textEnabled: true, imageEnabled: false })],
    });

    const raw = JSON.parse(localStorage.getItem(API_SETTINGS_KEY) || '{}');
    const settings = getAPISettings();

    expect(raw.profiles).toHaveLength(1);
    expect(Object.keys(raw)).toEqual(['profiles']);
    expect(settings.profiles).toHaveLength(1);
    expect(settings.profiles[0].provider).toBe('openai');
    expect(settings.profiles[0].imageEnabled).toBe(false);
  });

  it('normalizes imported profiles to OpenAI-compatible defaults', () => {
    localStorage.setItem(API_SETTINGS_KEY, JSON.stringify({
      profiles: [{
        id: 'api_2',
        baseUrl: '',
        apiKey: 'sk-test',
        textModel: 'unsupported-text',
        imageModel: 'unsupported-image',
      }],
    }));

    const settings = getAPISettings();

    expect(settings.profiles[0]).toMatchObject({
      id: 'api_2',
      provider: 'openai',
      baseUrl: 'https://api.openai.com/v1',
      textModel: 'gpt-5.4',
      imageModel: 'gpt-image-2',
      textEnabled: true,
      imageEnabled: true,
      imageMode: 'auto',
    });
  });

  it('filters enabled text and image profiles without compatibility arrays', () => {
    saveAPISettings({
      profiles: [
        baseApi({ id: 'text_only', textEnabled: true, imageEnabled: false }),
        baseApi({ id: 'image_only', textEnabled: false, imageEnabled: true }),
        baseApi({ id: 'disabled', enabled: false, textEnabled: true, imageEnabled: true }),
      ],
    });

    expect(getEnabledTextAPIs().map(api => api.id)).toEqual(['text_only']);
    expect(getEnabledImageAPIs().map(api => api.id)).toEqual(['image_only']);
  });
});
