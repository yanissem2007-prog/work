import createNextIntlPlugin from 'next-intl/plugin';
const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

// Derive allowed origins for the CSP from env (API + realtime socket).
const originOf = (url, fallback) => { try { return new URL(url ?? fallback).origin; } catch { return fallback; } };
const apiOrigin = originOf(process.env.NEXT_PUBLIC_API_URL, 'http://localhost:4000/api/v1');
const socketOrigin = originOf(process.env.NEXT_PUBLIC_SOCKET_URL, 'http://localhost:4000');
const wsOrigin = socketOrigin.replace(/^http/, 'ws');

const CSP = [
  "default-src 'self'",
  // Next + framer/three need inline/eval; nonce-based hardening is a later step.
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  `img-src 'self' data: blob: https: ${apiOrigin}`,
  "font-src 'self' https://fonts.gstatic.com data:",
  `connect-src 'self' ${apiOrigin} ${socketOrigin} ${wsOrigin} https: wss:`,
  "media-src 'self' https: blob:",
  "worker-src 'self' blob:",
  "frame-src 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'"
].join('; ');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  transpilePackages: ['@work/types'],
  // Pin the workspace root so Next stops warning about the stray
  // package-lock.json in the user's home directory.
  outputFileTracingRoot: new URL('../../', import.meta.url).pathname,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' }
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [360, 640, 768, 1024, 1280, 1600, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion', '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu']
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Content-Security-Policy', value: CSP },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' }
        ]
      }
    ];
  }
};
export default withNextIntl(nextConfig);
