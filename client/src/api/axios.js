import axios from 'axios';
import useStore from '../store';

const rawUrl = (import.meta.env.VITE_API_URL || '/api').trim();
// Auto-append '/api' if a full URL was provided without the '/api' suffix
const baseURL = rawUrl.startsWith('http') && !rawUrl.replace(/\/+$/, '').endsWith('/api')
  ? `${rawUrl.replace(/\/+$/, '')}/api`
  : rawUrl;

const api = axios.create({
  baseURL,
});

api.interceptors.request.use(config => {
  const token = useStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) useStore.getState().logout();
    return Promise.reject(err);
  }
);

export default api;
