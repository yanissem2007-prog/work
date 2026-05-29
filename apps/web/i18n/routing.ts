import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';
import { LOCALES, DEFAULT_LOCALE } from './config';

export const routing = defineRouting({
  locales: [...LOCALES],
  defaultLocale: DEFAULT_LOCALE,
  /**
   * `as-needed`: default locale (en) has no prefix → `/jobs`.
   * Other locales get a prefix → `/fr/jobs`, `/ar/jobs`.
   */
  localePrefix: 'as-needed',
  /**
   * SEO-friendly localized path aliases. Add per-route translations later.
   * Example:
   *   '/jobs': { en: '/jobs', fr: '/emplois', ar: '/وظائف' }
   */
  pathnames: {
    '/': '/',
    '/home': '/home',
    '/feed': '/feed',
    '/jobs': '/jobs',
    '/jobs/[id]': '/jobs/[id]',
    '/communities': '/communities',
    '/messages': '/messages',
    '/profile/[handle]': '/profile/[handle]',
    '/cv-builder': '/cv-builder',
    '/cv-analyzer': '/cv-analyzer',
    '/interview': '/interview',
    '/roadmap': '/roadmap',
    '/coach': '/coach',
    '/projects': '/projects',
    '/matches': '/matches',
    '/trending': '/trending',
    '/events': '/events',
    '/freelance': '/freelance',
    '/stats': '/stats',
    '/notifications': '/notifications',
    '/search': '/search',
    '/login': '/login',
    '/register': '/register',
    '/verify-otp': '/verify-otp'
  }
});

/**
 * Locale-aware Link, redirect, useRouter, usePathname, getPathname.
 * Use these instead of `next/link` / `next/navigation` in pages you migrate
 * into `app/[locale]/...`.
 */
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
