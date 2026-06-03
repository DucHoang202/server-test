import { SetupChecklistItem, ModelMapping, PromptTemplate, ApprovalRule, MediaPolicy, WorkflowStep, SocialChannel, ChannelTemplate, ChannelPublishRule, TaxonomyItem, NotificationRule, AuditLogEntry, KnowledgeSource, QuotaConfig, AssetFinanceConfig, SocialPlatform, ToneStyle } from "../model";

// ── Data ──

export const setupChecklist: SetupChecklistItem[] = [
    { id: '1', name: 'AI Provider + Model Mapping', status: 'configured', description: 'Cấu hình nhà cung cấp AI và mapping model cho từng agent', configGroup: 'ai-providers', debugInfo: 'OpenAI connected, 7/7 editorial agents mapped, 5/5 SEO agents mapped' },
    { id: '2', name: 'Publishing Integration', status: 'warning', description: 'Kết nối kênh phân phối nội dung', configGroup: 'social-channels', debugInfo: 'Facebook: connected, LinkedIn: disconnected, TikTok: disconnected, YouTube: connected' },
    { id: '3', name: 'Approval Rules', status: 'configured', description: 'Thiết lập quy trình phê duyệt nội dung', configGroup: 'approval-rules', debugInfo: '3 rules configured, all content types covered' },
    { id: '4', name: 'Desk / Taxonomy', status: 'configured', description: 'Cấu hình chuyên mục, tag, desk', configGroup: 'taxonomy', debugInfo: '5 categories, 12 tags, 3 desks' },
    { id: '5', name: 'Media Policy', status: 'not_configured', description: 'Chính sách media: kích thước, format, watermark', configGroup: 'media-config', debugInfo: 'No media policy configured' },
    { id: '6', name: 'Quota / Cost Threshold', status: 'error', description: 'Giới hạn ngân sách và chi phí AI', configGroup: 'quota', debugInfo: 'Monthly budget exceeded: $520/$500. Alert threshold at 80%' },
];

export const editorialModelMapping: ModelMapping[] = [
    { agentName: 'Research Agent', provider: 'openai', model: 'GPT-4o', temperature: 0.3, maxTokens: 8192, required: true },
    { agentName: 'Angle Agent', provider: 'anthropic', model: 'Claude 3.5 Sonnet', temperature: 0.7, maxTokens: 4096, required: true },
    { agentName: 'Outline Agent', provider: 'openai', model: 'GPT-4o', temperature: 0.5, maxTokens: 4096, required: true },
    { agentName: 'Writer Agent', provider: 'anthropic', model: 'Claude 3.5 Sonnet', temperature: 0.8, maxTokens: 16384, required: true },
    { agentName: 'Editor Agent', provider: 'openai', model: 'GPT-4o Mini', temperature: 0.3, maxTokens: 8192, required: true },
    { agentName: 'Thumbnail Agent', provider: 'openai', model: 'GPT-4o', temperature: 0.6, maxTokens: 2048, required: false },
    { agentName: 'Section Image Agent', provider: 'google', model: 'Gemini 2.0 Flash', temperature: 0.5, maxTokens: 2048, required: false },
];

export const seoModelMapping: ModelMapping[] = [
    { agentName: 'Keyword Research Agent', provider: 'openai', model: 'GPT-4o', temperature: 0.2, maxTokens: 4096, required: true },
    { agentName: 'SEO Outline Agent', provider: 'openai', model: 'GPT-4o', temperature: 0.4, maxTokens: 4096, required: true },
    { agentName: 'SEO Content Agent', provider: 'anthropic', model: 'Claude 3.5 Sonnet', temperature: 0.7, maxTokens: 16384, required: true },
    { agentName: 'SEO Optimize Agent', provider: 'openai', model: 'GPT-4o Mini', temperature: 0.3, maxTokens: 4096, required: true },
    { agentName: 'Media Agent', provider: 'google', model: 'Gemini 2.0 Flash', temperature: 0.5, maxTokens: 2048, required: false },
];

export const promptTemplates: PromptTemplate[] = [
    { id: '1', agentName: 'Research Agent', name: 'Default Research', promptText: 'Research the topic "{topic}" and provide key facts, statistics, and expert opinions. Focus on {angle}.', variables: ['topic', 'angle'] },
    { id: '2', agentName: 'Writer Agent', name: 'Long-form Article', promptText: 'Write a comprehensive article about "{topic}" following the outline: {outline}. Target audience: {audience}. Tone: {tone}.', variables: ['topic', 'outline', 'audience', 'tone'] },
    { id: '3', agentName: 'Editor Agent', name: 'Final Polish', promptText: 'Edit the following article for grammar, clarity, and SEO. Maintain {tone} tone. Article: {content}', variables: ['tone', 'content'] },
    { id: '4', agentName: 'SEO Content Agent', name: 'SEO Optimized', promptText: 'Write SEO-optimized content for keyword "{keyword}" with search intent "{intent}". Include headers, meta description.', variables: ['keyword', 'intent'] },
];

export const approvalRules: ApprovalRule[] = [
    { id: '1', contentType: 'Article', approvers: ['Editor', 'Admin'], minApprovals: 1, autoApprove: false },
    { id: '2', contentType: 'Editorial', approvers: ['Editor-in-Chief', 'Admin'], minApprovals: 2, autoApprove: false },
    { id: '3', contentType: 'Social Post', approvers: ['Social Manager'], minApprovals: 1, autoApprove: true },
];

export const mediaPolicy: MediaPolicy = {
    imageMaxSizeMB: 5,
    imageFormats: ['jpg', 'png', 'webp', 'svg'],
    videoMaxDurationSec: 300,
    videoFormats: ['mp4', 'webm'],
    watermark: false,
    autoCompress: true,
    cdnUrl: '',
};

export const workflowSteps: WorkflowStep[] = [
    { id: '1', name: 'Idea / Brief', order: 1, enabled: true, required: true },
    { id: '2', name: 'Research', order: 2, enabled: true, required: true },
    { id: '3', name: 'Outline', order: 3, enabled: true, required: true },
    { id: '4', name: 'Writing', order: 4, enabled: true, required: true },
    { id: '5', name: 'Editing', order: 5, enabled: true, required: true },
    { id: '6', name: 'Review / Approval', order: 6, enabled: true, required: true },
    { id: '7', name: 'Media Production', order: 7, enabled: true, required: false },
    { id: '8', name: 'Publishing', order: 8, enabled: true, required: true },
];

export const socialChannels: SocialChannel[] = [
    {
        id: '1', platform: 'facebook', platformLabel: 'Facebook Page',
        pageId: 'metapress.vn', pageName: 'MetaPress Vietnam',
        status: 'connected', enabled: true, token: 'fb_••••••3k9x',
        defaultTemplate: 'fb-default', tone: 'engaging',
        hashtagRules: '#metapress, #news, #vietnam', ctaRules: 'Đọc thêm tại link',
        contentLengthLimit: 2200, mediaRequirement: ['image', 'video'],
        schedulingEnabled: true, retryPolicy: { maxRetries: 3, cooldownMin: 156 },
        categoryMapping: ['Tin tức', 'Phân tích'], aiPublishPermission: false,
        debugInfo: 'Last sync: 2025-06-15 08:00. Token expires: 2025-08-15',
    },
    {
        id: '2', platform: 'linkedin', platformLabel: 'LinkedIn Page',
        pageId: '', pageName: '',
        status: 'disconnected', enabled: false, token: '',
        defaultTemplate: '', tone: 'professional',
        hashtagRules: '', ctaRules: '',
        contentLengthLimit: 3000, mediaRequirement: ['image'],
        schedulingEnabled: false, retryPolicy: { maxRetries: 2, cooldownMin: 30 },
        categoryMapping: [], aiPublishPermission: false,
        debugInfo: 'Not connected. Requires LinkedIn OAuth.',
    },
    {
        id: '3', platform: 'tiktok', platformLabel: 'TikTok',
        pageId: '', pageName: '',
        status: 'disconnected', enabled: false, token: '',
        defaultTemplate: '', tone: 'casual',
        hashtagRules: '', ctaRules: '',
        contentLengthLimit: 2200, mediaRequirement: ['video'],
        schedulingEnabled: false, retryPolicy: { maxRetries: 2, cooldownMin: 10 },
        categoryMapping: [], aiPublishPermission: false,
        debugInfo: 'Not connected. Requires TikTok Business API.',
    },
    {
        id: '4', platform: 'youtube', platformLabel: 'YouTube',
        pageId: 'UC_metapress', pageName: 'MetaPress Channel',
        status: 'connected', enabled: true, token: 'yt_••••••a2mz',
        defaultTemplate: 'yt-default', tone: 'professional',
        hashtagRules: '#metapress, #analysis', ctaRules: 'Subscribe & Like',
        contentLengthLimit: 5000, mediaRequirement: ['video', 'thumbnail'],
        schedulingEnabled: true, retryPolicy: { maxRetries: 3, cooldownMin: 60 },
        categoryMapping: ['Video', 'Phân tích'], aiPublishPermission: true,
        debugInfo: 'Last sync: 2025-06-14 22:00. Quota: 85% used.',
    },
];

export const channelTemplates: ChannelTemplate[] = [
    { id: '1', channel: 'facebook', channelLabel: 'Facebook', captionTemplate: '{title}\n\n{summary}\n\n{hashtags}\n\n{cta}', headlineTemplate: '{title} | MetaPress', summaryTemplate: '{summary}', hashtagRule: 'ai_generate', ctaPreset: 'Đọc thêm', tonePreset: 'engaging', defaultLength: 500, allowVariant: true },
    { id: '2', channel: 'linkedin', channelLabel: 'LinkedIn', captionTemplate: '{title}\n\n{summary}\n\n{hashtags}', headlineTemplate: '{title}', summaryTemplate: '{summary}', hashtagRule: 'auto_tags', ctaPreset: 'Learn more', tonePreset: 'professional', defaultLength: 700, allowVariant: true },
    { id: '3', channel: 'tiktok', channelLabel: 'TikTok', captionTemplate: '{title} {hashtags}', headlineTemplate: '{title}', summaryTemplate: '', hashtagRule: 'ai_generate', ctaPreset: 'Follow for more', tonePreset: 'casual', defaultLength: 150, allowVariant: false },
    { id: '4', channel: 'youtube', channelLabel: 'YouTube', captionTemplate: '{summary}\n\n{hashtags}\n\n{cta}', headlineTemplate: '{title} | MetaPress', summaryTemplate: '{summary}', hashtagRule: 'manual', ctaPreset: 'Subscribe & Like', tonePreset: 'professional', defaultLength: 1000, allowVariant: true },
];

export const channelPublishRules: ChannelPublishRule[] = [
    { channel: 'facebook', channelLabel: 'Facebook', publishMode: 'schedule_required', defaultTimeSlots: ['08:00', '12:00', '18:00'], maxRetries: 3, duplicatePrevention: true, mediaValidation: true, mediaRules: 'Min 1200x630 image', fallbackBehavior: 'queue', approvalRequired: false },
    { channel: 'linkedin', channelLabel: 'LinkedIn', publishMode: 'schedule_required', defaultTimeSlots: ['09:00', '14:00'], maxRetries: 2, duplicatePrevention: true, mediaValidation: true, mediaRules: 'Min 1200x627 image', fallbackBehavior: 'notify_admin', approvalRequired: true },
    { channel: 'tiktok', channelLabel: 'TikTok', publishMode: 'immediate', defaultTimeSlots: ['11:00', '19:00', '21:00'], maxRetries: 2, duplicatePrevention: true, mediaValidation: true, mediaRules: 'Video 9:16, min 720p', fallbackBehavior: 'skip', approvalRequired: true },
    { channel: 'youtube', channelLabel: 'YouTube', publishMode: 'schedule_required', defaultTimeSlots: ['10:00', '17:00'], maxRetries: 3, duplicatePrevention: true, mediaValidation: true, mediaRules: 'Video 16:9, min 1080p, thumbnail 1280x720', fallbackBehavior: 'queue', approvalRequired: true },
];

export const taxonomy: TaxonomyItem[] = [
    { id: '1', name: 'Tin tức', type: 'category' },
    { id: '2', name: 'Phân tích', type: 'category' },
    { id: '3', name: 'Hướng dẫn', type: 'category' },
    { id: '4', name: 'Review', type: 'category' },
    { id: '5', name: 'Opinion', type: 'category' },
    { id: '6', name: 'AI', type: 'tag' },
    { id: '7', name: 'Tech', type: 'tag' },
    { id: '8', name: 'Marketing', type: 'tag' },
    { id: '9', name: 'Finance', type: 'tag' },
    { id: '10', name: 'Startup', type: 'tag' },
    { id: '11', name: 'Content Desk', type: 'desk' },
    { id: '12', name: 'Editorial Desk', type: 'desk' },
    { id: '13', name: 'SEO Desk', type: 'desk' },
];

export const notificationRules: NotificationRule[] = [
    { id: '1', event: 'content.published', channel: 'slack', recipients: ['#content-team'] },
    { id: '2', event: 'editorial.completed', channel: 'email', recipients: ['editor@metapress.vn'] },
    { id: '3', event: 'content.review', channel: 'telegram', recipients: ['@reviewer_bot'] },
    { id: '4', event: 'quota.exceeded', channel: 'email', recipients: ['admin@metapress.vn', 'finance@metapress.vn'] },
];

export const auditLogs: AuditLogEntry[] = [
    { id: '1', timestamp: '2025-06-15 09:45:12', user: 'Admin', action: 'UPDATE', target: 'AI Provider - OpenAI', oldValue: 'GPT-4o Mini', newValue: 'GPT-4o' },
    { id: '2', timestamp: '2025-06-15 09:30:00', user: 'Admin', action: 'ENABLE', target: 'Social Channel - YouTube', oldValue: 'disabled', newValue: 'enabled' },
    { id: '3', timestamp: '2025-06-14 18:20:00', user: 'Editor', action: 'CREATE', target: 'Approval Rule - Social Post', oldValue: '—', newValue: 'Auto-approve enabled' },
    { id: '4', timestamp: '2025-06-14 15:00:00', user: 'Admin', action: 'UPDATE', target: 'Quota - Monthly Budget', oldValue: '$400', newValue: '$500' },
    { id: '5', timestamp: '2025-06-13 10:00:00', user: 'Admin', action: 'CONNECT', target: 'Facebook Page', oldValue: '—', newValue: 'MetaPress Vietnam' },
    { id: '6', timestamp: '2025-06-12 14:30:00', user: 'Admin', action: 'UPDATE', target: 'Media Policy', oldValue: 'watermark: on', newValue: 'watermark: off' },
    { id: '7', timestamp: '2025-06-11 09:00:00', user: 'System', action: 'ALERT', target: 'Quota', oldValue: '—', newValue: 'Budget exceeded 80% threshold' },
    { id: '8', timestamp: '2025-06-10 16:00:00', user: 'Admin', action: 'CREATE', target: 'Prompt Template - Writer Agent', oldValue: '—', newValue: 'Long-form Article template' },
];

export const knowledgeSources: KnowledgeSource[] = [
    { id: '1', type: 'url', url: 'https://docs.metapress.vn/style-guide', status: 'indexed', lastIndexed: '2025-06-14' },
    { id: '2', type: 'file', url: 'brand-guidelines-v3.pdf', status: 'indexed', lastIndexed: '2025-06-10' },
    { id: '3', type: 'api', url: 'https://api.metapress.vn/knowledge/v1', status: 'pending', lastIndexed: '—' },
];

export const quotaConfig: QuotaConfig = {
    monthlyBudget: 500,
    alertThreshold: 80,
    perUserDailyLimit: 5000,
    autoBlock: true,
};

export const assetFinanceConfig: AssetFinanceConfig = {
    costCategories: ['AI Generation', 'Media Production', 'Distribution', 'Licensing'],
    revenueTracking: true,
    roiMethod: 'weighted',
    currency: 'USD',
};

// Helpers
export const TONE_OPTIONS: { value: ToneStyle; label: string }[] = [
    { value: 'professional', label: 'Professional' },
    { value: 'casual', label: 'Casual' },
    { value: 'news', label: 'News' },
    { value: 'engaging', label: 'Engaging' },
];

export const PLATFORMS: { value: SocialPlatform; label: string }[] = [
    { value: 'facebook', label: 'Facebook' },
    { value: 'linkedin', label: 'LinkedIn' },
    { value: 'tiktok', label: 'TikTok' },
    { value: 'youtube', label: 'YouTube' },
];

export const CTA_PRESETS = ['Đọc thêm', 'Read more', 'Shop now', 'Learn more', 'Subscribe', 'Follow', 'Custom'];

export const NOTIFICATION_EVENTS = [
    'content.created', 'content.published', 'content.review',
    'editorial.completed', 'editorial.review',
    'campaign.created', 'quota.exceeded', 'user.login',
];
