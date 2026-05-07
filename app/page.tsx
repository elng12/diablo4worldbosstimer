import type { Metadata } from 'next';
import { WorldBossTimerPage } from '@/components/world-boss/WorldBossTimerPage';
import { mockCurrentResponse } from '@/data/worldBossMock';
import { getCurrentWorldBoss } from '@/lib/worldBossData';
import { getWorldBossJsonLd } from '@/lib/worldBossJsonLd';

export const revalidate = 60;

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com').replace(/\/$/, '');

export const metadata: Metadata = {
  title: 'Diablo 4 World Boss Timer - D4 World Boss Tracker',
  description:
    'Use Diablo 4 World Boss Timer schedule and Diablo 4 World Boss Tracker guide to check the next spawn, local time, locations, alerts, and rewards.',
  alternates: {
    canonical: `${siteUrl}/`,
  },
  openGraph: {
    title: 'Diablo 4 World Boss Timer - D4 World Boss Tracker',
    description:
      'Use Diablo 4 World Boss Timer schedule and Diablo 4 World Boss Tracker guide to check the next spawn, local time, locations, alerts, and rewards.',
    url: `${siteUrl}/`,
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Diablo 4 World Boss Timer - D4 World Boss Tracker',
    description:
      'Use Diablo 4 World Boss Timer schedule and Diablo 4 World Boss Tracker guide to check the next spawn, local time, locations, alerts, and rewards.',
    images: ['/og-image.png'],
  },
};

export default async function Page() {
  const initialCurrent = await getCurrentWorldBoss().catch(() => mockCurrentResponse);
  const jsonLd = getWorldBossJsonLd(initialCurrent.event);

  return (
    <>
      {jsonLd.map((schema) => (
        <script
          key={`${schema['@type']}-${'name' in schema ? schema.name : 'schema'}`}
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
      <WorldBossTimerPage initialCurrent={initialCurrent} />
    </>
  );
}
