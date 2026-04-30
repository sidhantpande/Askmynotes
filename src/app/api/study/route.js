import { NextResponse } from "next/server";
import { getVectorStore } from "@/lib/vectorStore";
import { safeInvoke } from "@/lib/ai";
import { createClient } from "@/utils/supabase/server";

export const runtime = "nodejs";

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

    const vectorStore = await getVectorStore();

    // 🧠 1. Retrieve deep context (top 15 chunks)
    const results = await vectorStore.similaritySearch(
      `core concepts and key facts in ${subject}`,
      15,
      { userId, subject }
    );

    if (!results || results.length === 0) {
      return NextResponse.json({ error: "No notes found to study from." }, { status: 404 });
    }

    const context = results.map(doc => doc.pageContent).join("\n\n");

    // 🧠 2. Generate Content
    let prompt = "";
    if (type === 'flashcards') {
      prompt = `Using the following notes about ${subject}, generate 8 high-quality Flashcards.
      Each flashcard must have a "question" and a "answer".
      Focus on definitions, formulas, and key dates.
      
      NOTES:
      ${context}
      
      Format as JSON array: [{"question": "...", "answer": "..."}]`;
    } else {
      prompt = `Using the following notes about ${subject}, generate 5 Multiple Choice Questions (Quiz).
      Each question must have "question", "options" (array of 4), and "correctAnswer" (index 0-3).
      
      NOTES:
      ${context}
      
      Format as JSON array: [{"question": "...", "options": ["...", "...", "...", "..."], "correctAnswer": 0}]`;
    }

    const resContent = await safeInvoke(prompt, { temperature: 0.1 });
    const content = JSON.parse(resContent.match(/\[.*\]/s)[0]);

    return NextResponse.json({ success: true, data: content });

  } catch (error) {
    console.error("Study API error:", error);
    return NextResponse.json({ error: "Failed to generate study material" }, { status: 500 });
  }
}
