import type { MetadataRoute } from 'next';

const SITE_URL = 'https://gleaum.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin/',
        '/api/admin/',
        '/api/cron/',
        '/api/native/',
        '/api/push/',
        '/auth/callback',
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
