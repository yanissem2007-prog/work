import { openai, isAIEnabled } from './openai';
import { logger } from '../../../config/logger';

export const EMBED_MODEL = 'text-embedding-3-small'; // 1536 dims
export const EMBED_DIMS = 1536;

export async function embedText(text: string): Promise<number[] | null> {
  if (!isAIEnabled() || !text.trim()) return null;
  try {
    const client = openai()!;
    const r = await client.embeddings.create({
      model: EMBED_MODEL,
      input: text.slice(0, 8000)
    });
    return r.data[0]?.embedding ?? null;
  } catch (e) {
    logger.error(e, 'embed failed');
    return null;
  }
}

export async function embedBatch(texts: string[]): Promise<(number[] | null)[]> {
  if (!isAIEnabled()) return texts.map(() => null);
  try {
    const client = openai()!;
    const r = await client.embeddings.create({
      model: EMBED_MODEL,
      input: texts.map((t) => t.slice(0, 8000))
    });
    return r.data.map((d) => d.embedding);
  } catch (e) {
    logger.error(e, 'batch embed failed');
    return texts.map(() => null);
  }
}

export function cosine(a: number[], b: number[]): number {
  let dot = 0, na = 0, nb = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : dot / denom;
}
