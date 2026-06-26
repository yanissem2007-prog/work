import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

export const runtime = 'nodejs';

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];

/**
 * Local image upload → public/uploads, served same-origin at /uploads/<file>.
 * Works with zero external config (no Cloudinary/S3). For production, swap the
 * disk write for a blob store — the response contract ({ url }) stays the same.
 */
export async function POST(req: NextRequest) {
  // Verify the bearer token against the API (server-side, not bypassable by CSP).
  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';
  try {
    const me = await fetch(`${apiUrl}/auth/me`, { headers: { Authorization: auth }, cache: 'no-store' });
    if (!me.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  } catch {
    return NextResponse.json({ error: 'Auth verification failed' }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const file = form.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'File too large (max 5 MB)' }, { status: 413 });
  }
  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json({ error: 'Unsupported file type' }, { status: 415 });
  }

  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  const filename = `${crypto.randomBytes(10).toString('hex')}.${ext}`;
  const dir = path.join(process.cwd(), 'public', 'uploads');

  try {
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, filename), Buffer.from(await file.arrayBuffer()));
  } catch (e) {
    return NextResponse.json({ error: 'Could not save file' }, { status: 500 });
  }

  return NextResponse.json({ url: `/uploads/${filename}` });
}
