// server.ts
import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

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

// GET all
app.get("/api/media-items", (_, res) => {
    success(res, mediaItems);
});

// GET by id
app.get("/api/media-items/:id", (req, res) => {
    const item = mediaItems.find((i) => i.id === req.params.id);
    if (!item) return notFound(res, "Media item");
    success(res, item);
});

// POST create
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

// PATCH update
app.patch("/api/media-items/:id", (req, res) => {
    const index = mediaItems.findIndex((i) => i.id === req.params.id);
    if (index === -1) return notFound(res, "Media item");
    mediaItems[index] = { ...mediaItems[index], ...req.body, updatedAt: now() };
    success(res, mediaItems[index]);
});

// DELETE
app.delete("/api/media-items/:id", (req, res) => {
    const index = mediaItems.findIndex((i) => i.id === req.params.id);
    if (index === -1) return notFound(res, "Media item");
    const deleted = mediaItems.splice(index, 1)[0];
    success(res, deleted);
});

// ====================
// Media Folders CRUD
// ====================

// GET all
app.get("/api/media-folders", (_, res) => {
    success(res, mediaFolders);
});

// GET by id
app.get("/api/media-folders/:id", (req, res) => {
    const folder = mediaFolders.find((f) => f.id === req.params.id);
    if (!folder) return notFound(res, "Media folder");
    success(res, folder);
});

// POST create
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

// PATCH update
app.patch("/api/media-folders/:id", (req, res) => {
    const index = mediaFolders.findIndex((f) => f.id === req.params.id);
    if (index === -1) return notFound(res, "Media folder");
    mediaFolders[index] = { ...mediaFolders[index], ...req.body };
    success(res, mediaFolders[index]);
});

// DELETE
app.delete("/api/media-folders/:id", (req, res) => {
    const index = mediaFolders.findIndex((f) => f.id === req.params.id);
    if (index === -1) return notFound(res, "Media folder");
    const deleted = mediaFolders.splice(index, 1)[0];
    success(res, deleted);
});

// ====================
// Users CRUD
// ====================

// GET all
app.get("/api/users", (_, res) => {
    success(res, users);
});

// GET by id
app.get("/api/users/:id", (req, res) => {
    const user = users.find((u) => u.id === req.params.id);
    if (!user) return notFound(res, "User");
    success(res, user);
});

// POST create
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

// PATCH update
app.patch("/api/users/:id", (req, res) => {
    const index = users.findIndex((u) => u.id === req.params.id);
    if (index === -1) return notFound(res, "User");
    users[index] = { ...users[index], ...req.body };
    success(res, users[index]);
});

// DELETE
app.delete("/api/users/:id", (req, res) => {
    const index = users.findIndex((u) => u.id === req.params.id);
    if (index === -1) return notFound(res, "User");
    const deleted = users.splice(index, 1)[0];
    success(res, deleted);
});

// ====================
// Permissions CRUD
// ====================

// GET all
app.get("/api/permissions", (_, res) => {
    success(res, permissionMatrix);
});

// GET by action
app.get("/api/permissions/:action", (req, res) => {
    const permission = permissionMatrix.find(
        (p) => p.action.toLowerCase() === decodeURIComponent(req.params.action).toLowerCase()
    );
    if (!permission) return notFound(res, "Permission");
    success(res, permission);
});

// POST create new action
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

// PATCH update roles for an action
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

// DELETE action
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

// GET all (hỗ trợ filter ?user= &action=)
app.get("/api/activity-log", (req, res) => {
    let result = [...activityLog];
    if (req.query.user) result = result.filter((a) => a.user === req.query.user);
    if (req.query.action) result = result.filter((a) => a.action === req.query.action);
    success(res, result);
});

// GET by id
app.get("/api/activity-log/:id", (req, res) => {
    const entry = activityLog.find((a) => a.id === req.params.id);
    if (!entry) return notFound(res, "Activity entry");
    success(res, entry);
});

// POST create
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

// PATCH update
app.patch("/api/activity-log/:id", (req, res) => {
    const index = activityLog.findIndex((a) => a.id === req.params.id);
    if (index === -1) return notFound(res, "Activity entry");
    activityLog[index] = { ...activityLog[index], ...req.body };
    success(res, activityLog[index]);
});

// DELETE
app.delete("/api/activity-log/:id", (req, res) => {
    const index = activityLog.findIndex((a) => a.id === req.params.id);
    if (index === -1) return notFound(res, "Activity entry");
    const deleted = activityLog.splice(index, 1)[0];
    success(res, deleted);
});

// ====================
// AI Usage CRUD
// ====================

// GET all
app.get("/api/ai-usage", (_, res) => {
    success(res, aiUsageByRole);
});

// GET by role
app.get("/api/ai-usage/:role", (req, res) => {
    const entry = aiUsageByRole.find(
        (a) => a.role.toLowerCase() === req.params.role.toLowerCase()
    );
    if (!entry) return notFound(res, "AI usage entry");
    success(res, entry);
});

// POST create
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

// PATCH update tokens
app.patch("/api/ai-usage/:role", (req, res) => {
    const index = aiUsageByRole.findIndex(
        (a) => a.role.toLowerCase() === req.params.role.toLowerCase()
    );
    if (index === -1) return notFound(res, "AI usage entry");
    aiUsageByRole[index] = { ...aiUsageByRole[index], ...req.body };
    success(res, aiUsageByRole[index]);
});

// DELETE
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

app.get("/", (_, res) => {
    res.json({ message: "MetaPress Mock API running" });
});

const PORT = process.env.PORT || 3006;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));