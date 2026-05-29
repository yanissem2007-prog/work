import type { Metadata } from 'next';
import { LOCALES, DEFAULT_LOCALE, type Locale } from './config';

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://work.app';

/**
 * Build the `alternates.languages` map for `hreflang` SEO across all locales,
 * plus an `x-default` pointing at the default locale URL.
 */
export function buildHreflangAlternates(path: string, currentLocale: Locale): Metadata['alternates'] {
  const trim = path.replace(/\/+$/, '') || '/';
  const languages: Record<string, string> = {};

  for (const loc of LOCALES) {
    const url = loc === DEFAULT_LOCALE ? `${SITE}${trim}` : `${SITE}/${loc}${trim}`;
    languages[loc] = url;
  }
  languages['x-default'] = `${SITE}${trim}`;

  const canonical = currentLocale === DEFAULT_LOCALE
    ? `${SITE}${trim}`
    : `${SITE}/${currentLocale}${trim}`;

  return { canonical, languages };
}

/** Open Graph locale codes per supported locale. */
export const OG_LOCALE: Record<Locale, string> = {
  en: 'en_US',
  fr: 'fr_FR',
  ar: 'ar_AR',
  es: 'es_ES',
  de: 'de_DE'
};
