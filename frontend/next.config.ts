import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

// Also allow the project's own Supabase host (custom domain / self-hosted / local dev).
const supabaseHost = (() => {
  try { return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').hostname; } catch { return ''; }
})();

const nextConfig: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    // Next refuses to optimise images from private/local IPs (SSRF protection).
    // Relax that ONLY when Supabase itself runs locally (e.g. `supabase start`).
    dangerouslyAllowLocalIP: ['localhost', '127.0.0.1'].includes(supabaseHost),
    // Images uploaded by admins live in public Supabase Storage buckets.
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co', pathname: '/storage/v1/object/public/**' },
      ...(supabaseHost && !supabaseHost.endsWith('.supabase.co')
        ? [{ protocol: (supabaseHost === 'localhost' ? 'http' : 'https') as 'http' | 'https', hostname: supabaseHost, pathname: '/storage/v1/object/public/**' }]
        : []),
    ],
  },
};

export default withNextIntl(nextConfig);