import { NextResponse } from "next/server";
import { getVectorStore } from "@/lib/vectorStore";
import { safeInvoke } from "@/lib/ai";
import { createClient } from "@/utils/supabase/server";

// 🚀 Advanced RAG Settings
const RETRIEVAL_COUNT = 10; // Increased for better context
const SIMILARITY_THRESHOLD = 0.15; // Balanced threshold

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

        // 🧠 3. Filtering & Rich Context Assembly
        const contextDocs = resultsWithScores
            .filter(([_, score]) => (1 - score) >= SIMILARITY_THRESHOLD)
            .map(([doc]) => doc);

        if (contextDocs.length === 0) {
            return NextResponse.json({
                answer: "I couldn't find specific information in your notes to answer this. Could you provide more detail or upload relevant material?",
                sources: [],
                confidence: 0
            });
        }

        // Format context with clear source identifiers
        const context = contextDocs
            .map((doc, i) => `[Source ${i + 1} | Page ${doc.metadata.pageNumber || '?'}]\n${doc.pageContent}`)
            .join("\n\n");

        // 🧠 4. Balanced Generation Prompt
        const finalPrompt = `You are a helpful and professional study assistant for the subject: ${subject}.

        RULES:
        1. Answer using the provided context. 
        2. If the answer is explicitly found → Provide a clear, detailed explanation.
        3. If the answer is partially related → Explain the concepts found and how they might apply.
        4. If the answer is completely absent → say "Not in document".
        5. Use bullet points or numbered lists for complex topics.

        CONTEXT:
        ${context}

        QUESTION:
        ${question}

        ANSWER:`;

        const answer = await safeInvoke(finalPrompt);

        // 🧠 5. Structured Response
        return NextResponse.json({
            answer: answer.trim(),
            sources: contextDocs.map(d => ({
                page: d.metadata.pageNumber,
                file: d.metadata.fileName
            })).filter((v, i, a) => a.findIndex(t => (t.page === v.page)) === i), // Unique pages
            confidence: resultsWithScores[0][1] > 0.8 ? 0.9 : 0.7
        });

    } catch (error) {
        console.error("❌ Ask API Error:", error);
        return NextResponse.json({ 
            error: "Failed to generate answer", 
            details: error.message 
        }, { status: 500 });
    }
}
