import { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

let _embeddings = null;
let _llm = null;

// ✅ Embeddings (FIXED - no manual embedContent)
export function getEmbeddings() {
  if (!_embeddings) {
    if (!process.env.GOOGLE_API_KEY) {
      throw new Error("GOOGLE_API_KEY missing ❌");
    }

    _embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: process.env.GOOGLE_API_KEY,
      model: "text-embedding-004", // ✅ correct model via LangChain
    });
  }

  return _embeddings;
}

// ✅ LLM (no change needed)
export function getLLM() {
  if (!_llm) {
    _llm = new ChatGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_API_KEY,
      model: "gemini-1.5-flash",
      temperature: 0.3,
    });
  }
  return _llm;
}

// (optional debug)
console.log("API KEY CHECK:", process.env.GOOGLE_API_KEY ? "Present" : "Missing");