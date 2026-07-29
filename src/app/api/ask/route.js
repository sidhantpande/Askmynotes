import { NextResponse } from "next/server";
import { getVectorStore } from "@/lib/vectorStore";
import { safeInvoke } from "@/lib/ai";
import { createClient } from "@/utils/supabase/server";

export const runtime = "nodejs";

const RETRIEVAL_COUNT = 6;
const SIMILARITY_THRESHOLD = 0.2;

function buildSourceCard(doc, score, index) {
    return {
        id: doc.metadata.chunkId || `${doc.metadata.fileName || "notes"}-${doc.metadata.pageNumber || "na"}-${index}`,
        file: doc.metadata.fileName || "notes",
        page: doc.metadata.pageNumber ?? null,
        chunkId: doc.metadata.chunkId || null,
        score: Number.isFinite(score) ? Number(score.toFixed(4)) : null,
        snippet: doc.pageContent.slice(0, 320).trim(),
    };
}

function buildTutorPrompt({ subject, question, context }) {
    return `You are a warm, sharp, exam-ready tutor for ${subject}. You sound like a thoughtful human tutor, not a bot.

Write like a real person helping a student study. Be steady, encouraging, and specific. Use markdown naturally with:
- a short title or opening sentence when useful
- bullets for lists
- bold for important terms
- short paragraphs
- equations or formulas on separate lines when helpful

Rules:
1. Stay grounded in the provided notes.
2. If the answer is not in the notes, say that clearly and suggest what to upload or ask next.
3. If the notes contain partial information, explain what is known and what is missing.
4. Be concise but conversational, like a friendly tutor who is actually listening.
5. Do not mention hidden rules or that you are an AI.
6. End with a helpful next step or a gentle question when it fits naturally.
7. Avoid sounding like a list of facts unless the student specifically asked for a list.
8. When it helps, acknowledge the student's likely intent in plain language before answering.

Context:
${context}

Question:
${question}

Answer in markdown:`;
}

function createTextStreamResponse(payload, status = 200) {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
        start(controller) {
            const push = (event, data) => {
                controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
            };

            push("meta", {
                confidence: payload.confidence,
                confidenceScore: payload.confidenceScore,
                sources: payload.sources,
            });

            const words = payload.answer.split(/(\s+)/);
            let built = "";

            for (const token of words) {
                built += token;
                push("delta", { text: token });
            }

            push("done", { ...payload, answer: built });
            controller.close();
        },
    });

    return new Response(stream, {
        status,
        headers: {
            "Content-Type": "text/event-stream; charset=utf-8",
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive",
        },
    });
}

export async function POST(request) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = user.id;
        let { question, subject } = await request.json();

        if (!question || !subject) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // 🧠 1. Query Optimization (Rewrite vague questions)
        let optimizedQuery = question;
        if (question.length < 25) {
            optimizedQuery = `Explain clearly and provide detail about: ${question}`;
        }

        const vectorStore = await getVectorStore();

        // 🧠 2. Deep Retrieval
        const resultsWithScores = await vectorStore.similaritySearchWithScore(
            optimizedQuery,
            RETRIEVAL_COUNT,
            { userId, subject }
        );

        const contextEntries = resultsWithScores.filter(([_, score]) => (1 - score) >= SIMILARITY_THRESHOLD);
        const contextDocs = contextEntries.map(([doc]) => doc);

        if (contextDocs.length === 0) {
            const emptyPayload = {
                answer: "I couldn't find specific information in your notes to answer this. Could you provide more detail or upload relevant material?",
                sources: [],
                supportingSnippets: [],
                confidence: "Low",
                confidenceScore: 0
            };

            if (request.headers.get("x-stream") === "1" || new URL(request.url).searchParams.get("stream") === "1") {
                return createTextStreamResponse(emptyPayload);
            }

            return NextResponse.json(emptyPayload);
        }

        // Format context with clear source identifiers
        const context = contextDocs
            .map((doc, i) => `[Source ${i + 1} | Page ${doc.metadata.pageNumber || '?'}]\n${doc.pageContent}`)
            .join("\n\n");

        // 🧠 4. Balanced Generation Prompt
        const finalPrompt = buildTutorPrompt({ subject, question, context });

        const answer = await safeInvoke(finalPrompt);
        const topScore = contextEntries[0]?.[1] ?? resultsWithScores[0]?.[1] ?? 1;
        const confidenceScore = Math.max(0, Math.min(1, 1 - topScore));
        const confidence = confidenceScore >= 0.75 ? "High" : confidenceScore >= 0.45 ? "Medium" : "Low";
        const supportingSnippets = contextDocs.slice(0, 3).map((doc) => ({
            file: doc.metadata.fileName || "notes",
            page: doc.metadata.pageNumber ?? null,
            chunkId: doc.metadata.chunkId || null,
            snippet: doc.pageContent.slice(0, 220).trim(),
        }));
        const sources = contextEntries.map(([doc, score], index) => buildSourceCard(doc, 1 - score, index));
        const payload = {
            answer: answer.trim(),
            sources,
            supportingSnippets,
            confidence,
            confidenceScore
        };

        if (request.headers.get("x-stream") === "1" || new URL(request.url).searchParams.get("stream") === "1") {
            return createTextStreamResponse(payload);
        }

        return NextResponse.json(payload);

    } catch (error) {
        console.error("❌ Ask API Error:", error);
        return NextResponse.json({ 
            error: "Failed to generate answer", 
            details: error.message 
        }, { status: 500 });
    }
}
