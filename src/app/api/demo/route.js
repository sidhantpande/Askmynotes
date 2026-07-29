import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

const FALLBACK_PREVIEW = {
  stats: {
    subjects: 3,
    notes: 2,
    answers: 14,
  },
  subject: {
    title: "Physics",
    files: ["Mechanics_1.pdf", "Thermal_Dynamics.pdf"],
  },
  messages: [
    { role: "user", text: "What is the relationship between work and energy in a conservative system?" },
    {
      role: "ai",
      text: "In a conservative system, the total mechanical energy remains constant. Work done by conservative forces equals the negative change in potential energy.",
      citation: "Mechanics_1.pdf · P. 42",
      confidence: "High",
    },
  ],
};

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(FALLBACK_PREVIEW);
    }

    const [{ data: subjects }, { data: chats }] = await Promise.all([
      supabase.from("subjects").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("chats").select("*").eq("user_id", user.id).order("updated_at", { ascending: false }).limit(1),
    ]);

    const latestSubject = subjects?.[0] || { title: "Your Subject", files: [] };
    const latestChat = chats?.[0]?.messages || FALLBACK_PREVIEW.messages;

    return NextResponse.json({
      stats: {
        subjects: subjects?.length || 0,
        notes: latestSubject.files?.length || 0,
        answers: latestChat.length,
      },
      subject: {
        title: latestSubject.title,
        files: latestSubject.files || [],
      },
      messages: latestChat,
    });
  } catch (error) {
    return NextResponse.json(FALLBACK_PREVIEW);
  }
}
