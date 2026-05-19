import { APISettings, APIConfig, RequestLogEntry } from '../types';

const API_SETTINGS_KEY = 'muse-ui-api-settings';
const REQUEST_LOGS_KEY = 'muse-ui-request-logs';

// Legacy keys for migration
const LEGACY_API_KEY = 'muse-ui-gemini-api-key';
const LEGACY_BASE_URL = 'muse-ui-gemini-base-url';
const LEGACY_TEXT_MODEL = 'muse-ui-text-model';
const LEGACY_IMAGE_MODEL = 'muse-ui-image-model';

export const DEFAULT_TEXT_MODEL = 'gemini-2.5-flash';
export const DEFAULT_IMAGE_MODEL = 'nado-banana-2';

export const TEXT_MODEL_PRESETS = [
  'gemini-2.5-flash',
  'gemini-2.5-pro',
  'gemini-3-flash-preview',
  'gemini-3-pro-preview',
  'gpt-4o',
  'gpt-4o-mini',
  'claude-3-5-sonnet',
  'nado-banana-2',
];

export const IMAGE_MODEL_PRESETS = [
  'gemini-2.5-flash-image',
  'gemini-3-pro-image-preview',
  'gpt-image-2',
  'dall-e-3',
  'nado-banana-2',
];

const createDefaultSettings = (): APISettings => ({
  textAPIs: [],
  imageAPIs: [],
});

const migrateFromLegacy = (): APISettings | null => {
  const apiKey = localStorage.getItem(LEGACY_API_KEY);
  if (!apiKey) return null;

  const baseUrl = localStorage.getItem(LEGACY_BASE_URL) || '';
  const textModel = localStorage.getItem(LEGACY_TEXT_MODEL) || DEFAULT_TEXT_MODEL;
  const imageModel = localStorage.getItem(LEGACY_IMAGE_MODEL) || DEFAULT_IMAGE_MODEL;

  const shared: APIConfig = {
    id: crypto.randomUUID(),
    name: 'Legacy Config',
    provider: 'gemini',
    baseUrl,
    apiKey,
    textModel,
    imageModel,
    enabled: true,
  };

  // Clean up legacy keys
  localStorage.removeItem(LEGACY_API_KEY);
  localStorage.removeItem(LEGACY_BASE_URL);
  localStorage.removeItem(LEGACY_TEXT_MODEL);
  localStorage.removeItem(LEGACY_IMAGE_MODEL);

  return {
    textAPIs: [{ ...shared }],
    imageAPIs: [{ ...shared }],
  };
};

export function getAPISettings(): APISettings {
  try {
    const raw = localStorage.getItem(API_SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as APISettings;
      // Ensure arrays exist
      return {
        textAPIs: parsed.textAPIs || [],
        imageAPIs: parsed.imageAPIs || [],
      };
    }
  } catch {
    // ignore parse errors
  }

  const migrated = migrateFromLegacy();
  if (migrated) {
    saveAPISettings(migrated);
    return migrated;
  }

  return createDefaultSettings();
}

export function saveAPISettings(settings: APISettings): void {
  localStorage.setItem(API_SETTINGS_KEY, JSON.stringify(settings));
}

// Backward-compatible: returns true if at least one enabled API exists
export function hasAnyAPI(): boolean {
  const settings = getAPISettings();
  return settings.textAPIs.some(a => a.enabled) || settings.imageAPIs.some(a => a.enabled);
}

// Backward-compatible: returns first enabled text API key (for AppHeader hasKey check)
export function getApiKey(): string | null {
  const settings = getAPISettings();
  const first = settings.textAPIs.find(a => a.enabled);
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
  // Keep last 100
  if (logs.length > 100) logs.length = 100;
  localStorage.setItem(REQUEST_LOGS_KEY, JSON.stringify(logs));
}

export function clearRequestLogs(): void {
  localStorage.removeItem(REQUEST_LOGS_KEY);
}
