import { env } from './env';

export const REFRESH_COOKIE = 'work_rt';

/**
 * Refresh-token cookie options.
 *
 * In production the web app and the API live on different sites (Vercel +
 * Render), so every API call is cross-site. Browsers do NOT send a
 * `SameSite=Lax` cookie on cross-site requests — that would silently break the
 * refresh flow and log every user out. Cross-site needs `SameSite=None`, and
 * `None` is only honoured together with `Secure`, so the two flip together.
 *
 * Locally both apps share the `localhost` host (cookies ignore the port), so
 * `lax` + non-secure keeps working over plain http://.
 */
const isProd = env.NODE_ENV === 'production';

export const refreshCookieOpts = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? ('none' as const) : ('lax' as const),
  // Path '/' so the cookie is sent to every API route, not just /api/v1/auth.
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000
};
