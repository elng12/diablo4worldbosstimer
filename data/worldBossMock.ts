// D4 World Boss Timer — Mock Data Fixtures
// Matches Implementation Lock DTOs exactly.
// Uses a dynamic time factory so events stay in the future during development.

import type {
  WorldBossEventDto,
  CurrentEventResponse,
  WorldBossScheduleResponse,
  ApiErrorResponse,
} from '@/types/worldBoss';

// ---------------------------------------------------------------------------
// Dynamic time factory
// ---------------------------------------------------------------------------

function minutesFromNow(minutes: number): string {
  return new Date(Date.now() + minutes * 60 * 1000).toISOString();
}

function isoNow(): string {
  return new Date().toISOString();
}

// ---------------------------------------------------------------------------
// Boss / Location rotation constants (P0)
// ---------------------------------------------------------------------------

const BOSSES = [
  { boss_name: 'Ashava', boss_slug: 'ashava' },
  { boss_name: 'Avarice', boss_slug: 'avarice' },
  { boss_name: 'Wandering Death', boss_slug: 'wandering-death' },
] as const;

const LOCATIONS = [
  {
    location_name: 'The Crucible',
    region: 'Fractured Peaks',
    nearest_waypoint: 'Yelesna',
    waypoint_confidence: 'Suggested' as const,
    route_note: 'Travel east from Yelesna and follow the arena road.',
  },
  {
    location_name: 'Caen Adar',
    region: 'Scosglen',
    nearest_waypoint: 'Corbach',
    waypoint_confidence: 'Suggested' as const,
    route_note:
      'Ride northwest from Corbach and enter the arena from the southern path.',
  },
  {
    location_name: 'Saraan Caldera',
    region: 'Dry Steppes',
    nearest_waypoint: null,
    waypoint_confidence: 'Needs manual verification' as const,
    route_note: 'Approach from the closest unlocked Dry Steppes waypoint.',
  },
  {
    location_name: 'Seared Basin',
    region: 'Kehjistan',
    nearest_waypoint: null,
    waypoint_confidence: 'Needs manual verification' as const,
    route_note: null,
  },
  {
    location_name: 'Fields of Desecration',
    region: 'Hawezar',
    nearest_waypoint: null,
    waypoint_confidence: 'Needs manual verification' as const,
    route_note: null,
  },
] as const;

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

function makeEvent(
  i: number,
  overrides?: Partial<WorldBossEventDto>,
): WorldBossEventDto {
  const boss = BOSSES[i % BOSSES.length];
  const loc = LOCATIONS[i % LOCATIONS.length];
  const baseMinutes = i * 210 + 15; // first event 15 min from now + 3.5h interval

  return {
    event_id: `wb_mock_${i}_${Date.now()}`,
    boss_name: boss.boss_name,
    boss_slug: boss.boss_slug,
    spawn_time_utc: minutesFromNow(baseMinutes),
    region: loc.region,
    location_name: loc.location_name,
    nearest_waypoint: loc.nearest_waypoint,
    waypoint_confidence: loc.waypoint_confidence,
    route_note: loc.route_note,
    confidence_status: 'Predicted',
    source_type: 'algorithm',
    is_overridden: false,
    last_updated_at: isoNow(),
    algorithm_version: 'world-boss-v1',
    season_version: 'S13',
    ...overrides,
  };
}

function makeUpcoming(count: number): WorldBossEventDto[] {
  return Array.from({ length: count }, (_, i) => makeEvent(i));
}

// Make one event Confirmed (index 2), one Needs verification (index 4)
function makeUpcomingMixed(count: number): WorldBossEventDto[] {
  return Array.from({ length: count }, (_, i) => {
    if (i === 2) {
      return makeEvent(i, {
        confidence_status: 'Confirmed',
        source_type: 'manual_override',
        is_overridden: true,
      });
    }
    if (i === 4) {
      return makeEvent(i, {
        confidence_status: 'Needs verification',
      });
    }
    return makeEvent(i);
  });
}

// ---------------------------------------------------------------------------
// Variant 1 — Normal (Predicted)
// ---------------------------------------------------------------------------

export const mockCurrentResponse: CurrentEventResponse = {
  event: makeEvent(0),
  upcoming: makeUpcomingMixed(8),
  server_time_utc: isoNow(),
  generated_at: isoNow(),
  stale_after_seconds: 300,
  status: 'ok',
  announcement: { enabled: false, message: null },
};

// ---------------------------------------------------------------------------
// Variant 2 — Confirmed
// ---------------------------------------------------------------------------

export const confirmedCurrentResponse: CurrentEventResponse = {
  event: makeEvent(0, {
    confidence_status: 'Confirmed',
    source_type: 'manual_override',
    is_overridden: true,
  }),
  upcoming: makeUpcomingMixed(8),
  server_time_utc: isoNow(),
  generated_at: isoNow(),
  stale_after_seconds: 300,
  status: 'ok',
  announcement: { enabled: false, message: null },
};

// ---------------------------------------------------------------------------
// Variant 3 — Needs verification
// ---------------------------------------------------------------------------

export const needsVerificationCurrentResponse: CurrentEventResponse = {
  event: makeEvent(0, { confidence_status: 'Needs verification' }),
  upcoming: makeUpcomingMixed(8),
  server_time_utc: isoNow(),
  generated_at: isoNow(),
  stale_after_seconds: 300,
  status: 'needs_verification',
  announcement: { enabled: false, message: null },
};

// ---------------------------------------------------------------------------
// Variant 4 — Full schedule (independent schedule endpoint)
// ---------------------------------------------------------------------------

export const mockScheduleResponse: WorldBossScheduleResponse = {
  events: makeUpcomingMixed(8),
  generated_at: isoNow(),
  server_time_utc: isoNow(),
  limit: 8,
  max_limit: 20,
};

// ---------------------------------------------------------------------------
// Variant 5 — No active anchor
// ---------------------------------------------------------------------------

export const noActiveAnchorResponse: CurrentEventResponse = {
  event: null,
  upcoming: [],
  server_time_utc: isoNow(),
  generated_at: isoNow(),
  stale_after_seconds: 300,
  status: 'no_active_anchor',
  announcement: { enabled: false, message: null },
};

// ---------------------------------------------------------------------------
// Variant 6 — No future events
// ---------------------------------------------------------------------------

export const noFutureEventsResponse: CurrentEventResponse = {
  event: null,
  upcoming: [],
  server_time_utc: isoNow(),
  generated_at: isoNow(),
  stale_after_seconds: 300,
  status: 'no_future_events',
  announcement: { enabled: false, message: null },
};

// ---------------------------------------------------------------------------
// Variant 7 — Current API failed
// ---------------------------------------------------------------------------

export const currentApiFailedState = {
  ok: false,
  error: {
    code: 'FETCH_FAILED',
    message: 'Unable to load the next World Boss.',
  },
} satisfies ApiErrorResponse;

// ---------------------------------------------------------------------------
// Variant 8 — Schedule API failed
// ---------------------------------------------------------------------------

export const scheduleApiFailedState = {
  ok: false,
  error: {
    code: 'SCHEDULE_FETCH_FAILED',
    message: 'Upcoming schedule could not load.',
  },
} satisfies ApiErrorResponse;

// ---------------------------------------------------------------------------
// Variant 9 — Event expired / checking next spawn
// ---------------------------------------------------------------------------

export const eventExpiredCheckingResponse: CurrentEventResponse = {
  event: makeEvent(0, { spawn_time_utc: minutesFromNow(-2) }), // already passed
  upcoming: makeUpcomingMixed(8),
  server_time_utc: isoNow(),
  generated_at: isoNow(),
  stale_after_seconds: 300,
  status: 'ok',
  announcement: { enabled: false, message: null },
};

// ---------------------------------------------------------------------------
// Variant 10 — Announcement active
// ---------------------------------------------------------------------------

export const announcementActiveResponse: CurrentEventResponse = {
  event: makeEvent(0),
  upcoming: makeUpcomingMixed(8),
  server_time_utc: isoNow(),
  generated_at: isoNow(),
  stale_after_seconds: 300,
  status: 'ok',
  announcement: {
    enabled: true,
    message:
      'Season update: World Boss spawn rules may change. Times are being verified.',
  },
};

// ---------------------------------------------------------------------------
// Variant 11 — Stale data
// ---------------------------------------------------------------------------

export const staleCurrentResponse: CurrentEventResponse = {
  event: makeEvent(0),
  upcoming: makeUpcomingMixed(8),
  server_time_utc: isoNow(),
  generated_at: minutesFromNow(-15),
  stale_after_seconds: 300,
  status: 'ok',
  announcement: { enabled: false, message: null },
};

// ---------------------------------------------------------------------------
// Variant 12 — Schedule empty response
// ---------------------------------------------------------------------------

export const emptyScheduleResponse: WorldBossScheduleResponse = {
  events: [],
  generated_at: isoNow(),
  server_time_utc: isoNow(),
  limit: 8,
  max_limit: 20,
};

export const mockVariants = {
  normal: mockCurrentResponse,
  confirmed: confirmedCurrentResponse,
  needsVerification: needsVerificationCurrentResponse,
  noActiveAnchor: noActiveAnchorResponse,
  noFutureEvents: noFutureEventsResponse,
  expired: eventExpiredCheckingResponse,
  announcement: announcementActiveResponse,
  stale: staleCurrentResponse,
};

// ---------------------------------------------------------------------------
// Loading / empty state
// ---------------------------------------------------------------------------

export const loadingState = {
  event: null,
  upcoming: [],
  server_time_utc: null,
  generated_at: null,
  stale_after_seconds: 300,
  status: 'loading' as const,
  announcement: { enabled: false, message: null },
};
