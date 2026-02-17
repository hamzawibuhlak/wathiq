import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../utils/constants';

// ═══════════════════════════════════════════════════════════
// API Client — mirrors frontend/src/api structure
// ═══════════════════════════════════════════════════════════

class ApiService {
    private client: AxiosInstance;
    private tenantSlug: string | null = null;

    constructor() {
        this.client = axios.create({
            baseURL: API_BASE_URL,
            timeout: 30000,
            headers: { 'Content-Type': 'application/json' },
        });

        // ── Request Interceptor ─────────────────
        this.client.interceptors.request.use(
            async (config: InternalAxiosRequestConfig) => {
                const token = await AsyncStorage.getItem('auth_token');
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                console.log(`🌐 API ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
                return config;
            },
            (error) => Promise.reject(error),
        );

        // ── Response Interceptor ────────────────
        this.client.interceptors.response.use(
            (response) => {
                console.log(`✅ API ${response.status} ${response.config.url}`, JSON.stringify(response.data).substring(0, 200));
                return response;
            },
            async (error: AxiosError) => {
                console.log(`❌ API Error ${error.response?.status} ${error.config?.url}`, error.response?.data);
                if (error.response?.status === 401) {
                    // Token expired — clear auth
                    await AsyncStorage.multiRemove(['auth_token', 'auth_user', 'tenant_slug']);
                    // Navigation will be handled by auth state listener
                }
                return Promise.reject(error);
            },
        );
    }

    setTenantSlug(slug: string) {
        this.tenantSlug = slug;
    }

    private getUrl(path: string): string {
        if (this.tenantSlug && !path.startsWith('/auth')) {
            return `/${this.tenantSlug}${path}`;
        }
        return path;
    }

    // ── HTTP Methods ──────────────────────────
    async get<T>(path: string, params?: object): Promise<T> {
        const res = await this.client.get<T>(this.getUrl(path), { params });
        return res.data;
    }

    async post<T>(path: string, data?: object): Promise<T> {
        const res = await this.client.post<T>(this.getUrl(path), data);
        return res.data;
    }

    async patch<T>(path: string, data?: object): Promise<T> {
        const res = await this.client.patch<T>(this.getUrl(path), data);
        return res.data;
    }

    async put<T>(path: string, data?: object): Promise<T> {
        const res = await this.client.put<T>(this.getUrl(path), data);
        return res.data;
    }

    async delete<T>(path: string): Promise<T> {
        const res = await this.client.delete<T>(this.getUrl(path));
        return res.data;
    }

    // ── Upload (multipart) ────────────────────
    async upload<T>(path: string, formData: FormData): Promise<T> {
        const res = await this.client.post<T>(this.getUrl(path), formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 120000,
        });
        return res.data;
    }

    // ── Auth endpoints (no tenant prefix) ─────
    async login(tenantSlug: string, email: string, password: string) {
        const res = await this.client.post('/auth/login', { email, password });
        this.tenantSlug = tenantSlug;
        return res.data;
    }
}

export const apiService = new ApiService();
export default apiService;
