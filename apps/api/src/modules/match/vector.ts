import { JobModel } from '../jobs/jobs.model';
import { UserModel } from '../auth/auth.model';
import { embedText, cosine } from '../ai/services/embeddings';
import { logger } from '../../config/logger';

function userBlurb(u: any): string {
  return [
    u.name, u.headline, u.bio, u.location,
    (u.skills ?? []).join(', ')
  ].filter(Boolean).join('\n');
}

function jobBlurb(j: any): string {
  return [
    j.title, j.description, j.location,
    (j.skills ?? []).join(', ')
  ].filter(Boolean).join('\n');
}

/** Lazily compute + cache an embedding on a Job document. */
export async function ensureJobEmbedding(jobId: string): Promise<number[] | null> {
  const job = await JobModel.findById(jobId).select('+embedding title description location skills').lean();
  if (!job) return null;
  if (Array.isArray(job.embedding) && job.embedding.length > 0) return job.embedding as number[];
  const vec = await embedText(jobBlurb(job));
  if (vec) await JobModel.updateOne({ _id: jobId }, { $set: { embedding: vec } });
  return vec;
}

/** Compute (do not store) a user embedding from profile fields. */
export async function computeUserEmbedding(userId: string): Promise<number[] | null> {
  const u = await UserModel.findById(userId).select('name headline bio location skills').lean();
  if (!u) return null;
  return embedText(userBlurb(u));
}

/**
 * Re-rank a candidate pool by cosine similarity against the user vector.
 * Falls back to original order on any failure (no API key, embed errors, etc.).
 */
export async function vectorRerank(userId: string, jobIds: string[]): Promise<Map<string, number>> {
  try {
    const uVec = await computeUserEmbedding(userId);
    if (!uVec) return new Map();
    const out = new Map<string, number>();
    // Pull embeddings (compute on the fly when missing)
    const jobs = await JobModel.find({ _id: { $in: jobIds } }).select('+embedding title description location skills').lean();
    await Promise.all(
      jobs.map(async (j) => {
        let v = j.embedding as number[] | undefined;
        if (!v || v.length === 0) {
          v = (await embedText(jobBlurb(j))) ?? undefined;
          if (v) await JobModel.updateOne({ _id: j._id }, { $set: { embedding: v } });
        }
        if (v) out.set(String(j._id), cosine(uVec, v));
      })
    );
    return out;
  } catch (e) {
    logger.error(e, 'vector rerank failed');
    return new Map();
  }
}
