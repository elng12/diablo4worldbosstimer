import { describe, it, expect } from 'vitest';
import {
  formatCountdown,
  formatLocalDateTime,
  formatTimeOnly,
  getSecondsUntil,
  getTimezoneState,
  confidenceClass,
  waypointLabel,
  isResponseStale,
} from '@/lib/worldBossFormat';
import type { WorldBossEventDto } from '@/types/worldBoss';

describe('formatCountdown', () => {
  it('formats zero seconds', () => {
    expect(formatCountdown(0)).toBe('00:00:00');
  });

  it('formats hours, minutes, seconds', () => {
    expect(formatCountdown(3661)).toBe('01:01:01');
  });

  it('formats large hours', () => {
    expect(formatCountdown(36000)).toBe('10:00:00');
  });

  it('clamps negative values to zero', () => {
    expect(formatCountdown(-100)).toBe('00:00:00');
  });
});

describe('getSecondsUntil', () => {
  it('returns seconds until a future time', () => {
    const future = new Date(Date.now() + 5000).toISOString();
    const seconds = getSecondsUntil(future);
    expect(seconds).toBeGreaterThanOrEqual(4);
    expect(seconds).toBeLessThanOrEqual(5);
  });

  it('returns 0 for past times', () => {
    const past = new Date(Date.now() - 10000).toISOString();
    expect(getSecondsUntil(past)).toBe(0);
  });
});

describe('confidenceClass', () => {
  it('returns confirmed for Confirmed', () => {
    expect(confidenceClass('Confirmed')).toBe('confirmed');
  });

  it('returns predicted for Predicted', () => {
    expect(confidenceClass('Predicted')).toBe('predicted');
  });

  it('returns needs-verification for Needs verification', () => {
    expect(confidenceClass('Needs verification')).toBe('needs-verification');
  });
});

describe('waypointLabel', () => {
  const baseEvent = {
    event_id: '1',
    boss_name: 'Ashava',
    boss_slug: 'ashava',
    spawn_time_utc: '2025-01-01T00:00:00Z',
    region: 'Fractured Peaks',
    location_name: 'The Crucible',
    nearest_waypoint: 'Yelesna',
    waypoint_confidence: 'Confirmed' as const,
    route_note: null,
    confidence_status: 'Confirmed' as const,
    source_type: 'algorithm' as const,
    is_overridden: false,
    last_updated_at: '2025-01-01T00:00:00Z',
    algorithm_version: 'v1',
    season_version: 'current',
  };

  it('returns confirmed waypoint label', () => {
    expect(waypointLabel(baseEvent as WorldBossEventDto)).toBe(
      'Nearest waypoint: Yelesna',
    );
  });

  it('returns suggested waypoint label', () => {
    const event = {
      ...baseEvent,
      waypoint_confidence: 'Suggested' as const,
    };
    expect(waypointLabel(event as WorldBossEventDto)).toBe(
      'Suggested waypoint: Yelesna',
    );
  });

  it('returns needs verification label', () => {
    const event = {
      ...baseEvent,
      waypoint_confidence: 'Needs manual verification' as const,
    };
    expect(waypointLabel(event as WorldBossEventDto)).toBe(
      'Waypoint needs manual verification: Yelesna',
    );
  });

  it('returns fallback when no waypoint', () => {
    const event = {
      ...baseEvent,
      nearest_waypoint: null,
    };
    expect(waypointLabel(event as WorldBossEventDto)).toBe(
      'Waypoint needs manual verification',
    );
  });
});

describe('isResponseStale', () => {
  it('returns false for fresh data', () => {
    const generatedAt = new Date().toISOString();
    expect(isResponseStale(generatedAt, 300)).toBe(false);
  });

  it('returns true for stale data', () => {
    const generatedAt = new Date(Date.now() - 600000).toISOString();
    expect(isResponseStale(generatedAt, 300)).toBe(true);
  });
});

describe('formatLocalDateTime', () => {
  it('produces a non-empty string', () => {
    const result = formatLocalDateTime('2025-06-15T12:00:00Z');
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('formatTimeOnly', () => {
  it('produces a non-empty string', () => {
    const result = formatTimeOnly('2025-06-15T12:00:00Z');
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('getTimezoneState', () => {
  it('returns a timezone label and failed flag', () => {
    const state = getTimezoneState();
    expect(state).toHaveProperty('label');
    expect(state).toHaveProperty('failed');
    expect(typeof state.label).toBe('string');
    expect(typeof state.failed).toBe('boolean');
  });
});
