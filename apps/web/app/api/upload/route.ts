import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

export const runtime = 'nodejs';

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];

const CLOUD = process.env.CLOUDINARY_CLOUD_NAME;
const KEY = process.env.CLOUDINARY_API_KEY;
const SECRET = process.env.CLOUDINARY_API_SECRET;
const hasCloudinary = Boolean(CLOUD && KEY && SECRET);

/**
 * Push the file straight to Cloudinary with a signed request.
 * Required in production: serverless filesystems are read-only, so the local
 * disk branch below only works during development.
 */
async function uploadToCloudinary(file: File): Promise<string> {
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = 'work/uploads';
  // Cloudinary signs the params sorted alphabetically, then the api_secret.
  const signature = crypto
    .createHash('sha1')
    .update(`folder=${folder}&timestamp=${timestamp}${SECRET}`)
    .digest('hex');

  const body = new FormData();
  body.append('file', file);
  body.append('api_key', KEY!);
  body.append('timestamp', String(timestamp));
  body.append('folder', folder);
  body.append('signature', signature);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD}/auto/upload`, {
    method: 'POST',
    body
  });
  if (!res.ok) throw new Error(`cloudinary responded ${res.status}`);
  const json = (await res.json()) as { secure_url?: string };
  if (!json.secure_url) throw new Error('cloudinary returned no url');
  return json.secure_url;
}

/** Dev-only: write to public/uploads, served same-origin at /uploads/<file>. */
async function uploadToDisk(file: File): Promise<string> {
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  const filename = `${crypto.randomBytes(10).toString('hex')}.${ext}`;
  const dir = path.join(process.cwd(), 'public', 'uploads');
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), Buffer.from(await file.arrayBuffer()));
  return `/uploads/${filename}`;
}

/**
 * Image upload. Uses Cloudinary when configured (production), otherwise falls
 * back to the local disk. The response contract ({ url }) is identical either way.
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

  try {
    const url = hasCloudinary ? await uploadToCloudinary(file) : await uploadToDisk(file);
    return NextResponse.json({ url });
  } catch (e) {
    // A read-only filesystem in production means Cloudinary simply isn't set up.
    if (!hasCloudinary && process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Uploads not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.' },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: 'Could not save file' }, { status: 500 });
  }
}
