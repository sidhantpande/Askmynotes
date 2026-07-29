import { NextResponse } from "next/server";
import { getVectorStore } from "@/lib/vectorStore";
import { safeInvoke } from "@/lib/ai";
import { createClient } from "@/utils/supabase/server";

export const runtime = "nodejs";

function extractJsonBlock(text) {
  const match = text.match(/\[[\s\S]*\]/);
  if (match) return match[0];
  const objectMatch = text.match(/\{[\s\S]*\}/);
  if (objectMatch) return objectMatch[0];
  throw new Error("Model did not return parseable JSON");
}

function normalizeType(type) {
  if (type === "flashcards") return "flashcards";
  if (type === "quiz" || type === "mcq") return "mcq";
  if (type === "short") return "short";
  return type;
}

function cleanJsonText(raw) {
  return raw
    .replace(/```json\s*/gi, "")
    .replace(/```/g, "")
    .trim();
}

function normalizeArray(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.flashcards)) return value.flashcards;
  if (Array.isArray(value?.shortQuestions)) return value.shortQuestions;
  if (Array.isArray(value?.mcqs)) return value.mcqs;
  return [];
}

function ensureCitation(item, fallback) {
  if (item.citation) return item;
  return { ...item, citation: fallback };
}

function recoverStudyPayload(raw, normalizedType) {
  const cleaned = cleanJsonText(raw);
  try {
    return JSON.parse(cleaned);
  } catch {
    const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      return JSON.parse(arrayMatch[0]);
    }
    const objectMatch = cleaned.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      return JSON.parse(objectMatch[0]);
    }

    const fallback = normalizedType === "mcq"
      ? [{ question: "Generate a study question from your notes.", options: { A: "No answer", B: "No answer", C: "No answer", D: "No answer" }, correct: "A", explanation: "The model output could not be parsed cleanly.", citation: "Notes" }]
      : [{ question: "Generate a study prompt from your notes.", answer: "The model output could not be parsed cleanly.", citation: "Notes" }];

    return normalizedType === "flashcards" ? fallback.map((item) => ({ question: item.question, answer: item.answer, citation: item.citation })) : fallback;
  }
}

function buildStudyPrompt({ normalizedType, subject, context }) {
  if (normalizedType === "flashcards") {
    return `You are generating premium study flashcards for ${subject}.

Return valid JSON only.
Shape: an array of 8 objects with keys:
- question
- answer
- citation

Guidelines:
- Keep answers short, clear, and friendly.
- Use the citation to mention a file name or page number from the notes.
- Prefer exam-relevant facts, definitions, and examples.
- Write the flashcards like a calm tutor would speak to a student.
- Avoid stiff textbook language unless the notes themselves are formal.

Notes:
${context}`;
  }

  if (normalizedType === "short") {
    return `You are generating short-answer revision prompts for ${subject}.

Return valid JSON only.
Shape: an array of 3 objects with keys:
- question
- answer
- citation

Guidelines:
- Answers should be 2 to 5 sentences.
- Make the question sound like a real exam or viva prompt.
- Use the citation to mention a file name or page number from the notes.
- Keep the tone human and reassuring, not robotic.

Notes:
${context}`;
  }

  return `You are generating multiple-choice practice questions for ${subject}.

Return valid JSON only.
Shape: an array of 5 objects with keys:
- question
- options
- correct
- explanation
- citation

Rules:
- options must be an object with keys A, B, C, D.
- correct must be one of A, B, C, D.
- explanation should explain why the correct option is right.
- Use the citation to mention a file name or page number from the notes.
- Make the explanation sound like a good teacher walking a student through the answer.
- Keep distractors realistic, not silly.

Notes:
${context}`;
}

export async function POST(request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = user.id;
    const { subject, type } = await request.json();

    if (!subject || !type) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const normalizedType = normalizeType(type);
    const vectorStore = await getVectorStore();
    const results = await vectorStore.similaritySearch(
      `core concepts, important definitions, examples, and facts for ${subject}`,
      12,
      { userId, subject }
    );

    if (!results.length) {
      return NextResponse.json({ error: "No notes found to study from." }, { status: 404 });
    }

    const context = results.map((doc, index) => `[Source ${index + 1} | ${doc.metadata.fileName || "notes"} | Page ${doc.metadata.pageNumber || "?"}]\n${doc.pageContent}`).join("\n\n");
    const prompt = buildStudyPrompt({ normalizedType, subject, context });

    const raw = await safeInvoke(prompt, { temperature: 0.2 });
    const parsed = recoverStudyPayload(extractJsonBlock(raw), normalizedType);

    if (normalizedType === "flashcards") {
      return NextResponse.json({ success: true, data: normalizeArray(parsed).map((item, index) => ensureCitation(item, `Source ${index + 1}`)) });
    }

    if (normalizedType === "short") {
      return NextResponse.json({ success: true, data: { shortQuestions: normalizeArray(parsed).map((item, index) => ensureCitation(item, `Source ${index + 1}`)) } });
    }

    return NextResponse.json({ success: true, data: { mcqs: normalizeArray(parsed).map((item, index) => ensureCitation(item, `Source ${index + 1}`)) } });
  } catch (error) {
    console.error("Study API error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate study material" }, { status: 500 });
  }
}
