/* ═══════════════════════════════════════════════════
   Project Configuration Mock Data
   ═══════════════════════════════════════════════════ */

// ── Types ──

export type ChecklistStatus = 'configured' | 'not_configured' | 'warning' | 'error';

export interface SetupChecklistItem {
    id: string;
    name: string;
    status: ChecklistStatus;
    description: string;
    configGroup: string;
    debugInfo: string;
}

export interface ModelMapping {
    agentName: string;
    provider: string;
    model: string;
    temperature: number;
    maxTokens: number;
    required: boolean;
}

export interface PromptTemplate {
    id: string;
    agentName: string;
    name: string;
    promptText: string;
    variables: string[];
}

export interface ApprovalRule {
    id: string;
    contentType: string;
    approvers: string[];
    minApprovals: number;
    autoApprove: boolean;
}

export interface MediaPolicy {
    imageMaxSizeMB: number;
    imageFormats: string[];
    videoMaxDurationSec: number;
    videoFormats: string[];
    watermark: boolean;
    autoCompress: boolean;
    cdnUrl: string;
}

export interface WorkflowStep {
    id: string;
    name: string;
    order: number;
    enabled: boolean;
    required: boolean;
}

export type SocialPlatform = 'facebook' | 'linkedin' | 'tiktok' | 'youtube';
export type ChannelStatus = 'connected' | 'disconnected' | 'error';
export type ToneStyle = 'professional' | 'casual' | 'news' | 'engaging';

export interface SocialChannel {
    id: string;
    platform: SocialPlatform;
    platformLabel: string;
    pageId: string;
    pageName: string;
    status: ChannelStatus;
    enabled: boolean;
    token: string;
    defaultTemplate: string;
    tone: ToneStyle;
    hashtagRules: string;
    ctaRules: string;
    contentLengthLimit: number;
    mediaRequirement: string[];
    schedulingEnabled: boolean;
    retryPolicy: { maxRetries: number; cooldownMin: number };
    categoryMapping: string[];
    aiPublishPermission: boolean;
    debugInfo: string;
}
export interface ApiIntegration {
    id: string;
    name: string;
    icon: string;
    status: 'connected' | 'disconnected';
    apiKey?: string;
    lastSync?: string;
}

export interface AiProvider {
    id: string;
    name: string;
    models: string[];
    status: 'connected' | 'disconnected';
    apiKey?: string;
    lastVerified?: string;
    baseUrl?: string;
}

export interface AiTaskConfig {
    id: string;
    task: string;
    provider: string;
    model: string;
}

export interface Webhook {
    id: string;
    url: string;
    events: string[];
    status: 'active' | 'inactive';
    lastTriggered?: string;
}

export interface GeneralSettings {
    siteName: string;
    timezone: string;
    language: string;
    defaultDesk: string;
}

export interface ChannelTemplate {
    id: string;
    channel: SocialPlatform;
    channelLabel: string;
    captionTemplate: string;
    headlineTemplate: string;
    summaryTemplate: string;
    hashtagRule: 'manual' | 'auto_tags' | 'ai_generate';
    ctaPreset: string;
    tonePreset: ToneStyle;
    defaultLength: number;
    allowVariant: boolean;
}

export interface ChannelPublishRule {
    channel: SocialPlatform;
    channelLabel: string;
    publishMode: 'immediate' | 'schedule_required';
    defaultTimeSlots: string[];
    maxRetries: number;
    duplicatePrevention: boolean;
    mediaValidation: boolean;
    mediaRules: string;
    fallbackBehavior: 'skip' | 'queue' | 'notify_admin';
    approvalRequired: boolean;
}

export interface TaxonomyItem {
    id: string;
    name: string;
    type: 'category' | 'tag' | 'desk';
    parent?: string;
}

export interface NotificationRule {
    id: string;
    event: string;
    channel: string;
    recipients: string[];
}

export interface AuditLogEntry {
    id: string;
    timestamp: string;
    user: string;
    action: string;
    target: string;
    oldValue: string;
    newValue: string;
}

export interface KnowledgeSource {
    id: string;
    type: 'url' | 'file' | 'api';
    url: string;
    status: 'indexed' | 'pending' | 'error';
    lastIndexed: string;
}

export interface QuotaConfig {
    monthlyBudget: number;
    alertThreshold: number;
    perUserDailyLimit: number;
    autoBlock: boolean;
}

export interface AssetFinanceConfig {
    costCategories: string[];
    revenueTracking: boolean;
    roiMethod: 'simple' | 'weighted' | 'time_decay';
    currency: string;
}