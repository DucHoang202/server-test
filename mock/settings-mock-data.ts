import { GeneralSettings, ApiIntegration, AiProvider, AiTaskConfig, Webhook } from "../model";
export const generalSettings: GeneralSettings = {
    siteName: 'MetaPress Media Hub',
    timezone: 'Asia/Ho_Chi_Minh (UTC+7)',
    language: 'Tiếng Việt',
    defaultDesk: 'Content',
};
export const aiParams = {
    temperature: 0.7,
    maxTokens: 4096,
    alertThreshold: 80,
    monthlyBudget: 500,
}

export const apiIntegrations: ApiIntegration[] = [
    { id: '1', name: 'Facebook', icon: 'facebook', status: 'connected', apiKey: 'fb_••••••••3k9x', lastSync: '2025-06-15 08:00' },
    { id: '2', name: 'YouTube', icon: 'youtube', status: 'connected', apiKey: 'yt_••••••••a2mz', lastSync: '2025-06-14 22:00' },
    { id: '3', name: 'WordPress', icon: 'globe', status: 'disconnected' },
    { id: '4', name: 'Shopify', icon: 'shopping-bag', status: 'disconnected' },
    { id: '5', name: 'Telegram', icon: 'send', status: 'connected', apiKey: 'tg_••••••••f7qr', lastSync: '2025-06-15 09:30' },
    { id: '6', name: 'LinkedIn', icon: 'linkedin', status: 'disconnected' },
];

export const aiProviders: AiProvider[] = [
    { id: 'openai', name: 'OpenAI', models: ['GPT-4o', 'GPT-4o Mini', 'o1', 'o1-mini'], status: 'connected', apiKey: 'sk-••••••••••••3k9x', lastVerified: '2025-06-15 08:00', baseUrl: 'https://api.openai.com/v1' },
    { id: 'anthropic', name: 'Anthropic', models: ['Claude 3.5 Sonnet', 'Claude 3.5 Haiku', 'Claude 3 Opus'], status: 'connected', apiKey: 'sk-ant-••••••••a2mz', lastVerified: '2025-06-14 22:00', baseUrl: 'https://api.anthropic.com' },
    { id: 'google', name: 'Google AI', models: ['Gemini 2.0 Flash', 'Gemini 1.5 Pro', 'Gemini 1.5 Flash'], status: 'disconnected' },
];

export const aiTaskConfigs: AiTaskConfig[] = [
    { id: "Research", task: 'Research', provider: 'openai', model: 'GPT-4o' },
    { id: "Writing", task: 'Writing', provider: 'anthropic', model: 'Claude 3.5 Sonnet' },
    { id: "Editing", task: 'Editing', provider: 'openai', model: 'GPT-4o Mini' },
];

export const tokenLimitsPerRole = [
    { role: 'Admin', limit: 100000 },
    { role: 'Editor', limit: 50000 },
    { role: 'Writer', limit: 30000 },
    { role: 'Reviewer', limit: 20000 },
    { role: 'Viewer', limit: 5000 },
];

export const aiConfig = {
    monthlyBudget: 500,
    alertThreshold: 80,
    temperature: 0.7,
    maxTokens: 4096,
};

export const webhooks: Webhook[] = [
    { id: '1', url: 'https://hooks.slack.com/services/T00/B00/xxx', events: ['content.published', 'content.updated'], status: 'active', lastTriggered: '2025-06-15 09:45' },
    { id: '2', url: 'https://api.analytics.io/webhook/metapress', events: ['content.published', 'campaign.created'], status: 'active', lastTriggered: '2025-06-14 18:20' },
    { id: '3', url: 'https://notify.internal.vn/editorial', events: ['editorial.completed', 'editorial.review'], status: 'inactive', lastTriggered: '2025-06-10 12:00' },
    { id: '4', url: 'https://cms-backup.example.com/sync', events: ['content.created', 'content.deleted'], status: 'active', lastTriggered: '2025-06-15 07:00' },
];

export const WEBHOOK_EVENTS = [
    'content.created', 'content.updated', 'content.published', 'content.deleted',
    'editorial.completed', 'editorial.review',
    'campaign.created', 'campaign.updated',
    'user.login', 'user.created',
];
