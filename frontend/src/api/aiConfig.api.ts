import api from './client';

export interface ProviderConfig {
    apiKey: string;
    model: string;
    configured: boolean;
}

export interface AiConfig {
    provider: string;
    openai: ProviderConfig;
    anthropic: ProviderConfig;
    openrouter: ProviderConfig;
}

export interface AiPrompt {
    key: string;
    label: string;
    description: string;
    prompt: string;
    defaultPrompt: string;
    isCustom: boolean;
}

export interface UpdateAiConfigDto {
    provider?: string;
    openaiApiKey?: string;
    openaiModel?: string;
    anthropicApiKey?: string;
    anthropicModel?: string;
    openrouterApiKey?: string;
    openrouterModel?: string;
}

export interface TestConnectionResult {
    success: boolean;
    message: string;
    model?: string;
    response?: string;
}

export const aiConfigApi = {
    getConfig: () =>
        api.get<{ data: AiConfig }>('/ai/config').then((r) => r.data),

    updateConfig: (data: UpdateAiConfigDto) =>
        api.patch<{ message: string; data: AiConfig }>('/ai/config', data).then((r) => r.data),

    testConnection: (provider: string) =>
        api.post<TestConnectionResult>('/ai/config/test', { provider }).then((r) => r.data),

    getPrompts: () =>
        api.get<{ data: AiPrompt[] }>('/ai/config/prompts').then((r) => r.data),

    updatePrompt: (key: string, prompt: string) =>
        api.patch<{ message: string }>(`/ai/config/prompts/${key}`, { prompt }).then((r) => r.data),

    resetPrompt: (key: string) =>
        api.delete<{ message: string; data: { key: string; prompt: string } }>(`/ai/config/prompts/${key}`).then((r) => r.data),
};
