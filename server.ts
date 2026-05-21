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
const placeholder = "/placeholder.svg";

app.get("/api/media-items", async (_, res) => {
    try {
        const mediaItems = [
            // Upload items
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
                id: "media-003", name: "product-demo.mp4", type: "video", source: "upload",
                url: placeholder, thumbnailUrl: placeholder, folderId: "folder-4",
                tags: ["demo", "product"], size: 52428800, duration: 120, format: "mp4",
                createdAt: "2025-02-05", updatedAt: "2025-02-05", uploadedBy: "Admin User",
            },
            {
                id: "media-004", name: "brand-guidelines.pdf", type: "document", source: "upload",
                url: placeholder, thumbnailUrl: placeholder, folderId: "folder-5",
                tags: ["brand", "guidelines"], size: 3145728, format: "pdf",
                createdAt: "2025-02-15", updatedAt: "2025-02-15", uploadedBy: "Admin User",
            },
            {
                id: "media-005", name: "social-template-ig.jpg", type: "image", source: "upload",
                url: placeholder, thumbnailUrl: placeholder, folderId: "folder-3",
                tags: ["social", "instagram", "template"], size: 245760, width: 1080, height: 1080, format: "jpg",
                createdAt: "2025-02-18", updatedAt: "2025-02-18", uploadedBy: "Editor B",
            },
            {
                id: "media-006", name: "blog-cover-seo.jpg", type: "image", source: "upload",
                url: placeholder, thumbnailUrl: placeholder, folderId: "folder-2",
                tags: ["blog", "SEO", "cover"], size: 409600, width: 1200, height: 630, format: "jpg",
                createdAt: "2025-03-01", updatedAt: "2025-03-01", uploadedBy: "Admin User",
            },
            {
                id: "media-007", name: "tutorial-part1.mp4", type: "video", source: "upload",
                url: placeholder, thumbnailUrl: placeholder, folderId: "folder-4",
                tags: ["tutorial", "onboarding"], size: 104857600, duration: 300, format: "mp4",
                createdAt: "2025-03-02", updatedAt: "2025-03-02", uploadedBy: "Editor A",
            },
            {
                id: "media-008", name: "pitch-deck.pdf", type: "document", source: "upload",
                url: placeholder, thumbnailUrl: placeholder, folderId: "folder-5",
                tags: ["pitch", "investor"], size: 5242880, format: "pdf",
                createdAt: "2025-03-03", updatedAt: "2025-03-03", uploadedBy: "Admin User",
            },
            {
                id: "media-009", name: "thumbnail-ep12.jpg", type: "image", source: "upload",
                url: placeholder, thumbnailUrl: placeholder, folderId: "folder-1",
                tags: ["thumbnail", "youtube"], size: 184320, width: 1280, height: 720, format: "jpg",
                createdAt: "2025-03-04", updatedAt: "2025-03-04", uploadedBy: "Editor B",
            },
            {
                id: "media-010", name: "fb-ad-creative.png", type: "image", source: "upload",
                url: placeholder, thumbnailUrl: placeholder, folderId: "folder-3",
                tags: ["facebook", "ad", "creative"], size: 327680, width: 1200, height: 628, format: "png",
                createdAt: "2025-03-05", updatedAt: "2025-03-05", uploadedBy: "Admin User",
            },

            // AI Generated items
            {
                id: "media-ai-001", name: "ai-thumbnail-crypto.jpg", type: "image", source: "ai-generated",
                url: placeholder, thumbnailUrl: placeholder, folderId: null,
                tags: ["ai", "crypto", "thumbnail"], size: 307200, width: 1280, height: 720, format: "jpg",
                createdAt: "2025-02-20", updatedAt: "2025-02-20", uploadedBy: "AI Agent",
                aiPrompt: "A futuristic digital landscape with Bitcoin symbols floating in a neon-lit cityscape",
                aiStyle: "Cinematic", aiModel: "flux.dev",
                linkedContentId: "CT-001", linkedContentTitle: "Bitcoin Q1 2025 Analysis",
            },
            {
                id: "media-ai-002", name: "ai-blog-cover-ai-trends.jpg", type: "image", source: "ai-generated",
                url: placeholder, thumbnailUrl: placeholder, folderId: null,
                tags: ["ai", "trends", "blog"], size: 409600, width: 1200, height: 630, format: "jpg",
                createdAt: "2025-02-25", updatedAt: "2025-02-25", uploadedBy: "AI Agent",
                aiPrompt: "Abstract neural network visualization with flowing data streams in purple and cyan tones",
                aiStyle: "Illustration", aiModel: "flux2.dev",
                linkedContentId: "CT-003", linkedContentTitle: "AI Trends 2025",
            },
            {
                id: "media-ai-003", name: "ai-social-defi.jpg", type: "image", source: "ai-generated",
                url: placeholder, thumbnailUrl: placeholder, folderId: null,
                tags: ["ai", "defi", "social"], size: 245760, width: 1080, height: 1080, format: "jpg",
                createdAt: "2025-03-01", updatedAt: "2025-03-01", uploadedBy: "AI Agent",
                aiPrompt: "Decentralized finance concept art showing interconnected blockchain nodes with golden light",
                aiStyle: "Realistic", aiModel: "flux.schnell",
                linkedContentId: "CT-005", linkedContentTitle: "DeFi Deep Dive",
            },
            {
                id: "media-ai-004", name: "ai-banner-metaverse.jpg", type: "image", source: "ai-generated",
                url: placeholder, thumbnailUrl: placeholder, folderId: null,
                tags: ["ai", "metaverse", "banner"], size: 512000, width: 1920, height: 1080, format: "jpg",
                createdAt: "2025-03-03", updatedAt: "2025-03-03", uploadedBy: "AI Agent",
                aiPrompt: "Immersive metaverse environment with virtual avatars and holographic interfaces",
                aiStyle: "Cinematic", aiModel: "flux.dev",
            },
            {
                id: "media-ai-005", name: "ai-infographic-web3.jpg", type: "image", source: "ai-generated",
                url: placeholder, thumbnailUrl: placeholder, folderId: null,
                tags: ["ai", "web3", "infographic"], size: 368640, width: 1080, height: 1350, format: "jpg",
                createdAt: "2025-03-05", updatedAt: "2025-03-05", uploadedBy: "AI Agent",
                aiPrompt: "Clean infographic style showing Web3 ecosystem layers with icons and connecting lines",
                aiStyle: "Illustration", aiModel: "flux2.dev",
                linkedContentId: "CT-008", linkedContentTitle: "Web3 Ecosystem Overview",
            },
            {
                id: "media-ai-006", name: "ai-thumb-nft-guide.jpg", type: "image", source: "ai-generated",
                url: placeholder, thumbnailUrl: placeholder, folderId: null,
                tags: ["ai", "nft", "guide"], size: 286720, width: 1280, height: 720, format: "jpg",
                createdAt: "2025-03-06", updatedAt: "2025-03-06", uploadedBy: "AI Agent",
                aiPrompt: "Colorful NFT art gallery with digital frames floating in space, vibrant colors",
                aiStyle: "Realistic", aiModel: "flux.dev",
            },
        ];
        res.json({
            success: true,
            data: [mediaItems],
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