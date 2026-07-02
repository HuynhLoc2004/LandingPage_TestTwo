import axios from 'axios';
import { API_BASE_URL } from '../config/env';

const buildFullUrl = (config) => {
  const requestUrl = config?.url || '';
  const baseUrl = config?.baseURL || API_BASE_URL;

  try {
    return new URL(requestUrl, baseUrl).toString();
  } catch {
    return `${baseUrl}${requestUrl}`;
  }
};

const logApiError = (error) => {
  const status = error.response?.status ?? 'NO_RESPONSE';
  const url = buildFullUrl(error.config || {});
  const message = error.message || 'Unknown error';
  const responseBody = error.response?.data;

  console.error('[API ERROR]', {
    status,
    url,
    message,
    responseBody,
  });
};

const instance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

instance.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  console.log('[API REQUEST]', {
    method: (config.method || 'GET').toUpperCase(),
    url: buildFullUrl(config),
  });

  return config;
});

instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    logApiError(error);

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const response = await axios.post(
          `${API_BASE_URL}/auth/refresh-token`,
          {},
          { withCredentials: true }
        );
        const { accessToken } = response.data;

        localStorage.setItem('accessToken', accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        console.log('[API REQUEST]', {
          method: (originalRequest.method || 'GET').toUpperCase(),
          url: buildFullUrl(originalRequest),
          retry: true,
        });

        return instance(originalRequest);
      } catch (refreshError) {
        logApiError(refreshError);
        localStorage.removeItem('accessToken');
        window.dispatchEvent(new CustomEvent('auth:login-required'));
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default instance;
