import { describe, expect, it } from 'vitest';
import {
  buildApiProxyUrl,
  buildOpenAICompatibleUrl,
  buildRequestUrl,
  normalizeOpenAIBaseUrl,
} from '../src/services/apiUrl';

describe('OpenAI-compatible API URL helpers', () => {
  it('treats empty OpenAI base URL as the official v1 root', () => {
    expect(buildOpenAICompatibleUrl('', 'chat/completions')).toBe('https://api.openai.com/v1/chat/completions');
  });

  it('normalizes service roots and appends endpoint paths', () => {
    expect(buildOpenAICompatibleUrl('https://api.example.com/v1', 'models')).toBe('https://api.example.com/v1/models');
    expect(buildOpenAICompatibleUrl('api.example.com/openai', '/images/generations')).toBe('https://api.example.com/openai/v1/images/generations');
  });

  it('strips legacy full endpoint URLs back to the v1 root', () => {
    expect(normalizeOpenAIBaseUrl('https://api.example.com/v1/chat/completions')).toBe('https://api.example.com/v1');
    expect(normalizeOpenAIBaseUrl('https://api.example.com/v1/images/generations')).toBe('https://api.example.com/v1');
  });

  it('builds same-origin proxy URLs for browser-hostile API gateways', () => {
    expect(buildApiProxyUrl('https://api.example.com/v1/chat/completions')).toBe('/api-proxy?target=https%3A%2F%2Fapi.example.com%2Fv1%2Fchat%2Fcompletions');
  });

  it('proxies arbitrary external request URLs in the browser dev environment', () => {
    expect(buildRequestUrl('https://cdn.example.com/image.png')).toBe('/api-proxy?target=https%3A%2F%2Fcdn.example.com%2Fimage.png');
  });
});
