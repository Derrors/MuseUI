import { afterEach, describe, expect, it, vi } from 'vitest';
import { callOpenAIImageEditAPI, shouldFallbackToChatImageAPI } from '../src/services/aiService';
import type { APIConfig } from '../src/types';

const api: APIConfig = {
  id: 'api-1',
  name: 'Test API',
  provider: 'openai',
  baseUrl: 'https://proxy.example/v1',
  apiKey: 'test-key',
  imageModel: 'gpt-image-2',
  enabled: true,
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('OpenAI-compatible image fallback', () => {
  it('falls back to chat image generation when a gateway has no images API account', () => {
    expect(shouldFallbackToChatImageAPI(new Error('OpenAI image error 503: {"error":{"message":"No available compatible accounts","type":"api_error"}}'))).toBe(true);
  });

  it('does not fall back for unrelated upstream errors', () => {
    expect(shouldFallbackToChatImageAPI(new Error('OpenAI image error 401: invalid api key'))).toBe(false);
  });

  it('builds multipart image edit requests for reference-image generation', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({
      data: [{ b64_json: 'ZmFrZS1wbmc=' }],
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }));

    const result = await callOpenAIImageEditAPI(api, {
      prompt: 'turn this into a sticker',
      aspectRatio: '1:1',
      images: {
        editImageBase64: 'data:image/png;base64,ZmFrZQ==',
      },
    });

    expect(result).toBe('data:image/png;base64,ZmFrZS1wbmc=');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain('/api-proxy?target=');
    expect(decodeURIComponent(String(url))).toContain('https://proxy.example/v1/images/edits');
    expect(init?.method).toBe('POST');
    expect(init?.headers).toEqual({ Authorization: 'Bearer test-key' });
    expect(init?.body).toBeInstanceOf(FormData);
    const body = init?.body as FormData;
    expect(body.get('model')).toBe('gpt-image-2');
    expect(body.get('prompt')).toBe('turn this into a sticker');
    expect(body.get('size')).toBe('1024x1024');
    expect(body.get('image')).toBeInstanceOf(File);
  });
});
