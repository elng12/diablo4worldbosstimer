import type { MetadataRoute } from 'next';

const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com'
).replace(/\/$/, '');

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${siteUrl}/`,
      changeFrequency: 'always',
      priority: 1.0,
    },
  ];
}
