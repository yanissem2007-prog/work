import { HttpError } from '../../middleware/error';
import { logger } from '../../config/logger';

const GH_API = 'https://api.github.com';

export interface GitHubRepo {
  owner: string;
  name: string;
  description: string | null;
  language: string | null;
  stars: number;
  forks: number;
  topics: string[];
  homepage: string | null;
  defaultBranch: string;
  pushedAt: string;
  htmlUrl: string;
  readmeExcerpt: string | null;
}

/**
 * Parse anything resembling a GitHub repo URL/slug.
 * Supports:
 *   https://github.com/owner/repo
 *   github.com/owner/repo
 *   owner/repo
 */
export function parseRepoIdentifier(input: string): { owner: string; repo: string } {
  const cleaned = input.trim().replace(/^https?:\/\//, '').replace(/\.git$/, '').replace(/\/$/, '');
  const parts = cleaned.replace(/^github\.com\//, '').split('/');
  if (parts.length < 2 || !parts[0] || !parts[1]) {
    throw new HttpError(400, 'BAD_REPO', 'Invalid GitHub repo identifier');
  }
  return { owner: parts[0], repo: parts[1] };
}

async function gh<T>(path: string): Promise<T> {
  const token = process.env.GITHUB_TOKEN;
  const r = await fetch(`${GH_API}${path}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });
  if (r.status === 404) throw new HttpError(404, 'NOT_FOUND', 'Repo not found');
  if (r.status === 403) throw new HttpError(429, 'RATE_LIMIT', 'GitHub rate-limited — set GITHUB_TOKEN');
  if (!r.ok) throw new HttpError(502, 'GH_ERROR', `GitHub ${r.status}`);
  return r.json() as Promise<T>;
}

/** Pull metadata + README excerpt for a public repo. */
export async function fetchRepoMetadata(input: string): Promise<GitHubRepo> {
  const { owner, repo } = parseRepoIdentifier(input);

  const meta = await gh<any>(`/repos/${owner}/${repo}`);

  let readmeExcerpt: string | null = null;
  try {
    const readme = await gh<{ content: string; encoding: string }>(`/repos/${owner}/${repo}/readme`);
    if (readme.content) {
      const decoded = Buffer.from(readme.content, readme.encoding === 'base64' ? 'base64' : 'utf8').toString('utf8');
      readmeExcerpt = decoded.replace(/!\[.*?\]\(.*?\)/g, '').replace(/```[\s\S]*?```/g, '').trim().slice(0, 800);
    }
  } catch (e) {
    logger.debug(e, 'no readme');
  }

  return {
    owner,
    name: repo,
    description: meta.description ?? null,
    language: meta.language ?? null,
    stars: meta.stargazers_count ?? 0,
    forks: meta.forks_count ?? 0,
    topics: meta.topics ?? [],
    homepage: meta.homepage ?? null,
    defaultBranch: meta.default_branch ?? 'main',
    pushedAt: meta.pushed_at,
    htmlUrl: meta.html_url,
    readmeExcerpt
  };
}
