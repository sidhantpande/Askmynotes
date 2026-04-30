import { OpenAIEmbeddings, ChatOpenAI } from "@langchain/openai";

let _embeddings = null;

/**
 * ✅ STABLE: OpenAI Embeddings (text-embedding-3-small)
 * 1536 dimensions for production-grade reliability.
 */
export function getEmbeddings() {
  if (!_embeddings) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY missing ❌");
    }
    _embeddings = new OpenAIEmbeddings({
      apiKey: process.env.OPENAI_API_KEY,
      model: "text-embedding-3-small", 
    });
  }
  return _embeddings;
}

/**
 * 🚀 PRODUCTION LLM: Pure OpenAI GPT-4o-mini
 * Focused on 100% stability and zero endpoint errors.
 */
export function getLLM() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY missing ❌");
  }

  return new ChatOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    modelName: "gpt-4o-mini",
    temperature: 0.3,
  });
}

/**
 * Resilient Execution Wrapper
 */
export async function safeInvoke(prompt, options = {}) {
  try {
    const llm = getLLM();
    const response = await llm.invoke(prompt);
    return response.content || response;
  } catch (error) {
    console.error("❌ OpenAI Execution failed:", error.message);
    throw error;
  }
}
