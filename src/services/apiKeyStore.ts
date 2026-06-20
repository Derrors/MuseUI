import { APIConfig, APISettings, RequestLogEntry } from '../types';
import {
  DEFAULT_IMAGE_MODEL,
  DEFAULT_TEXT_MODEL,
  IMAGE_MODEL_PRESETS,
  normalizeAPISettings,
  TEXT_MODEL_PRESETS,
} from '../domain/api-settings/profileModel';

const API_SETTINGS_KEY = 'muse-ui-api-settings';
const REQUEST_LOGS_KEY = 'muse-ui-request-logs';

export { DEFAULT_IMAGE_MODEL, DEFAULT_TEXT_MODEL, IMAGE_MODEL_PRESETS, TEXT_MODEL_PRESETS };

export function getAPISettings(): APISettings {
  try {
    const raw = localStorage.getItem(API_SETTINGS_KEY);
    if (raw) {
      return normalizeAPISettings(JSON.parse(raw) as Partial<APISettings>);
    }
  } catch {
    // ignore parse errors
  }

  return { profiles: [] };
}

export function saveAPISettings(settings: APISettings): void {
  const normalized = normalizeAPISettings(settings);
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
