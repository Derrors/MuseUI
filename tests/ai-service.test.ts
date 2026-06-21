import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { callImageAPI, callOpenAIImageEditAPI, shouldFallbackToChatImageAPI } from '../src/services/aiService';
import { saveAPISettings } from '../src/services/apiKeyStore';
import type { APIConfig } from '../src/types';

const IMAGE_DATA_URL = 'data:image/png;base64,AA==';

const api: APIConfig = {
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
};

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

describe('OpenAI-compatible image fallback', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createMemoryStorage());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('falls back to chat image generation when a gateway has no images API account', () => {
    expect(shouldFallbackToChatImageAPI(new Error('OpenAI image error 503: {"error":{"message":"No available compatible accounts","type":"api_error"}}'))).toBe(true);
  });

  it('does not fall back for unrelated upstream errors', () => {
    expect(shouldFallbackToChatImageAPI(new Error('OpenAI image error 401: invalid api key'))).toBe(false);
  });

  it('sends reference images to the image edits endpoint as multipart form data', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({
      data: [{ b64_json: 'AA==' }],
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }));
    vi.stubGlobal('fetch', fetchMock);

    await callOpenAIImageEditAPI(api, {
      prompt: 'Use this reference',
      aspectRatio: '1:1',
      images: {
        editImageBase64: IMAGE_DATA_URL,
        maskImageBase64: IMAGE_DATA_URL,
      },
    });

    const [url, init] = fetchMock.mock.calls[0];
    expect(decodeURIComponent(String(url))).toContain('/images/edits');
    expect(init?.method).toBe('POST');
    expect(init?.headers).toEqual({ Authorization: 'Bearer sk-test' });

    const body = init?.body as FormData;
    expect(body.get('model')).toBe('gpt-image-2');
    expect(body.get('prompt')).toBe('Use this reference');
    expect(body.get('size')).toBe('1024x1024');
    expect(body.get('output_format')).toBe('png');
    expect(body.get('image')).toBeInstanceOf(Blob);
    expect(body.get('mask')).toBeInstanceOf(Blob);
  });

  it('routes callImageAPI through image edits when image inputs are present', async () => {
    saveAPISettings({ profiles: [api] });
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({
      data: [{ b64_json: 'AA==' }],
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await callImageAPI({
      prompt: 'Generate from reference',
      aspectRatio: '1:1',
      images: { styleImageBase64: IMAGE_DATA_URL },
    });

    expect(result.url).toBe('data:image/png;base64,AA==');
    expect(decodeURIComponent(String(fetchMock.mock.calls[0][0]))).toContain('/images/edits');
  });
});
