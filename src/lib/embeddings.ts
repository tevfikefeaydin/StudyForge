import { createHash } from "crypto";

const EMBEDDINGS_BASE_URL = process.env.EMBEDDINGS_BASE_URL || "https://api.openai.com/v1";
const EMBEDDINGS_API_KEY = process.env.EMBEDDINGS_API_KEY || "";
const EMBEDDINGS_MODEL = process.env.EMBEDDINGS_MODEL || "text-embedding-3-small";
const DIMS = parseInt(process.env.EMBEDDINGS_DIMENSIONS || "1536");

/**
 * When no API key is set, generate a deterministic pseudo-embedding from a hash.
 * This allows the full import/retrieve flow to work for local testing.
 */
function fakeEmbedding(text: string): number[] {
  const hash = createHash("sha256").update(text).digest();
  const vec: number[] = [];
  for (let i = 0; i < DIMS; i++) {
    vec.push((hash[i % hash.length] / 255) * 2 - 1);
  }
  return vec;
}

function isApiConfigured(): boolean {
  return EMBEDDINGS_API_KEY.length > 0 && !EMBEDDINGS_API_KEY.startsWith("sk-your");
}

export async function generateEmbedding(text: string): Promise<number[]> {
  if (!isApiConfigured()) {
    return fakeEmbedding(text);
  }

  const res = await fetch(`${EMBEDDINGS_BASE_URL}/embeddings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${EMBEDDINGS_API_KEY}`,
    },
    body: JSON.stringify({
      model: EMBEDDINGS_MODEL,
      input: text.slice(0, 8000),
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Embeddings API error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  return data.data[0].embedding;
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  if (!isApiConfigured()) {
    return texts.map((t) => fakeEmbedding(t));
  }

  const batchSize = 100;
  const allEmbeddings: number[][] = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize).map((t) => t.slice(0, 8000));

    const res = await fetch(`${EMBEDDINGS_BASE_URL}/embeddings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${EMBEDDINGS_API_KEY}`,
      },
      body: JSON.stringify({
        model: EMBEDDINGS_MODEL,
        input: batch,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Embeddings API error ${res.status}: ${errText}`);
    }

    const data = await res.json();
    const sorted = data.data.sort(
      (a: { index: number }, b: { index: number }) => a.index - b.index
    );
    allEmbeddings.push(...sorted.map((d: { embedding: number[] }) => d.embedding));
  }

  return allEmbeddings;
}
