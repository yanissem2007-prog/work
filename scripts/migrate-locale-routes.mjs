#!/usr/bin/env node
/**
 * One-shot migration: copies `apps/web/app/(app)` and `apps/web/app/(auth)`
 * into `apps/web/app/[locale]/...` so next-intl's path-based routing
 * (e.g. /fr/jobs, /ar/jobs) takes effect.
 *
 * Idempotent: re-runs do nothing if [locale] already contains the routes.
 *
 * Run from repo root:  node scripts/migrate-locale-routes.mjs
 */
import { mkdir, cp, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve('apps/web/app');
const LOCALE_DIR = path.join(ROOT, '[locale]');

const SOURCES = ['(app)', '(auth)', 'cv', 'oauth'];

async function copyGroup(group) {
  const src = path.join(ROOT, group);
  if (!existsSync(src)) return;
  const dst = path.join(LOCALE_DIR, group);
  await mkdir(dst, { recursive: true });
  await cp(src, dst, { recursive: true, force: false, errorOnExist: false });
  console.log(`✓ ${group}  →  [locale]/${group}`);
}

async function main() {
  if (!existsSync(ROOT)) {
    console.error(`Could not find ${ROOT}. Run from the repo root.`);
    process.exit(1);
  }
  await mkdir(LOCALE_DIR, { recursive: true });
  for (const g of SOURCES) await copyGroup(g);

  console.log(`
Next steps:
  1) In each migrated page, replace 'next/link' → '@/i18n/routing#Link' and
     'next/navigation' (useRouter / usePathname) → '@/i18n/routing'.
  2) Create apps/web/app/[locale]/layout.tsx as a thin pass-through
     (NextIntlClientProvider is already in the root layout).
  3) Delete the original (app)/(auth) folders OR keep them as default-locale fallbacks.
  4) Test:
       /jobs              (default locale → en)
       /fr/jobs           (French)
       /ar/jobs           (RTL Arabic)
`);
}
main().catch((e) => { console.error(e); process.exit(1); });
