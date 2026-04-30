import { NextResponse } from "next/server";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Document } from "@langchain/core/documents";
import { addDocuments } from "@/lib/vectorStore";
import { createClient } from "@/utils/supabase/server";

export const maxDuration = 60;

export async function POST(request) {
  try {
    // 🔐 Auth check
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = user.id;

    // 📦 Get form data
    const formData = await request.formData();
    const file = formData.get("file");
    const subject = formData.get("subject");

    if (!file || !subject) {
      return NextResponse.json(
        { error: "Missing required fields: file, subject" },
        { status: 400 }
      );
    }

    const fileName = file.name;
    let text = "";

    // 📄 Handle PDF correctly (NO static import)
    if (fileName.endsWith(".pdf")) {
 const pdfModule = await import("pdf-parse");
const pdf = pdfModule.default || pdfModule;

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const pdfData = await pdf(buffer);
      text = pdfData.text;
    } else {
      // 📄 Handle TXT
      text = await file.text();
    }

    // ❌ No text extracted
    if (!text.trim()) {
      return NextResponse.json(
        { error: "Could not extract any text from the file" },
        { status: 400 }
      );
    }

    // ✂️ Split text into chunks
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 500,
      chunkOverlap: 50,
    });

    const rawChunks = await splitter.splitText(text);

    // 📚 Convert to Documents
    const documents = rawChunks.map(
      (chunk, index) =>
        new Document({
          pageContent: chunk,
          metadata: {
            subject,
            userId,
            fileName,
            chunkId: `${fileName}_chunk_${index}`,
          },
        })
    );

    // 🧠 Store in Chroma
    await addDocuments(documents);

    return NextResponse.json({
      success: true,
      message: `Uploaded ${documents.length} chunks`,
      chunksCount: documents.length,
    });
  } catch (error) {
    console.error("Upload error:", error);

    return NextResponse.json(
      { error: `Upload failed: ${error.message}` },
      { status: 500 }
    );
  }
}