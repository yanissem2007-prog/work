import { getRequestConfig } from 'next-intl/server';
import { cookies, headers } from 'next/headers';
import { DEFAULT_LOCALE, LOCALES, LOCALE_COOKIE, detectLocale, type Locale } from './config';

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value as Locale | undefined;

  let locale: Locale = DEFAULT_LOCALE;
  if (cookieLocale && LOCALES.includes(cookieLocale)) {
    locale = cookieLocale;
  } else {
    const hdrs = await headers();
    locale = detectLocale(hdrs.get('accept-language'));
  }

  // Load only the requested locale (lazy bundles).
  const messages = (await import(`../messages/${locale}.json`)).default;

  return { locale, messages };
});
