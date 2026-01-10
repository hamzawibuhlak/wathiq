import axios from 'axios';

export const apiClient = axios.create({
  baseURL: 'https://api.bewathiq.com',
  withCredentials: true,
});

// 🔑 هذا أهم جزء
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);
