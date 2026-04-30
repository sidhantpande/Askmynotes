import { NextResponse } from "next/server";
import { getVectorStore } from "@/lib/vectorStore";
import { getLLM } from "@/lib/gemini";
import { createClient } from "@/utils/supabase/server";

const SIMILARITY_THRESHOLD = 0.30;

function calculateConfidence(scores) {
    if (!scores || scores.length === 0) return "Low";
    const maxScore = Math.max(...scores);
    if (maxScore > 0.50) return "High";
    if (maxScore >= 0.40) return "Medium";
    return "Low";
}

export async function POST(request) {
    try {
        // Auth gate
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const userId = user.id;
        const { question, subject } = await request.json();

        if (!question || !subject) {
            return NextResponse.json(
                { error: "Missing required fields: question, subject" },
                { status: 400 }
            );
        }

        const vectorStore = await getVectorStore();

        // Chroma-native filter by userId + subject for isolation
        const resultsWithScores = await vectorStore.similaritySearchWithScore(
            question,
            5,
            { $and: [{ userId }, { subject }] }
        );

        if (!resultsWithScores || resultsWithScores.length === 0) {
            return NextResponse.json({
                answer: `Not found in your notes for ${subject}`,
                supportingSnippets: [],
                citations: [],
                confidence: "Low",
            });
        }

        // Chroma returns distances (lower = better). Convert to similarity.
        const docsWithSimilarity = resultsWithScores.map(([doc, distance]) => [
            doc,
            1 - distance,
        ]);

        // Apply similarity threshold
        const filteredDocs = docsWithSimilarity.filter(
            ([, similarity]) => similarity >= SIMILARITY_THRESHOLD
        );

        if (filteredDocs.length === 0) {
            return NextResponse.json({
                answer: `Not found in your notes for ${subject}`,
                supportingSnippets: [],
                citations: [],
                confidence: "Low",
            });
        }

        const context = filteredDocs
            .map(
                ([doc], i) =>
                    `[Source ${i + 1} — File: ${doc.metadata.fileName}, Chunk: ${doc.metadata.chunkId}]\n${doc.pageContent}`
            )
            .join("\n\n");

        const citations = filteredDocs.map(
            ([doc]) =>
                `File: ${doc.metadata.fileName}, Chunk: ${doc.metadata.chunkId}`
        );

        const supportingSnippets = filteredDocs
            .slice(0, 3)
            .map(([doc]) => doc.pageContent.substring(0, 200));

        const prompt = `You are a strict academic assistant. Answer the student's question using ONLY the provided context from their notes. 

RULES:
- Use ONLY the context below. Do NOT use any prior knowledge.
- Do NOT guess or infer beyond what is explicitly stated.
- If the answer is not found in the context, respond exactly with: "Not found in your notes for ${subject}"
- Be concise and academic in tone.

CONTEXT:
${context}

QUESTION: ${question}

ANSWER:`;

        const llm = getLLM();
        const response = await llm.invoke(prompt);
        const answer = response.content;

        const similarities = filteredDocs.map(([, sim]) => sim);
        const confidence = answer.includes("Not found in your notes")
            ? "Low"
            : calculateConfidence(similarities);

        return NextResponse.json({
            answer,
            supportingSnippets,
            citations,
            confidence,
        });
    } catch (error) {
        console.error("Ask error:", error);
        return NextResponse.json(
            { error: "Failed to process question" },
            { status: 500 }
        );
    }
}
