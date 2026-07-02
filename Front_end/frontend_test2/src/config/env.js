const DEFAULT_API_BASE_URL = 'http://localhost:8080';
const WS_ENDPOINT = '/ws';

const isHttpsPage = typeof window !== 'undefined' && window.location.protocol === 'https:';

const trimTrailingSlash = (value) => value.replace(/\/+$/, '');

const normalizeUrl = (value, fallback) => {
  const rawValue = trimTrailingSlash(value || fallback);

  try {
    const url = new URL(rawValue);

    if (isHttpsPage && url.protocol === 'http:') {
      url.protocol = 'https:';
    }

    return trimTrailingSlash(url.toString());
  } catch {
    return rawValue;
  }
};

const appendPath = (baseUrl, path) => {
  try {
    const url = new URL(baseUrl);
    url.pathname = `${trimTrailingSlash(url.pathname)}${path}`;
    return trimTrailingSlash(url.toString());
  } catch {
    return `${trimTrailingSlash(baseUrl)}${path}`;
  }
};

const normalizeWebSocketUrl = (value) => {
  const normalizedUrl = normalizeUrl(value, appendPath(API_BASE_URL, WS_ENDPOINT));

  try {
    const url = new URL(normalizedUrl);

    if (!trimTrailingSlash(url.pathname).endsWith(WS_ENDPOINT)) {
      url.pathname = `${trimTrailingSlash(url.pathname)}${WS_ENDPOINT}`;
    }

    return trimTrailingSlash(url.toString());
  } catch {
    return trimTrailingSlash(normalizedUrl).endsWith(WS_ENDPOINT)
      ? normalizedUrl
      : `${trimTrailingSlash(normalizedUrl)}${WS_ENDPOINT}`;
  }
};

export const API_BASE_URL = normalizeUrl(
  import.meta.env.VITE_API_BASE_URL,
  DEFAULT_API_BASE_URL
);
export const WS_BASE_URL = normalizeWebSocketUrl(import.meta.env.VITE_WS_BASE_URL);
export const IS_PRODUCTION = import.meta.env.MODE === 'production';

console.log('[ENV] MODE:', import.meta.env.MODE);
console.log('[ENV] API_BASE_URL:', API_BASE_URL);
console.log('[ENV] WS_BASE_URL:', WS_BASE_URL);
