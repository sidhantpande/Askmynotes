import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { getEmbeddings } from "./ai.js";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let vectorStoreInstance = null;

export async function getVectorStore() {
  if (!vectorStoreInstance) {
    const embeddings = getEmbeddings();
    const client = createClient(supabaseUrl, supabaseKey);

    vectorStoreInstance = new SupabaseVectorStore(embeddings, {
      client,
      tableName: "documents",
      queryName: "match_documents",
    });
  }

  return vectorStoreInstance;
}

export async function addDocuments(documents) {
  // 1. Validation: Ensure documents array is not empty
  if (!documents || documents.length === 0) {
    throw new Error("No documents to embed");
  }

  // 2. Filter: Remove empty or near-empty documents (Fixes empty vector error)
  const cleanDocs = documents.filter(
    doc => doc.pageContent && doc.pageContent.trim().length > 20
  );

  if (cleanDocs.length === 0) {
    throw new Error("All documents filtered out — content too short");
  }

  const store = await getVectorStore();
  
  try {
    console.log(`📡 Embedding ${cleanDocs.length} documents using embedding-001...`);
    
    // 3. Safety Check: Verify embedding model is returning valid data
    const embeddings = getEmbeddings();
    const testVector = await embeddings.embedQuery("test connectivity");
    
    if (!testVector || testVector.length === 0) {
       throw new Error("Embedding failed — empty vector returned from API");
    }
    
    console.log(`✅ Embedding model verified (Dimensions: ${testVector.length})`);

    // 4. Batch Insertion: LangChain handles the embedding + storage
    await store.addDocuments(cleanDocs);
    
    console.log("✅ Vector store insertion complete");
  } catch (error) {
    // 5. Improved Error Logging
    console.error("❌ Vector Store Error:", error);
    throw error;
  }

  return store;
}