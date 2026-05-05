import { faqItems } from '@/content/worldBossContent';

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';
const pageUrl = `${siteUrl.replace(/\/$/, '')}/`;

export function getWorldBossJsonLd() {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqItems.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: siteUrl,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Diablo 4 World Boss Timer',
          item: pageUrl,
        },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Diablo 4 World Boss Timer',
      url: pageUrl,
      applicationCategory: 'GameApplication',
      operatingSystem: 'Any',
      description:
        'Track the next Diablo 4 world boss with a live countdown, local spawn time, schedule, locations, reminders, and reward notes.',
    },
  ];
}
