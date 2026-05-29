'use server';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { LOCALES, LOCALE_COOKIE, type Locale } from '@/i18n/config';

const ONE_YEAR = 60 * 60 * 24 * 365;

export async function setLocale(locale: Locale): Promise<void> {
  if (!LOCALES.includes(locale)) return;
  (await cookies()).set(LOCALE_COOKIE, locale, {
    httpOnly: false,
    sameSite: 'lax',
    secure: true,
    path: '/',
    maxAge: ONE_YEAR
  });
  revalidatePath('/', 'layout');
}
