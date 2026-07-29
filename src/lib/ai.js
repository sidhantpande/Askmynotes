import { OpenAIEmbeddings, ChatOpenAI } from "@langchain/openai";
import { GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI } from "@langchain/google-genai";

let _embeddings = null;
let _llm = null;

function getProvider() {
  const provider = (process.env.AI_PROVIDER || "").toLowerCase();
  if (provider === "gemini") return "gemini";
  if (provider === "openai") return "openai";
  if (process.env.GEMINI_API_KEY) return "gemini";
  if (process.env.OPENAI_API_KEY) return "openai";
  throw new Error("Missing AI credentials. Set GEMINI_API_KEY or OPENAI_API_KEY.");
}

export function getEmbeddings() {
  if (!_embeddings) {
    const provider = getProvider();
    if (provider === "gemini") {
      _embeddings = new GoogleGenerativeAIEmbeddings({
        apiKey: process.env.GEMINI_API_KEY,
        model: process.env.GEMINI_EMBEDDING_MODEL || "text-embedding-004",
      });
    } else {
      _embeddings = new OpenAIEmbeddings({
        apiKey: process.env.OPENAI_API_KEY,
        model: process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small",
      });
    }
  }
  return _embeddings;
}

export function getLLM() {
  if (!_llm) {
    const provider = getProvider();
    if (provider === "gemini") {
      _llm = new ChatGoogleGenerativeAI({
        apiKey: process.env.GEMINI_API_KEY,
        model: process.env.GEMINI_MODEL || "gemini-2.0-flash",
        temperature: 0.3,
      });
    } else {
      _llm = new ChatOpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        temperature: 0.3,
      });
    }
  }
  return _llm;
}

export async function safeInvoke(prompt, options = {}) {
  try {
    const llm = getLLM();
    const response = await llm.invoke(prompt, options);
    return response.content || response;
  } catch (error) {
    console.error("AI execution failed:", error.message);
    throw error;
  }
}
