export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
export const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL || 'http://localhost:8080/ws';
export const IS_PRODUCTION = import.meta.env.MODE === 'production';

console.log('[ENV] MODE:', import.meta.env.MODE);
console.log('[ENV] API_BASE_URL:', API_BASE_URL);
console.log('[ENV] WS_BASE_URL:', WS_BASE_URL);