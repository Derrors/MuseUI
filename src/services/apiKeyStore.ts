import { APIConfig, APISettings, RequestLogEntry } from '../types';
import { createId } from '../utils/id';

const API_SETTINGS_KEY = 'muse-ui-api-settings';
const REQUEST_LOGS_KEY = 'muse-ui-request-logs';

export const DEFAULT_TEXT_MODEL = 'gpt-5.4';
export const DEFAULT_IMAGE_MODEL = 'gpt-image-2';

export const TEXT_MODEL_PRESETS = [
  'gpt-5.4',
  'gpt-5.5',
];

export const IMAGE_MODEL_PRESETS = [
  'gpt-image-2',
];

const normalizeTextModel = (model?: string): string => (
  model && TEXT_MODEL_PRESETS.includes(model) ? model : DEFAULT_TEXT_MODEL
);

const normalizeImageModel = (model?: string): string => (
  model && IMAGE_MODEL_PRESETS.includes(model) ? model : DEFAULT_IMAGE_MODEL
);

const normalizeProfile = (api: Partial<APIConfig>): APIConfig => ({
  id: api.id || createId('api'),
  name: api.name || '',
  provider: 'openai',
  baseUrl: api.baseUrl || 'https://api.openai.com/v1',
  apiKey: api.apiKey || '',
  textModel: normalizeTextModel(api.textModel),
  imageModel: normalizeImageModel(api.imageModel),
  enabled: api.enabled !== false,
  textEnabled: api.textEnabled ?? true,
  imageEnabled: api.imageEnabled ?? true,
  imageMode: api.imageMode || 'auto',
});

const normalizeSettings = (settings: Partial<APISettings>): APISettings => ({
  profiles: Array.isArray(settings.profiles)
    ? settings.profiles.map(api => normalizeProfile(api))
    : [],
});

export function getAPISettings(): APISettings {
  try {
    const raw = localStorage.getItem(API_SETTINGS_KEY);
    if (raw) {
      return normalizeSettings(JSON.parse(raw) as Partial<APISettings>);
    }
  } catch {
    // ignore parse errors
  }

  return { profiles: [] };
}

export function saveAPISettings(settings: APISettings): void {
  const normalized = normalizeSettings(settings);
  localStorage.setItem(API_SETTINGS_KEY, JSON.stringify(normalized));
}

export function getEnabledTextAPIs(): APIConfig[] {
  return getAPISettings().profiles.filter(api => api.enabled && api.textEnabled);
}

export function getEnabledImageAPIs(): APIConfig[] {
  return getAPISettings().profiles.filter(api => api.enabled && api.imageEnabled);
}

export function hasAnyAPI(): boolean {
  return getEnabledTextAPIs().length > 0 || getEnabledImageAPIs().length > 0;
}

export function getApiKey(): string | null {
  const first = getEnabledTextAPIs()[0];
  return first?.apiKey || null;
}

// Request Logs
export function getRequestLogs(): RequestLogEntry[] {
  try {
    const raw = localStorage.getItem(REQUEST_LOGS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addRequestLog(entry: RequestLogEntry): void {
  const logs = getRequestLogs();
  logs.unshift(entry);
  if (logs.length > 100) logs.length = 100;
  localStorage.setItem(REQUEST_LOGS_KEY, JSON.stringify(logs));
}

export function clearRequestLogs(): void {
  localStorage.removeItem(REQUEST_LOGS_KEY);
}
