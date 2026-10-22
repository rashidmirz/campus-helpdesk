const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const TOKEN_KEY = 'sou.token.v2';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY);
export const removeToken = () => localStorage.removeItem(TOKEN_KEY);

let onUnauthorizedCallback = null;
export const setOnUnauthorized = (cb) => { onUnauthorizedCallback = cb; };

export async function request(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  const token = getToken();

  const headers = { ...options.headers };
  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // If not FormData, default content-type to application/json
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(url, { ...options, headers });

  if (res.status === 401) {
    removeToken();
    if (onUnauthorizedCallback) {
      onUnauthorizedCallback();
    }
    const err = await res.json().catch(() => ({ detail: 'Unauthorized' }));
    throw new Error(err.detail || 'Session expired. Please sign in again.');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || err.message || `Request failed with status ${res.status}`);
  }

  // Handle 204 No Content
  if (res.status === 204) return null;

  return res.json().catch(() => null);
}

export const http = {
  get: (endpoint, options) => request(endpoint, { method: 'GET', ...options }),
  post: (endpoint, body, options) => request(endpoint, {
    method: 'POST',
    body: body instanceof FormData ? body : JSON.stringify(body),
    ...options
  }),
  patch: (endpoint, body, options) => request(endpoint, {
    method: 'PATCH',
    body: JSON.stringify(body),
    ...options
  }),
  delete: (endpoint, options) => request(endpoint, { method: 'DELETE', ...options }),
  upload: (endpoint, formData, options) => request(endpoint, {
    method: 'POST',
    body: formData,
    ...options
  })
};
