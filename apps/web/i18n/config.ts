export const LOCALES = ['en', 'fr', 'ar', 'es', 'de'] as const;
export type Locale = typeof LOCALES[number];

export const DEFAULT_LOCALE: Locale = 'en';

export const LOCALE_META: Record<Locale, { label: string; flag: string; dir: 'ltr' | 'rtl' }> = {
  en: { label: 'English',  flag: '🇬🇧', dir: 'ltr' },
  fr: { label: 'Français', flag: '🇫🇷', dir: 'ltr' },
  ar: { label: 'العربية',   flag: '🇸🇦', dir: 'rtl' },
  es: { label: 'Español',  flag: '🇪🇸', dir: 'ltr' },
  de: { label: 'Deutsch',  flag: '🇩🇪', dir: 'ltr' }
};

/**
 * Detect from Accept-Language / browser. Falls back to default.
 */
export function detectLocale(acceptLanguage?: string | null): Locale {
  if (!acceptLanguage) return DEFAULT_LOCALE;
  const parts = acceptLanguage.split(',').map((p) => p.split(';')[0].trim().toLowerCase());
  for (const p of parts) {
    const base = p.slice(0, 2) as Locale;
    if (LOCALES.includes(base)) return base;
  }
  return DEFAULT_LOCALE;
}

export const LOCALE_COOKIE = 'work-locale';
