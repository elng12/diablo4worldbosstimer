import { describe, expect, it } from 'vitest';
import { getWorldBossJsonLd } from '@/lib/worldBossJsonLd';
import type { WorldBossEventDto } from '@/types/worldBoss';

const event: WorldBossEventDto = {
  event_id: 'event-1',
  boss_name: 'Ashava',
  boss_slug: 'ashava',
  spawn_time_utc: '2026-05-06T02:30:00.000Z',
  region: 'Fractured Peaks',
  location_name: 'The Crucible',
  nearest_waypoint: 'Yelesna',
  waypoint_confidence: 'Confirmed',
  route_note: null,
  confidence_status: 'Predicted',
  source_type: 'algorithm',
  is_overridden: false,
  last_updated_at: '2026-05-06T01:30:00.000Z',
  algorithm_version: 'world-boss-v1',
  season_version: 'current',
};

describe('getWorldBossJsonLd', () => {
  it('includes FAQ, breadcrumb, web app, and event schemas when an event exists', () => {
    const schemas = getWorldBossJsonLd(event);

    expect(schemas.map((schema) => schema['@type'])).toEqual([
      'FAQPage',
      'BreadcrumbList',
      'WebApplication',
      'Event',
    ]);
  });

  it('omits Event schema when there is no current event', () => {
    const schemas = getWorldBossJsonLd(null);

    expect(schemas.map((schema) => schema['@type'])).toEqual([
      'FAQPage',
      'BreadcrumbList',
      'WebApplication',
    ]);
  });

  it('maps the next world boss to Event JSON-LD fields', () => {
    const eventSchema = getWorldBossJsonLd(event).find(
      (schema) => schema['@type'] === 'Event',
    );

    expect(eventSchema).toMatchObject({
      name: 'Diablo 4 World Boss: Ashava',
      startDate: '2026-05-06T02:30:00.000Z',
      eventStatus: 'https://schema.org/EventScheduled',
      eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode',
      location: {
        '@type': 'Place',
        name: 'The Crucible',
        address: {
          '@type': 'PostalAddress',
          addressRegion: 'Fractured Peaks',
        },
      },
    });
  });
});
