import type { MetadataRoute } from 'next';

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://work.app';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const routes: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE}/jobs`, lastModified: now, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${BASE}/communities`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE}/ai`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/cv-builder`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/login`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE}/register`, lastModified: now, changeFrequency: 'yearly', priority: 0.5 }
  ];
  return routes;
}
