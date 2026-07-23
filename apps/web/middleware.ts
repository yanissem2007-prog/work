import { NextResponse, type NextRequest } from 'next/server';
import { LOCALES, DEFAULT_LOCALE, LOCALE_COOKIE, type Locale } from '@/i18n/config';

const PROTECTED = ['/feed', '/jobs', '/messages', '/communities', '/ai', '/notifications', '/profile', '/cv-builder', '/settings', '/home', '/matches', '/coach', '/projects', '/cv-analyzer', '/interview', '/roadmap', '/trending', '/events', '/freelance', '/stats'];
const AUTH_ONLY = ['/login', '/register'];

function detectFromHeader(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return DEFAULT_LOCALE;
  for (const p of acceptLanguage.split(',')) {
    const base = p.trim().slice(0, 2).toLowerCase() as Locale;
    if (LOCALES.includes(base)) return base;
  }
  return DEFAULT_LOCALE;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  // In production the web app and the API sit on different domains, so the API's
  // httpOnly `work_rt` cookie is simply not visible here. The client mirrors a
  // non-sensitive hint cookie on this origin instead. Locally both share the
  // `localhost` host (cookies ignore the port), so `work_rt` is still readable —
  // accept either. This gate is routing UX only: every API call is still
  // authorized server-side by the bearer token, so a forged hint reveals nothing.
  const hasSession = req.cookies.has('work_auth') || req.cookies.has('work_rt');

  // Auth gates
  if (PROTECTED.some((p) => pathname.startsWith(p)) && !hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }
  if (AUTH_ONLY.some((p) => pathname.startsWith(p)) && hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = '/home';
    return NextResponse.redirect(url);
  }

  // Language: stored in a cookie (read by i18n/request.ts). No URL prefix —
  // every page keeps its existing path. Set the cookie once on first visit.
  const res = NextResponse.next();
  if (!req.cookies.has(LOCALE_COOKIE)) {
    res.cookies.set(LOCALE_COOKIE, detectFromHeader(req.headers.get('accept-language')), {
      path: '/', sameSite: 'lax', maxAge: 60 * 60 * 24 * 365
    });
  }
  return res;
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
