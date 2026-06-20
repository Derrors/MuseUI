import type { APIConfig, APISettings } from '../../types';
import { createId } from '../../utils/id';

export const DEFAULT_TEXT_MODEL = 'gpt-5.4';
export const DEFAULT_IMAGE_MODEL = 'gpt-image-2';

export const TEXT_MODEL_PRESETS = [
  'gpt-5.4',
  'gpt-5.5',
];

export const IMAGE_MODEL_PRESETS = [
  'gpt-image-2',
];

export const normalizeTextModel = (model?: string): string => (
  model && TEXT_MODEL_PRESETS.includes(model) ? model : DEFAULT_TEXT_MODEL
);

export const normalizeImageModel = (model?: string): string => (
  model && IMAGE_MODEL_PRESETS.includes(model) ? model : DEFAULT_IMAGE_MODEL
);

export const createDefaultAPIProfile = (): APIConfig => ({
  id: createId('api'),
  name: '',
  provider: 'openai',
  baseUrl: 'https://api.openai.com/v1',
  apiKey: '',
  textModel: DEFAULT_TEXT_MODEL,
  imageModel: DEFAULT_IMAGE_MODEL,
  enabled: true,
  textEnabled: true,
  imageEnabled: true,
  imageMode: 'auto',
});

export const normalizeAPIProfile = (api: Partial<APIConfig>): APIConfig => {
  const defaults = createDefaultAPIProfile();
  return {
    ...defaults,
    id: api.id || defaults.id,
    name: api.name || '',
    provider: 'openai',
    baseUrl: api.baseUrl || defaults.baseUrl,
    apiKey: api.apiKey || '',
    textModel: normalizeTextModel(api.textModel),
    imageModel: normalizeImageModel(api.imageModel),
    enabled: api.enabled !== false,
    textEnabled: api.textEnabled ?? true,
    imageEnabled: api.imageEnabled ?? true,
    imageMode: api.imageMode || defaults.imageMode,
  };
};

export const normalizeAPISettings = (settings: Partial<APISettings>): APISettings => ({
  profiles: Array.isArray(settings.profiles)
    ? settings.profiles.map(api => normalizeAPIProfile(api))
    : [],
});

export const normalizeAPIProfileForUI = (api: APIConfig): APIConfig => ({
  ...api,
  name: api.name || '',
  textEnabled: api.textEnabled ?? true,
  imageEnabled: api.imageEnabled ?? true,
  imageMode: api.imageMode || 'auto',
});
