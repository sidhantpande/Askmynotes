import { NextResponse } from "next/server";
import { getVectorStore } from "@/lib/vectorStore";
import { getLLM } from "@/lib/gemini";
import { createClient } from "@/utils/supabase/server";

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
        const { subject, type } = await request.json();

        if (!subject) {
            return NextResponse.json(
                { error: "Missing required field: subject" },
                { status: 400 }
            );
        }

        const studyType = type || "mcq"; // default to mcq

        const vectorStore = await getVectorStore();

        // Chroma-native filter by userId + subject
        const resultsWithScores = await vectorStore.similaritySearchWithScore(
            `Key concepts and important topics in ${subject}`,
            15,
            { $and: [{ userId }, { subject }] }
        );

        if (!resultsWithScores || resultsWithScores.length === 0) {
            return NextResponse.json({
                mcqs: [],
                shortQuestions: [],
                message: `No notes found for ${subject}`,
            });
        }

        const context = resultsWithScores
            .map(
                ([doc], i) =>
                    `[Source ${i + 1} — File: ${doc.metadata.fileName}, Chunk: ${doc.metadata.chunkId}]\n${doc.pageContent}`
            )
            .join("\n\n");

        let prompt;

        if (studyType === "mcq") {
            prompt = `You are an academic study material generator. Based ONLY on the provided context from a student's notes, generate multiple-choice questions.

RULES:
- Use ONLY the context below. Do NOT use any prior knowledge.
- Do NOT guess or fabricate information.
- Each question MUST be directly answerable from the context.
- Include accurate citations referencing the source file and chunk.

CONTEXT:
${context}

Generate the following in STRICT JSON format (no markdown, no code fences, just raw JSON):
{
  "mcqs": [
    {
      "question": "A clear multiple-choice question based on the notes",
      "options": {
        "A": "option A text",
        "B": "option B text",
        "C": "option C text",
        "D": "option D text"
      },
      "correct": "A",
      "explanation": "Why this answer is correct, citing the source",
      "citation": "File: <fileName>, Chunk: <chunkId>"
    }
  ]
}

Generate exactly 5 MCQs. Use real file names and chunk IDs from the sources above.`;
        } else {
            prompt = `You are an academic study material generator. Based ONLY on the provided context from a student's notes, generate short-answer questions.

RULES:
- Use ONLY the context below. Do NOT use any prior knowledge.
- Do NOT guess or fabricate information.
- Each question MUST be directly answerable from the context.
- Include accurate citations referencing the source file and chunk.

CONTEXT:
${context}

Generate the following in STRICT JSON format (no markdown, no code fences, just raw JSON):
{
  "shortQuestions": [
    {
      "question": "A short-answer question based on the notes",
      "answer": "Concise answer from the notes",
      "citation": "File: <fileName>, Chunk: <chunkId>"
    }
  ]
}

Generate exactly 3 short-answer questions. Use real file names and chunk IDs from the sources above.`;
        }

        const llm = getLLM();
        const response = await llm.invoke(prompt);
        let content = response.content.trim();

        // Strip markdown code fences if present
        if (content.startsWith("```")) {
            content = content.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
        }

        let studyMaterial;
        try {
            studyMaterial = JSON.parse(content);
        } catch {
            console.error("Failed to parse study material JSON:", content);
            return NextResponse.json(
                { error: "Failed to generate valid study material. Please try again." },
                { status: 500 }
            );
        }

        return NextResponse.json({
            mcqs: studyMaterial.mcqs || [],
            shortQuestions: studyMaterial.shortQuestions || [],
        });
    } catch (error) {
        console.error("Study error:", error);
        return NextResponse.json(
            { error: "Failed to generate study material" },
            { status: 500 }
        );
    }
}
