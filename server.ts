// server.ts
import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

const API_KEY = "sk_mdjwnNCia8w7WzdCsqvcXjHJXG6WBRtE";

function mapToMediaItem(item: any) {
    return {
        id: item.id,
        name: item.name,
        type: item.type,
        source: item.source,
        url: item.url,
        thumbnailUrl: item.thumbnailUrl,
        folderId: item.folderId,
        tags: item.tags,
        size: item.size,
        width: item.width,
        height: item.height,
        format: item.format,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        uploadedBy: item.uploadedBy,
        aiPrompt: item.aiPrompt,
        aiStyle: item.aiStyle,
        aiModel: item.aiModel,
        linkedContentId: item.linkedContentId,
        linkedContentTitle: item.linkedContentTitle,
    };
}

function mapToMediaFolder(folder: any) {
    return {
        id: folder.id,
        name: folder.name,
        parentId: folder.parentId,
        itemCount: folder.itemCount,
        createdAt: folder.createdAt,
    };
}

app.get("/api/media-items", async (_, res) => {
    try {
        const prompt = "a cat in space";

        const imageUrl = `https://gen.pollinations.ai/image/${encodeURIComponent(
            prompt
        )}`;

        const item = mapToMediaItem({
            id: "1",
            name: "Cat In Space",
            type: "image",
            source: "pollinations",
            url: imageUrl,
            thumbnailUrl: imageUrl,
            folderId: "ai-images",
            tags: ["ai", "cat", "space"],
            size: 0,
            width: 1024,
            height: 1024,
            format: "png",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            uploadedBy: "AI",
            aiPrompt: prompt,
            aiStyle: "default",
            aiModel: "pollinations",
            linkedContentId: null,
            linkedContentTitle: null,
        });

        res.json({
            success: true,
            data: [item],
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: "Failed to fetch media items",
        });
    }
});

app.get("/api/media-folders", async (_, res) => {
    try {
        const folders = [
            mapToMediaFolder({
                id: "ai-images",
                name: "AI Images",
                parentId: null,
                itemCount: 1,
                createdAt: new Date().toISOString(),
            }),
        ];

        res.json({
            success: true,
            data: folders,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: "Failed to fetch media folders",
        });
    }
});
type MockUser = {
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

const mockUsers: MockUser[] = [
    {
        id: "1",
        name: "Nguyễn Minh Tuấn",
        email: "tuan@metapress.vn",
        initials: "NT",
        role: "Admin",
        team: "Product",
        status: "active",
        lastLogin: "2025-06-15 09:23",
        aiTokensUsed: 45200,
        aiTokensLimit: 100000,
    },
    {
        id: "2",
        name: "Trần Thị Mai",
        email: "mai@metapress.vn",
        initials: "TM",
        role: "Editor",
        team: "Content",
        status: "active",
        lastLogin: "2025-06-15 08:45",
        aiTokensUsed: 32800,
        aiTokensLimit: 50000,
    },
];

const PERMISSION_ACTIONS = [
    "Create Content",
    "Edit Content",
    "Publish",
    "Delete",
    "Manage Users",
    "View Analytics",
    "AI Usage",
    "Settings",
];

const permissionMatrix: Permission[] = PERMISSION_ACTIONS.map(
    (action) => ({
        action,
        roles: {
            Admin: true,
            Editor: [
                "Create Content",
                "Edit Content",
                "Publish",
                "View Analytics",
                "AI Usage",
            ].includes(action),
            Writer: [
                "Create Content",
                "Edit Content",
                "AI Usage",
            ].includes(action),
            Reviewer: [
                "Edit Content",
                "View Analytics",
            ].includes(action),
            Viewer: ["View Analytics"].includes(action),
        },
    })
);

const activityLog: ActivityEntry[] = [
    {
        id: "1",
        timestamp: "2025-06-15 10:30",
        user: "Cao Minh Đức",
        action: "Login",
        target: "System",
        ip: "192.168.1.45",
    },
];

const aiUsageByRole = [
    { role: "Admin", tokens: 97200 },
    { role: "Editor", tokens: 54100 },
    { role: "Writer", tokens: 63500 },
    { role: "Reviewer", tokens: 14500 },
    { role: "Viewer", tokens: 1200 },
];

// routes
app.get("/", (_, res) => {
    res.json({
        message: "MetaPress Mock API running",
    });
});

app.get("/api/users", (_, res) => {
    res.json(mockUsers);
});

app.get("/api/permissions", (_, res) => {
    res.json(permissionMatrix);
});

app.get("/api/activity-log", (_, res) => {
    res.json(activityLog);
});

app.get("/api/ai-usage", (_, res) => {
    res.json(aiUsageByRole);
});

// optional
app.get("/api/dashboard", (_, res) => {
    res.json({
        users: mockUsers,
        permissions: permissionMatrix,
        activityLog,
        aiUsageByRole,
    });
});

const PORT = process.env.PORT || 3006;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});