import { prisma } from "./prisma";
import { generateEmbedding, generateEmbeddings } from "./embeddings";
import type { ChunkInput, RetrievedChunk } from "@/types";

/**
 * Store chunks with embeddings in the database.
 * Uses pgvector for PostgreSQL vector storage.
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
        metadata: (chunk.metadata as object) ?? {},
        tokenCount,
      },
    });

    // Store embedding via raw SQL (pgvector)
    const embeddingStr = `[${embeddings[i].join(",")}]`;
    await prisma.$executeRawUnsafe(
      `UPDATE "Chunk" SET embedding = $1::vector WHERE id = $2`,
      embeddingStr,
      created.id
    );

    ids.push(created.id);
  }

  return ids;
}

/**
 * Retrieve relevant chunks using pgvector cosine similarity.
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
  const embeddingStr = `[${queryEmbedding.join(",")}]`;

  const sectionFilter = sectionId
    ? `AND c."sectionId" = '${sectionId}'`
    : "";

  const textChunks = await prisma.$queryRawUnsafe<
    { id: string; content: string; type: string; language: string | null; similarity: number }[]
  >(
    `SELECT c.id, c.content, c.type, c.language,
            1 - (c.embedding <=> $1::vector) as similarity
     FROM "Chunk" c
     WHERE c."courseId" = $2
       AND c.type = 'text'
       AND c.embedding IS NOT NULL
       ${sectionFilter}
     ORDER BY c.embedding <=> $1::vector
     LIMIT $3`,
    embeddingStr,
    courseId,
    topKText
  );

  const codeChunks = await prisma.$queryRawUnsafe<
    { id: string; content: string; type: string; language: string | null; similarity: number }[]
  >(
    `SELECT c.id, c.content, c.type, c.language,
            1 - (c.embedding <=> $1::vector) as similarity
     FROM "Chunk" c
     WHERE c."courseId" = $2
       AND c.type = 'code'
       AND c.embedding IS NOT NULL
       ${sectionFilter}
     ORDER BY c.embedding <=> $1::vector
     LIMIT $3`,
    embeddingStr,
    courseId,
    topKCode
  );

  return {
    textChunks: textChunks.map((c) => ({
      id: c.id,
      content: c.content,
      type: c.type as "text" | "code",
      language: c.language ?? undefined,
      similarity: Number(c.similarity),
    })),
    codeChunks: codeChunks.map((c) => ({
      id: c.id,
      content: c.content,
      type: c.type as "text" | "code",
      language: c.language ?? undefined,
      similarity: Number(c.similarity),
    })),
  };
}
