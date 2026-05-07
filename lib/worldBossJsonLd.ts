import { faqItems } from '@/content/worldBossContent';
import type { WorldBossEventDto } from '@/types/worldBoss';

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://diablo4worldbosstimer.live';
const pageUrl = `${siteUrl.replace(/\/$/, '')}/`;

export type JsonLdSchema = Record<string, unknown> & {
  '@context': string;
  '@type': string;
  name?: string;
};

function getEventJsonLd(event: WorldBossEventDto | null): JsonLdSchema | null {
  if (!event) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: `Diablo 4 World Boss: ${event.boss_name}`,
    startDate: event.spawn_time_utc,
    endDate: event.spawn_time_utc,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    url: pageUrl,
    location: {
      '@type': 'Place',
      name: `${event.location_name}, ${event.region} — Diablo 4`,
    },
    description: `Next Diablo 4 world boss spawn for ${event.boss_name} with live countdown, local time, location, and confidence status.`,
  };
}

function isSchema(schema: JsonLdSchema | null): schema is JsonLdSchema {
  return schema !== null;
}

export function getWorldBossJsonLd(
  event: WorldBossEventDto | null = null,
): JsonLdSchema[] {
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
      '@type': 'WebPage',
      name: 'Diablo 4 World Boss Timer',
      alternateName: [
        'Diablo 4 World Boss Tracker',
        'D4 World Boss Timer',
        'Diablo 4 Boss Timer',
      ],
      url: pageUrl,
      description:
        'Use Diablo 4 World Boss Timer schedule and Diablo 4 World Boss Tracker guide to check the next spawn, local time, locations, alerts, and reward notes.',
      about: {
        '@type': 'VideoGame',
        name: 'Diablo 4',
        alternateName: 'Diablo IV',
      },
      keywords: [
        'Diablo 4 World Boss Timer',
        'Diablo 4 World Boss Tracker',
        'D4 World Boss schedule',
        'Diablo 4 boss spawn timer',
      ],
    },
    getEventJsonLd(event),
  ].filter(isSchema);
}
