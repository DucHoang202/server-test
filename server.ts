// server.ts
import express from "express";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
// server.ts

dotenv.config();
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});
import cors from "cors";
import { Request, Response, NextFunction } from "express";
import writingStepRouter from "./draft-step";
import Anthropic from "@anthropic-ai/sdk";
import {
    apiIntegrations as initialApiIntegrations,
    aiProviders as initialAiProviders,
    aiTaskConfigs as initialAiTaskConfigs,
    webhooks as initialWebhooks,
    generalSettings as initialGeneralSettings,
    tokenLimitsPerRole,
    aiParams as initialAiParams,
} from './mock/settings-mock-data';
import {
    setupChecklist as initialSetupChecklist,
    editorialModelMapping as initialEditorial,
    seoModelMapping as initialSeo,
    promptTemplates as initialPromptTemplates,
    approvalRules as initialApprovalRules,
    mediaPolicy as initialMediaPolicy,
    workflowSteps as initialWorkflowSteps,
    socialChannels as initialSocialChannels,
    channelTemplates as initialChannelTemplates,
    channelPublishRules as initialChannelPublishRules,
    taxonomy as initialTaxonomy,
    notificationRules as initialNotificationRules,
    auditLogs as initialAuditLogs,
    knowledgeSources as initialKnowledgeSources,
    quotaConfig as initialQuotaConfig,
    assetFinanceConfig as initialAssetFinanceConfig,
} from './mock/project-config-mock-data';

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});
const app = express();
app.use(cors());
app.use(express.json()); // ← only once, at the top

// ====================
// Types
// ====================

type MediaItem = {
    id: string;
    name: string;
    type: string;
    source: string;
    url: string;
    thumbnailUrl: string;
    folderId: string | null;
    tags: string[];
    size: number;
    width?: number;
    height?: number;
    format: string;
    createdAt: string;
    updatedAt: string;
    uploadedBy: string;
    aiPrompt?: string;
    aiStyle?: string;
    aiModel?: string;
    linkedContentId?: string;
    linkedContentTitle?: string;
};

type MediaFolder = {
    id: string;
    name: string;
    parentId: string | null;
    itemCount: number;
    createdAt: string;
};

type User = {
    id: string;
    name: string;
    email: string;
    initials: string;
    role: string;
    team: string;
    status: string;
    lastLogin: string;
    aiTokensUsed: number;
    aiTokensLimit: number;
};

type Permission = {
    action: string;
    roles: Record<string, boolean>;
};

type ActivityEntry = {
    id: string;
    timestamp: string;
    user: string;
    action: string;
    target: string;
    ip: string;
};

type AiUsage = {
    role: string;
    tokens: number;
};

// ====================
// In-memory DB
// ====================

const placeholder = "/placeholder.svg";

let mediaItems: MediaItem[] = [
    {
        id: "media-001", name: "hero-banner-q1.jpg", type: "image", source: "upload",
        url: placeholder, thumbnailUrl: placeholder, folderId: "folder-2",
        tags: ["banner", "hero", "Q1"], size: 524288, width: 1920, height: 1080, format: "jpg",
        createdAt: "2025-01-12", updatedAt: "2025-01-12", uploadedBy: "Admin User",
    },
    {
        id: "media-002", name: "team-photo.png", type: "image", source: "upload",
        url: placeholder, thumbnailUrl: placeholder, folderId: "folder-6",
        tags: ["team", "about"], size: 1048576, width: 2400, height: 1600, format: "png",
        createdAt: "2025-01-20", updatedAt: "2025-01-20", uploadedBy: "Editor A",
    },
    {
        id: "media-ai-001", name: "ai-thumbnail-crypto.jpg", type: "image", source: "ai-generated",
        url: placeholder, thumbnailUrl: placeholder, folderId: null,
        tags: ["ai", "crypto", "thumbnail"], size: 307200, width: 1280, height: 720, format: "jpg",
        createdAt: "2025-02-20", updatedAt: "2025-02-20", uploadedBy: "AI Agent",
        aiPrompt: "A futuristic digital landscape", aiStyle: "Cinematic", aiModel: "flux.dev",
    },
];

let mediaFolders: MediaFolder[] = [
    { id: "folder-1", name: "Thumbnails", parentId: null, itemCount: 3, createdAt: "2025-01-01" },
    { id: "folder-2", name: "Banners", parentId: null, itemCount: 2, createdAt: "2025-01-01" },
    { id: "folder-3", name: "Social Media", parentId: null, itemCount: 5, createdAt: "2025-01-01" },
    { id: "ai-images", name: "AI Images", parentId: null, itemCount: 1, createdAt: new Date().toISOString() },
];

let users: User[] = [
    {
        id: "1", name: "Nguyễn Minh Tuấn", email: "tuan@metapress.vn",
        initials: "NT", role: "Admin", team: "Product", status: "active",
        lastLogin: "2025-06-15 09:23", aiTokensUsed: 45200, aiTokensLimit: 100000,
    },
    {
        id: "2", name: "Trần Thị Mai", email: "mai@metapress.vn",
        initials: "TM", role: "Editor", team: "Content", status: "active",
        lastLogin: "2025-06-15 08:45", aiTokensUsed: 32800, aiTokensLimit: 50000,
    },
];

const PERMISSION_ACTIONS = [
    "Create Content", "Edit Content", "Publish", "Delete",
    "Manage Users", "View Analytics", "AI Usage", "Settings",
];

let permissionMatrix: Permission[] = PERMISSION_ACTIONS.map((action) => ({
    action,
    roles: {
        Admin: true,
        Editor: ["Create Content", "Edit Content", "Publish", "View Analytics", "AI Usage"].includes(action),
        Writer: ["Create Content", "Edit Content", "AI Usage"].includes(action),
        Reviewer: ["Edit Content", "View Analytics"].includes(action),
        Viewer: ["View Analytics"].includes(action),
    },
}));

let activityLog: ActivityEntry[] = [
    { id: "1", timestamp: "2025-06-15 10:30", user: "Cao Minh Đức", action: "Login", target: "System", ip: "192.168.1.45" },
];

let aiUsageByRole: AiUsage[] = [
    { role: "Admin", tokens: 97200 },
    { role: "Editor", tokens: 54100 },
    { role: "Writer", tokens: 63500 },
    { role: "Reviewer", tokens: 14500 },
    { role: "Viewer", tokens: 1200 },
];

// ====================
// Helpers
// ====================

const generateId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const now = () => new Date().toISOString();

const notFound = (res: express.Response, entity: string) =>
    res.status(404).json({ success: false, error: `${entity} not found` });

const success = (res: express.Response, data: unknown, status = 200) =>
    res.status(status).json({ success: true, data });

// ====================
// Media Items CRUD
// ====================

app.get("/api/media-items", (_, res) => {
    success(res, mediaItems);
});

app.get("/api/media-items/:id", (req, res) => {
    const item = mediaItems.find((i) => i.id === req.params.id);
    if (!item) return notFound(res, "Media item");
    success(res, item);
});

app.post("/api/media-items", (req, res) => {
    const body = req.body;
    const newItem: MediaItem = {
        id: generateId("media"),
        name: body.name ?? "Untitled",
        type: body.type ?? "image",
        source: body.source ?? "upload",
        url: body.url ?? placeholder,
        thumbnailUrl: body.thumbnailUrl ?? placeholder,
        folderId: body.folderId ?? null,
        tags: body.tags ?? [],
        size: body.size ?? 0,
        width: body.width,
        height: body.height,
        format: body.format ?? "jpg",
        createdAt: now(),
        updatedAt: now(),
        uploadedBy: body.uploadedBy ?? "Unknown",
        aiPrompt: body.aiPrompt,
        aiStyle: body.aiStyle,
        aiModel: body.aiModel,
        linkedContentId: body.linkedContentId,
        linkedContentTitle: body.linkedContentTitle,
    };
    mediaItems.push(newItem);
    success(res, newItem, 201);
});

app.patch("/api/media-items/:id", (req, res) => {
    const index = mediaItems.findIndex((i) => i.id === req.params.id);
    if (index === -1) return notFound(res, "Media item");
    mediaItems[index] = { ...mediaItems[index], ...req.body, updatedAt: now() };
    success(res, mediaItems[index]);
});

app.delete("/api/media-items/:id", (req, res) => {
    const index = mediaItems.findIndex((i) => i.id === req.params.id);
    if (index === -1) return notFound(res, "Media item");
    const deleted = mediaItems.splice(index, 1)[0];
    success(res, deleted);
});

// ====================
// Media Folders CRUD
// ====================

app.get("/api/media-folders", (_, res) => {
    success(res, mediaFolders);
});

app.get("/api/media-folders/:id", (req, res) => {
    const folder = mediaFolders.find((f) => f.id === req.params.id);
    if (!folder) return notFound(res, "Media folder");
    success(res, folder);
});

app.post("/api/media-folders", (req, res) => {
    const body = req.body;
    const newFolder: MediaFolder = {
        id: generateId("folder"),
        name: body.name ?? "New Folder",
        parentId: body.parentId ?? null,
        itemCount: 0,
        createdAt: now(),
    };
    mediaFolders.push(newFolder);
    success(res, newFolder, 201);
});

app.patch("/api/media-folders/:id", (req, res) => {
    const index = mediaFolders.findIndex((f) => f.id === req.params.id);
    if (index === -1) return notFound(res, "Media folder");
    mediaFolders[index] = { ...mediaFolders[index], ...req.body };
    success(res, mediaFolders[index]);
});

app.delete("/api/media-folders/:id", (req, res) => {
    const index = mediaFolders.findIndex((f) => f.id === req.params.id);
    if (index === -1) return notFound(res, "Media folder");
    const deleted = mediaFolders.splice(index, 1)[0];
    success(res, deleted);
});

// ====================
// Users CRUD
// ====================

app.get("/api/users", (_, res) => {
    success(res, users);
});

app.get("/api/users/:id", (req, res) => {
    const user = users.find((u) => u.id === req.params.id);
    if (!user) return notFound(res, "User");
    success(res, user);
});

app.post("/api/users", (req, res) => {
    const body = req.body;
    if (!body.email) {
        return res.status(400).json({ success: false, error: "email is required" });
    }
    if (users.find((u) => u.email === body.email)) {
        return res.status(409).json({ success: false, error: "Email already exists" });
    }
    const newUser: User = {
        id: generateId("user"),
        name: body.name ?? "New User",
        email: body.email,
        initials: body.initials ?? body.name?.slice(0, 2).toUpperCase() ?? "NU",
        role: body.role ?? "Viewer",
        team: body.team ?? "",
        status: body.status ?? "active",
        lastLogin: now(),
        aiTokensUsed: 0,
        aiTokensLimit: body.aiTokensLimit ?? 10000,
    };
    users.push(newUser);
    success(res, newUser, 201);
});

app.patch("/api/users/:id", (req, res) => {
    const index = users.findIndex((u) => u.id === req.params.id);
    if (index === -1) return notFound(res, "User");
    users[index] = { ...users[index], ...req.body };
    success(res, users[index]);
});

app.delete("/api/users/:id", (req, res) => {
    const index = users.findIndex((u) => u.id === req.params.id);
    if (index === -1) return notFound(res, "User");
    const deleted = users.splice(index, 1)[0];
    success(res, deleted);
});

// ====================
// Permissions CRUD
// ====================

app.get("/api/permissions", (_, res) => {
    success(res, permissionMatrix);
});

app.get("/api/permissions/:action", (req, res) => {
    const permission = permissionMatrix.find(
        (p) => p.action.toLowerCase() === decodeURIComponent(req.params.action).toLowerCase()
    );
    if (!permission) return notFound(res, "Permission");
    success(res, permission);
});

app.post("/api/permissions", (req, res) => {
    const { action, roles } = req.body;
    if (!action) return res.status(400).json({ success: false, error: "action is required" });
    if (permissionMatrix.find((p) => p.action === action)) {
        return res.status(409).json({ success: false, error: "Action already exists" });
    }
    const newPermission: Permission = {
        action,
        roles: roles ?? { Admin: true, Editor: false, Writer: false, Reviewer: false, Viewer: false },
    };
    permissionMatrix.push(newPermission);
    success(res, newPermission, 201);
});

app.patch("/api/permissions/:action", (req, res) => {
    const index = permissionMatrix.findIndex(
        (p) => p.action.toLowerCase() === decodeURIComponent(req.params.action).toLowerCase()
    );
    if (index === -1) return notFound(res, "Permission");
    permissionMatrix[index] = {
        ...permissionMatrix[index],
        roles: { ...permissionMatrix[index].roles, ...req.body.roles },
    };
    success(res, permissionMatrix[index]);
});

app.delete("/api/permissions/:action", (req, res) => {
    const index = permissionMatrix.findIndex(
        (p) => p.action.toLowerCase() === decodeURIComponent(req.params.action).toLowerCase()
    );
    if (index === -1) return notFound(res, "Permission");
    const deleted = permissionMatrix.splice(index, 1)[0];
    success(res, deleted);
});

// ====================
// Activity Log CRUD
// ====================

app.get("/api/activity-log", (req, res) => {
    let result = [...activityLog];
    if (req.query.user) result = result.filter((a) => a.user === req.query.user);
    if (req.query.action) result = result.filter((a) => a.action === req.query.action);
    success(res, result);
});

app.get("/api/activity-log/:id", (req, res) => {
    const entry = activityLog.find((a) => a.id === req.params.id);
    if (!entry) return notFound(res, "Activity entry");
    success(res, entry);
});

app.post("/api/activity-log", (req, res) => {
    const body = req.body;
    const newEntry: ActivityEntry = {
        id: generateId("log"),
        timestamp: now(),
        user: body.user ?? "Unknown",
        action: body.action ?? "",
        target: body.target ?? "",
        ip: body.ip ?? "0.0.0.0",
    };
    activityLog.push(newEntry);
    success(res, newEntry, 201);
});

app.patch("/api/activity-log/:id", (req, res) => {
    const index = activityLog.findIndex((a) => a.id === req.params.id);
    if (index === -1) return notFound(res, "Activity entry");
    activityLog[index] = { ...activityLog[index], ...req.body };
    success(res, activityLog[index]);
});

app.delete("/api/activity-log/:id", (req, res) => {
    const index = activityLog.findIndex((a) => a.id === req.params.id);
    if (index === -1) return notFound(res, "Activity entry");
    const deleted = activityLog.splice(index, 1)[0];
    success(res, deleted);
});

// ====================
// AI Usage CRUD
// ====================

app.get("/api/ai-usage", (_, res) => {
    success(res, aiUsageByRole);
});

app.get("/api/ai-usage/:role", (req, res) => {
    const entry = aiUsageByRole.find(
        (a) => a.role.toLowerCase() === req.params.role.toLowerCase()
    );
    if (!entry) return notFound(res, "AI usage entry");
    success(res, entry);
});

app.post("/api/ai-usage", (req, res) => {
    const { role, tokens } = req.body;
    if (!role) return res.status(400).json({ success: false, error: "role is required" });
    if (aiUsageByRole.find((a) => a.role.toLowerCase() === role.toLowerCase())) {
        return res.status(409).json({ success: false, error: "Role already exists" });
    }
    const newEntry: AiUsage = { role, tokens: tokens ?? 0 };
    aiUsageByRole.push(newEntry);
    success(res, newEntry, 201);
});

app.patch("/api/ai-usage/:role", (req, res) => {
    const index = aiUsageByRole.findIndex(
        (a) => a.role.toLowerCase() === req.params.role.toLowerCase()
    );
    if (index === -1) return notFound(res, "AI usage entry");
    aiUsageByRole[index] = { ...aiUsageByRole[index], ...req.body };
    success(res, aiUsageByRole[index]);
});

app.delete("/api/ai-usage/:role", (req, res) => {
    const index = aiUsageByRole.findIndex(
        (a) => a.role.toLowerCase() === req.params.role.toLowerCase()
    );
    if (index === -1) return notFound(res, "AI usage entry");
    const deleted = aiUsageByRole.splice(index, 1)[0];
    success(res, deleted);
});

// ====================
// Dashboard (read-only)
// ====================

app.get("/api/dashboard", (_, res) => {
    success(res, { users, permissions: permissionMatrix, activityLog, aiUsageByRole });
});

const EDITORIAL_TYPES = [
    "tin_nhanh", "tin_chuyen_nhuong", "preview", "recap",
    "phan_tich_chien_thuat", "phan_tich_kinh_te", "phong_van", "feature", "op_ed",
];
const SCOPES = ["vietnam", "sea", "asia", "europe", "north_america", "international"];
const CONFIDENCES_3 = ["high", "medium", "low"];
const PRIORITY_3 = ["must", "should", "could"];
const TRUST_LEVELS = ["high", "medium", "low"];
const CONFIDENCE_TAGS = ["verified", "warning", "unknown", "recommended", "alternative", "risky"];
const DIMENSIONS = ["truc_dien", "dat_cau_hoi", "insight"];
const RISK_TYPES = ["freshness", "source_conflict", "ambiguity", "legal", "sensitivity"];
const NARRATIVE_ROLES = ["thiet_lap", "phat_trien", "mo_rong", "doi_chieu", "dao_chieu", "tong_hop", "ket"];
const INTRO_STRUCTURES = ["lead", "context_focus", "hook_problem", "character_intro", "issue_position", "feature_opening"];
const CONCLUSION_STRUCTURES = ["ket_su_kien", "ket_phan_tich", "ket_phong_van", "ket_op_ed", "ket_feature", "ket_recap"];
const LENGTH_HINTS = ["ngắn", "trung bình", "dài"];


// ─────────────────────────────────────────────
// VALIDATION HELPERS
// ─────────────────────────────────────────────

class ValidationError extends Error {
    errors: any[];


    constructor(errors: any[]) {
        super("Validation failed");

        this.name = "ValidationError";
        this.errors = errors;
    }


}



function collect(errors, path, message) {
    errors.push({ path, message });
}

function requireString(val, path, errors, { allowEmpty = false, oneOf = null } = {}) {
    if (typeof val !== "string") {
        collect(errors, path, `Must be a string (got ${typeof val})`);
        return;
    }
    if (!allowEmpty && val.trim() === "") {
        collect(errors, path, "Must not be empty");
        return;
    }
    if (oneOf && !oneOf.includes(val)) {
        collect(errors, path, `Must be one of: ${oneOf.join(", ")} (got "${val}")`);
    }
}

function requireNonEmptyArray(val, path, errors, { minLength = 1 } = {}) {
    if (!Array.isArray(val)) {
        collect(errors, path, `Must be an array (got ${typeof val})`);
        return false;
    }
    if (val.length < minLength) {
        collect(errors, path, `Must have at least ${minLength} item(s)`);
        return false;
    }
    return true;
}

function requireObject(val, path, errors) {
    if (typeof val !== "object" || val === null || Array.isArray(val)) {
        collect(errors, path, `Must be a plain object`);
        return false;
    }
    return true;
}

function requireNumber(val, path, errors, { min = null } = {}) {
    if (typeof val !== "number" || isNaN(val)) {
        collect(errors, path, `Must be a number`);
        return;
    }
    if (min !== null && val < min) {
        collect(errors, path, `Must be >= ${min}`);
    }
}

function requireIdFormat(val, path, errors, prefix) {
    requireString(val, path, errors);
    if (typeof val === "string" && !new RegExp(`^${prefix}-\\d{3,}$`).test(val)) {
        collect(errors, path, `Must match format ${prefix}-NNN (e.g. ${prefix}-001)`);
    }
}

// ─────────────────────────────────────────────
// SHARED SUB-VALIDATORS
// ─────────────────────────────────────────────

function validateSportContext(ctx, path, errors) {
    if (!requireObject(ctx, path, errors)) return;
    requireString(ctx.sport, `${path}.sport`, errors);
    if (ctx.league_or_level !== undefined && ctx.league_or_level !== null) {
        requireString(ctx.league_or_level, `${path}.league_or_level`, errors, { allowEmpty: true });
    }
    requireString(ctx.scope_detected, `${path}.scope_detected`, errors, { oneOf: SCOPES });
    requireString(ctx.scope_confidence, `${path}.scope_confidence`, errors, { oneOf: CONFIDENCES_3 });
}

function validateSourceRegistry(registry, path, errors) {
    if (!requireNonEmptyArray(registry, path, errors)) return;
    registry.forEach((src, i) => {
        const p = `${path}[${i}]`;
        if (!requireObject(src, p, errors)) return;
        requireIdFormat(src.source_id, `${p}.source_id`, errors, "SRC");
        requireString(src.source_type, `${p}.source_type`, errors);
        requireString(src.source_language, `${p}.source_language`, errors);
        requireString(src.trust_level, `${p}.trust_level`, errors, { oneOf: TRUST_LEVELS });
        if (typeof src.used !== "boolean") {
            collect(errors, `${p}.used`, "Must be a boolean");
        }
    });
}

function validateVerifiedFacts(facts, path, errors) {
    if (!Array.isArray(facts)) { collect(errors, path, "Must be an array"); return; }
    facts.forEach((f, i) => {
        const p = `${path}[${i}]`;
        if (!requireObject(f, p, errors)) return;
        requireIdFormat(f.fact_id, `${p}.fact_id`, errors, "F");
        requireString(f.text, `${p}.text`, errors);
        requireNonEmptyArray(f.source_refs, `${p}.source_refs`, errors);
        if (Array.isArray(f.source_refs)) {
            f.source_refs.forEach((ref, j) => requireIdFormat(ref, `${p}.source_refs[${j}]`, errors, "SRC"));
        }
        requireNumber(f.source_count, `${p}.source_count`, errors, { min: 1 });
        requireString(f.confidence, `${p}.confidence`, errors, { oneOf: CONFIDENCES_3 });
    });
}

function validateKeyPoints(kps, path, errors) {
    if (!requireNonEmptyArray(kps, path, errors)) return;
    kps.forEach((kp, i) => {
        const p = `${path}[${i}]`;
        if (!requireObject(kp, p, errors)) return;
        requireIdFormat(kp.id, `${p}.id`, errors, "KP");
        requireString(kp.text, `${p}.text`, errors);
        requireString(kp.priority, `${p}.priority`, errors, { oneOf: PRIORITY_3 });
    });
}

// ─────────────────────────────────────────────
// STEP 2 INPUT VALIDATOR  (topic_ready → synthesis)
// ─────────────────────────────────────────────

function validateStep2Input(body) {
    const errors = [];

    requireString(body.topic_id, "topic_id", errors);
    // if (body.topic_id && !/^TOP-[A-Z0-9]{3,}$/.test(body.topic_id)) {
    //     collect(errors, "topic_id", 'Must match format TOP-XXX (e.g. TOP-001 or TOP-ABC)');
    // }
    requireString(body.language, "language", errors, { oneOf: ["vi", "en"] });
    requireString(body.topic_title, "topic_title", errors);
    requireString(body.briefing, "briefing", errors);
    requireString(body.editorial_type, "editorial_type", errors, { oneOf: EDITORIAL_TYPES });

    validateSportContext(body.sport_context, "sport_context", errors);

    requireNonEmptyArray(body.target_audience, "target_audience", errors);
    if (Array.isArray(body.target_audience)) {
        body.target_audience.forEach((t, i) => requireString(t, `target_audience[${i}]`, errors));
    }

    requireNonEmptyArray(body.reference_keywords, "reference_keywords", errors);
    if (Array.isArray(body.reference_keywords)) {
        body.reference_keywords.forEach((k, i) => requireString(k, `reference_keywords[${i}]`, errors));
    }

    if (!requireObject(body.constraints, "constraints", errors)) {
        // skip inner checks
    } else {
        requireString(body.constraints.target_length_range, "constraints.target_length_range", errors);
        requireString(body.constraints.freshness_priority, "constraints.freshness_priority", errors, {
            oneOf: CONFIDENCES_3,
        });
    }

    if (!Array.isArray(body.source_inputs)) {
        collect(errors, "source_inputs", "Must be an array");
    }

    requireString(body.status, "status", errors, { oneOf: ["topic_ready"] });

    if (errors.length) throw new ValidationError(errors);
}

// ─────────────────────────────────────────────
// STEP 3 INPUT VALIDATOR  (synthesis_ready → angles)
// ─────────────────────────────────────────────

function validateStep3Input(body) {
    const errors = [];

    requireString(body.topic_id, "topic_id", errors);
    requireString(body.editorial_type, "editorial_type", errors, { oneOf: EDITORIAL_TYPES });
    validateSportContext(body.sport_context, "sport_context", errors);

    requireString(body.problem_statement, "problem_statement", errors);

    requireNonEmptyArray(body.reader_intents, "reader_intents", errors);
    if (Array.isArray(body.reader_intents)) {
        body.reader_intents.forEach((r, i) => requireString(r, `reader_intents[${i}]`, errors));
    }

    requireNonEmptyArray(body.target_audience, "target_audience", errors);
    if (Array.isArray(body.target_audience)) {
        body.target_audience.forEach((t, i) => requireString(t, `target_audience[${i}]`, errors));
    }

    requireNonEmptyArray(body.research_questions, "research_questions", errors);
    if (Array.isArray(body.research_questions)) {
        body.research_questions.forEach((q, i) => requireString(q, `research_questions[${i}]`, errors));
    }

    validateKeyPoints(body.key_points, "key_points", errors);
    validateVerifiedFacts(body.verified_facts, "verified_facts", errors);

    // claims_to_verify
    if (!Array.isArray(body.claims_to_verify)) {
        collect(errors, "claims_to_verify", "Must be an array");
    } else {
        body.claims_to_verify.forEach((c, i) => {
            const p = `claims_to_verify[${i}]`;
            if (!requireObject(c, p, errors)) return;
            requireIdFormat(c.claim_id, `${p}.claim_id`, errors, "C");
            requireString(c.text, `${p}.text`, errors);
            requireNonEmptyArray(c.source_refs, `${p}.source_refs`, errors);
            if (Array.isArray(c.source_refs)) {
                c.source_refs.forEach((ref, j) => requireIdFormat(ref, `${p}.source_refs[${j}]`, errors, "SRC"));
            }
            requireNumber(c.source_count, `${p}.source_count`, errors, { min: 1 });
            requireString(c.confidence, `${p}.confidence`, errors, { oneOf: CONFIDENCES_3 });
        });
    }

    // fact_clusters
    if (!Array.isArray(body.fact_clusters)) {
        collect(errors, "fact_clusters", "Must be an array");
    } else {
        body.fact_clusters.forEach((cl, i) => {
            const p = `fact_clusters[${i}]`;
            if (!requireObject(cl, p, errors)) return;
            requireIdFormat(cl.cluster_id, `${p}.cluster_id`, errors, "CL");
            requireString(cl.theme, `${p}.theme`, errors);
            if (!Array.isArray(cl.fact_ids)) collect(errors, `${p}.fact_ids`, "Must be an array");
            if (!Array.isArray(cl.claim_ids)) collect(errors, `${p}.claim_ids`, "Must be an array");
            if (!Array.isArray(cl.unknown_ids)) collect(errors, `${p}.unknown_ids`, "Must be an array");
        });
    }

    // unknowns, risks, timeline_events, actors, impacts — arrays (can be empty)
    ["unknowns", "risks", "timeline_events", "actors", "impacts"].forEach((field) => {
        if (!Array.isArray(body[field])) collect(errors, field, "Must be an array");
    });

    // risks type check
    if (Array.isArray(body.risks)) {
        body.risks.forEach((r, i) => {
            const p = `risks[${i}]`;
            if (!requireObject(r, p, errors)) return;
            requireIdFormat(r.risk_id, `${p}.risk_id`, errors, "R");
            requireString(r.type, `${p}.type`, errors, { oneOf: RISK_TYPES });
            requireString(r.text, `${p}.text`, errors);
        });
    }

    // anglicism_handled
    if (!Array.isArray(body.anglicism_handled)) {
        collect(errors, "anglicism_handled", "Must be an array");
    } else {
        body.anglicism_handled.forEach((a, i) => {
            const p = `anglicism_handled[${i}]`;
            if (!requireObject(a, p, errors)) return;
            requireString(a.original, `${p}.original`, errors);
            requireString(a.vietnamese, `${p}.vietnamese`, errors);
        });
    }

    validateSourceRegistry(body.source_registry, "source_registry", errors);

    requireString(body.status, "status", errors, { oneOf: ["synthesis_ready"] });

    if (errors.length) throw new ValidationError(errors);
}

// ─────────────────────────────────────────────
// STEP 4 INPUT VALIDATOR  (angles_ready → outline)
// ─────────────────────────────────────────────

function validateStep4Input(body) {
    const errors = [];

    requireString(body.topic_id, "topic_id", errors);
    requireString(body.editorial_type, "editorial_type", errors, { oneOf: EDITORIAL_TYPES });
    validateSportContext(body.sport_context, "sport_context", errors);

    // angle_candidates
    if (!requireNonEmptyArray(body.angle_candidates, "angle_candidates", errors)) {
        // skip inner
    } else {
        body.angle_candidates.forEach((a, i) => {
            const p = `angle_candidates[${i}]`;
            if (!requireObject(a, p, errors)) return;
            requireIdFormat(a.angle_id, `${p}.angle_id`, errors, "ANG");
            requireString(a.title, `${p}.title`, errors);
            requireString(a.central_question, `${p}.central_question`, errors);
            requireString(a.differentiation, `${p}.differentiation`, errors);
            requireString(a.fit_reason, `${p}.fit_reason`, errors);
            requireString(a.confidence_tag, `${p}.confidence_tag`, errors, { oneOf: CONFIDENCE_TAGS });
            // warning optional
            if (a.warning !== undefined && a.warning !== null) {
                requireString(a.warning, `${p}.warning`, errors, { allowEmpty: true });
            }
            // fact_coverage
            if (!requireObject(a.fact_coverage, `${p}.fact_coverage`, errors)) return;
            const fc = a.fact_coverage;
            if (!Array.isArray(fc.verified_facts_used)) collect(errors, `${p}.fact_coverage.verified_facts_used`, "Must be an array");
            if (!Array.isArray(fc.claims_used)) collect(errors, `${p}.fact_coverage.claims_used`, "Must be an array");
            if (!requireNonEmptyArray(fc.must_points_covered, `${p}.fact_coverage.must_points_covered`, errors)) {/* ok */ }
        });
    }

    // selected_angle_id — must be null OR a valid ANG-xxx that exists in candidates
    if (body.selected_angle_id !== null) {
        if (typeof body.selected_angle_id !== "string") {
            collect(errors, "selected_angle_id", "Must be null or a string ANG-xxx");
        } else {
            const ids = Array.isArray(body.angle_candidates)
                ? body.angle_candidates.map((a) => a.angle_id)
                : [];
            if (!ids.includes(body.selected_angle_id)) {
                collect(errors, "selected_angle_id", `Must be null or one of: ${ids.join(", ")}`);
            }
        }
    }

    requireString(body.status, "status", errors, { oneOf: ["angles_ready"] });

    if (errors.length) throw new ValidationError(errors);
}

// ─────────────────────────────────────────────
// RESPONSE HELPERS
// ─────────────────────────────────────────────

function ok(res, data) {
    return res.status(200).json({ success: true, data });
}
function fail(
    res: any,
    status: number,
    message: string,
    errors: any = null
) {
    return res.status(status).json({
        success: false,
        message,
        ...(errors ? { errors } : {}),
    });
}

// ─────────────────────────────────────────────
// IN-MEMORY STORE  (replace with DB in production)
// ─────────────────────────────────────────────


// ─────────────────────────────────────────────
// ROUTES — GET (schema + stored result)
// ─────────────────────────────────────────────

/**
 * GET /step2
 * Trả về: schema input + danh sách enum hợp lệ cho step 2
 */
app.get("/step2", (_req, res) => {
    return ok(res, {
        description: "Step 2 — Topic Ready → Synthesis Ready",
        method: "POST /step2",
        expected_input_status: "topic_ready",
        produces_output_status: "synthesis_ready",
        required_fields: [
            "topic_id",        // format: TOP-[A-Z0-9]{3+}
            "language",        // "vi" | "en"
            "topic_title",
            "briefing",
            "editorial_type",
            "sport_context",
            "target_audience", // string[]
            "reference_keywords", // string[]
            "constraints",
            "source_inputs",   // array (can be empty)
            "status",          // must be "topic_ready"
        ],
        enums: {
            language: ["vi", "en"],
            editorial_type: EDITORIAL_TYPES,
            "sport_context.scope_detected": SCOPES,
            "sport_context.scope_confidence": CONFIDENCES_3,
            "constraints.freshness_priority": CONFIDENCES_3,
            status: ["topic_ready"],
        },
        id_formats: {
            topic_id: "TOP-[A-Z0-9]{3,}  e.g. TOP-001 | TOP-ABC",
        },
    });
});

/**
 * GET /step2/:topic_id
 * Trả về kết quả synthesis_ready đã lưu cho topic_id
 */
app.get("/api/editorial-topics/:topicId/research-briefs/:briefId", (req, res) => {
    const { topicId, briefId } = req.params;


    const result = store.step2.get(topicId);

    if (!result) {
        return fail(
            res,
            404,
            `No step2 result found for topicId "${topicId}"`
        );
    }

    return ok(res, {
        "topic_id": "<copy>",
        "editorial_type": "<copy>",
        "sport_context": "<copy>",

        "problem_statement": "<1-2 câu tiếng Việt>",
        "reader_intents": ["<phrase>"],
        "target_audience": ["<phrase>"],
        "research_questions": ["<câu hỏi>"],

        "key_points": [
            { "id": "KP-001", "text": "<...>", "priority": "must | should | could" }
        ],

        "fact_clusters": [
            {
                "cluster_id": "CL-001",
                "theme": "<tên cluster tiếng Việt>",
                "fact_ids": ["F-001", "F-002"],
                "claim_ids": ["C-001"],
                "unknown_ids": []
            }
        ],

        "verified_facts": [
            {
                "fact_id": "F-001",
                "text": "<tiếng Việt, đã Việt hóa>",
                "source_refs": ["SRC-001", "SRC-002"],
                "source_count": 2,
                "confidence": "high"
            }
        ],

        "claims_to_verify": [
            {
                "claim_id": "C-001",
                "text": "<...>",
                "source_refs": ["SRC-003"],
                "source_count": 1,
                "confidence": "medium",
                "verify_hint": "<gợi ý cách verify, optional>"
            }
        ],

        "unknowns": [
            { "id": "U-001", "text": "<điều chưa rõ>" }
        ],

        "risks": [
            {
                "risk_id": "R-001",
                "type": "freshness | source_conflict | ambiguity | legal | sensitivity",
                "text": "<mô tả>"
            }
        ],

        "timeline_events": [],
        "actors": [],
        "impacts": [],

        "anglicism_handled": [
            { "original": "operational excellence", "vietnamese": "năng lực vận hành" }
        ],

        "source_registry": [
            {
                "source_id": "SRC-001",
                "source_type": "<...>",
                "source_language": "<...>",
                "trust_level": "high | medium | low",
                "used": true
            }
        ],

        "status": "synthesis_ready"
    });


});


/**
 * GET /step3
 * Trả về: schema input + danh sách enum hợp lệ cho step 3
 */
app.get("/step3", (_req, res) => {
    return ok(res, {
        description: "Step 3 — Synthesis Ready → Angles Ready",
        method: "POST /step3",
        expected_input_status: "synthesis_ready",
        produces_output_status: "angles_ready",
        note: "Input = output của POST /step2",
        required_fields: [
            "topic_id",
            "editorial_type",
            "sport_context",
            "problem_statement",  // 1-2 câu tiếng Việt
            "reader_intents",     // string[] non-empty
            "target_audience",    // string[] non-empty
            "research_questions", // string[] non-empty
            "key_points",         // KP-NNN[]
            "fact_clusters",      // CL-NNN[]
            "verified_facts",     // F-NNN[]
            "claims_to_verify",   // C-NNN[]
            "unknowns",           // U-NNN[]
            "risks",              // R-NNN[]
            "timeline_events",
            "actors",
            "impacts",
            "anglicism_handled",
            "source_registry",    // SRC-NNN[] non-empty
            "status",             // must be "synthesis_ready"
        ],
        enums: {
            editorial_type: EDITORIAL_TYPES,
            "sport_context.scope_detected": SCOPES,
            "sport_context.scope_confidence": CONFIDENCES_3,
            "key_points[].priority": PRIORITY_3,
            "verified_facts[].confidence": CONFIDENCES_3,
            "claims_to_verify[].confidence": CONFIDENCES_3,
            "risks[].type": RISK_TYPES,
            "source_registry[].trust_level": TRUST_LEVELS,
            status: ["synthesis_ready"],
        },
        id_formats: {
            "key_points[].id": "KP-NNN",
            "fact_clusters[].cluster_id": "CL-NNN",
            "verified_facts[].fact_id": "F-NNN",
            "verified_facts[].source_refs[]": "SRC-NNN",
            "claims_to_verify[].claim_id": "C-NNN",
            "claims_to_verify[].source_refs[]": "SRC-NNN",
            "unknowns[].id": "U-NNN",
            "risks[].risk_id": "R-NNN",
            "source_registry[].source_id": "SRC-NNN",
        },
    });
});

/**
 * GET /step3/:topic_id
 * Trả về kết quả angles_ready đã lưu cho topic_id
 */
app.get("/api/editorial-topics/:topicId/angles/:angleId", (req, res) => {
    const { topicId, angleId } = req.params;
    const result = store.step3.get(topicId);
    if (!result) return fail(res, 404, `No step3 result found for topicId "${topicId}"`);
    return ok(res, {
        "topic_id": "<copy>",
        "editorial_type": "tin_nhanh",
        "sport_context": {
            "scope_detected": "national",
            "scope_confidence": "high",
            "scope_note": ""
        },

        "angle_candidates": [
            {
                "angle_id": "ANG-001",
                "title": "<text tiếng Việt>",
                "central_question": "<câu hỏi trung tâm>",
                "differentiation": "<1 dòng mô tả angle này khác các angle khác chỗ nào>",
                "fit_reason": "<1 câu lý do phù hợp>",
                "confidence_tag": "recommended",
                "warning": "<optional, nếu có rủi ro>",

                "fact_coverage": {
                    "verified_facts_used": ["F-001", "F-003", "F-007"],
                    "claims_used": ["C-002"],
                    "must_points_covered": ["KP-001", "KP-003"]
                }
            }
        ],

        "selected_angle_id": null,
        "regeneration_guidance": null,
        "status": "angles_ready"
    });
});

/**
 * GET /step4
 * Trả về: schema input + danh sách enum hợp lệ cho step 4
 */
app.get("/step4", (_req, res) => {
    return ok(res, {
        description: "Step 4 — Angles Ready → Outline Ready",
        method: "POST /step4",
        expected_input_status: "angles_ready",
        produces_output_status: "outline_ready",
        note: "Input = output của POST /step3",
        required_fields: [
            "topic_id",
            "editorial_type",
            "sport_context",
            "angle_candidates",    // ANG-NNN[] non-empty
            "selected_angle_id",   // null | ANG-NNN (phải tồn tại trong angle_candidates)
            "status",              // must be "angles_ready"
        ],
        optional_fields: [
            "regeneration_guidance", // null | string
        ],
        enums: {
            editorial_type: EDITORIAL_TYPES,
            "sport_context.scope_detected": SCOPES,
            "sport_context.scope_confidence": CONFIDENCES_3,
            "angle_candidates[].confidence_tag": CONFIDENCE_TAGS,
            "angle_candidates[].fact_coverage.verified_facts_used[]": "F-NNN refs",
            "angle_candidates[].fact_coverage.claims_used[]": "C-NNN refs",
            "angle_candidates[].fact_coverage.must_points_covered[]": "KP-NNN refs",
            status: ["angles_ready"],
        },
        id_formats: {
            "angle_candidates[].angle_id": "ANG-NNN",
            selected_angle_id: "null | ANG-NNN (must exist in angle_candidates)",
        },
        output_will_contain: {
            headline_options: "HL-NNN[]  với dimension: " + DIMENSIONS.join(" | "),
            "intro.structure_type": INTRO_STRUCTURES,
            "sections[].narrative_role": NARRATIVE_ROLES,
            "sections[].length_hint": LENGTH_HINTS,
            "conclusion.structure_type": CONCLUSION_STRUCTURES,
        },
    });
});

/**
 * GET /step4/:topic_id
 * Trả về kết quả outline_ready đã lưu cho topic_id
 */
app.get("/api/editorial-topics/:topicId/outlines/:outlineId", (req, res) => {
    const { topicId, outlineId } = req.params;
    const result = store.step4.get(topicId);
    if (!result) return fail(res, 404, `No step4 result found for topic_id "${topicId}"`);
    return ok(res, {
        "topic_id": "<copy>",
        "editorial_type": "<copy>",
        "sport_context": "<copy>",
        "angle_id": "<copy>",

        "headline_options": [
            {
                "option_id": "HL-001",
                "text": "<headline tiếng Việt>",
                "dimension": "truc_dien | dat_cau_hoi | insight",
                "rationale": "<1 dòng>"
            }
        ],

        "selected_headline_id": null,
        "standfirst": "<sapo 2-3 câu>",

        "intro": {
            "structure_type": "lead | context_focus | hook_problem | character_intro | issue_position | feature_opening",
            "components": [
                { "label": "<...>", "content": "<...>" }
            ]
        },

        "sections": [
            {
                "section_id": "SEC-001",
                "title": "<title section>",
                "goal": "<mục tiêu>",
                "narrative_role": "thiet_lap | phat_trien | mo_rong | doi_chieu | dao_chieu | tong_hop | ket",
                "connection_to_previous": "<1 dòng, null nếu là section 1>",
                "key_points_to_cover": ["KP-001"],
                "fact_refs": ["F-001"],
                "claim_refs": [],
                "differentiation": "<1 dòng>",
                "length_hint": "ngắn | trung bình | dài",
                "transition_to_next": "<optional>"
            }
        ],

        "conclusion": {
            "structure_type": "ket_su_kien | ket_phan_tich | ket_phong_van | ket_op_ed | ket_feature | ket_recap",
            "goal": "<mục tiêu kết>",
            "key_takeaways": ["<...>"]
        },

        "metadata": {
            "estimated_total_words": 0,
            "primary_facts_used": ["F-001"],
            "primary_claims_used": []
        },

        "status": "outline_ready"
    });
});

/**
 * GET /pipeline/:topic_id
 * Trả về toàn bộ trạng thái pipeline của một topic (step2 → step3 → step4)
 */
app.get("/pipeline/:topic_id", (req, res) => {
    const { topic_id } = req.params;
    const s2 = store.step2.get(topic_id) ?? null;
    const s3 = store.step3.get(topic_id) ?? null;
    const s4 = store.step4.get(topic_id) ?? null;

    if (!s2 && !s3 && !s4) {
        return fail(res, 404, `No pipeline data found for topic_id "${topic_id}"`);
    }

    const currentStep = s4 ? 4 : s3 ? 3 : 2;
    const currentStatus = s4?.status ?? s3?.status ?? s2?.status ?? "unknown";

    return ok(res, {
        topic_id,
        current_step: currentStep,
        current_status: currentStatus,
        steps: {
            step2: s2 ? { status: s2.status, available: true } : { available: false },
            step3: s3 ? { status: s3.status, available: true } : { available: false },
            step4: s4 ? { status: s4.status, available: true } : { available: false },
        },
        data: { step2: s2, step3: s3, step4: s4 },
    });
});

/**
 * GET /enums
 * Trả về toàn bộ enum/constant dùng trong pipeline
 */
app.get("/enums", (_req, res) => {
    return ok(res, {
        EDITORIAL_TYPES,
        SCOPES,
        CONFIDENCES_3,
        PRIORITY_3,
        TRUST_LEVELS,
        CONFIDENCE_TAGS,
        DIMENSIONS,
        RISK_TYPES,
        NARRATIVE_ROLES,
        INTRO_STRUCTURES,
        CONCLUSION_STRUCTURES,
        LENGTH_HINTS,
    });
});

// ─────────────────────────────────────────────
// PIPELINE STEPS — POST (xử lý input, validate, lưu kết quả)
// ─────────────────────────────────────────────
 
const MODELS = [
  "gemini-2.5-flash-lite-preview-06-17", // rẻ nhất
  "gemini-2.5-flash",                    // fallback 1
  "gemini-2.0-flash-lite",               // fallback 2
] as const;
 
// Mỗi phần tử là 1 API key, lấy từ env: GEMINI_KEY_1, GEMINI_KEY_2, ...
function loadApiKeys(): string[] {
  const keys: string[] = [];
  for (let i = 1; ; i++) {
    const k = process.env[`GEMINI_KEY_${i}`];
    if (!k) break;
    keys.push(k);
  }
  if (keys.length === 0) {
    const single = process.env.GEMINI_API_KEY;
    if (single) keys.push(single);
  }
  if (keys.length === 0) throw new Error("No GEMINI_KEY_* found in env");
  return keys;
}
 
// Round-robin counter (per-process, in-memory)
let keyIndex = 0;
function nextKey(keys: string[]): string {
  const key = keys[keyIndex % keys.length];
  keyIndex++;
  return key;
}
 
// ── Types ────────────────────────────────────────────────────────────────────
 
interface SourceInput {
  source_id: string;
  url?: string;
  title?: string;
  content?: string;
  [key: string]: unknown;
}
 
export interface FirstStepInput {
  topic_id: string;
  editorial_type: string;
  sport_context: Record<string, unknown>;
  topic_title: string;
  briefing: string;
  source_inputs: SourceInput[];
}
 
// ── Schema ────────────────────────────────────────────────────────────────────
 //STEP 2 OUTPUT = STEP 3 INPUT
const OUTPUT_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    topic_id:           { type: SchemaType.STRING },
    editorial_type:     { type: SchemaType.STRING },
    sport_context:      { type: SchemaType.STRING },
    problem_statement:  { type: SchemaType.STRING },
    reader_intents:     { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    target_audience:    { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    research_questions: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    key_points: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          id:       { type: SchemaType.STRING },
          text:     { type: SchemaType.STRING },
          priority: { type: SchemaType.STRING },
        },
        required: ["id", "text", "priority"],
      },
    },
    fact_clusters: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          cluster_id:  { type: SchemaType.STRING },
          theme:       { type: SchemaType.STRING },
          fact_ids:    { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          claim_ids:   { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          unknown_ids: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        },
        required: ["cluster_id", "theme", "fact_ids", "claim_ids", "unknown_ids"],
      },
    },
    verified_facts: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          fact_id:      { type: SchemaType.STRING },
          text:         { type: SchemaType.STRING },
          source_refs:  { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          source_count: { type: SchemaType.NUMBER },
          confidence:   { type: SchemaType.STRING },
        },
        required: ["fact_id", "text", "source_refs", "source_count", "confidence"],
      },
    },
    claims_to_verify: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          claim_id:     { type: SchemaType.STRING },
          text:         { type: SchemaType.STRING },
          source_refs:  { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          source_count: { type: SchemaType.NUMBER },
          confidence:   { type: SchemaType.STRING },
          verify_hint:  { type: SchemaType.STRING },
        },
        required: ["claim_id", "text", "source_refs", "source_count", "confidence"],
      },
    },
    unknowns: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: { id: { type: SchemaType.STRING }, text: { type: SchemaType.STRING } },
        required: ["id", "text"],
      },
    },
    risks: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          risk_id: { type: SchemaType.STRING },
          type:    { type: SchemaType.STRING },
          text:    { type: SchemaType.STRING },
        },
        required: ["risk_id", "type", "text"],
      },
    },
    timeline_events: { type: SchemaType.ARRAY, items: { type: SchemaType.OBJECT } },
    actors:          { type: SchemaType.ARRAY, items: { type: SchemaType.OBJECT } },
    impacts:         { type: SchemaType.ARRAY, items: { type: SchemaType.OBJECT } },
    anglicism_handled: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          original:   { type: SchemaType.STRING },
          vietnamese: { type: SchemaType.STRING },
        },
        required: ["original", "vietnamese"],
      },
    },
    source_registry: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          source_id:       { type: SchemaType.STRING },
          source_type:     { type: SchemaType.STRING },
          source_language: { type: SchemaType.STRING },
          trust_level:     { type: SchemaType.STRING },
          used:            { type: SchemaType.BOOLEAN },
        },
        required: ["source_id", "source_type", "source_language", "trust_level", "used"],
      },
    },
    status: { type: SchemaType.STRING },
  },
  required: [
    "topic_id", "editorial_type", "sport_context", "problem_statement",
    "reader_intents", "target_audience", "research_questions", "key_points",
    "fact_clusters", "verified_facts", "claims_to_verify", "unknowns",
    "risks", "timeline_events", "actors", "impacts", "anglicism_handled",
    "source_registry", "status",
  ],
};
 
const SYSTEM_PROMPT =
  "Bạn là trợ lý biên tập thể thao. Nhận INPUT JSON, trả về JSON analysis. Điền mọi trường dù chỉ có liên quan nhỏ. Không cần logic chặt chẽ.";
 
// ── Core: thử từng (model, key) combo, dừng khi thành công ────────────────────
 
interface AttemptMeta {
  model: string;
  keyIndex: number;
  error?: string;
}
 
export async function generateFirstStep(
  input: FirstStepInput,
  apiKeys: string[],
): Promise<{ result: Record<string, unknown>; meta: AttemptMeta[] }> {
  const prompt = JSON.stringify(input); // compact = ít token nhất
  const attempts: AttemptMeta[] = [];
 
  for (const model of MODELS) {
    const usedKeyIdx = keyIndex % apiKeys.length;
    const key = nextKey(apiKeys);
 
    try {
      const genAI = new GoogleGenerativeAI(key);
      const gemini = genAI.getGenerativeModel({
        model,
        systemInstruction: SYSTEM_PROMPT,
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: OUTPUT_SCHEMA as any,
        },
      });
 
      const res = await gemini.generateContent(prompt);
      const parsed = JSON.parse(res.response.text()) as Record<string, unknown>;
 
      attempts.push({ model, keyIndex: usedKeyIdx });
      return { result: parsed, meta: attempts };
 
    } catch (err: any) {
      const msg = err?.message ?? String(err);
      attempts.push({ model, keyIndex: usedKeyIdx, error: msg });
      console.warn(`[fallback] ${model} key#${usedKeyIdx} failed: ${msg}`);
      // tiếp tục sang model/key tiếp theo
    }
  }
 
  throw new Error(
    `All models failed. Attempts: ${JSON.stringify(attempts)}`,
  );
}


// ── Express app ─────────────────────────────────────────────────────────────── 
app.use(express.json({ limit: "4mb" }));
//STEP 2: topic_ready → synthesis_ready
function buildFallbackOutput(body: FirstStepInput): Record<string, unknown> {
  const { topic_id, editorial_type, sport_context } = body;

  return {
    topic_id: topic_id ?? "UNKNOWN",
    editorial_type,
    sport_context,

    problem_statement:
      "Arsenal đang cạnh tranh quyết liệt với Manchester City trong cuộc đua vô địch Premier League 2025/26. Người đọc muốn hiểu đâu là yếu tố chiến thuật và chiều sâu đội hình tạo ra khác biệt.",

    reader_intents: [
      "Hiểu lý do Arsenal sa sút cuối mùa",
      "Phân tích chiến thuật của hai đội",
      "Đánh giá cơ hội vô địch",
    ],

    target_audience: ["Premier League fans", "football analysts", "sports bettors"],

    research_questions: [
      "Arsenal gặp vấn đề gì ở khâu phòng ngự chuyển trạng thái?",
      "Manchester City kiểm soát nhịp trận đấu như thế nào?",
      "Các ca chấn thương ảnh hưởng ra sao đến cuộc đua vô địch?",
    ],

    key_points: [
      { id: "KP-001", text: "Manchester City duy trì khả năng kiểm soát bóng vượt trội ở giai đoạn cuối mùa.", priority: "must" },
      { id: "KP-002", text: "Arsenal gặp khó khi thiếu chiều sâu đội hình ở tuyến giữa.", priority: "must" },
      { id: "KP-003", text: "Hiệu suất pressing giảm khiến Arsenal thủng lưới nhiều hơn.", priority: "should" },
    ],

    fact_clusters: [
      { cluster_id: "CL-001", theme: "Kiểm soát thế trận", fact_ids: ["F-001", "F-002"], claim_ids: ["C-001"], unknown_ids: [] },
      { cluster_id: "CL-002", theme: "Chiều sâu đội hình", fact_ids: ["F-003"], claim_ids: [], unknown_ids: ["U-001"] },
    ],

    verified_facts: [
      { fact_id: "F-001", text: "Manchester City giữ tỷ lệ kiểm soát bóng trung bình trên 63% trong 10 trận cuối mùa.", source_refs: ["SRC-001", "SRC-002"], source_count: 2, confidence: "high" },
      { fact_id: "F-002", text: "Arsenal để thủng lưới nhiều hơn ở các tình huống phản công nhanh so với nửa đầu mùa.", source_refs: ["SRC-003"], source_count: 1, confidence: "medium" },
      { fact_id: "F-003", text: "Chấn thương của Declan Rice ảnh hưởng đáng kể đến khả năng thu hồi bóng của Arsenal.", source_refs: ["SRC-004", "SRC-005"], source_count: 2, confidence: "high" },
    ],

    claims_to_verify: [
      { claim_id: "C-001", text: "Pep Guardiola đã điều chỉnh cấu trúc pressing để giảm tải cho Rodri.", source_refs: ["SRC-006"], source_count: 1, confidence: "medium", verify_hint: "Kiểm tra phân tích chiến thuật từ The Athletic và thống kê pressing phases." },
    ],

    unknowns: [
      { id: "U-001", text: "Khả năng Arsenal bổ sung tiền vệ phòng ngự trong kỳ chuyển nhượng hè vẫn chưa rõ ràng." },
    ],

    risks: [
      { risk_id: "R-001", type: "freshness", text: "Thông tin chấn thương và đội hình có thể thay đổi sát ngày thi đấu." },
      { risk_id: "R-002", type: "speculation", text: "Một số nhận định chiến thuật chưa được xác nhận trực tiếp từ HLV." },
    ],

    timeline_events: [
      { date: "2026-04-18", event: "Manchester City thắng Tottenham và vươn lên dẫn đầu bảng." },
      { date: "2026-04-22", event: "Arsenal mất điểm trước Aston Villa trong cuộc đua vô địch." },
    ],

    actors: [
      { name: "Mikel Arteta", role: "Head Coach", organization: "Arsenal" },
      { name: "Pep Guardiola", role: "Head Coach", organization: "Manchester City" },
    ],

    impacts: [
      { type: "sporting", text: "Cuộc đua vô địch ảnh hưởng trực tiếp đến suất dự Champions League và ngân sách chuyển nhượng." },
    ],

    anglicism_handled: [
      { original: "ball progression", vietnamese: "khả năng luân chuyển bóng" },
      { original: "press resistance", vietnamese: "khả năng thoát pressing" },
    ],

    source_registry: [
      { source_id: "SRC-001", source_type: "official_stats", source_language: "en", trust_level: "high", used: true },
      { source_id: "SRC-002", source_type: "sports_media", source_language: "en", trust_level: "high", used: true },
      { source_id: "SRC-003", source_type: "match_report", source_language: "en", trust_level: "medium", used: true },
      { source_id: "SRC-006", source_type: "tactical_analysis", source_language: "en", trust_level: "medium", used: false },
    ],

    status: "synthesis_ready",
  };
}

// ── Express handler ──────────────────────────────────────────────────────────
app.post("/generate-first-step", async (req: Request, res: Response) => {
  const body = req.body as FirstStepInput;

  if (!body?.topic_id || !body?.editorial_type) {
    res.status(400).json({ error: "topic_id và editorial_type là bắt buộc" });
    return;
  }

  try {
    const { result, meta } = await generateFirstStep(body, API_KEYS);
    res.json({ ...result, _meta: meta });
  } catch (err: any) {
    console.error("[generate-first-step] All models failed:", err?.message);

    if (res.headersSent) return;

    res.status(200).json({
      ...buildFallbackOutput(body),
      _meta: { fallback: true, error: err?.message },
    });
  }
});
 //Step 3: synthesis_ready → angles_ready
 
const ANGLES_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    topic_id:       { type: SchemaType.STRING },
    editorial_type: { type: SchemaType.STRING },
    sport_context:  { type: SchemaType.STRING },
    angle_candidates: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          angle_id:        { type: SchemaType.STRING },
          title:           { type: SchemaType.STRING },
          central_question:{ type: SchemaType.STRING },
          differentiation: { type: SchemaType.STRING },
          fit_reason:      { type: SchemaType.STRING },
          confidence_tag:  { type: SchemaType.STRING },
          warning:         { type: SchemaType.STRING },
          fact_coverage: {
            type: SchemaType.OBJECT,
            properties: {
              verified_facts_used:  { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
              claims_used:          { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
              must_points_covered:  { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
            },
            required: ["verified_facts_used", "claims_used", "must_points_covered"],
          },
        },
        required: ["angle_id", "title", "central_question", "differentiation",
                   "fit_reason", "confidence_tag", "fact_coverage"],
      },
    },
    status: { type: SchemaType.STRING },
  },
  required: ["topic_id", "editorial_type", "sport_context", "angle_candidates", "status"],
};

const SYS = "Biên tập thể thao. Nhận step-1 JSON, đề xuất góc bài. Trả JSON, không giải thích. Priorily làm theo regeneration_guidance nếu có";

// ── Tinh gọn input: chỉ giữ những gì cần để chọn góc ─────────────────────────

function slim(input: any) {
  return {
    topic_id:       input.topic_id,
    editorial_type: input.editorial_type,
    sport_context:  input.sport_context,
    problem_statement: input.problem_statement,
    key_points:     input.key_points,
    verified_facts: (input.verified_facts ?? []).map((f: any) => ({ id: f.fact_id, t: f.text })),
    claims:         (input.claims_to_verify ?? []).map((c: any) => ({ id: c.claim_id, t: c.text })),
    risks:          (input.risks ?? []).map((r: any) => ({ id: r.risk_id, t: r.text })),
        ...(input.regeneration_guidance ? { guidance: input.regeneration_guidance } : {}),
  };
}

// ── Core ──────────────────────────────────────────────────────────────────────

export async function generateAngles(
  input: any,
  apiKeys: string[],
): Promise<{ result: Record<string, unknown>; meta: AttemptMeta[] }> {
  const prompt = JSON.stringify(slim(input));
  const attempts: AttemptMeta[] = [];

  for (const model of MODELS) {
    const usedKeyIdx = (global as any).__keyIndex ?? 0;
    const key = nextKey(apiKeys);
    try {
      const res = await new GoogleGenerativeAI(key)
        .getGenerativeModel({
          model,
          systemInstruction: SYS,
          generationConfig: { responseMimeType: "application/json", responseSchema: ANGLES_SCHEMA as any },
        })
        .generateContent(prompt);

      attempts.push({ model, keyIndex: usedKeyIdx });
      return { result: JSON.parse(res.response.text()), meta: attempts };
    } catch (err: any) {
      attempts.push({ model, keyIndex: usedKeyIdx, error: err?.message ?? String(err) });
      console.warn(`[angles] ${model} key#${usedKeyIdx} fail:`, err?.message);
    }
  }
  throw new Error(`All models failed: ${JSON.stringify(attempts)}`);
}

const API_KEYS = loadApiKeys();

  app.post("/generate-angle-step", async (req: Request, res: Response) => {
    if (!req.body?.topic_id) { res.status(400).json({ error: "missing topic_id" }); return; }
    try {
      const { result, meta } = await generateAngles(req.body as any, API_KEYS);
      res.json({ ...result, _meta: meta });
    } catch (e: any) {
        const { topic_id, editorial_type, sport_context } = req.body;

    const output = {
        topic_id: "TOPIC-2026-001",

        editorial_type: {
            id: "match-analysis",
            label: "Match Analysis",
        },

        sport_context: {
            sport: "football",
            league: "Premier League",
            season: "2025/26",
            teams: ["Arsenal", "Manchester City"],
        },

        angle_candidates: [
            {
                angle_id: "ANG-001",

                title:
                    "Vì sao Arsenal hụt hơi trước Manchester City ở giai đoạn quyết định?",

                central_question:
                    "Điều gì khiến Arsenal đánh mất lợi thế trong cuộc đua vô địch Premier League?",

                differentiation:
                    "Tập trung vào yếu tố chiến thuật và chiều sâu đội hình thay vì chỉ nhìn vào kết quả thi đấu.",

                fit_reason:
                    "Angle này phù hợp với nhóm độc giả muốn hiểu nguyên nhân chiến thuật phía sau cuộc đua vô địch.",

                confidence_tag: "safe",

                warning: null,

                fact_coverage: {
                    verified_facts_used: ["F-001", "F-002", "F-003"],
                    claims_used: ["C-001"],
                    must_points_covered: ["KP-001", "KP-002"],
                },
            },

            {
                angle_id: "ANG-002",

                title:
                    "Pep Guardiola đã điều chỉnh Manchester City như thế nào để vượt Arsenal?",

                central_question:
                    "Các thay đổi chiến thuật nào giúp Manchester City duy trì sự ổn định cuối mùa?",

                differentiation:
                    "Đào sâu vào cách Pep Guardiola tối ưu pressing và kiểm soát bóng.",

                fit_reason:
                    "Phù hợp với độc giả yêu thích tactical analysis và dữ liệu chuyên sâu.",

                confidence_tag: "balanced",

                warning:
                    "Một số nhận định chiến thuật vẫn cần xác minh thêm từ nguồn phân tích chuyên môn.",

                fact_coverage: {
                    verified_facts_used: ["F-001"],
                    claims_used: ["C-001"],
                    must_points_covered: ["KP-001"],
                },
            },

            {
                angle_id: "ANG-003",

                title:
                    "Arsenal có thực sự thiếu bản lĩnh vô địch Premier League?",

                central_question:
                    "Liệu vấn đề của Arsenal nằm ở tâm lý hay chất lượng đội hình?",

                differentiation:
                    "Khai thác góc nhìn tâm lý thi đấu và áp lực đường dài thay vì thuần chiến thuật.",

                fit_reason:
                    "Angle này dễ tạo tranh luận và tăng tương tác cộng đồng.",

                confidence_tag: "risky",

                warning:
                    "Dễ mang tính suy đoán nếu không có phát biểu trực tiếp từ cầu thủ hoặc HLV.",

                fact_coverage: {
                    verified_facts_used: ["F-002", "F-003"],
                    claims_used: [],
                    must_points_covered: ["KP-002", "KP-003"],
                },
            },
        ],

        selected_angle_id: null,

        regeneration_guidance: null,

        status: "angles_ready",
    };
        return res.json(output);
    }
  });

//Step 4: angles_ready → outline_ready
// ── Schema ────────────────────────────────────────────────────────────────────
 
const S = SchemaType;
const strArr = { type: S.ARRAY, items: { type: S.STRING } };
 
const OUTLINE_SCHEMA = {
  type: S.OBJECT,
  properties: {
    topic_id:       { type: S.STRING },
    editorial_type: { type: S.STRING },
    sport_context:  { type: S.STRING },
    angle_id:       { type: S.STRING },
    headline_options: {
      type: S.ARRAY,
      items: {
        type: S.OBJECT,
        properties: {
          option_id: { type: S.STRING },
          text:      { type: S.STRING },
          dimension: { type: S.STRING },
          rationale: { type: S.STRING },
        },
        required: ["option_id", "text", "dimension", "rationale"],
      },
    },
    standfirst: { type: S.STRING },
    intro: {
      type: S.OBJECT,
      properties: {
        structure_type: { type: S.STRING },
        components: {
          type: S.ARRAY,
          items: {
            type: S.OBJECT,
            properties: { label: { type: S.STRING }, content: { type: S.STRING } },
            required: ["label", "content"],
          },
        },
      },
      required: ["structure_type", "components"],
    },
    sections: {
      type: S.ARRAY,
      items: {
        type: S.OBJECT,
        properties: {
          section_id:              { type: S.STRING },
          title:                   { type: S.STRING },
          goal:                    { type: S.STRING },
          narrative_role:          { type: S.STRING },
          connection_to_previous:  { type: S.STRING },
          key_points_to_cover:     strArr,
          fact_refs:               strArr,
          claim_refs:              strArr,
          differentiation:         { type: S.STRING },
          length_hint:             { type: S.STRING },
          transition_to_next:      { type: S.STRING },
        },
        required: ["section_id", "title", "goal", "narrative_role",
                   "key_points_to_cover", "fact_refs", "claim_refs",
                   "differentiation", "length_hint"],
      },
    },
    conclusion: {
      type: S.OBJECT,
      properties: {
        structure_type: { type: S.STRING },
        goal:           { type: S.STRING },
        key_takeaways:  strArr,
      },
      required: ["structure_type", "goal", "key_takeaways"],
    },
    metadata: {
      type: S.OBJECT,
      properties: {
        estimated_total_words: { type: S.NUMBER },
        primary_facts_used:    strArr,
        primary_claims_used:   strArr,
      },
      required: ["estimated_total_words", "primary_facts_used", "primary_claims_used"],
    },
    status: { type: S.STRING },
  },
  required: ["topic_id", "editorial_type", "sport_context", "angle_id",
             "headline_options", "standfirst", "intro", "sections", "conclusion",
             "metadata", "status"],
};

const SYS4 = "Biên tập thể thao. Nhận INPUT JSON, tạo outline bài viết. Trả JSON, không giải thích. Priorily làm theo regeneration_guidance nếu có.";

function slimOutline(input: Record<string, unknown>) {
  const syn = (input.synthesis_data ?? {}) as any;
  return {
    topic_id:       input.topic_id,
    editorial_type: input.editorial_type,
    sport_context:  input.sport_context,
    angle:          input.selected_angle,
    problem:        syn.problem_statement,
    key_points:     syn.key_points,
    facts:          (syn.verified_facts ?? []).map((f: any) => ({ id: f.fact_id, t: f.text })),
    claims:         (syn.claims_to_verify ?? []).map((c: any) => ({ id: c.claim_id, t: c.text })),
    ...(input.regeneration_guidance ? { guidance: input.regeneration_guidance } : {}),
  };
}
 
// ── Core ──────────────────────────────────────────────────────────────────────
 
export async function generateOutline(
  input: Record<string, unknown>,
  apiKeys: string[],
): Promise<{ result: Record<string, unknown>; meta: AttemptMeta[] }> {
  const prompt = JSON.stringify(slimOutline(input));
  const attempts: AttemptMeta[] = [];
 
  for (const model of MODELS) {
    const usedKeyIdx = (global as any).__keyIndex ?? 0;
    const key = nextKey(apiKeys);
    try {
      const res = await new GoogleGenerativeAI(key)
        .getGenerativeModel({
          model,
          systemInstruction: SYS4,
          generationConfig: { responseMimeType: "application/json", responseSchema: OUTLINE_SCHEMA as any },
        })
        .generateContent(prompt);
 
      attempts.push({ model, keyIndex: usedKeyIdx });
      return { result: JSON.parse(res.response.text()), meta: attempts };
    } catch (err: any) {
      attempts.push({ model, keyIndex: usedKeyIdx, error: err?.message ?? String(err) });
      console.warn(`[outline] ${model} key#${usedKeyIdx} fail:`, err?.message);
    }
  }
  throw new Error(`All models failed: ${JSON.stringify(attempts)}`);
}
//STEP 4: angles_ready → outline_ready
  app.post("/generate-outline-step", async (req: Request, res: Response) => {
    if (!req.body?.topic_id) { res.status(400).json({ error: "missing topic_id" }); return; }
    try {
      const { result, meta } = await generateOutline(req.body, API_KEYS);
      res.json({ ...result, _meta: meta });
    } catch (e: any) {
  const { topic_id, editorial_type, sport_context, angle_candidates, selected_angle_id } = req.body;

    const output = {
        topic_id: "TOPIC-2026-001",

        editorial_type: {
            id: "match-analysis",
            label: "Match Analysis",
        },

        sport_context: {
            sport: "football",
            league: "Premier League",
            season: "2025/26",
            teams: ["Arsenal", "Manchester City"],
        },

        angle_id: "ANG-001",

        headline_options: [
            {
                option_id: "HL-001",
                text:
                    "Vì sao Arsenal hụt hơi trước Manchester City ở giai đoạn quyết định?",
                dimension: "dat_cau_hoi",
                rationale:
                    "Tạo sự tò mò và đánh đúng mối quan tâm của fan Premier League.",
            },

            {
                option_id: "HL-002",
                text:
                    "Manchester City đã vượt Arsenal bằng bản lĩnh hay chiều sâu đội hình?",
                dimension: "insight",
                rationale:
                    "Nhấn mạnh yếu tố phân tích thay vì chỉ phản ánh kết quả.",
            },

            {
                option_id: "HL-003",
                text:
                    "Arsenal lại gục ngã trong cuộc đua vô địch Premier League",
                dimension: "truc_dien",
                rationale:
                    "Tiêu đề trực diện, dễ tiếp cận với nhóm độc giả đại chúng.",
            },
        ],

        selected_headline_id: null,

        standfirst:
            "Arsenal từng có thời điểm nắm lợi thế lớn trong cuộc đua vô địch Premier League 2025/26. Tuy nhiên, sự ổn định, chiều sâu đội hình và khả năng kiểm soát trận đấu của Manchester City đã tạo ra khác biệt ở giai đoạn quyết định.",

        intro: {
            structure_type: "hook_problem",

            components: [
                {
                    label: "hook",
                    content:
                        "Khi Premier League bước vào giai đoạn cuối mùa, áp lực bắt đầu bào mòn mọi sai lầm nhỏ nhất.",
                },

                {
                    label: "problem",
                    content:
                        "Arsenal một lần nữa đánh mất lợi thế trong cuộc đua vô địch dù từng dẫn đầu bảng xếp hạng.",
                },

                {
                    label: "direction",
                    content:
                        "Khác biệt không chỉ nằm ở kết quả, mà còn ở cách Manchester City duy trì sự ổn định chiến thuật và chiều sâu đội hình.",
                },
            ],
        },

        sections: [
            {
                section_id: "SEC-001",

                title:
                    "Arsenal đã đánh mất quyền kiểm soát cuộc đua như thế nào?",

                goal:
                    "Thiết lập bối cảnh cuộc đua vô địch và thời điểm Arsenal bắt đầu sa sút.",

                narrative_role: "thiet_lap",

                connection_to_previous: null,

                key_points_to_cover: ["KP-001"],

                fact_refs: ["F-001", "F-002"],

                claim_refs: [],

                differentiation:
                    "Tập trung vào diễn biến cuộc đua thay vì chỉ thống kê kết quả.",

                length_hint: "trung bình",

                transition_to_next:
                    "Sự sa sút đó bắt nguồn từ nhiều vấn đề chiến thuật và nhân sự.",
            },

            {
                section_id: "SEC-002",

                title:
                    "Chiều sâu đội hình trở thành khác biệt lớn nhất",

                goal:
                    "Phân tích ảnh hưởng của chấn thương và khả năng xoay tua đội hình.",

                narrative_role: "phat_trien",

                connection_to_previous:
                    "Sau khi mất lợi thế, Arsenal bắt đầu bộc lộ giới hạn lực lượng.",

                key_points_to_cover: ["KP-002"],

                fact_refs: ["F-003"],

                claim_refs: [],

                differentiation:
                    "Nhấn mạnh yếu tố thể lực và lịch thi đấu dày đặc cuối mùa.",

                length_hint: "dài",

                transition_to_next:
                    "Nhưng chiều sâu đội hình chỉ là một phần của vấn đề.",
            },

            {
                section_id: "SEC-003",

                title:
                    "Manchester City duy trì sự ổn định chiến thuật ra sao?",

                goal:
                    "Làm rõ cách Pep Guardiola điều chỉnh chiến thuật ở giai đoạn cuối mùa.",

                narrative_role: "doi_chieu",

                connection_to_previous:
                    "Trong khi Arsenal hụt hơi, Manchester City lại tăng tốc đúng thời điểm.",

                key_points_to_cover: ["KP-001", "KP-003"],

                fact_refs: ["F-001"],

                claim_refs: ["C-001"],

                differentiation:
                    "Đưa góc nhìn tactical analysis thay vì narrative thông thường.",

                length_hint: "dài",

                transition_to_next:
                    "Những khác biệt đó dẫn tới câu hỏi lớn hơn về bản lĩnh vô địch.",
            },

            {
                section_id: "SEC-004",

                title:
                    "Đây là thất bại chiến thuật hay vấn đề bản lĩnh?",

                goal:
                    "Mở rộng tranh luận sang yếu tố tâm lý và kinh nghiệm đường dài.",

                narrative_role: "mo_rong",

                connection_to_previous:
                    "Yếu tố chiến thuật không hoàn toàn giải thích được cú hụt hơi của Arsenal.",

                key_points_to_cover: ["KP-003"],

                fact_refs: ["F-002"],

                claim_refs: [],

                differentiation:
                    "Kết hợp góc nhìn tâm lý thi đấu với phân tích chuyên môn.",

                length_hint: "trung bình",

                transition_to_next:
                    "Dù nguyên nhân là gì, Arsenal vẫn đang đứng trước một bài toán lớn cho mùa giải tới.",
            },
        ],

        conclusion: {
            structure_type: "ket_phan_tich",

            goal:
                "Tổng hợp nguyên nhân Arsenal thất bại và mở ra góc nhìn cho mùa giải tiếp theo.",

            key_takeaways: [
                "Manchester City tạo khác biệt bằng sự ổn định và chiều sâu đội hình.",
                "Arsenal vẫn thiếu kinh nghiệm duy trì áp lực vô địch đường dài.",
                "Cuộc đua mùa tới sẽ phụ thuộc vào khả năng nâng cấp lực lượng của Arsenal.",
            ],
        },

        metadata: {
            estimated_total_words: 1800,

            primary_facts_used: ["F-001", "F-002", "F-003"],

            primary_claims_used: ["C-001"],
        },

        status: "outline_ready",
    };
       return res.json(output);   }
  });

// health check
app.get("/health", (_req, res) => res.json({ ok: true, keys: API_KEYS.length }));
 
/**
 * POST /step2
 * Input:  topic_ready payload
 * Output: synthesis_ready payload stub
 */
// ── JSON Schema for Gemini controlled generation ─────────────────────────────

 
// ── System prompt ─────────────────────────────────────────────────────────────
 

 

/**
 * POST /step3
 * Input:  synthesis_ready payload (= step2 output)
 * Output: angles_ready payload stub
 */
// app.post("/generate-angle-step", (req, res) => {
//     try {
//         validateStep3Input(req.body);
//     } catch (e) {
//         if (e instanceof ValidationError) return fail(res, 422, "Step 3 input validation failed", e.errors);
//         throw e;
//     }

//     const { topic_id, editorial_type, sport_context } = req.body;

//     const output = {
//         topic_id: "TOPIC-2026-001",

//         editorial_type: {
//             id: "match-analysis",
//             label: "Match Analysis",
//         },

//         sport_context: {
//             sport: "football",
//             league: "Premier League",
//             season: "2025/26",
//             teams: ["Arsenal", "Manchester City"],
//         },

//         angle_candidates: [
//             {
//                 angle_id: "ANG-001",

//                 title:
//                     "Vì sao Arsenal hụt hơi trước Manchester City ở giai đoạn quyết định?",

//                 central_question:
//                     "Điều gì khiến Arsenal đánh mất lợi thế trong cuộc đua vô địch Premier League?",

//                 differentiation:
//                     "Tập trung vào yếu tố chiến thuật và chiều sâu đội hình thay vì chỉ nhìn vào kết quả thi đấu.",

//                 fit_reason:
//                     "Angle này phù hợp với nhóm độc giả muốn hiểu nguyên nhân chiến thuật phía sau cuộc đua vô địch.",

//                 confidence_tag: "safe",

//                 warning: null,

//                 fact_coverage: {
//                     verified_facts_used: ["F-001", "F-002", "F-003"],
//                     claims_used: ["C-001"],
//                     must_points_covered: ["KP-001", "KP-002"],
//                 },
//             },

//             {
//                 angle_id: "ANG-002",

//                 title:
//                     "Pep Guardiola đã điều chỉnh Manchester City như thế nào để vượt Arsenal?",

//                 central_question:
//                     "Các thay đổi chiến thuật nào giúp Manchester City duy trì sự ổn định cuối mùa?",

//                 differentiation:
//                     "Đào sâu vào cách Pep Guardiola tối ưu pressing và kiểm soát bóng.",

//                 fit_reason:
//                     "Phù hợp với độc giả yêu thích tactical analysis và dữ liệu chuyên sâu.",

//                 confidence_tag: "balanced",

//                 warning:
//                     "Một số nhận định chiến thuật vẫn cần xác minh thêm từ nguồn phân tích chuyên môn.",

//                 fact_coverage: {
//                     verified_facts_used: ["F-001"],
//                     claims_used: ["C-001"],
//                     must_points_covered: ["KP-001"],
//                 },
//             },

//             {
//                 angle_id: "ANG-003",

//                 title:
//                     "Arsenal có thực sự thiếu bản lĩnh vô địch Premier League?",

//                 central_question:
//                     "Liệu vấn đề của Arsenal nằm ở tâm lý hay chất lượng đội hình?",

//                 differentiation:
//                     "Khai thác góc nhìn tâm lý thi đấu và áp lực đường dài thay vì thuần chiến thuật.",

//                 fit_reason:
//                     "Angle này dễ tạo tranh luận và tăng tương tác cộng đồng.",

//                 confidence_tag: "risky",

//                 warning:
//                     "Dễ mang tính suy đoán nếu không có phát biểu trực tiếp từ cầu thủ hoặc HLV.",

//                 fact_coverage: {
//                     verified_facts_used: ["F-002", "F-003"],
//                     claims_used: [],
//                     must_points_covered: ["KP-002", "KP-003"],
//                 },
//             },
//         ],

//         selected_angle_id: null,

//         regeneration_guidance: null,

//         status: "angles_ready",
//     };

//     store.step3.set(topic_id, output);
//     return ok(res, output);
// });

/**
 * POST /step4
 * Input:  angles_ready payload (= step3 output)
 * Output: outline_ready payload stub
 */
// app.post("/generate-outline-step", (req, res) => {
//     try {
//         validateStep4Input(req.body);
//     } catch (e) {
//         if (e instanceof ValidationError) return fail(res, 422, "Step 4 input validation failed", e.errors);
//         throw e;
//     }

//     const { topic_id, editorial_type, sport_context, angle_candidates, selected_angle_id } = req.body;

//     const output = {
//         topic_id: "TOPIC-2026-001",

//         editorial_type: {
//             id: "match-analysis",
//             label: "Match Analysis",
//         },

//         sport_context: {
//             sport: "football",
//             league: "Premier League",
//             season: "2025/26",
//             teams: ["Arsenal", "Manchester City"],
//         },

//         angle_id: "ANG-001",

//         headline_options: [
//             {
//                 option_id: "HL-001",
//                 text:
//                     "Vì sao Arsenal hụt hơi trước Manchester City ở giai đoạn quyết định?",
//                 dimension: "dat_cau_hoi",
//                 rationale:
//                     "Tạo sự tò mò và đánh đúng mối quan tâm của fan Premier League.",
//             },

//             {
//                 option_id: "HL-002",
//                 text:
//                     "Manchester City đã vượt Arsenal bằng bản lĩnh hay chiều sâu đội hình?",
//                 dimension: "insight",
//                 rationale:
//                     "Nhấn mạnh yếu tố phân tích thay vì chỉ phản ánh kết quả.",
//             },

//             {
//                 option_id: "HL-003",
//                 text:
//                     "Arsenal lại gục ngã trong cuộc đua vô địch Premier League",
//                 dimension: "truc_dien",
//                 rationale:
//                     "Tiêu đề trực diện, dễ tiếp cận với nhóm độc giả đại chúng.",
//             },
//         ],

//         selected_headline_id: null,

//         standfirst:
//             "Arsenal từng có thời điểm nắm lợi thế lớn trong cuộc đua vô địch Premier League 2025/26. Tuy nhiên, sự ổn định, chiều sâu đội hình và khả năng kiểm soát trận đấu của Manchester City đã tạo ra khác biệt ở giai đoạn quyết định.",

//         intro: {
//             structure_type: "hook_problem",

//             components: [
//                 {
//                     label: "hook",
//                     content:
//                         "Khi Premier League bước vào giai đoạn cuối mùa, áp lực bắt đầu bào mòn mọi sai lầm nhỏ nhất.",
//                 },

//                 {
//                     label: "problem",
//                     content:
//                         "Arsenal một lần nữa đánh mất lợi thế trong cuộc đua vô địch dù từng dẫn đầu bảng xếp hạng.",
//                 },

//                 {
//                     label: "direction",
//                     content:
//                         "Khác biệt không chỉ nằm ở kết quả, mà còn ở cách Manchester City duy trì sự ổn định chiến thuật và chiều sâu đội hình.",
//                 },
//             ],
//         },

//         sections: [
//             {
//                 section_id: "SEC-001",

//                 title:
//                     "Arsenal đã đánh mất quyền kiểm soát cuộc đua như thế nào?",

//                 goal:
//                     "Thiết lập bối cảnh cuộc đua vô địch và thời điểm Arsenal bắt đầu sa sút.",

//                 narrative_role: "thiet_lap",

//                 connection_to_previous: null,

//                 key_points_to_cover: ["KP-001"],

//                 fact_refs: ["F-001", "F-002"],

//                 claim_refs: [],

//                 differentiation:
//                     "Tập trung vào diễn biến cuộc đua thay vì chỉ thống kê kết quả.",

//                 length_hint: "trung bình",

//                 transition_to_next:
//                     "Sự sa sút đó bắt nguồn từ nhiều vấn đề chiến thuật và nhân sự.",
//             },

//             {
//                 section_id: "SEC-002",

//                 title:
//                     "Chiều sâu đội hình trở thành khác biệt lớn nhất",

//                 goal:
//                     "Phân tích ảnh hưởng của chấn thương và khả năng xoay tua đội hình.",

//                 narrative_role: "phat_trien",

//                 connection_to_previous:
//                     "Sau khi mất lợi thế, Arsenal bắt đầu bộc lộ giới hạn lực lượng.",

//                 key_points_to_cover: ["KP-002"],

//                 fact_refs: ["F-003"],

//                 claim_refs: [],

//                 differentiation:
//                     "Nhấn mạnh yếu tố thể lực và lịch thi đấu dày đặc cuối mùa.",

//                 length_hint: "dài",

//                 transition_to_next:
//                     "Nhưng chiều sâu đội hình chỉ là một phần của vấn đề.",
//             },

//             {
//                 section_id: "SEC-003",

//                 title:
//                     "Manchester City duy trì sự ổn định chiến thuật ra sao?",

//                 goal:
//                     "Làm rõ cách Pep Guardiola điều chỉnh chiến thuật ở giai đoạn cuối mùa.",

//                 narrative_role: "doi_chieu",

//                 connection_to_previous:
//                     "Trong khi Arsenal hụt hơi, Manchester City lại tăng tốc đúng thời điểm.",

//                 key_points_to_cover: ["KP-001", "KP-003"],

//                 fact_refs: ["F-001"],

//                 claim_refs: ["C-001"],

//                 differentiation:
//                     "Đưa góc nhìn tactical analysis thay vì narrative thông thường.",

//                 length_hint: "dài",

//                 transition_to_next:
//                     "Những khác biệt đó dẫn tới câu hỏi lớn hơn về bản lĩnh vô địch.",
//             },

//             {
//                 section_id: "SEC-004",

//                 title:
//                     "Đây là thất bại chiến thuật hay vấn đề bản lĩnh?",

//                 goal:
//                     "Mở rộng tranh luận sang yếu tố tâm lý và kinh nghiệm đường dài.",

//                 narrative_role: "mo_rong",

//                 connection_to_previous:
//                     "Yếu tố chiến thuật không hoàn toàn giải thích được cú hụt hơi của Arsenal.",

//                 key_points_to_cover: ["KP-003"],

//                 fact_refs: ["F-002"],

//                 claim_refs: [],

//                 differentiation:
//                     "Kết hợp góc nhìn tâm lý thi đấu với phân tích chuyên môn.",

//                 length_hint: "trung bình",

//                 transition_to_next:
//                     "Dù nguyên nhân là gì, Arsenal vẫn đang đứng trước một bài toán lớn cho mùa giải tới.",
//             },
//         ],

//         conclusion: {
//             structure_type: "ket_phan_tich",

//             goal:
//                 "Tổng hợp nguyên nhân Arsenal thất bại và mở ra góc nhìn cho mùa giải tiếp theo.",

//             key_takeaways: [
//                 "Manchester City tạo khác biệt bằng sự ổn định và chiều sâu đội hình.",
//                 "Arsenal vẫn thiếu kinh nghiệm duy trì áp lực vô địch đường dài.",
//                 "Cuộc đua mùa tới sẽ phụ thuộc vào khả năng nâng cấp lực lượng của Arsenal.",
//             ],
//         },

//         metadata: {
//             estimated_total_words: 1800,

//             primary_facts_used: ["F-001", "F-002", "F-003"],

//             primary_claims_used: ["C-001"],
//         },

//         status: "outline_ready",
//     };

//     store.step4.set(topic_id, output);
//     return ok(res, output);
// });
// server.ts

//  | "verified"
//   | "warning"
//   | "unknown"
//   | "recommended"
//   | "alternative"
//   | "risky";
app.post("/generate-suggestion-step", async (req, res) => {
  const FALLBACK = {
    editorialType: {
      value: "match-analysis",
      label: "Match Analysis",
      confidence: "unknown",
    },
    sport: {
      value: "football",
      confidence: "alternative",
    },
    league: {
      value: "Premier League",
      confidence: "verified",
    },
    audience: {
      value: [
        "football fans",
        "fantasy premier league players",
        "sports bettors",
      ],
      confidence: "warning",
    },
    keywords: {
      value: [
        "Arsenal vs Chelsea",
        "title race",
        "xG analysis",
        "tactical breakdown",
      ],
      confidence: "risky",
    },
    warnings: [
      "Injury reports may change before kickoff",
      "Lineup predictions are speculative",
    ],
  };

  try {
    const { briefing = "" } = req.body;

    const systemPrompt = `
Return only JSON:
{"editorialType":{"value":"","label":"","confidence":""},"sport":{"value":"","confidence":""},"league":{"value":"","confidence":""},"audience":{"value":[],"confidence":""},"keywords":{"value":[],"confidence":""},"warnings":[]}

Extract from sports briefing.
Unknown=>""|[].
confidence=verified|alternative|warning|risky|unknown.
`;

    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        temperature: 0.2,
      },
      contents: briefing,
    });

    const suggestion = JSON.parse(result.text);

    return res.json(suggestion);
  } catch (error) {
    console.error("generate-suggestion-step:", error);
return res.json(FALLBACK);
  }
});
app.use("", writingStepRouter); // → POST /api/writing-step
// ─────────────────────────────────────────────
// ERROR MIDDLEWARE
// ─────────────────────────────────────────────

// JSON parse error
app.use((err, req, res, next) => {
    if (err.type === "entity.parse.failed") {
        return fail(res, 400, "Invalid JSON body");
    }
    console.error(err);
    return fail(res, 500, "Internal server error");
});



// Mock datasets in-memory
let setupChecklist = [
    { id: '1', name: 'AI Provider + Model Mapping', status: 'configured', description: 'Cấu hình nhà cung cấp AI và mapping model cho từng agent', configGroup: 'ai-providers', debugInfo: 'OpenAI connected, 7/7 editorial agents mapped, 5/5 SEO agents mapped' },
    { id: '2', name: 'Publishing Integration', status: 'warning', description: 'Kết nối kênh phân phối nội dung', configGroup: 'social-channels', debugInfo: 'Facebook: connected, LinkedIn: disconnected, TikTok: disconnected, YouTube: connected' },
    { id: '3', name: 'Approval Rules', status: 'configured', description: 'Thiết lập quy trình phê duyệt nội dung', configGroup: 'approval-rules', debugInfo: '3 rules configured, all content types covered' },
    { id: '4', name: 'Desk / Taxonomy', status: 'configured', description: 'Cấu hình chuyên mục, tag, desk', configGroup: 'taxonomy', debugInfo: '5 categories, 12 tags, 3 desks' },
    { id: '5', name: 'Media Policy', status: 'not_configured', description: 'Chính sách media: kích thước, format, watermark', configGroup: 'media-config', debugInfo: 'No media policy configured' },
    { id: '6', name: 'Quota / Cost Threshold', status: 'error', description: 'Giới hạn ngân sách và chi phí AI', configGroup: 'quota', debugInfo: 'Monthly budget exceeded: $520/$500. Alert threshold at 80%' },
];

let editorialModelMapping = [
    { agentName: 'Research Agent', provider: 'openai', model: 'GPT-4o', temperature: 0.3, maxTokens: 8192, required: true },
    { agentName: 'Angle Agent', provider: 'anthropic', model: 'Claude 3.5 Sonnet', temperature: 0.7, maxTokens: 4096, required: true },
    { agentName: 'Outline Agent', provider: 'openai', model: 'GPT-4o', temperature: 0.5, maxTokens: 4096, required: true },
    { agentName: 'Writer Agent', provider: 'anthropic', model: 'Claude 3.5 Sonnet', temperature: 0.8, maxTokens: 16384, required: true },
    { agentName: 'Editor Agent', provider: 'openai', model: 'GPT-4o Mini', temperature: 0.3, maxTokens: 8192, required: true },
    { agentName: 'Thumbnail Agent', provider: 'openai', model: 'GPT-4o', temperature: 0.6, maxTokens: 2048, required: false },
    { agentName: 'Section Image Agent', provider: 'google', model: 'Gemini 2.0 Flash', temperature: 0.5, maxTokens: 2048, required: false },
];

let seoModelMapping = [
    { agentName: 'Keyword Research Agent', provider: 'openai', model: 'GPT-4o', temperature: 0.2, maxTokens: 4096, required: true },
    { agentName: 'SEO Outline Agent', provider: 'openai', model: 'GPT-4o', temperature: 0.4, maxTokens: 4096, required: true },
    { agentName: 'SEO Content Agent', provider: 'anthropic', model: 'Claude 3.5 Sonnet', temperature: 0.7, maxTokens: 16384, required: true },
    { agentName: 'SEO Optimize Agent', provider: 'openai', model: 'GPT-4o Mini', temperature: 0.3, maxTokens: 4096, required: true },
    { agentName: 'Media Agent', provider: 'google', model: 'Gemini 2.0 Flash', temperature: 0.5, maxTokens: 2048, required: false },
];

let promptTemplates = [
    { id: '1', agentName: 'Research Agent', name: 'Default Research', promptText: 'Research the topic "{topic}" and provide key facts, statistics, and expert opinions. Focus on {angle}.', variables: ['topic', 'angle'] },
    { id: '2', agentName: 'Writer Agent', name: 'Long-form Article', promptText: 'Write a comprehensive article about "{topic}" following the outline: {outline}. Target audience: {outline}. Tone: {tone}.', variables: ['topic', 'outline', 'audience', 'tone'] },
    { id: '3', agentName: 'Editor Agent', name: 'Final Polish', promptText: 'Edit the following article for grammar, clarity, and SEO. Maintain {tone} tone. Article: {content}', variables: ['tone', 'content'] },
    { id: '4', agentName: 'SEO Content Agent', name: 'SEO Optimized', promptText: 'Write SEO-optimized content for keyword "{keyword}" with search intent "{intent}". Include headers, meta description.', variables: ['keyword', 'intent'] },
];

let approvalRules = [
    { id: '1', contentType: 'Article', approvers: ['Editor', 'Admin'], minApprovals: 1, autoApprove: false },
    { id: '2', contentType: 'Editorial', approvers: ['Editor-in-Chief', 'Admin'], minApprovals: 2, autoApprove: false },
    { id: '3', contentType: 'Social Post', approvers: ['Social Manager'], minApprovals: 1, autoApprove: true },
];

let mediaPolicy = {
    imageMaxSizeMB: 5,
    imageFormats: ['jpg', 'png', 'webp', 'svg'],
    videoMaxDurationSec: 300,
    videoFormats: ['mp4', 'webm'],
    watermark: false,
    autoCompress: true,
    cdnUrl: '',
};

let workflowSteps = [
    { id: '1', name: 'Idea / Brief', order: 1, enabled: true, required: true },
    { id: '2', name: 'Research', order: 2, enabled: true, required: true },
    { id: '3', name: 'Outline', order: 3, enabled: true, required: true },
    { id: '4', name: 'Writing', order: 4, enabled: true, required: true },
    { id: '5', name: 'Editing', order: 5, enabled: true, required: true },
    { id: '6', name: 'Review / Approval', order: 6, enabled: true, required: true },
    { id: '7', name: 'Media Production', order: 7, enabled: true, required: false },
    { id: '8', name: 'Publishing', order: 8, enabled: true, required: true },
];

let socialChannels = [
    {
        id: '1', platform: 'facebook', platformLabel: 'Facebook Page',
        pageId: 'metapress.vn', pageName: 'MetaPress Vietnam',
        status: 'connected', enabled: true, token: 'fb_••••••3k9x',
        defaultTemplate: 'fb-default', tone: 'engaging',
        hashtagRules: '#metapress, #news, #vietnam', ctaRules: 'Đọc thêm tại link',
        contentLengthLimit: 2200, mediaRequirement: ['image', 'video'],
        schedulingEnabled: true, retryPolicy: { maxRetries: 3, cooldownMin: 15 },
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

let channelTemplates = [
    { id: '1', channel: 'facebook', channelLabel: 'Facebook', captionTemplate: '{title}\n\n{summary}\n\n{hashtags}\n\n{cta}', headlineTemplate: '{title} | MetaPress', summaryTemplate: '{summary}', hashtagRule: 'ai_generate', ctaPreset: 'Đọc thêm', tonePreset: 'engaging', defaultLength: 500, allowVariant: true },
    { id: '2', channel: 'linkedin', channelLabel: 'LinkedIn', captionTemplate: '{title}\n\n{summary}\n\n{hashtags}', headlineTemplate: '{title}', summaryTemplate: '{summary}', hashtagRule: 'auto_tags', ctaPreset: 'Learn more', tonePreset: 'professional', defaultLength: 700, allowVariant: true },
    { id: '3', channel: 'tiktok', channelLabel: 'TikTok', captionTemplate: '{title} {hashtags}', headlineTemplate: '{title}', summaryTemplate: '', hashtagRule: 'ai_generate', ctaPreset: 'Follow for more', tonePreset: 'casual', defaultLength: 150, allowVariant: false },
    { id: '4', channel: 'youtube', channelLabel: 'YouTube', captionTemplate: '{summary}\n\n{hashtags}\n\n{cta}', headlineTemplate: '{title} | MetaPress', summaryTemplate: '{summary}', hashtagRule: 'manual', ctaPreset: 'Subscribe & Like', tonePreset: 'professional', defaultLength: 1000, allowVariant: true },
];

let channelPublishRules = [
    { channel: 'facebook', channelLabel: 'Facebook', publishMode: 'schedule_required', defaultTimeSlots: ['08:00', '12:00', '18:00'], maxRetries: 3, duplicatePrevention: true, mediaValidation: true, mediaRules: 'Min 1200x630 image', fallbackBehavior: 'queue', approvalRequired: false },
    { channel: 'linkedin', channelLabel: 'LinkedIn', publishMode: 'schedule_required', defaultTimeSlots: ['09:00', '14:00'], maxRetries: 2, duplicatePrevention: true, mediaValidation: true, mediaRules: 'Min 1200x627 image', fallbackBehavior: 'notify_admin', approvalRequired: true },
    { channel: 'tiktok', channelLabel: 'TikTok', publishMode: 'immediate', defaultTimeSlots: ['11:00', '19:00', '21:00'], maxRetries: 2, duplicatePrevention: true, mediaValidation: true, mediaRules: 'Video 9:16, min 720p', fallbackBehavior: 'skip', approvalRequired: true },
    { channel: 'youtube', channelLabel: 'YouTube', publishMode: 'schedule_required', defaultTimeSlots: ['10:00', '17:00'], maxRetries: 3, duplicatePrevention: true, mediaValidation: true, mediaRules: 'Video 16:9, min 1080p, thumbnail 1280x720', fallbackBehavior: 'queue', approvalRequired: true },
];

let taxonomy = [
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

let notificationRules = [
    { id: '1', event: 'content.published', channel: 'slack', recipients: ['#content-team'] },
    { id: '2', event: 'editorial.completed', channel: 'email', recipients: ['editor@metapress.vn'] },
    { id: '3', event: 'content.review', channel: 'telegram', recipients: ['@reviewer_bot'] },
    { id: '4', event: 'quota.exceeded', channel: 'email', recipients: ['admin@metapress.vn', 'finance@metapress.vn'] },
];

let auditLogs1 = [
    { id: '1', timestamp: '2025-06-15 09:45:12', user: 'Admin', action: 'UPDATE', target: 'AI Provider - OpenAI', oldValue: 'GPT-4o Mini', newValue: 'GPT-4o' },
    { id: '2', timestamp: '2025-06-15 09:30:00', user: 'Admin', action: 'ENABLE', target: 'Social Channel - YouTube', oldValue: 'disabled', newValue: 'enabled' },
    { id: '3', timestamp: '2025-06-14 18:20:00', user: 'Editor', action: 'CREATE', target: 'Approval Rule - Social Post', oldValue: '—', newValue: 'Auto-approve enabled' },
    { id: '4', timestamp: '2025-06-14 15:00:00', user: 'Admin', action: 'UPDATE', target: 'Quota - Monthly Budget', oldValue: '$400', newValue: '$500' },
    { id: '5', timestamp: '2025-06-13 10:00:00', user: 'Admin', action: 'CONNECT', target: 'Facebook Page', oldValue: '—', newValue: 'MetaPress Vietnam' },
    { id: '6', timestamp: '2025-06-12 14:30:00', user: 'Admin', action: 'UPDATE', target: 'Media Policy', oldValue: 'watermark: on', newValue: 'watermark: off' },
    { id: '7', timestamp: '2025-06-11 09:00:00', user: 'System', action: 'ALERT', target: 'Quota', oldValue: '—', newValue: 'Budget exceeded 80% threshold' },
    { id: '8', timestamp: '2025-06-10 16:00:00', user: 'Admin', action: 'CREATE', target: 'Prompt Template - Writer Agent', oldValue: '—', newValue: 'Long-form Article template' },
];

let knowledgeSources = [
    { id: '1', type: 'url', url: 'https://docs.metapress.vn/style-guide', status: 'indexed', lastIndexed: '2025-06-14' },
    { id: '2', type: 'file', url: 'brand-guidelines-v3.pdf', status: 'indexed', lastIndexed: '2025-06-10' },
    { id: '3', type: 'api', url: 'https://api.metapress.vn/knowledge/v1', status: 'pending', lastIndexed: '—' },
];

let quotaConfig = {
    monthlyBudget: 500,
    alertThreshold: 80,
    perUserDailyLimit: 5000,
    autoBlock: true,
};

let assetFinanceConfig = {
    costCategories: ['AI Generation', 'Media Production', 'Distribution', 'Licensing'],
    revenueTracking: true,
    roiMethod: 'weighted',
    currency: 'USD',
};

// Helper to write to logs
function addAuditLog(user, action, target, oldValue, newValue) {
    const newEntry = {
        id: Math.random().toString(36).substring(2, 9),
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        user,
        action,
        target,
        oldValue,
        newValue
    };
    auditLogs1 = [newEntry, ...auditLogs1];
}

// ── 1. CHECKLIST OVERVIEW ────────────────────────────────────────────
app.get('/api/setup-checklist', (req, res) => {
    const hasMapping = editorialModelMapping.length > 0;
    const activeChannels = socialChannels.filter(c => c.status === 'connected').length;
    const isQuotaExceeded = quotaConfig.monthlyBudget < 520;

    const calculated = setupChecklist.map(item => {
        if (item.id === '1') {
            return {
                ...item,
                status: hasMapping ? 'configured' : 'not_configured',
                debugInfo: hasMapping ? `OpenAI connected, ${editorialModelMapping.length} editorial agents mapped, ${seoModelMapping.length} SEO agents mapped` : 'No models mapped'
            };
        }
        if (item.id === '2') {
            const status = activeChannels === socialChannels.length ? 'configured'
                : activeChannels > 0 ? 'warning'
                    : 'not_configured';
            return {
                ...item,
                status,
                debugInfo: `${activeChannels}/${socialChannels.length} channels connected (${socialChannels.filter(c => c.status === 'connected').map(c => c.pageName || c.platformLabel).join(', ')})`
            };
        }
        if (item.id === '6') {
            return {
                ...item,
                status: isQuotaExceeded ? 'error' : 'configured',
                debugInfo: isQuotaExceeded
                    ? `Monthly budget warning: current costs ($520) exceed limit ($${quotaConfig.monthlyBudget})`
                    : `Active. Alert threshold at ${quotaConfig.alertThreshold}%`
            };
        }
        return item;
    });

    res.json({ data: calculated });
});

app.patch('/api/setup-checklist/:id', (req, res) => {
    const { id } = req.params;
    const idx = setupChecklist.findIndex(i => i.id === id);
    if (idx === -1) {
        return res.status(404).json({ error: 'Item not found' });
    }
    setupChecklist[idx] = { ...setupChecklist[idx], ...req.body };
    res.json({ data: setupChecklist[idx] });
});

// ── 2. AI PROVIDER + MODEL MAPPING 
// SEO Model Mapping
// ───────────────────────────────────
app.get('/api/setup-checklist/editorial-mappings', (req, res) => {
    res.json({ data: editorialModelMapping });
});

app.post('/api/setup-checklist/editorial-mappings', (req, res) => {
    const oldLen = editorialModelMapping.length;
    editorialModelMapping = req.body;
    addAuditLog('Admin', 'UPDATE', 'Editorial Model Mapping', `${oldLen} agents mapped`, `${editorialModelMapping.length} agents mapped`);
    res.json({ data: editorialModelMapping });
});

app.get('/api/setup-checklist/seo-mappings', (req, res) => {
    res.json({ data: seoModelMapping });
});

app.post('/api/setup-checklist/seo-mappings', (req, res) => {
    const oldLen = seoModelMapping.length;
    seoModelMapping = req.body;
    addAuditLog('Admin', 'UPDATE', 'SEO Model Mapping', `${oldLen} agents mapped`, `${seoModelMapping.length} agents mapped`);
    res.json({ data: seoModelMapping });
});
//─────────Prompt Templates
app.get('/api/setup-checklist/prompt-templates', (req, res) => {
    res.json({ data: promptTemplates });
});

app.post('/api/setup-checklist/prompt-templates', (req, res) => {
    const template = req.body;
    const idx = promptTemplates.findIndex(t => t.id === template.id);
    if (idx === -1) {
        const newTemplate = { ...template, id: Math.random().toString(36).substring(2, 9) };
        promptTemplates.push(newTemplate);
        addAuditLog('Admin', 'CREATE', `Prompt Template - ${template.agentName}`, '—', template.name);
        res.json({ data: newTemplate });
    } else {
        const oldName = promptTemplates[idx].name;
        promptTemplates[idx] = template;
        addAuditLog('Admin', 'UPDATE', `Prompt Template - ${template.agentName}`, oldName, template.name);
        res.json({ data: template });
    }
});

app.delete('/api/setup-checklist/prompt-templates/:id', (req, res) => {
    const { id } = req.params;
    const target = promptTemplates.find(t => t.id === id);
    if (target) {
        promptTemplates = promptTemplates.filter(t => t.id !== id);
        addAuditLog('Admin', 'DELETE', `Prompt Template - ${target.agentName}`, target.name, '—');
    }
    res.json({ data: { success: true } });
});

// ── 3. PUBLISHING INTEGRATION ────────────────────────────────────────
app.get('/api/setup-checklist/social-channels', (req, res) => {
    res.json({ data: socialChannels });
});

app.post('/api/setup-checklist/social-channels', (req, res) => {
    const channel = req.body;
    const idx = socialChannels.findIndex(c => c.id === channel.id);
    if (idx === -1) {
        const newChannel = { ...channel, id: Math.random().toString(36).substring(2, 9) };
        socialChannels.push(newChannel);
        addAuditLog('Admin', 'CONNECT', `Social Channel - ${channel.platformLabel}`, '—', channel.pageName || 'Connected');
        res.json({ data: newChannel });
    } else {
        const oldName = socialChannels[idx].pageName || 'Disconnected';
        socialChannels[idx] = channel;
        addAuditLog('Admin', 'UPDATE', `Social Channel - ${channel.platformLabel}`, oldName, channel.pageName || 'Updated');
        res.json({ data: channel });
    }
});

app.post('/api/setup-checklist/social-channels/:id/test', (req, res) => {
    const { id } = req.params;
    const channel = socialChannels.find(c => c.id === id);
    if (!channel) {
        return res.json({ data: { success: false, message: 'Kênh không tồn tại' } });
    }
    const success = channel.status === 'connected' || (channel.token && channel.token.length > 0);
    res.json({
        data: {
            success,
            message: success
                ? `Kiểm tra kết nối thành công tới ${channel.pageName || channel.platformLabel}.`
                : `Lỗi kết nối: Token xác thực đã hết hạn hoặc không hợp lệ. Vui lòng kết nối lại.`
        }
    });
});

app.get('/api/setup-checklist/channel-templates', (req, res) => {
    res.json({ data: channelTemplates });
});

app.post('/api/setup-checklist/channel-templates', (req, res) => {
    const template = req.body;
    const idx = channelTemplates.findIndex(t => t.id === template.id);
    if (idx === -1) {
        const newTemplate = { ...template, id: Math.random().toString(36).substring(2, 9) };
        channelTemplates.push(newTemplate);
        addAuditLog('Admin', 'CREATE', `Channel Template - ${template.channelLabel}`, '—', template.headlineTemplate);
        res.json({ data: newTemplate });
    } else {
        channelTemplates[idx] = template;
        addAuditLog('Admin', 'UPDATE', `Channel Template - ${template.channelLabel}`, 'Old Configuration', 'Updated Configuration');
        res.json({ data: template });
    }
});

app.get('/api/setup-checklist/channel-publish-rules', (req, res) => {
    res.json({ data: channelPublishRules });
});

app.post('/api/setup-checklist/channel-publish-rules', (req, res) => {
    const rule = req.body;
    const idx = channelPublishRules.findIndex(r => r.channel === rule.channel);
    if (idx === -1) {
        channelPublishRules.push(rule);
        addAuditLog('Admin', 'CREATE', `Publish Rule - ${rule.channelLabel}`, '—', rule.publishMode);
        res.json({ data: rule });
    } else {
        const oldMode = channelPublishRules[idx].publishMode;
        channelPublishRules[idx] = rule;
        addAuditLog('Admin', 'UPDATE', `Publish Rule - ${rule.channelLabel}`, oldMode, rule.publishMode);
        res.json({ data: rule });
    }
});

// ── 4. APPROVAL RULES ────────────────────────────────────────────────
app.get('/api/setup-checklist/approval-rules', (req, res) => {
    res.json({ data: approvalRules });
});

app.post('/api/setup-checklist/approval-rules', (req, res) => {
    const rule = req.body;
    const idx = approvalRules.findIndex(r => r.id === rule.id);
    if (idx === -1) {
        const newRule = { ...rule, id: Math.random().toString(36).substring(2, 9) };
        approvalRules.push(newRule);
        addAuditLog('Admin', 'CREATE', `Approval Rule - ${rule.contentType}`, '—', `Auto: ${rule.autoApprove}`);
        res.json({ data: newRule });
    } else {
        const oldRule = approvalRules[idx];
        approvalRules[idx] = rule;
        addAuditLog('Admin', 'UPDATE', `Approval Rule - ${rule.contentType}`, `Auto: ${oldRule.autoApprove}`, `Auto: ${rule.autoApprove}`);
        res.json({ data: rule });
    }
});

app.delete('/api/setup-checklist/approval-rules/:id', (req, res) => {
    const { id } = req.params;
    const target = approvalRules.find(r => r.id === id);
    if (target) {
        approvalRules = approvalRules.filter(r => r.id !== id);
        addAuditLog('Admin', 'DELETE', `Approval Rule - ${target.contentType}`, `Auto: ${target.autoApprove}`, '—');
    }
    res.json({ data: { success: true } });
});

// ── 5. TAXONOMY ──────────────────────────────────────────────────────
app.get('/api/setup-checklist/taxonomy', (req, res) => {
    res.json({ data: taxonomy });
});

app.post('/api/setup-checklist/taxonomy', (req, res) => {
    const item = req.body;
    const idx = taxonomy.findIndex(t => t.id === item.id);
    if (idx === -1) {
        const newItem = { ...item, id: Math.random().toString(36).substring(2, 9) };
        taxonomy.push(newItem);
        addAuditLog('Admin', 'CREATE', `Taxonomy - ${item.type}`, '—', item.name);
        res.json({ data: newItem });
    } else {
        const oldName = taxonomy[idx].name;
        taxonomy[idx] = item;
        addAuditLog('Admin', 'UPDATE', `Taxonomy - ${item.type}`, oldName, item.name);
        res.json({ data: item });
    }
});

app.delete('/api/setup-checklist/taxonomy/:id', (req, res) => {
    const { id } = req.params;
    const target = taxonomy.find(t => t.id === id);
    if (target) {
        taxonomy = taxonomy.filter(t => t.id !== id);
        addAuditLog('Admin', 'DELETE', `Taxonomy - ${target.type}`, target.name, '—');
    }
    res.json({ data: { success: true } });
});

// ── 6. MEDIA CONFIGURATION ──────────────────────────────────────────────────
app.get('/api/setup-checklist/media-policy', (req, res) => {
    res.json({ data: mediaPolicy });
});

app.post('/api/setup-checklist/media-policy', (req, res) => {
    const policy = req.body;
    const old = { ...mediaPolicy };
    mediaPolicy = policy;
    addAuditLog('Admin', 'UPDATE', 'Media Policy', `Max size: ${old.imageMaxSizeMB}MB, Watermark: ${old.watermark}`, `Max size: ${policy.imageMaxSizeMB}MB, Watermark: ${policy.watermark}`);
    res.json({ data: mediaPolicy });
});

// ── 7. WORKFLOW STEPS ────────────────────────────────────────────────
app.get('/api/setup-checklist/workflow-steps', (req, res) => {
    res.json({ data: workflowSteps });
});

app.post('/api/setup-checklist/workflow-steps', (req, res) => {
    workflowSteps = req.body;
    addAuditLog('Admin', 'UPDATE', 'Workflow Steps Layout', 'Reordered/Enabled state updated', 'Saved');
    res.json({ data: workflowSteps });
});

// ── 8. NOTIFICATION RULES ────────────────────────────────────────────
app.get('/api/setup-checklist/notification-rules', (req, res) => {
    res.json({ data: notificationRules });
});

app.post('/api/setup-checklist/notification-rules', (req, res) => {
    const rule = req.body;
    const idx = notificationRules.findIndex(r => r.id === rule.id);
    if (idx === -1) {
        const newRule = { ...rule, id: Math.random().toString(36).substring(2, 9) };
        notificationRules.push(newRule);
        addAuditLog('Admin', 'CREATE', `Notification - ${rule.event}`, '—', `${rule.channel}: ${rule.recipients.join(',')}`);
        res.json({ data: newRule });
    } else {
        const oldRule = notificationRules[idx];
        notificationRules[idx] = rule;
        addAuditLog('Admin', 'UPDATE', `Notification - ${rule.event}`, `${oldRule.channel}: ${oldRule.recipients.join(',')}`, `${rule.channel}: ${rule.recipients.join(',')}`);
        res.json({ data: rule });
    }
});

app.delete('/api/setup-checklist/notification-rules/:id', (req, res) => {
    const { id } = req.params;
    const target = notificationRules.find(r => r.id === id);
    if (target) {
        notificationRules = notificationRules.filter(r => r.id !== id);
        addAuditLog('Admin', 'DELETE', `Notification - ${target.event}`, target.channel, '—');
    }
    res.json({ data: { success: true } });
});

// ── 9. QUOTA & COST CONTROL ──────────────────────────────────────────────────
app.get('/api/setup-checklist/quota-config', (req, res) => {
    res.json({ data: quotaConfig });
});

app.post('/api/setup-checklist/quota-config', (req, res) => {
    const old = { ...quotaConfig };
    quotaConfig = req.body;
    addAuditLog('Admin', 'UPDATE', 'Quota Settings', `Budget: $${old.monthlyBudget}`, `Budget: $${quotaConfig.monthlyBudget}`);
    res.json({ data: quotaConfig });
});

// ── 10. ASSET / FINANCE ─────────────────────────────────────────
app.get('/api/setup-checklist/finance-config', (req, res) => {
    res.json({ data: assetFinanceConfig });
});

app.post('/api/setup-checklist/finance-config', (req, res) => {
    const old = { ...assetFinanceConfig };
    assetFinanceConfig = req.body;
    addAuditLog('Admin', 'UPDATE', 'Asset Finance Settings', `ROI: ${old.roiMethod}, Currency: ${old.currency}`, `ROI: ${assetFinanceConfig.roiMethod}, Currency: ${assetFinanceConfig.currency}`);
    res.json({ data: assetFinanceConfig });
});

// ── 11. KNOWLEDGE SOURCES ────────────────────────────────────────────
app.get('/api/setup-checklist/knowledge-sources', (req, res) => {
    res.json({ data: knowledgeSources });
});

app.post('/api/setup-checklist/knowledge-sources', (req, res) => {
    const source = req.body;
    const newSource = {
        ...source,
        id: Math.random().toString(36).substring(2, 9),
        status: 'pending',
        lastIndexed: '—'
    };
    knowledgeSources.push(newSource);
    addAuditLog('Admin', 'CREATE', `Knowledge Source - ${source.type.toUpperCase()}`, '—', source.url);
    res.json({ data: newSource });
});

app.delete('/api/setup-checklist/knowledge-sources/:id', (req, res) => {
    const { id } = req.params;
    const target = knowledgeSources.find(k => k.id === id);
    if (target) {
        knowledgeSources = knowledgeSources.filter(k => k.id !== id);
        addAuditLog('Admin', 'DELETE', `Knowledge Source - ${target.type.toUpperCase()}`, target.url, '—');
    }
    res.json({ data: { success: true } });
});

app.post('/api/setup-checklist/knowledge-sources/:id/index', (req, res) => {
    const { id } = req.params;
    const idx = knowledgeSources.findIndex(k => k.id === id);
    if (idx === -1) {
        return res.status(404).json({ error: 'Source not found' });
    }
    knowledgeSources[idx].status = 'indexed';
    knowledgeSources[idx].lastIndexed = new Date().toISOString().substring(0, 10);
    addAuditLog('Admin', 'UPDATE', `Knowledge Re-indexing`, knowledgeSources[idx].url, 'Indexed');
    res.json({ data: knowledgeSources[idx] });
});

// ── 12. AUDIT LOGS ───────────────────────────────────────────────────
app.get('/api/setup-checklist/audit-logs', (req, res) => {
    res.json({ data: auditLogs });
});

//----13


// =============================================================
// TypeScript Interfaces
// =============================================================
interface CostCategory {
    id: string;
    name: string;
    description: string;
    active: boolean;
    createdAt: string;
}

interface RevenueCategory {
    id: string;
    name: string;
    description: string;
    active: boolean;
    createdAt: string;
}

interface RateCard {
    id: string;
    provider: string;
    model: string;
    inputPricePer1k: number;
    outputPricePer1k: number;
    currency: string;
    updatedAt: string;
}

interface TokenUsageLog {
    id: string;
    agent: string;
    model: string;
    provider: string;
    inputTokens: number;
    outputTokens: number;
    editorialItemId?: string;
    publishedItemId?: string;
    date: string;
}

interface CostEntry {
    id: string;
    amount: number;
    currency: string;
    categoryId: string;
    categoryName: string;
    date: string;
    note: string;
    publishedItemId?: string;
    publishedItemTitle?: string;
    projectId?: string;
    projectName?: string;
    status: string;
    createdBy: string;
    approvedBy?: string;
    lockedAt?: string;
    voidReason?: string;
    isAdjustment: boolean;
    adjustmentReason?: string;
    originalEntryId?: string;
    createdAt: string;
    updatedAt: string;
}

interface RevenueEntry {
    id: string;
    amount: number;
    currency: string;
    categoryId: string;
    categoryName: string;
    date: string;
    note: string;
    publishedItemId?: string;
    publishedItemTitle?: string;
    projectId?: string;
    projectName?: string;
    status: string;
    createdBy: string;
    approvedBy?: string;
    lockedAt?: string;
    voidReason?: string;
    isAdjustment: boolean;
    adjustmentReason?: string;
    originalEntryId?: string;
    createdAt: string;
    updatedAt: string;
}

interface AuditLogEntry {
    id: string;
    action: string;
    entityType: string;
    entityId: string;
    description: string;
    userId: string;
    userName: string;
    timestamp: string;
}

// =============================================================
// Local Database State (Mutable in-memory DB)
// =============================================================
let costCategories: CostCategory[] = [
    { id: "CC-001", name: "AI", description: "Chi phí sử dụng AI models", active: true, createdAt: "2025-01-01" },
    { id: "CC-002", name: "Nhân sự", description: "Lương, phụ cấp biên tập viên", active: true, createdAt: "2025-01-01" },
    { id: "CC-003", name: "Media", description: "Ảnh, video, infographic", active: true, createdAt: "2025-01-01" },
    { id: "CC-004", name: "Outsource", description: "Thuê ngoài viết bài, dịch thuật", active: true, createdAt: "2025-01-01" },
    { id: "CC-005", name: "Phân phối", description: "Quảng cáo, boost post", active: true, createdAt: "2025-01-01" },
    { id: "CC-006", name: "Tools", description: "SaaS, hosting, analytics tools", active: true, createdAt: "2025-01-01" },
    { id: "CC-007", name: "Khác", description: "Chi phí phát sinh khác", active: true, createdAt: "2025-01-01" },
];

let revenueCategories: RevenueCategory[] = [
    { id: "RC-001", name: "Ads", description: "Doanh thu quảng cáo display/native", active: true, createdAt: "2025-01-01" },
    { id: "RC-002", name: "Sponsorship", description: "Tài trợ nội dung", active: true, createdAt: "2025-01-01" },
    { id: "RC-003", name: "PR Deal", description: "Hợp đồng PR/bài trả phí", active: true, createdAt: "2025-01-01" },
    { id: "RC-004", name: "Subscription Value", description: "Giá trị từ subscriber", active: true, createdAt: "2025-01-01" },
    { id: "RC-005", name: "Lead Value", description: "Giá trị chuyển đổi lead", active: true, createdAt: "2025-01-01" },
    { id: "RC-006", name: "Khác", description: "Doanh thu khác", active: true, createdAt: "2025-01-01" },
];

let rateCards: RateCard[] = [
    { id: "RATE-001", provider: "OpenAI", model: "GPT-4o", inputPricePer1k: 0.005, outputPricePer1k: 0.015, currency: "USD", updatedAt: "2025-03-01" },
    { id: "RATE-002", provider: "OpenAI", model: "GPT-4o-mini", inputPricePer1k: 0.00015, outputPricePer1k: 0.0006, currency: "USD", updatedAt: "2025-03-01" },
    { id: "RATE-003", provider: "Google", model: "Gemini 2.5 Flash", inputPricePer1k: 0.00015, outputPricePer1k: 0.0006, currency: "USD", updatedAt: "2025-03-01" },
    { id: "RATE-004", provider: "Anthropic", model: "Claude 3.5 Sonnet", inputPricePer1k: 0.003, outputPricePer1k: 0.015, currency: "USD", updatedAt: "2025-03-01" },
];

let tokenUsageLogs: TokenUsageLog[] = [
    { id: "TU-001", agent: "research", model: "GPT-4o", provider: "OpenAI", inputTokens: 2500, outputTokens: 3200, editorialItemId: "ED-001", publishedItemId: "PUB-001", date: "2025-03-01" },
    { id: "TU-002", agent: "angle", model: "GPT-4o", provider: "OpenAI", inputTokens: 1800, outputTokens: 2100, editorialItemId: "ED-001", publishedItemId: "PUB-001", date: "2025-03-01" },
    { id: "TU-003", agent: "outline", model: "GPT-4o", provider: "OpenAI", inputTokens: 2200, outputTokens: 2800, editorialItemId: "ED-001", publishedItemId: "PUB-001", date: "2025-03-01" },
    { id: "TU-004", agent: "writer", model: "GPT-4o", provider: "OpenAI", inputTokens: 3500, outputTokens: 5500, editorialItemId: "ED-001", publishedItemId: "PUB-001", date: "2025-03-01" },
    { id: "TU-005", agent: "editor", model: "GPT-4o-mini", provider: "OpenAI", inputTokens: 4000, outputTokens: 4200, editorialItemId: "ED-001", publishedItemId: "PUB-001", date: "2025-03-02" },
    { id: "TU-006", agent: "distribution", model: "GPT-4o-mini", provider: "OpenAI", inputTokens: 1200, outputTokens: 1800, editorialItemId: "ED-001", publishedItemId: "PUB-001", date: "2025-03-02" },
    { id: "TU-007", agent: "research", model: "Gemini 2.5 Flash", provider: "Google", inputTokens: 3000, outputTokens: 3800, editorialItemId: "ED-002", publishedItemId: "PUB-002", date: "2025-03-03" },
    { id: "TU-008", agent: "angle", model: "Gemini 2.5 Flash", provider: "Google", inputTokens: 1500, outputTokens: 2000, editorialItemId: "ED-002", publishedItemId: "PUB-002", date: "2025-03-03" },
    { id: "TU-009", agent: "outline", model: "Gemini 2.5 Flash", provider: "Google", inputTokens: 2000, outputTokens: 2500, editorialItemId: "ED-002", publishedItemId: "PUB-002", date: "2025-03-03" },
    { id: "TU-010", agent: "writer", model: "GPT-4o", provider: "OpenAI", inputTokens: 4000, outputTokens: 6000, editorialItemId: "ED-002", publishedItemId: "PUB-002", date: "2025-03-04" },
    { id: "TU-011", agent: "editor", model: "GPT-4o-mini", provider: "OpenAI", inputTokens: 3500, outputTokens: 3800, editorialItemId: "ED-002", publishedItemId: "PUB-002", date: "2025-03-04" },
    { id: "TU-012", agent: "distribution", model: "GPT-4o-mini", provider: "OpenAI", inputTokens: 1000, outputTokens: 1500, editorialItemId: "ED-002", publishedItemId: "PUB-002", date: "2025-03-04" },
    { id: "TU-013", agent: "research", model: "GPT-4o", provider: "OpenAI", inputTokens: 2800, outputTokens: 3500, editorialItemId: "ED-003", date: "2025-03-05" },
    { id: "TU-014", agent: "writer", model: "Claude 3.5 Sonnet", provider: "Anthropic", inputTokens: 3800, outputTokens: 5800, editorialItemId: "ED-003", date: "2025-03-06" },
    { id: "TU-015", agent: "research", model: "GPT-4o", provider: "OpenAI", inputTokens: 2200, outputTokens: 2900, editorialItemId: "ED-004", publishedItemId: "PUB-003", date: "2025-03-07" },
    { id: "TU-016", agent: "writer", model: "GPT-4o", provider: "OpenAI", inputTokens: 3200, outputTokens: 5200, editorialItemId: "ED-004", publishedItemId: "PUB-003", date: "2025-03-07" },
];

let costEntries: CostEntry[] = [
    { id: "COST-001", amount: 150000, currency: "VND", categoryId: "CC-002", categoryName: "Nhân sự", date: "2025-03-01", note: "Phí biên tập bài PUB-001", publishedItemId: "PUB-001", publishedItemTitle: "AI trong báo chí 2025", status: "locked", createdBy: "Admin User", approvedBy: "Admin User", isAdjustment: false, createdAt: "2025-03-01", updatedAt: "2025-03-02" },
    { id: "COST-002", amount: 500000, currency: "VND", categoryId: "CC-003", categoryName: "Media", date: "2025-03-02", note: "Mua ảnh stock cho bài", publishedItemId: "PUB-001", publishedItemTitle: "AI trong báo chí 2025", status: "approved", createdBy: "Admin User", approvedBy: "Admin User", isAdjustment: false, createdAt: "2025-03-02", updatedAt: "2025-03-02" },
    { id: "COST-003", amount: 2000000, currency: "VND", categoryId: "CC-005", categoryName: "Phân phối", date: "2025-03-03", note: "Boost post Facebook", publishedItemId: "PUB-002", publishedItemTitle: "Xu hướng Content Marketing", projectId: "PRJ-001", projectName: "Dự án AI Media", status: "locked", createdBy: "Admin User", approvedBy: "Admin User", isAdjustment: false, createdAt: "2025-03-03", updatedAt: "2025-03-03" },
    { id: "COST-004", amount: 800000, currency: "VND", categoryId: "CC-004", categoryName: "Outsource", date: "2025-03-04", note: "Dịch bài sang tiếng Anh", publishedItemId: "PUB-002", publishedItemTitle: "Xu hướng Content Marketing", status: "draft", createdBy: "Editor 1", isAdjustment: false, createdAt: "2025-03-04", updatedAt: "2025-03-04" },
    { id: "COST-005", amount: 3500000, currency: "VND", categoryId: "CC-002", categoryName: "Nhân sự", date: "2025-03-05", note: "Lương nhân viên tháng 3 (phân bổ)", projectId: "PRJ-001", projectName: "Dự án AI Media", status: "locked", createdBy: "Admin User", approvedBy: "Admin User", isAdjustment: false, createdAt: "2025-03-05", updatedAt: "2025-03-05" },
    { id: "COST-006", amount: 120000, currency: "VND", categoryId: "CC-006", categoryName: "Tools", date: "2025-03-06", note: "Canva Pro subscription (phân bổ)", projectId: "PRJ-001", projectName: "Dự án AI Media", status: "approved", createdBy: "Admin User", isAdjustment: false, createdAt: "2025-03-06", updatedAt: "2025-03-06" },
    { id: "COST-007", amount: -200000, currency: "VND", categoryId: "CC-003", categoryName: "Media", date: "2025-03-07", note: "Hoàn tiền ảnh stock trùng", publishedItemId: "PUB-001", publishedItemTitle: "AI trong báo chí 2025", status: "locked", createdBy: "Admin User", approvedBy: "Admin User", isAdjustment: true, adjustmentReason: "Hoàn tiền do mua trùng license ảnh", originalEntryId: "COST-002", createdAt: "2025-03-07", updatedAt: "2025-03-07" },
];

let revenueEntries: RevenueEntry[] = [
    { id: "REV-001", amount: 5000000, currency: "VND", categoryId: "RC-001", categoryName: "Ads", date: "2025-03-05", note: "Google AdSense tháng 3", publishedItemId: "PUB-001", publishedItemTitle: "AI trong báo chí 2025", status: "locked", createdBy: "Admin User", approvedBy: "Admin User", isAdjustment: false, createdAt: "2025-03-05", updatedAt: "2025-03-05" },
    { id: "REV-002", amount: 15000000, currency: "VND", categoryId: "RC-002", categoryName: "Sponsorship", date: "2025-03-06", note: "Tài trợ từ TechCorp cho series AI", projectId: "PRJ-001", projectName: "Dự án AI Media", status: "locked", createdBy: "Admin User", approvedBy: "Admin User", isAdjustment: false, createdAt: "2025-03-06", updatedAt: "2025-03-06" },
    { id: "REV-003", amount: 8000000, currency: "VND", categoryId: "RC-003", categoryName: "PR Deal", date: "2025-03-07", note: "Bài PR hợp tác BrandX", publishedItemId: "PUB-003", publishedItemTitle: "Review sản phẩm BrandX", status: "approved", createdBy: "Admin User", approvedBy: "Admin User", isAdjustment: false, createdAt: "2025-03-07", updatedAt: "2025-03-07" },
    { id: "REV-004", amount: 2000000, currency: "VND", categoryId: "RC-005", categoryName: "Lead Value", date: "2025-03-08", note: "5 leads qualified từ bài PUB-002", publishedItemId: "PUB-002", publishedItemTitle: "Xu hướng Content Marketing", projectId: "PRJ-001", projectName: "Dự án AI Media", status: "draft", createdBy: "Editor 1", isAdjustment: false, createdAt: "2025-03-08", updatedAt: "2025-03-08" },
];

let auditLogs: AuditLogEntry[] = [
    { id: "AL-001", action: "create", entityType: "cost_entry", entityId: "COST-001", description: "Tạo chi phí nhân sự cho PUB-001", userId: "USR-001", userName: "Admin User", timestamp: "2025-03-01T10:00:00" },
    { id: "AL-002", action: "approve", entityType: "cost_entry", entityId: "COST-001", description: "Duyệt chi phí COST-001", userId: "USR-001", userName: "Admin User", timestamp: "2025-03-01T14:00:00" },
    { id: "AL-003", action: "lock", entityType: "cost_entry", entityId: "COST-001", description: "Khóa chi phí COST-001", userId: "USR-001", userName: "Admin User", timestamp: "2025-03-02T09:00:00" },
    { id: "AL-004", action: "create", entityType: "revenue_entry", entityId: "REV-001", description: "Tạo doanh thu Ads cho PUB-001", userId: "USR-001", userName: "Admin User", timestamp: "2025-03-05T10:00:00" },
    { id: "AL-005", action: "lock", entityType: "revenue_entry", entityId: "REV-001", description: "Khóa doanh thu REV-001", userId: "USR-001", userName: "Admin User", timestamp: "2025-03-05T15:00:00" },
    { id: "AL-006", action: "adjustment", entityType: "cost_entry", entityId: "COST-007", description: "Tạo điều chỉnh hoàn tiền ảnh stock", userId: "USR-001", userName: "Admin User", timestamp: "2025-03-07T11:00:00" },
    { id: "AL-007", action: "recalculate", entityType: "ai_cost", entityId: "RATE-001", description: "Tính lại AI cost sau khi cập nhật rate card", userId: "USR-001", userName: "Admin User", timestamp: "2025-03-08T09:00:00" },
];

// =============================================================
// Helper Functions
// =============================================================
const getNextId = (prefix: string, list: { id: string }[]): string => {
    const ids = list
        .map((item) => {
            const match = item.id.match(new RegExp(`${prefix}-(\\d+)`));
            return match ? parseInt(match[1], 10) : 0;
        })
        .filter((n) => !isNaN(n));
    const max = ids.length > 0 ? Math.max(...ids) : 0;
    return `${prefix}-${String(max + 1).padStart(3, "0")}`;
};

const mapToSnakeCase = (obj: any): any => {
    if (Array.isArray(obj)) return obj.map(mapToSnakeCase);
    if (obj !== null && typeof obj === "object") {
        const n: any = {};
        Object.keys(obj).forEach((key) => {
            const snakeKey = key.replace(/([A-Z])/g, "_$1").toLowerCase();
            n[snakeKey] = mapToSnakeCase(obj[key]);
        });
        return n;
    }
    return obj;
};

const logAudit = async (action: string, entityType: string, entityId: string, description: string) => {
    const newLog: AuditLogEntry = {
        id: getNextId("AL", auditLogs),
        action,
        entityType,
        entityId,
        description,
        userId: "USR-001",
        userName: "Admin User",
        timestamp: new Date().toISOString(),
    };
    auditLogs = [newLog, ...auditLogs];
    console.log(`[AUDIT LOG] ${action.toUpperCase()} - ${entityType} - ${description}`);
};

// =============================================================
// Cost Categories
// =============================================================
app.get("/api/assets/cost-categories", (req, res) => {
    res.json({ data: mapToSnakeCase(costCategories) });
});

app.post("/api/assets/cost-categories", (req, res) => {
    const payload = req.body;
    const newCat: CostCategory = {
        id: getNextId("CC", costCategories),
        name: payload.name || "",
        description: payload.description || "",
        active: payload.active !== undefined ? Boolean(payload.active) : true,
        createdAt: new Date().toISOString().slice(0, 10),
    };
    costCategories = [newCat, ...costCategories];
    logAudit("create", "cost_category", newCat.id, `Tạo danh mục chi phí: ${newCat.name}`);
    res.status(201).json({ data: mapToSnakeCase(newCat) });
});

app.patch("/api/assets/cost-categories/:id", (req, res) => {
    const { id } = req.params;
    const payload = req.body;
    const index = costCategories.findIndex((c) => c.id === id);
    if (index === -1) {
        return res.status(404).json({ message: `Cost category ${id} not found` });
    }
    const current = costCategories[index];
    if (payload.name !== undefined) current.name = payload.name;
    if (payload.description !== undefined) current.description = payload.description;
    if (payload.active !== undefined) current.active = Boolean(payload.active);

    costCategories[index] = current;
    logAudit("update", "cost_category", id, `Cập nhật danh mục chi phí: ${current.name}`);
    res.json({ data: mapToSnakeCase(current) });
});

app.delete("/api/assets/cost-categories/:id", (req, res) => {
    const { id } = req.params;
    const cat = costCategories.find((c) => c.id === id);
    if (!cat) {
        return res.status(404).json({ message: `Cost category ${id} not found` });
    }
    costCategories = costCategories.filter((c) => c.id !== id);
    logAudit("delete", "cost_category", id, `Xóa danh mục chi phí: ${cat.name}`);
    res.json({ data: undefined });
});

// =============================================================
// Revenue Categories
// =============================================================
app.get("/api/assets/revenue-categories", (req, res) => {
    res.json({ data: mapToSnakeCase(revenueCategories) });
});

app.post("/api/assets/revenue-categories", (req, res) => {
    const payload = req.body;
    const newCat: RevenueCategory = {
        id: getNextId("RC", revenueCategories),
        name: payload.name || "",
        description: payload.description || "",
        active: payload.active !== undefined ? Boolean(payload.active) : true,
        createdAt: new Date().toISOString().slice(0, 10),
    };
    revenueCategories = [newCat, ...revenueCategories];
    logAudit("create", "revenue_category", newCat.id, `Tạo danh mục doanh thu: ${newCat.name}`);
    res.status(201).json({ data: mapToSnakeCase(newCat) });
});

app.patch("/api/assets/revenue-categories/:id", (req, res) => {
    const { id } = req.params;
    const payload = req.body;
    const index = revenueCategories.findIndex((c) => c.id === id);
    if (index === -1) {
        return res.status(404).json({ message: `Revenue category ${id} not found` });
    }
    const current = revenueCategories[index];
    if (payload.name !== undefined) current.name = payload.name;
    if (payload.description !== undefined) current.description = payload.description;
    if (payload.active !== undefined) current.active = Boolean(payload.active);

    revenueCategories[index] = current;
    logAudit("update", "revenue_category", id, `Cập nhật danh mục doanh thu: ${current.name}`);
    res.json({ data: mapToSnakeCase(current) });
});

app.delete("/api/assets/revenue-categories/:id", (req, res) => {
    const { id } = req.params;
    const cat = revenueCategories.find((c) => c.id === id);
    if (!cat) {
        return res.status(404).json({ message: `Revenue category ${id} not found` });
    }
    revenueCategories = revenueCategories.filter((c) => c.id !== id);
    logAudit("delete", "revenue_category", id, `Xóa danh mục doanh thu: ${cat.name}`);
    res.json({ data: undefined });
});

// =============================================================
// Cost Entries (Transactions)
// =============================================================
app.get("/api/assets/cost-entries", (req, res) => {
    const { categoryId, status, publishedItemId, projectId, dateFrom, dateTo } = req.query;
    let result = [...costEntries];

    if (categoryId) result = result.filter((e) => e.categoryId === categoryId);
    if (status) result = result.filter((e) => e.status === status);
    if (publishedItemId) result = result.filter((e) => e.publishedItemId === publishedItemId);
    if (projectId) result = result.filter((e) => e.projectId === projectId);
    if (dateFrom) result = result.filter((e) => e.date >= String(dateFrom));
    if (dateTo) result = result.filter((e) => e.date <= String(dateTo));

    res.json({ data: mapToSnakeCase(result) });
});

app.get("/api/assets/cost-entries/:id", (req, res) => {
    const { id } = req.params;
    const entry = costEntries.find((e) => e.id === id);
    if (!entry) return res.status(404).json({ message: "Not found" });
    res.json({ data: mapToSnakeCase(entry) });
});

app.post("/api/assets/cost-entries", (req, res) => {
    const payload = req.body;
    const newEntry: CostEntry = {
        id: getNextId("COST", costEntries),
        amount: Number(payload.amount ?? 0),
        currency: payload.currency || "VND",
        categoryId: payload.category_id || "",
        categoryName: payload.category_name || "",
        date: payload.date || new Date().toISOString().slice(0, 10),
        note: payload.note || "",
        publishedItemId: payload.published_item_id,
        publishedItemTitle: payload.published_item_title,
        projectId: payload.project_id,
        projectName: payload.project_name,
        status: payload.status || "draft",
        createdBy: payload.created_by || "Admin User",
        isAdjustment: Boolean(payload.is_adjustment),
        adjustmentReason: payload.adjustment_reason,
        originalEntryId: payload.original_entry_id,
        createdAt: new Date().toISOString().slice(0, 10),
        updatedAt: new Date().toISOString().slice(0, 10),
    };
    costEntries = [newEntry, ...costEntries];

    let desc = `Tạo giao dịch chi phí: ${newEntry.note} (${newEntry.amount.toLocaleString("vi-VN")} ${newEntry.currency})`;
    if (newEntry.isAdjustment) {
        desc = `Tạo giao dịch điều chỉnh chi phí: ${newEntry.note} (${newEntry.amount.toLocaleString("vi-VN")} ${newEntry.currency})`;
    }
    logAudit(newEntry.isAdjustment ? "adjustment" : "create", "cost_entry", newEntry.id, desc);

    res.status(201).json({ data: mapToSnakeCase(newEntry) });
});

app.patch("/api/assets/cost-entries/:id", (req, res) => {
    const { id } = req.params;
    const payload = req.body;
    const index = costEntries.findIndex((e) => e.id === id);
    if (index === -1) return res.status(404).json({ message: "Not found" });

    const current = costEntries[index];

    if (payload.amount !== undefined) current.amount = Number(payload.amount);
    if (payload.currency !== undefined) current.currency = payload.currency;
    if (payload.category_id !== undefined) current.categoryId = payload.category_id;
    if (payload.category_name !== undefined) current.categoryName = payload.category_name;
    if (payload.date !== undefined) current.date = payload.date;
    if (payload.note !== undefined) current.note = payload.note;
    if (payload.published_item_id !== undefined) current.publishedItemId = payload.published_item_id;
    if (payload.published_item_title !== undefined) current.publishedItemTitle = payload.published_item_title;
    if (payload.project_id !== undefined) current.projectId = payload.project_id;
    if (payload.project_name !== undefined) current.projectName = payload.project_name;
    if (payload.status !== undefined) current.status = payload.status;
    if (payload.created_by !== undefined) current.createdBy = payload.created_by;
    if (payload.approved_by !== undefined) current.approvedBy = payload.approved_by;
    if (payload.locked_at !== undefined) current.lockedAt = payload.locked_at;
    if (payload.void_reason !== undefined) current.voidReason = payload.void_reason;
    if (payload.is_adjustment !== undefined) current.isAdjustment = Boolean(payload.is_adjustment);
    if (payload.adjustment_reason !== undefined) current.adjustmentReason = payload.adjustment_reason;
    if (payload.original_entry_id !== undefined) current.originalEntryId = payload.original_entry_id;

    current.updatedAt = new Date().toISOString().slice(0, 10);
    costEntries[index] = current;

    let action = "update";
    let desc = `Cập nhật giao dịch chi phí: ${current.note}`;

    if (payload.status) {
        if (payload.status === "submitted") {
            action = "submit";
            desc = `Trình duyệt giao dịch chi phí: ${current.note}`;
        } else if (payload.status === "approved") {
            action = "approve";
            desc = `Duyệt giao dịch chi phí: ${current.note}`;
            current.approvedBy = "Admin User";
        } else if (payload.status === "locked") {
            action = "lock";
            desc = `Khóa giao dịch chi phí: ${current.note}`;
            current.lockedAt = new Date().toISOString();
        } else if (payload.status === "void") {
            action = "void";
            desc = `Hủy giao dịch chi phí: ${current.note}. Lý do: ${payload.void_reason || "Không có lý do cụ thể"}`;
            current.voidReason = payload.void_reason;
        }
    }

    logAudit(action, "cost_entry", id, desc);
    res.json({ data: mapToSnakeCase(current) });
});

app.delete("/api/assets/cost-entries/:id", (req, res) => {
    const { id } = req.params;
    const entry = costEntries.find((e) => e.id === id);
    if (!entry) return res.status(404).json({ message: "Not found" });
    if (entry.status === "locked") {
        return res.status(400).json({ message: "Cannot delete a locked transaction" });
    }
    costEntries = costEntries.filter((e) => e.id !== id);
    logAudit("delete", "cost_entry", id, `Xóa giao dịch chi phí: ${entry.note}`);
    res.json({ data: undefined });
});

// =============================================================
// Revenue Entries (Transactions)
// =============================================================
app.get("/api/assets/revenue-entries", (req, res) => {
    const { categoryId, status, publishedItemId, projectId, dateFrom, dateTo } = req.query;
    let result = [...revenueEntries];

    if (categoryId) result = result.filter((e) => e.categoryId === categoryId);
    if (status) result = result.filter((e) => e.status === status);
    if (publishedItemId) result = result.filter((e) => e.publishedItemId === publishedItemId);
    if (projectId) result = result.filter((e) => e.projectId === projectId);
    if (dateFrom) result = result.filter((e) => e.date >= String(dateFrom));
    if (dateTo) result = result.filter((e) => e.date <= String(dateTo));

    res.json({ data: mapToSnakeCase(result) });
});

app.get("/api/assets/revenue-entries/:id", (req, res) => {
    const { id } = req.params;
    const entry = revenueEntries.find((e) => e.id === id);
    if (!entry) return res.status(404).json({ message: "Not found" });
    res.json({ data: mapToSnakeCase(entry) });
});

app.post("/api/assets/revenue-entries", (req, res) => {
    const payload = req.body;
    const newEntry: RevenueEntry = {
        id: getNextId("REV", revenueEntries),
        amount: Number(payload.amount ?? 0),
        currency: payload.currency || "VND",
        categoryId: payload.category_id || "",
        categoryName: payload.category_name || "",
        date: payload.date || new Date().toISOString().slice(0, 10),
        note: payload.note || "",
        publishedItemId: payload.published_item_id,
        publishedItemTitle: payload.published_item_title,
        projectId: payload.project_id,
        projectName: payload.project_name,
        status: payload.status || "draft",
        createdBy: payload.created_by || "Admin User",
        isAdjustment: Boolean(payload.is_adjustment),
        adjustmentReason: payload.adjustment_reason,
        originalEntryId: payload.original_entry_id,
        createdAt: new Date().toISOString().slice(0, 10),
        updatedAt: new Date().toISOString().slice(0, 10),
    };
    revenueEntries = [newEntry, ...revenueEntries];

    let desc = `Tạo giao dịch doanh thu: ${newEntry.note} (${newEntry.amount.toLocaleString("vi-VN")} ${newEntry.currency})`;
    if (newEntry.isAdjustment) {
        desc = `Tạo giao dịch điều chỉnh doanh thu: ${newEntry.note} (${newEntry.amount.toLocaleString("vi-VN")} ${newEntry.currency})`;
    }
    logAudit(newEntry.isAdjustment ? "adjustment" : "create", "revenue_entry", newEntry.id, desc);

    res.status(201).json({ data: mapToSnakeCase(newEntry) });
});

app.patch("/api/assets/revenue-entries/:id", (req, res) => {
    const { id } = req.params;
    const payload = req.body;
    const index = revenueEntries.findIndex((e) => e.id === id);
    if (index === -1) return res.status(404).json({ message: "Not found" });

    const current = revenueEntries[index];

    if (payload.amount !== undefined) current.amount = Number(payload.amount);
    if (payload.currency !== undefined) current.currency = payload.currency;
    if (payload.category_id !== undefined) current.categoryId = payload.category_id;
    if (payload.category_name !== undefined) current.categoryName = payload.category_name;
    if (payload.date !== undefined) current.date = payload.date;
    if (payload.note !== undefined) current.note = payload.note;
    if (payload.published_item_id !== undefined) current.publishedItemId = payload.published_item_id;
    if (payload.published_item_title !== undefined) current.publishedItemTitle = payload.published_item_title;
    if (payload.project_id !== undefined) current.projectId = payload.project_id;
    if (payload.project_name !== undefined) current.projectName = payload.project_name;
    if (payload.status !== undefined) current.status = payload.status;
    if (payload.created_by !== undefined) current.createdBy = payload.created_by;
    if (payload.approved_by !== undefined) current.approvedBy = payload.approved_by;
    if (payload.locked_at !== undefined) current.lockedAt = payload.locked_at;
    if (payload.void_reason !== undefined) current.voidReason = payload.void_reason;
    if (payload.is_adjustment !== undefined) current.isAdjustment = Boolean(payload.is_adjustment);
    if (payload.adjustment_reason !== undefined) current.adjustmentReason = payload.adjustment_reason;
    if (payload.original_entry_id !== undefined) current.originalEntryId = payload.original_entry_id;

    current.updatedAt = new Date().toISOString().slice(0, 10);
    revenueEntries[index] = current;

    let action = "update";
    let desc = `Cập nhật giao dịch doanh thu: ${current.note}`;

    if (payload.status) {
        if (payload.status === "submitted") {
            action = "submit";
            desc = `Trình duyệt giao dịch doanh thu: ${current.note}`;
        } else if (payload.status === "approved") {
            action = "approve";
            desc = `Duyệt giao dịch doanh thu: ${current.note}`;
            current.approvedBy = "Admin User";
        } else if (payload.status === "locked") {
            action = "lock";
            desc = `Khóa giao dịch doanh thu: ${current.note}`;
            current.lockedAt = new Date().toISOString();
        } else if (payload.status === "void") {
            action = "void";
            desc = `Hủy giao dịch doanh thu: ${current.note}. Lý do: ${payload.void_reason || "Không có lý do cụ thể"}`;
            current.voidReason = payload.void_reason;
        }
    }

    logAudit(action, "revenue_entry", id, desc);
    res.json({ data: mapToSnakeCase(current) });
});

app.delete("/api/assets/revenue-entries/:id", (req, res) => {
    const { id } = req.params;
    const entry = revenueEntries.find((e) => e.id === id);
    if (!entry) return res.status(404).json({ message: "Not found" });
    if (entry.status === "locked") {
        return res.status(400).json({ message: "Cannot delete a locked transaction" });
    }
    revenueEntries = revenueEntries.filter((e) => e.id !== id);
    logAudit("delete", "revenue_entry", id, `Xóa giao dịch doanh thu: ${entry.note}`);
    res.json({ data: undefined });
});

// =============================================================
// Rate Cards
// =============================================================
app.get("/api/assets/rate-cards", (req, res) => {
    res.json({ data: mapToSnakeCase(rateCards) });
});

app.post("/api/assets/rate-cards", (req, res) => {
    const payload = req.body;
    const newCard: RateCard = {
        id: getNextId("RATE", rateCards),
        provider: payload.provider || "",
        model: payload.model || "",
        inputPricePer1k: Number(payload.input_price_per_1k ?? 0),
        outputPricePer1k: Number(payload.output_price_per_1k ?? 0),
        currency: payload.currency || "USD",
        updatedAt: new Date().toISOString().slice(0, 10),
    };
    rateCards = [...rateCards, newCard];
    logAudit("create", "rate_card", newCard.id, `Tạo bảng giá Rate Card: ${newCard.provider} - ${newCard.model}`);
    res.status(201).json({ data: mapToSnakeCase(newCard) });
});

app.patch("/api/assets/rate-cards/:id", (req, res) => {
    const { id } = req.params;
    const payload = req.body;
    const index = rateCards.findIndex((r) => r.id === id);
    if (index === -1) return res.status(404).json({ message: "Not found" });

    const current = rateCards[index];
    if (payload.provider !== undefined) current.provider = payload.provider;
    if (payload.model !== undefined) current.model = payload.model;
    if (payload.input_price_per_1k !== undefined) current.inputPricePer1k = Number(payload.input_price_per_1k);
    if (payload.output_price_per_1k !== undefined) current.outputPricePer1k = Number(payload.output_price_per_1k);
    if (payload.currency !== undefined) current.currency = payload.currency;
    current.updatedAt = new Date().toISOString().slice(0, 10);

    rateCards[index] = current;
    logAudit("update", "rate_card", id, `Cập nhật bảng giá Rate Card: ${current.provider} - ${current.model}`);
    res.json({ data: mapToSnakeCase(current) });
});

app.delete("/api/assets/rate-cards/:id", (req, res) => {
    const { id } = req.params;
    const card = rateCards.find((r) => r.id === id);
    if (!card) return res.status(404).json({ message: "Not found" });

    rateCards = rateCards.filter((r) => r.id !== id);
    logAudit("delete", "rate_card", id, `Xóa bảng giá Rate Card: ${card.provider} - ${card.model}`);
    res.json({ data: undefined });
});

// =============================================================
// Token Usage Logs
// =============================================================
app.get("/api/assets/token-usage-logs", (req, res) => {
    const { publishedItemId, dateFrom, dateTo } = req.query;
    let result = [...tokenUsageLogs];

    if (publishedItemId) result = result.filter((t) => t.publishedItemId === publishedItemId);
    if (dateFrom) result = result.filter((t) => t.date >= String(dateFrom));
    if (dateTo) result = result.filter((t) => t.date <= String(dateTo));

    res.json({ data: mapToSnakeCase(result) });
});

app.post("/api/assets/token-usage-logs", (req, res) => {
    const payload = req.body;
    const newLog: TokenUsageLog = {
        id: getNextId("TU", tokenUsageLogs),
        agent: payload.agent || "",
        model: payload.model || "",
        provider: payload.provider || "",
        inputTokens: Number(payload.input_tokens ?? 0),
        outputTokens: Number(payload.output_tokens ?? 0),
        editorialItemId: payload.editorial_item_id,
        publishedItemId: payload.published_item_id,
        date: payload.date || new Date().toISOString().slice(0, 10),
    };
    tokenUsageLogs = [...tokenUsageLogs, newLog];
    res.status(201).json({ data: mapToSnakeCase(newLog) });
});

// =============================================================
// Audit Logs
// =============================================================
app.get("/api/assets/audit-logs", (req, res) => {
    res.json({ data: mapToSnakeCase(auditLogs) });
});

app.post("/api/assets/audit-logs", (req, res) => {
    const payload = req.body;
    const newLog: AuditLogEntry = {
        id: getNextId("AL", auditLogs),
        action: payload.action || "custom",
        entityType: payload.entity_type || "other",
        entityId: payload.entity_id || "",
        description: payload.description || "",
        userId: "USR-001",
        userName: "Admin User",
        timestamp: new Date().toISOString(),
    };
    auditLogs = [newLog, ...auditLogs];
    res.status(201).json({ data: mapToSnakeCase(newLog) });
});

// =============================================================
// Analytics & KPI Helpers
// =============================================================
const computeBreakdown = (filters: any) => {
    let logs = [...tokenUsageLogs];

    if (filters.publishedItemId) {
        logs = logs.filter((t) => t.publishedItemId === filters.publishedItemId);
    }
    if (filters.dateFrom) {
        logs = logs.filter((t) => t.date >= filters.dateFrom);
    }
    if (filters.dateTo) {
        logs = logs.filter((t) => t.date <= filters.dateTo);
    }

    const agentMap = new Map<string, any>();

    for (const t of logs) {
        const rate = rateCards.find((r) => r.model === t.model && r.provider === t.provider);
        const inputCost = rate ? (t.inputTokens / 1000) * rate.inputPricePer1k : 0;
        const outputCost = rate ? (t.outputTokens / 1000) * rate.outputPricePer1k : 0;
        const key = `${t.agent}-${t.model}`;

        const existing = agentMap.get(key);
        if (existing) {
            existing.inputTokens += t.inputTokens;
            existing.outputTokens += t.outputTokens;
            existing.inputCost += inputCost;
            existing.outputCost += outputCost;
            existing.totalCost += inputCost + outputCost;
        } else {
            agentMap.set(key, {
                agent: t.agent,
                model: t.model,
                inputTokens: t.inputTokens,
                outputTokens: t.outputTokens,
                inputCost,
                outputCost,
                totalCost: inputCost + outputCost,
            });
        }
    }

    return Array.from(agentMap.values());
};

// =============================================================
// Analytics & KPI Routes
// =============================================================
app.get("/api/assets/analytics/ai-cost-breakdown", (req, res) => {
    const breakdown = computeBreakdown(req.query);
    res.json({ data: breakdown });
});

app.get("/api/assets/analytics/total-ai-cost", (req, res) => {
    const breakdown = computeBreakdown(req.query);
    const total = breakdown.reduce((acc, curr) => acc + curr.totalCost, 0);
    res.json({ data: total });
});

app.get("/api/assets/analytics/kpi", (req, res) => {
    const filters = req.query;

    let filteredCosts = costEntries.filter((c) => c.status !== "void");
    let filteredRevs = revenueEntries.filter((r) => r.status !== "void");

    if (filters.publishedItemId) {
        filteredCosts = filteredCosts.filter((c) => c.publishedItemId === filters.publishedItemId);
        filteredRevs = filteredRevs.filter((r) => r.publishedItemId === filters.publishedItemId);
    }
    if (filters.projectId) {
        // Standard rule matching frontend filter logic:
        filteredCosts = filteredCosts.filter((c) => c.projectId === filters.projectId || c.publishedItemId);
        filteredRevs = filteredRevs.filter((r) => r.publishedItemId === filters.publishedItemId);
    }
    if (filters.dateFrom) {
        filteredCosts = filteredCosts.filter((c) => c.date >= String(filters.dateFrom));
        filteredRevs = filteredRevs.filter((r) => r.date >= String(filters.dateFrom));
    }
    if (filters.dateTo) {
        filteredCosts = filteredCosts.filter((c) => c.date <= String(filters.dateTo));
        filteredRevs = filteredRevs.filter((r) => r.date <= String(filters.dateTo));
    }

    const breakdown = computeBreakdown(filters);
    const totalAiCostUsd = breakdown.reduce((acc, curr) => acc + curr.totalCost, 0);
    const aiCostVnd = totalAiCostUsd * 25000;

    const totalTransactionCost = filteredCosts.reduce((sum, entry) => sum + entry.amount, 0);
    const totalCost = totalTransactionCost + aiCostVnd;

    const totalRevenue = filteredRevs.reduce((sum, entry) => sum + entry.amount, 0);

    const profit = totalRevenue - totalCost;
    const roi = totalCost > 0 ? (profit / totalCost) * 100 : 0;

    const articleCount = new Set([
        ...filteredCosts.map((c) => c.publishedItemId),
        ...filteredRevs.map((r) => r.publishedItemId)
    ].filter(Boolean)).size || 1;

    const costPerArticle = totalCost / articleCount;

    res.json({
        data: {
            totalCost,
            totalRevenue,
            profit,
            roi,
            costPerArticle,
            costPer1kViews: 0,
            aiCost: aiCostVnd,
        },
    });
});
// In-memory data store
let store = {
        step2: new Map(), // topic_id → synthesis_ready payload
    step3: new Map(), // topic_id → angles_ready payload
    step4: new Map(), // topic_id → outline_ready payload
    settings: {
        apiIntegrations: [...initialApiIntegrations],
        aiProviders: [...initialAiProviders],
        aiTaskConfigs: [...initialAiTaskConfigs],
        webhooks: [...initialWebhooks],
        generalSettings: { ...initialGeneralSettings },
        tokenLimitsPerRole: [...tokenLimitsPerRole],
        aiParams: { ...initialAiParams },
    },
    projectConfig: {
        setupChecklist: [...initialSetupChecklist],
        modelMappings: {
            editorial: [...initialEditorial],
            seo: [...initialSeo],
        },
        promptTemplates: [...initialPromptTemplates],
        approvalRules: [...initialApprovalRules],
        mediaPolicy: { ...initialMediaPolicy },
        workflowSteps: [...initialWorkflowSteps],
        socialChannels: [...initialSocialChannels],
        channelTemplates: [...initialChannelTemplates],
        channelPublishRules: [...initialChannelPublishRules],
        taxonomy: [...initialTaxonomy],
        notificationRules: [...initialNotificationRules],
        auditLogs: [...initialAuditLogs],
        knowledgeSources: [...initialKnowledgeSources],
        quotaConfig: { ...initialQuotaConfig },
        assetFinanceConfig: { ...initialAssetFinanceConfig },
    }
};

// ==========================================
// Settings Routes
// ==========================================
//GENERAL
app.get('/api/settings/general', (req, res) => res.json(store.settings.generalSettings));
app.put('/api/settings/general', (req, res) => {
    store.settings.generalSettings = { ...store.settings.generalSettings, ...req.body };
    res.json(store.settings.generalSettings);
});

// Generic collection handler factory
const createCollectionRoutes = (basePath: string, getCollection: () => any[]) => {
    app.get(basePath, (req, res) => res.json(getCollection()));
    app.post(basePath, (req, res) => {
        const newItem = { ...req.body, id: Date.now().toString() };
        getCollection().push(newItem);
        res.json(newItem);
    });
    app.put(`${basePath}/:id`, (req, res) => {
        const collection = getCollection();
        const index = collection.findIndex((item: any) => item.id === req.params.id);
        if (index > -1) {
            collection[index] = { ...collection[index], ...req.body };
            res.json(collection[index]);
        } else {
            res.status(404).json({ error: 'Not found' });
        }
    });

    // Optional PUT on collection for full array update (e.g., workflow steps order)
    app.put(basePath, (req, res) => {
        if (Array.isArray(req.body)) {
            const collection = getCollection();
            collection.splice(0, collection.length, ...req.body);
            res.json(collection);
        } else {
            res.status(400).json({ error: 'Array expected' });
        }
    });
    app.delete(`${basePath}/:id`, (req, res) => {
        const collection = getCollection();
        const index = collection.findIndex((item: any) => item.id === req.params.id);
        if (index > -1) {
            collection.splice(index, 1);
            res.json({ success: true });
        } else {
            res.status(404).json({ error: 'Not found' });
        }
    });
};

createCollectionRoutes('/api/settings/api-integrations', () => store.settings.apiIntegrations);
// AI PROVIDERS
createCollectionRoutes('/api/settings/ai-providers', () => store.settings.aiProviders);
// AI CONFIG
createCollectionRoutes('/api/settings/ai-task-configs', () => store.settings.aiTaskConfigs);
// wEBHOOKS
createCollectionRoutes('/api/settings/webhooks', () => store.settings.webhooks);

// ==========================================
// Project Config Routes
// ==========================================
app.get('/api/project-config/media-policy', (req, res) => res.json(store.projectConfig.mediaPolicy));
app.put('/api/project-config/media-policy', (req, res) => {
    store.projectConfig.mediaPolicy = { ...store.projectConfig.mediaPolicy, ...req.body };
    res.json(store.projectConfig.mediaPolicy);
});

app.get('/api/project-config/quota-config', (req, res) => res.json(store.projectConfig.quotaConfig));
app.put('/api/project-config/quota-config', (req, res) => {
    store.projectConfig.quotaConfig = { ...store.projectConfig.quotaConfig, ...req.body };
    res.json(store.projectConfig.quotaConfig);
});
app.put('/api/settings/ai-task-configs/:task', (req, res) => {
    const index = store.settings.aiTaskConfigs.findIndex(
        item => item.task === req.params.task
    );

    if (index === -1) {
        return res.status(404).json({ error: 'Not found' });
    }

    store.settings.aiTaskConfigs[index] = {
        ...store.settings.aiTaskConfigs[index],
        ...req.body,
    };

    res.json(store.settings.aiTaskConfigs[index]);
});
// CHI PHÍ + Tham số mặc định + NGÂN SÁCH + Ngưỡng cảnh báo + Temperature + Max Tokens
app.get('/api/settings/ai-params', (req, res) => res.json(store.settings.aiParams));
app.put('/api/settings/ai-params', (req, res) => {
    store.settings.aiParams = { ...store.settings.aiParams, ...req.body };
    res.json(store.settings.aiParams);
});
app.get('/api/project-config/asset-finance', (req, res) => res.json(store.projectConfig.assetFinanceConfig));
app.put('/api/project-config/asset-finance', (req, res) => {
    store.projectConfig.assetFinanceConfig = { ...store.projectConfig.assetFinanceConfig, ...req.body };
    res.json(store.projectConfig.assetFinanceConfig);
});

//Audit logs
app.get('/api/project-config/audit-logs', (req, res) => res.json(store.projectConfig.auditLogs));
app.post('/api/project-config/audit-logs', (req, res) => {
    const newAuditLog: any = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        ...req.body,
    };

    store.projectConfig.auditLogs.unshift(newAuditLog);

    res.json({
        success: true,
        data: newAuditLog,
    });
});
// Single object / display routes
app.get('/api/project-config/setup-checklist', (req, res) => res.json(store.projectConfig.setupChecklist));

//SEO MODEL MAPPING + EDITORIAL MODEL MAPPING
app.get('/api/project-config/model-mappings', (req, res) => {
    const type = req.query.type as string;
    if (type === 'editorial') return res.json(store.projectConfig.modelMappings.editorial);
    if (type === 'seo') return res.json(store.projectConfig.modelMappings.seo);
    res.status(400).json({ error: 'invalid type' });
});
let modelMappings: any[] = [];

app.put(
    "/api/project-config/model-mappings",
    (req: Request<{}, {}, any[]>, res: Response) => {
        try {
            const mappings = req.body;

            if (!Array.isArray(mappings)) {
                return res.status(400).json({
                    message: "Body must be an array of ModelMapping",
                });
            }

            modelMappings = mappings;

            return res.status(200).json(modelMappings);
        } catch (error) {
            console.error(error);

            return res.status(500).json({
                message: "Failed to update model mappings",
            });
        }
    }
);
//EDITORIAL WORKFLOW
createCollectionRoutes('/api/project-config/workflow-steps', () => store.projectConfig.workflowSteps);
//PROMPT TEMPLATES
createCollectionRoutes('/api/project-config/prompt-templates', () => store.projectConfig.promptTemplates);
//APPROVAL RULES
createCollectionRoutes('/api/project-config/approval-rules', () => store.projectConfig.approvalRules);
//CHANNEL TEMPLATES
createCollectionRoutes('/api/project-config/channel-templates', () => store.projectConfig.channelTemplates);
//PUBLISHING RULES
createCollectionRoutes('/api/project-config/channel-publish-rules', () => store.projectConfig.channelPublishRules);
//TAXONOMY & MAPPING
createCollectionRoutes('/api/project-config/taxonomy', () => store.projectConfig.taxonomy);
//NOTIFICATION RULES
createCollectionRoutes('/api/project-config/notification-rules', () => store.projectConfig.notificationRules);

//KNOWLEDGE BASE
createCollectionRoutes('/api/project-config/knowledge-sources', () => store.projectConfig.knowledgeSources);
// server.ts — thêm vào nếu chưa có
//TOKEN LIMITS THEO ROLE
app.get('/api/settings/token-limits', (req, res) => res.json(store.settings.tokenLimitsPerRole));
app.put('/api/settings/token-limits', (req, res) => {
    if (Array.isArray(req.body)) {
        store.settings.tokenLimitsPerRole = req.body;
        res.json(store.settings.tokenLimitsPerRole);
    } else {
        res.status(400).json({ error: 'Array expected' });
    }
});
//SOCIAL CHANNELS
app.get('/api/project-config/social-channels', (req, res) => {
    res.json({
        success: true,
        data: store.projectConfig.socialChannels,
    });
});
app.put('/api/project-config/social-channels/:id', (req, res) => {
    const { id } = req.params;
    const channels = store.projectConfig.socialChannels;

    const channel = channels.find(
        (item: any) => String(item.id) === String(id)
    );

    if (!channel) {
        return res.status(404).json({
            error: 'Social channel not found',
        });
    }

    Object.assign(channel, req.body);

    return res.json({
        success: true,
        data: channel,
    });
});
// =============================================================
// Start Server
// =============================================================

// ─────────────────────────────────────────────
// START
// ─────────────────────────────────────────────
const PORT = process.env.PORT || 3006;
app.listen(PORT, () => console.log(`Editorial pipeline server running on :${PORT}`));

module.exports = app; // for testing
