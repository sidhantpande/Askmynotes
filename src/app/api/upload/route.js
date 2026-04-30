import { NextResponse } from "next/server";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Document } from "@langchain/core/documents";
import { addDocuments } from "@/lib/vectorStore";
import { createClient } from "@/utils/supabase/server";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.js";

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
      pdfjsLib.GlobalWorkerOptions.workerPort = null;
      const buffer = Buffer.from(await file.arrayBuffer());

      const loadingTask = pdfjsLib.getDocument({
        data: new Uint8Array(buffer),
        disableWorker: true,
        useWorkerFetch: false,
        isEvalSupported: false,
      });

      const pdf = await loadingTask.promise;

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items.map(item => item.str).join(" ");

        if (pageText.trim()) {
          // 🧠 Semantic Splitting: Paragraph-aware with sentence boundary preservation
          const splitter = new RecursiveCharacterTextSplitter({
            chunkSize: 800,
            chunkOverlap: 150,
            separators: ["\n\n", "\n", ". ", " ", ""],
          });

          const pageChunks = await splitter.splitText(pageText);

          pageChunks.forEach((chunk, chunkIdx) => {
            processedChunks.push(new Document({
              pageContent: chunk,
              metadata: {
                subject,
                userId,
                fileName,
                pageNumber: i,
                chunkId: `${fileName}_p${i}_c${chunkIdx}`,
              }
            }));
          });
        }
        page.cleanup();
      }
      await pdf.destroy();
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
    });

  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: `Upload failed: ${error.message}` }, { status: 500 });
  }
}