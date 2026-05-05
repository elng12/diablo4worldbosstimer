import type { Metadata } from 'next';
import { WorldBossTimerPage } from '@/components/world-boss/WorldBossTimerPage';
import { mockCurrentResponse } from '@/data/worldBossMock';
import { getCurrentWorldBoss } from '@/lib/worldBossData';
import { getWorldBossJsonLd } from '@/lib/worldBossJsonLd';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Diablo 4 World Boss Timer – Next Spawn, Schedule & Locations',
  description:
    'Track the next Diablo 4 world boss with a live countdown, local spawn time, schedule, locations, reminders, and reward notes before your next run starts.',
  alternates: {
    canonical: '/diablo-4-world-boss-timer/',
  },
  openGraph: {
    title: 'Diablo 4 World Boss Timer – Next Spawn, Schedule & Locations',
    description:
      'Track the next Diablo 4 world boss with a live countdown, local spawn time, schedule, locations, reminders, and reward notes before your next run starts.',
    url: '/diablo-4-world-boss-timer/',
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
    title: 'Diablo 4 World Boss Timer – Next Spawn, Schedule & Locations',
    description:
      'Track the next Diablo 4 world boss with a live countdown, local spawn time, schedule, locations, reminders, and reward notes before your next run starts.',
    images: ['/og-image.png'],
  },
};

export default async function Page() {
  const jsonLd = getWorldBossJsonLd();
  const initialCurrent = await getCurrentWorldBoss().catch(() => mockCurrentResponse);

  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd[0]) }}
      />
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd[1]) }}
      />
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd[2]) }}
      />
      <WorldBossTimerPage initialCurrent={initialCurrent} />
    </>
  );
}
