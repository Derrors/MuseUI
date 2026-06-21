import type { GeneratedImage, GenerationConfig } from '../../types';
import type { GeneratedAssetResult } from './types';

export const createGeneratedImage = (
  asset: GeneratedAssetResult,
  dims: { width: number; height: number },
  config: GenerationConfig,
  options: {
    prompt?: string;
    batchId: string;
    originalDescription?: string;
    projectId?: string | null;
    details?: Partial<NonNullable<GeneratedImage['details']>>;
  },
): GeneratedImage => ({
  id: asset.id,
  imageId: asset.imageId,
  url: asset.url,
  prompt: options.prompt ?? asset.prompt,
  timestamp: asset.timestamp,
  details: {
    ...options.details,
    platform: config.platform,
    resolution: `${dims.width}x${dims.height}`,
    style: config.style.name,
    tokens: config.designTokens,
    fullPrompt: asset.prompt,
    batchId: options.batchId,
    originalDescription: options.originalDescription,
    projectId: options.projectId || undefined,
  },
});
