// routes/writingStep.ts
import { Router, Request, Response } from "express";
import { z } from "zod";

// ─── Zod Schemas ────────────────────────────────────────────────────────────

const ComponentSchema = z.object({
    label: z.string(),
    content: z.string(),
});

const IntroSchema = z.object({
    structure_type: z.enum([
        "lead",
        "context_focus",
        "hook_problem",
        "character_intro",
        "issue_position",
        "feature_opening",
    ]),
    components: z.array(ComponentSchema).min(1),
});

const SectionSchema = z.object({
    section_id: z.string(),
    title: z.string(),
    goal: z.string(),
    narrative_role: z.enum([
        "thiet_lap",
        "phat_trien",
        "mo_rong",
        "doi_chieu",
        "dao_chieu",
        "tong_hop",
        "ket",
    ]),
    connection_to_previous: z.string().nullable(),
    key_points_to_cover: z.array(z.string()),
    fact_refs: z.array(z.string()),
    claim_refs: z.array(z.string()),
    differentiation: z.string(),
    length_hint: z.enum(["ngắn", "trung bình", "dài"]),
    transition_to_next: z.string().optional(),
});

const ConclusionSchema = z.object({
    structure_type: z.enum([
        "ket_su_kien",
        "ket_phan_tich",
        "ket_phong_van",
        "ket_op_ed",
        "ket_feature",
        "ket_recap",
    ]),
    goal: z.string(),
    key_takeaways: z.array(z.string()).min(1),
});

const MetadataSchema = z.object({
    estimated_total_words: z.number().int().nonnegative(),
    primary_facts_used: z.array(z.string()),
    primary_claims_used: z.array(z.string()),
});

const OutlineInputSchema = z.object({
    topic_id: z.string(),

    language: z.literal("vi"),

    editorial_type: z.string(),

    sport_context: z.object(),

    synthesis_data: z.object({
        verified_facts: z.array(
            z.object({
                fact_id: z.string(),
                text: z.string(),

                source_refs: z.array(z.string()).optional(),

                source_count: z.number().optional(),

                confidence: z.string().optional(),
            })
        ),

        claims_to_verify: z.array(
            z.object({
                claim_id: z.string(),

                text: z.string(),

                source_refs: z.array(z.string()).optional(),

                source_count: z.number().optional(),

                confidence: z.string().optional(),

                verify_hint: z.string().optional(),
            })
        ),
    }),

    selected_angle: z.object({
        title: z.string(),

        central_question: z.string(),

        differentiation: z.string(),
    }),

    "outline": z.object({
        selected_headline: z.object({
            text: z.string(),

            dimension: z.enum([
                "truc_dien",
                "dat_cau_hoi",
                "insight",
            ]),
        }),

        standfirst: z.string(),

        intro: z.object({
            structure_type: z.enum([
                "lead",
                "context_focus",
                "hook_problem",
                "character_intro",
                "issue_position",
                "feature_opening",
            ]),

            components: z.array(
                z.object({
                    label: z.string(),

                    content: z.string(),
                })
            ),
        }),

        sections: z.array(
            z.object({
                section_id: z.string(),

                title: z.string(),

                goal: z.string(),

                narrative_role: z.enum([
                    "thiet_lap",
                    "phat_trien",
                    "mo_rong",
                    "doi_chieu",
                    "dao_chieu",
                    "tong_hop",
                    "ket",
                ]),

                connection_to_previous: z
                    .string()
                    .nullable(),

                key_points_to_cover: z.array(z.string()),

                fact_refs: z.array(z.string()),

                claim_refs: z.array(z.string()),

                differentiation: z.string(),

                length_hint: z.enum([
                    "ngắn",
                    "trung bình",
                    "dài",
                ]),

                transition_to_next: z
                    .string()
                    .nullable()
                    .optional(),
            })
        ),

        conclusion: z.object({
            structure_type: z.enum([
                "ket_su_kien",
                "ket_phan_tich",
                "ket_phong_van",
                "ket_op_ed",
                "ket_feature",
                "ket_recap",
            ]),

            goal: z.string(),

            key_takeaways: z.array(z.string()),
        }),

        metadata: z.object({
            estimated_total_words: z.number().int().nonnegative(),
            primary_facts_used: z.array(z.string()),
            primary_claims_used: z.array(z.string()),
        }),
    }),
});

// ─── Types ───────────────────────────────────────────────────────────────────

type OutlineInput = z.infer<typeof OutlineInputSchema>;

type ContentBlock =
    | { type: "paragraph"; text: string; facts_used: string[]; claims_used: string[] }
    | { type: "bullet_list"; items: string[] }
    | { type: "blockquote"; text: string; attribution: string }
    | { type: "table"; caption?: string; headers: string[]; rows: string[][] }
    | { type: "info_box"; title: string; content: string };

interface DraftSection {
    section_id: string;
    title: string;
    content_blocks: ContentBlock[];
    facts_used: string[];
    claims_used: string[];
    anglicism_handled: { original: string; vietnamese: string; explanation_added: boolean }[];
    open_issues: string[];
}

interface DraftOutput {
    topic_id: string;
    editorial_type: string;
    sport_context: any;
    angle_id: string;
    outline_id: string;
    title: string;
    standfirst: string;
    intro_content: {
        structure_type: string;
        content_blocks: ContentBlock[];
    };
    sections: DraftSection[];
    conclusion_content: {
        structure_type: string;
        content_blocks: ContentBlock[];
    };
    consistency_notes: string[];
    metadata: {
        total_words: number;
        total_facts_used: number;
        total_claims_used: number;
        total_anglicism_handled: number;
        block_count: {
            paragraph: number;
            bullet_list: number;
            numbered_list: number;
            blockquote: number;
            table: number;
            info_box: number;
        };
    };
    status: "draft_ready";
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Resolve headline text từ outline.selected_headline */
function resolveHeadline(input: OutlineInput): string {
    return input.outline.selected_headline.text;
}

/** Map intro components → paragraph content_blocks */
function buildIntroBlocks(input: OutlineInput): ContentBlock[] {
    return input.outline.intro.components.map((c) => ({
        type: "paragraph" as const,
        text: `[${c.label}] ${c.content}`,
        facts_used: [],
        claims_used: [],
    }));
}

/** Map một section outline → DraftSection scaffold */
function buildSection(sec: z.infer<typeof SectionSchema>): DraftSection {
    const blocks: ContentBlock[] = [];

    // Paragraph scaffold từ key_points
    if (sec.key_points_to_cover.length > 0) {
        blocks.push({
            type: "paragraph",
            text: sec.key_points_to_cover.join(" "),
            facts_used: [...sec.fact_refs],
            claims_used: [...sec.claim_refs],
        });
    }

    // Nếu có transition → gợi ý paragraph chuyển tiếp
    if (sec.transition_to_next) {
        blocks.push({
            type: "paragraph",
            text: `[Chuyển tiếp] ${sec.transition_to_next}`,
            facts_used: [],
            claims_used: [],
        });
    }

    return {
        section_id: sec.section_id,
        title: sec.title,
        content_blocks: blocks,
        facts_used: [...sec.fact_refs],
        claims_used: [...sec.claim_refs],
        anglicism_handled: [],
        open_issues: sec.goal ? [`Chưa phát triển đủ mục tiêu: ${sec.goal}`] : [],
    };
}

/** Map conclusion key_takeaways → paragraph blocks */
function buildConclusionBlocks(input: OutlineInput): ContentBlock[] {
    return input.outline.conclusion.key_takeaways.map((kp) => ({
        type: "paragraph" as const,
        text: kp,
        facts_used: [],
        claims_used: [],
    }));
}

/** Đếm tổng block theo type */
function countBlocks(allBlocks: ContentBlock[]): DraftOutput["metadata"]["block_count"] {
    const count = {
        paragraph: 0,
        bullet_list: 0,
        numbered_list: 0,
        blockquote: 0,
        table: 0,
        info_box: 0,
    };
    for (const b of allBlocks) {
        if (b.type in count) {
            count[b.type as keyof typeof count]++;
        }
    }
    return count;
}

// ─── Transform ────────────────────────────────────────────────────────────────

function transformOutlineToDraft(input: OutlineInput): DraftOutput {
    const { outline, topic_id, editorial_type, sport_context, selected_angle } = input;

    const title = resolveHeadline(input);
    const introBlocks = buildIntroBlocks(input);
    const draftSections = outline.sections.map(buildSection);
    const conclusionBlocks = buildConclusionBlocks(input);

    const allBlocks: ContentBlock[] = [
        ...introBlocks,
        ...draftSections.flatMap((s) => s.content_blocks),
        ...conclusionBlocks,
    ];

    const allFacts = new Set<string>([
        ...outline.metadata.primary_facts_used,
        ...draftSections.flatMap((s) => s.facts_used),
    ]);

    const allClaims = new Set<string>([
        ...outline.metadata.primary_claims_used,
        ...draftSections.flatMap((s) => s.claims_used),
    ]);

    const paragraphText = allBlocks
        .filter((b): b is Extract<ContentBlock, { type: "paragraph" }> => b.type === "paragraph")
        .map((b) => b.text)
        .join(" ");

    const estimatedWords = paragraphText.split(/\s+/).filter(Boolean).length;

    // angle_id derived từ selected_angle.title (slug hoá đơn giản)
    const angle_id = selected_angle.title
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");

    return {
        topic_id,
        editorial_type,
        sport_context,
        angle_id,
        outline_id: `outline-${topic_id}-${angle_id}`,
        title,
        standfirst: outline.standfirst,
        intro_content: {
            structure_type: outline.intro.structure_type,
            content_blocks: introBlocks,
        },
        sections: draftSections,
        conclusion_content: {
            structure_type: outline.conclusion.structure_type,
            content_blocks: conclusionBlocks,
        },
        consistency_notes: [],
        metadata: {
            total_words: estimatedWords,
            total_facts_used: allFacts.size,
            total_claims_used: allClaims.size,
            total_anglicism_handled: 0,
            block_count: countBlocks(allBlocks),
        },
        status: "draft_ready",
    };
}

// ─── Route ────────────────────────────────────────────────────────────────────

const router = Router();

router.post("/writing-step", (req: Request, res: Response) => {
    // const parsed = OutlineInputSchema.safeParse(req.body);

    // if (!parsed.success) {
    //     return res.status(400).json({
    //         error: "Invalid outline input",
    //         details: parsed.error.flatten(),
    //     });
    // }

    const draft = {
        "topic_id": "TOPIC-2026-001",
        "editorial_type": "phan_tich_chien_thuat",
        "sport_context": {
            "sport": "Bóng đá",
            "league_or_level": "Premier League",
            "scope_detected": "international",
            "scope_confidence": "high"
        },
        "angle_id": "ANG-003",
        "outline_id": "OUTLINE-001",

        "title": "Vì sao Arsenal hụt hơi trước Manchester City ở giai đoạn quyết định?",

        "standfirst": "Arsenal từng nắm lợi thế lớn trong cuộc đua vô địch Premier League 2025/26. Tuy nhiên, sự ổn định chiến thuật, chiều sâu đội hình và kinh nghiệm đường dài của Manchester City đã tạo nên khác biệt ở thời điểm quan trọng nhất.",

        "intro_content": {
            "structure_type": "hook_problem",
            "content_blocks": [
                {
                    "type": "paragraph",
                    "text": "Khi Premier League bước vào giai đoạn cuối mùa, áp lực bắt đầu bào mòn mọi sai lầm nhỏ nhất. Arsenal từng có thời điểm chiếm lợi thế trong cuộc đua vô địch, nhưng chỉ vài tuần sa sút đã khiến họ đánh mất quyền tự quyết.",
                    "facts_used": [],
                    "claims_used": []
                },
                {
                    "type": "paragraph",
                    "text": "Trong khi đó, Manchester City tiếp tục thể hiện hình ảnh quen thuộc dưới thời Pep Guardiola: ổn định, kiểm soát và gần như không để lộ khoảng trống trong giai đoạn quyết định.",
                    "facts_used": ["F-001"],
                    "claims_used": []
                }
            ]
        },

        "sections": [
            {
                "section_id": "SEC-001",
                "title": "Arsenal đã đánh mất lợi thế như thế nào?",

                "content_blocks": [
                    {
                        "type": "paragraph",
                        "text": "Giai đoạn cuối mùa chứng kiến Arsenal đánh rơi nhiều điểm số quan trọng trước các đối thủ bị đánh giá thấp hơn. Vấn đề không chỉ nằm ở kết quả, mà còn ở cách họ để trận đấu vượt khỏi tầm kiểm soát trong những thời điểm áp lực cao.",
                        "facts_used": ["F-002"],
                        "claims_used": []
                    },

                    {
                        "type": "bullet_list",
                        "items": [
                            "Khả năng pressing giảm rõ rệt",
                            "Tuyến giữa mất sự cân bằng",
                            "Khó kiểm soát phản công tốc độ cao"
                        ]
                    },

                    {
                        "type": "blockquote",
                        "text": "Trong cuộc đua đường dài, chỉ một giai đoạn mất ổn định cũng đủ khiến mọi lợi thế biến mất.",
                        "attribution": "Phân tích Premier League Weekly"
                    }
                ],

                "facts_used": ["F-001", "F-002"],

                "claims_used": [],

                "anglicism_handled": [
                    {
                        "original": "high press",
                        "vietnamese": "pressing tầm cao",
                        "explanation_added": false
                    }
                ],

                "open_issues": []
            },

            {
                "section_id": "SEC-002",
                "title": "Chiều sâu đội hình tạo nên khác biệt",

                "content_blocks": [
                    {
                        "type": "paragraph",
                        "text": "Chấn thương của Declan Rice khiến Arsenal mất đi nhân tố quan trọng trong khâu thu hồi bóng và chuyển đổi trạng thái. Trong khi đó, Manchester City vẫn duy trì chất lượng thi đấu dù xoay tua đội hình liên tục.",
                        "facts_used": ["F-003"],
                        "claims_used": []
                    },

                    {
                        "type": "table",
                        "caption": "So sánh chiều sâu đội hình cuối mùa",
                        "headers": [
                            "Tiêu chí",
                            "Arsenal",
                            "Manchester City"
                        ],
                        "rows": [
                            [
                                "Khả năng xoay tua",
                                "Hạn chế",
                                "Ổn định"
                            ],
                            [
                                "Kiểm soát bóng",
                                "Giảm cuối mùa",
                                "Duy trì ổn định"
                            ],
                            [
                                "Kinh nghiệm vô địch",
                                "Thấp hơn",
                                "Rất cao"
                            ]
                        ]
                    },

                    {
                        "type": "info_box",
                        "title": "Điểm đáng chú ý",
                        "content": "Manchester City duy trì tỷ lệ kiểm soát bóng trên 63% trong 10 trận cuối mùa."
                    }
                ],

                "facts_used": ["F-001", "F-003"],

                "claims_used": [],

                "anglicism_handled": [
                    {
                        "original": "squad depth",
                        "vietnamese": "chiều sâu đội hình",
                        "explanation_added": false
                    }
                ],

                "open_issues": []
            },

            {
                "section_id": "SEC-003",
                "title": "Pep Guardiola đã thay đổi Manchester City ra sao?",

                "content_blocks": [
                    {
                        "type": "paragraph",
                        "text": "Một trong những điều chỉnh đáng chú ý của Pep Guardiola là giảm tải pressing cho Rodri để giữ sự ổn định tuyến giữa ở giai đoạn cuối mùa.",
                        "facts_used": ["F-004"],
                        "claims_used": ["C-001"]
                    },

                    {
                        "type": "paragraph",
                        "text": "Điều đó giúp Manchester City duy trì khả năng kiểm soát nhịp độ trận đấu ngay cả khi lịch thi đấu trở nên dày đặc.",
                        "facts_used": ["F-001"],
                        "claims_used": []
                    },

                    {
                        "type": "bullet_list",
                        "items": [
                            "Kiểm soát bóng tốt hơn",
                            "Giảm áp lực lên Rodri",
                            "Tối ưu hóa pressing theo thời điểm"
                        ]
                    }
                ],

                "facts_used": ["F-001", "F-004"],

                "claims_used": ["C-001"],

                "anglicism_handled": [
                    {
                        "original": "game management",
                        "vietnamese": "kiểm soát thế trận",
                        "explanation_added": false
                    }
                ],

                "open_issues": [
                    "Cần xác minh thêm dữ liệu pressing phases từ nguồn thống kê chuyên sâu."
                ]
            }
        ],

        "conclusion_content": {
            "structure_type": "ket_phan_tich",

            "content_blocks": [
                {
                    "type": "paragraph",
                    "text": "Khoảng cách giữa Arsenal và Manchester City không hoàn toàn nằm ở chất lượng đội hình. Điều tạo ra khác biệt lớn nhất là khả năng duy trì sự ổn định dưới áp lực kéo dài của cuộc đua vô địch.",
                    "facts_used": [],
                    "claims_used": []
                },

                {
                    "type": "paragraph",
                    "text": "Nếu muốn thực sự vượt qua Manchester City trong những mùa tới, Arsenal không chỉ cần thêm cầu thủ, mà còn cần xây dựng bản lĩnh và chiều sâu đủ để tồn tại trong giai đoạn khắc nghiệt nhất của mùa giải.",
                    "facts_used": [],
                    "claims_used": []
                }
            ]
        },

        "consistency_notes": [
            "Giữ tone phân tích xuyên suốt bài viết.",
            "Không khẳng định tuyệt đối các claim chiến thuật chưa verify hoàn toàn."
        ],

        "metadata": {
            "total_words": 1450,
            "total_facts_used": 7,
            "total_claims_used": 1,
            "total_anglicism_handled": 3,

            "block_count": {
                "paragraph": 8,
                "bullet_list": 2,
                "numbered_list": 0,
                "blockquote": 1,
                "table": 1,
                "info_box": 1
            }
        },

        "status": "draft_ready"
    };
    return res.status(200).json(draft);
});

export default router;