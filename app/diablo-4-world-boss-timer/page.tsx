import type { Metadata } from 'next';
import { WorldBossTimerPage } from '@/components/world-boss/WorldBossTimerPage';
import { mockCurrentResponse } from '@/data/worldBossMock';
import { getCurrentWorldBoss } from '@/lib/worldBossData';
import { getWorldBossJsonLd } from '@/lib/worldBossJsonLd';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Diablo 4 World Boss Timer - D4 World Boss Tracker',
  description:
    'Use the Diablo 4 World Boss Timer and Diablo 4 World Boss Tracker to check the next spawn, D4 world boss timer schedule, locations, reminders, and rewards.',
  alternates: {
    canonical: 'https://diablo4worldbosstimer.live/',
  },
  openGraph: {
    title: 'Diablo 4 World Boss Timer - D4 World Boss Tracker',
    description:
      'Use the Diablo 4 World Boss Timer and Diablo 4 World Boss Tracker to check the next spawn, D4 world boss timer schedule, locations, reminders, and rewards.',
    url: '/',
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
      'Use the Diablo 4 World Boss Timer and Diablo 4 World Boss Tracker to check the next spawn, D4 world boss timer schedule, locations, reminders, and rewards.',
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
