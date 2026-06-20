import { describe, expect, it } from 'vitest';
import { shouldFallbackToChatImageAPI } from '../src/services/aiService';

describe('OpenAI-compatible image fallback', () => {
  it('falls back to chat image generation when a gateway has no images API account', () => {
    expect(shouldFallbackToChatImageAPI(new Error('OpenAI image error 503: {"error":{"message":"No available compatible accounts","type":"api_error"}}'))).toBe(true);
  });

  it('does not fall back for unrelated upstream errors', () => {
    expect(shouldFallbackToChatImageAPI(new Error('OpenAI image error 401: invalid api key'))).toBe(false);
  });
});

