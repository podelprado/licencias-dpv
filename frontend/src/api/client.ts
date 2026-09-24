import axios from 'axios';
import toast from 'react-hot-toast';

const BASE_URL = (window as any).__ELECTRON_API_URL__ || '/api';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Inyectar token en cada request (desde Zustand persist o localStorage)
apiClient.interceptors.request.use((config) => {
  const stored = localStorage.getItem('auth-storage');
  let token: string | null = null;
  if (stored) {
    try { token = JSON.parse(stored)?.state?.token; } catch {}
  }
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Manejo global de errores
apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    const raw = error.response?.data?.message;
    const message = Array.isArray(raw) ? raw.join(', ') : raw || 'Error de conexión';

    if (error.response?.status === 401) {
      localStorage.removeItem('auth-storage');
      window.location.href = '/login';
    } else if (error.response?.status !== 404) {
      toast.error(typeof message === 'string' ? message : 'Error inesperado');
    }
    return Promise.reject(error);
  },
);
