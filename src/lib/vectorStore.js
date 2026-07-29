import fs from "fs";
import path from "path";
import { getEmbeddings } from "./ai.js";

const persistDirectory = process.env.CHROMA_DIR || path.join(process.cwd(), "chroma_store");
const persistFile = path.join(persistDirectory, "local-vector-store.json");

let vectorStoreInstance = null;

function ensurePersistDirectory() {
  fs.mkdirSync(persistDirectory, { recursive: true });
}

function normalizeVector(vector) {
  const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0)) || 1;
  return vector.map((value) => value / magnitude);
}

function cosineSimilarity(left, right) {
  const length = Math.min(left.length, right.length);
  let dot = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;

  for (let i = 0; i < length; i += 1) {
    dot += left[i] * right[i];
    leftMagnitude += left[i] * left[i];
    rightMagnitude += right[i] * right[i];
  }

  const denominator = Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude);
  return denominator === 0 ? 0 : dot / denominator;
}

class LocalVectorStore {
  constructor(embeddings) {
    this.embeddings = embeddings;
    this.entries = [];
    this.loaded = false;
  }

  async load() {
    if (this.loaded) return;
    ensurePersistDirectory();
    if (fs.existsSync(persistFile)) {
      try {
        const raw = fs.readFileSync(persistFile, "utf8");
        const parsed = JSON.parse(raw);
        this.entries = Array.isArray(parsed?.entries) ? parsed.entries : [];
      } catch {
        this.entries = [];
      }
    }
    this.loaded = true;
  }

  persist() {
    ensurePersistDirectory();
    fs.writeFileSync(persistFile, JSON.stringify({ entries: this.entries }, null, 2), "utf8");
  }

  async addDocuments(documents) {
    await this.load();
    const texts = documents.map((doc) => doc.pageContent);
    const vectors = await this.embeddings.embedDocuments(texts);

    documents.forEach((doc, index) => {
      this.entries.push({
        pageContent: doc.pageContent,
        metadata: doc.metadata || {},
        embedding: normalizeVector(vectors[index] || []),
      });
    });

    this.persist();
  }

  async similaritySearch(query, k = 4, filter = {}) {
    const results = await this.similaritySearchWithScore(query, k, filter);
    return results.map(([doc]) => doc);
  }

  async similaritySearchWithScore(query, k = 4, filter = {}) {
    await this.load();

    if (this.entries.length === 0) {
      return [];
    }

    const queryVector = normalizeVector(await this.embeddings.embedQuery(query));
    const scored = this.entries
      .filter((entry) => {
        if (!filter || Object.keys(filter).length === 0) return true;
        return Object.entries(filter).every(([key, value]) => entry.metadata?.[key] === value);
      })
      .map((entry) => {
        const similarity = cosineSimilarity(queryVector, entry.embedding || []);
        return [
          {
            pageContent: entry.pageContent,
            metadata: entry.metadata,
          },
          1 - similarity,
        ];
      })
      .sort((a, b) => a[1] - b[1]);

    return scored.slice(0, k);
  }
}

export async function getVectorStore() {
  if (!vectorStoreInstance) {
    vectorStoreInstance = new LocalVectorStore(getEmbeddings());
  }

  return vectorStoreInstance;
}

export async function addDocuments(documents) {
  if (!documents?.length) {
    throw new Error("No documents to embed");
  }

  const cleanDocs = documents.filter((doc) => doc.pageContent?.trim().length > 20);
  if (!cleanDocs.length) {
    throw new Error("All documents were filtered out because they were too short");
  }

  const store = await getVectorStore();
  await store.addDocuments(cleanDocs);
  return store;
}
