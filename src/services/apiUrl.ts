const OPENAI_OFFICIAL_BASE_URL = 'https://api.openai.com/v1';
const API_PROXY_PREFIX = '/api-proxy';

const hasProtocol = (value: string): boolean => /^[a-zA-Z][a-zA-Z\d+.-]*:\/\//.test(value);

const stripKnownOpenAIEndpoint = (segments: string[]): string[] => {
  const joined = segments.join('/').toLowerCase();
  const suffixes = [
    'chat/completions',
    'images/generations',
    'images/edits',
    'responses',
    'models',
  ];

  for (const suffix of suffixes) {
    if (joined === suffix) return [];
    if (joined.endsWith(`/${suffix}`)) return segments.slice(0, -suffix.split('/').length);
  }

  return segments;
};

export function normalizeOpenAIBaseUrl(baseUrl: string): string {
  const trimmed = baseUrl.trim();
  if (!trimmed) return OPENAI_OFFICIAL_BASE_URL;

  const input = hasProtocol(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const url = new URL(input);
    const segments = url.pathname.split('/').filter(Boolean);
    const v1Index = segments.findIndex(segment => segment.toLowerCase() === 'v1');
    const normalizedSegments = v1Index >= 0
      ? segments.slice(0, v1Index + 1)
      : [...stripKnownOpenAIEndpoint(segments), 'v1'];

    return `${url.origin}/${normalizedSegments.join('/')}`.replace(/\/+$/, '');
  } catch {
    return trimmed.replace(/\/+$/, '');
  }
}

export function buildOpenAICompatibleUrl(baseUrl: string, path: string): string {
  const normalizedBaseUrl = normalizeOpenAIBaseUrl(baseUrl);
  const endpointPath = path.replace(/^\/+/, '');
  return `${normalizedBaseUrl}/${endpointPath}`;
}

const shouldUseLocalApiProxy = (url: string): boolean => {
  if (!import.meta.env.DEV || typeof window === 'undefined') return false;

  try {
    const target = new URL(url);
    return target.origin !== window.location.origin;
  } catch {
    return false;
  }
};

export function buildApiProxyUrl(url: string): string {
  return `${API_PROXY_PREFIX}?target=${encodeURIComponent(url)}`;
}

export function buildRequestUrl(url: string): string {
  return shouldUseLocalApiProxy(url) ? buildApiProxyUrl(url) : url;
}

export function buildOpenAICompatibleRequestUrl(baseUrl: string, path: string): string {
  const url = buildOpenAICompatibleUrl(baseUrl, path);
  return buildRequestUrl(url);
}
