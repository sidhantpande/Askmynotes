import { NextResponse } from "next/server";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Document } from "@langchain/core/documents";
import { addDocuments } from "@/lib/vectorStore";
import { createClient } from "@/utils/supabase/server";

// 🚀 Enforce Node.js runtime for stable PDF processing
export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request) {
  try {
    // 🔐 Authentication Check
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = user.id;

    // 📦 Request Data Extraction
    const formData = await request.formData();
    const file = formData.get("file");
    const subject = formData.get("subject");

    if (!file || !subject) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const fileName = file.name;
    let processedChunks = [];

    // 📄 PDF Processing
    if (fileName.endsWith(".pdf")) {
      const parsePdf = (await import("pdf-parse")).default;
      const buffer = Buffer.from(await file.arrayBuffer());
      const parsed = await parsePdf(buffer);
      const pages = String(parsed.text || "")
        .split(/\f/g)
        .map((pageText) => pageText.trim())
        .filter(Boolean);

      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 800,
        chunkOverlap: 150,
        separators: ["\n\n", "\n", ". ", " ", ""],
      });

      if (pages.length === 0 && parsed.text?.trim()) {
        pages.push(parsed.text.trim());
      }

      for (let i = 0; i < pages.length; i += 1) {
        const pageText = pages[i];
        const pageChunks = await splitter.splitText(pageText);

        pageChunks.forEach((chunk, chunkIdx) => {
          processedChunks.push(new Document({
            pageContent: chunk,
            metadata: {
              subject,
              userId,
              fileName,
              pageNumber: i + 1,
              chunkId: `${fileName}_p${i + 1}_c${chunkIdx}`,
            }
          }));
        });
      }
    } else {
      // 📄 Handle TXT
      const text = await file.text();
      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 800,
        chunkOverlap: 150,
        separators: ["\n\n", "\n", ". ", " ", ""],
      });
      const rawChunks = await splitter.splitText(text);
      processedChunks = rawChunks.map((chunk, index) => new Document({
        pageContent: chunk,
        metadata: { subject, userId, fileName, chunkId: `${fileName}_c${index}` }
      }));
    }

    // 🧹 Sanitation & Validation
    processedChunks = processedChunks.filter(doc => doc.pageContent.trim().length > 20);

    if (processedChunks.length === 0) {
      return NextResponse.json({ error: "No readable content found. Check if the PDF is scanned." }, { status: 400 });
    }

    // 🧠 Add to Vector Store
    await addDocuments(processedChunks);

    return NextResponse.json({
      success: true,
      message: `Processed into ${processedChunks.length} semantic chunks`,
      chunksCount: processedChunks.length,
    });

  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: `Upload failed: ${error.message}` }, { status: 500 });
  }
}
