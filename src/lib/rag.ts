import { prisma } from "./prisma";
import { generateEmbedding, generateEmbeddings } from "./embeddings";
import type { ChunkInput, RetrievedChunk } from "@/types";

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}

/**
 * Store chunks with embeddings in the database.
 * Embeddings are stored as JSON string in the embedding column.
 */
export async function embedAndStoreChunks(
  courseId: string,
  chunks: ChunkInput[]
): Promise<string[]> {
  if (chunks.length === 0) return [];

  const texts = chunks.map((c) => c.content);
  const embeddings = await generateEmbeddings(texts);
  const ids: string[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const tokenCount = Math.ceil(chunk.content.length / 4);

    const created = await prisma.chunk.create({
      data: {
        courseId,
        sectionId: chunk.sectionId,
        type: chunk.type,
        content: chunk.content,
        language: chunk.language,
        metadata: chunk.metadata ? JSON.stringify(chunk.metadata) : "{}",
        tokenCount,
        embedding: JSON.stringify(embeddings[i]),
      },
    });

    ids.push(created.id);
  }

  return ids;
}

/**
 * Retrieve relevant chunks using in-memory cosine similarity.
 * Always filters by courseId, optionally by sectionId.
 * Returns both text and code chunks separately.
 */
export async function retrieveContext(
  courseId: string,
  sectionId: string | null,
  query: string,
  options?: { topKText?: number; topKCode?: number }
): Promise<{ textChunks: RetrievedChunk[]; codeChunks: RetrievedChunk[] }> {
  const { topKText = 5, topKCode = 3 } = options ?? {};

  const queryEmbedding = await generateEmbedding(query);

  // Fetch all chunks for the course (with optional section filter)
  const where: { courseId: string; embedding: { not: null }; sectionId?: string } = {
    courseId,
    embedding: { not: null },
  };
  if (sectionId) where.sectionId = sectionId;

  const allChunks = await prisma.chunk.findMany({ where });

  // Score each chunk by cosine similarity
  const scored = allChunks
    .map((c) => {
      let similarity = 0;
      if (c.embedding) {
        try {
          const emb = JSON.parse(c.embedding) as number[];
          similarity = cosineSimilarity(queryEmbedding, emb);
        } catch {
          // bad embedding data
        }
      }
      return { ...c, similarity };
    })
    .sort((a, b) => b.similarity - a.similarity);

  const textChunks: RetrievedChunk[] = scored
    .filter((c) => c.type === "text")
    .slice(0, topKText)
    .map((c) => ({
      id: c.id,
      content: c.content,
      type: "text",
      language: c.language ?? undefined,
      similarity: c.similarity,
    }));

  const codeChunks: RetrievedChunk[] = scored
    .filter((c) => c.type === "code")
    .slice(0, topKCode)
    .map((c) => ({
      id: c.id,
      content: c.content,
      type: "code",
      language: c.language ?? undefined,
      similarity: c.similarity,
    }));

  return { textChunks, codeChunks };
}
