fetch("http://localhost:3006/generate-first-step", {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
    },
    body: JSON.stringify({
        topic_id: "TOP-001",
        language: "vi",
        topic_title: "MU thắng Arsenal",
        briefing: "Tổng hợp trận đấu",
        editorial_type: "recap",
        sport_context: {
            sport: "football",
            league_or_level: "Premier League",
            scope_detected: "europe",
            scope_confidence: "high",
        },
        target_audience: ["fan bóng đá"],
        reference_keywords: ["MU", "Arsenal"],
        constraints: {
            target_length_range: "800-1200",
            freshness_priority: "high",
        },
        source_inputs: [],
        status: "topic_ready",
    }),
})
    .then(async (res) => {
        console.log("STATUS:", res.status);

        ```
const text = await res.text();

console.log(text);
```

    })
    .catch(console.error);
