import { DEFAULT_IMAGE_MODEL, getEnabledImageAPIs } from '../../services/apiKeyStore';
import { constructPrompt } from '../../services/aiGenerationService';
import type { GenerationCanvasState, GenerationConfigState, GenerationReviewData } from './types';
import { getAspectRatio } from './config';

export const buildDevReviewData = (
  config: GenerationConfigState,
  canvas: GenerationCanvasState,
  currentProjectId: string | null,
  onConfirm: (prompt: string, ignoreLayoutImage: boolean, projectId?: string | null) => void,
): GenerationReviewData => {
  const constructed = constructPrompt({
    ...config,
    designMd: config.designMdContent || undefined,
    visualStyle: config.visualStyleContent || undefined,
    layoutDensity: config.layoutDensityContent || undefined,
  } as any, false, !!canvas.layoutImage);

  const enabledImageAPIs = getEnabledImageAPIs();
  let targetAPI = enabledImageAPIs[0];
  if (config.preferredImageApiId) {
    const preferred = enabledImageAPIs.find(api => api.id === config.preferredImageApiId);
    if (preferred) targetAPI = preferred;
  }

  const width = config.customSize.active ? config.customSize.width : config.resolution.width;
  const height = config.customSize.active ? config.customSize.height : config.resolution.height;
  const aspectRatio = getAspectRatio(width, height);

  return {
    prompt: constructed,
    config: config as any,
    pendingAction: () => onConfirm(constructed, false, currentProjectId),
    images: [],
    apiRequestInfo: targetAPI ? {
      targetAPI: {
        provider: targetAPI.provider,
        baseUrl: targetAPI.baseUrl,
        model: targetAPI.imageModel || DEFAULT_IMAGE_MODEL,
        name: targetAPI.name,
      },
      requestParams: {
        prompt: constructed,
        aspectRatio,
        preferredApiId: config.preferredImageApiId,
        images: {
          hasColorImage: !!config.colorImage,
          hasStyleImage: !!config.referenceImages[0],
          hasLayoutImage: !!canvas.layoutImage,
          hasEditImage: false,
          hasMaskImage: false,
          contentImageCount: 0,
        },
      },
    } : undefined,
  };
};
