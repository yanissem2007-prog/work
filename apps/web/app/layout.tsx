import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono, Fraunces } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { LOCALE_META, LOCALES, DEFAULT_LOCALE, type Locale } from '@/i18n/config';
import { OG_LOCALE } from '@/i18n/seo';
import '@/styles/globals.css';
import { Providers } from '@/providers/Providers';
import { SkipNav } from '@/components/a11y/SkipNav';
import { RouteProgress } from '@/components/effects/RouteProgress';
import { CursorFollower } from '@/components/effects/CursorFollower';
import { PageTransition } from '@/components/effects/PageTransition';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap', preload: true });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap' });
// Editorial display serif — gives the brand a human, designed character
// instead of the generic geometric-sans "SaaS template" look.
// Variable font: when `axes` are specified, next/font requires `weight` to be
// omitted (the full variable weight range is loaded automatically).
const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  axes: ['opsz', 'SOFT', 'WONK']
});

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://work.app';

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: 'WORK — Where careers take shape', template: '%s · WORK' },
  description:
    'The professional network reimagined. Jobs, communities, social feed, AI assistant and CV builder — built for the next generation.',
  applicationName: 'WORK',
  keywords: ['jobs', 'careers', 'recruitment', 'community', 'AI', 'CV builder', 'students', 'recruiters'],
  referrer: 'origin-when-cross-origin',
  formatDetection: { telephone: false, email: false, address: false },
  openGraph: {
    type: 'website', siteName: 'WORK', url: SITE,
    title: 'WORK — Where careers take shape',
    description: 'Jobs, communities, AI, and CV — the new professional network.',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'WORK' }],
    alternateLocale: LOCALES.filter((l) => l !== DEFAULT_LOCALE).map((l) => OG_LOCALE[l])
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WORK — Where careers take shape',
    description: 'Jobs, communities, AI, and CV — the new professional network.',
    images: ['/og.png']
  },
  icons: { icon: '/favicon.ico', apple: '/apple-touch-icon.png' },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large' } },
  alternates: {
    canonical: SITE,
    languages: Object.fromEntries([
      ...LOCALES.map((l) => [l, l === DEFAULT_LOCALE ? SITE : `${SITE}/${l}`]),
      ['x-default', SITE]
    ])
  }
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fafafa' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' }
  ],
  width: 'device-width',
  initialScale: 1,
  colorScheme: 'dark light'
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = (await getLocale()) as Locale;
  const messages = await getMessages();
  const dir = LOCALE_META[locale]?.dir ?? 'ltr';

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning className={`${inter.variable} ${mono.variable} ${fraunces.variable}`}>
      <body className="antialiased font-sans selection:bg-accent/30 selection:text-fg">
        <SkipNav />
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Providers>
            <RouteProgress />
            <CursorFollower />
            <div id="main">
              <PageTransition>{children}</PageTransition>
            </div>
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
