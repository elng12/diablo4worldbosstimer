import { describe, it, expect } from 'vitest';
import {
  buildWorldBossGenerationPlan,
  validateRequiredSettings,
  type WorldBossAnchorRow,
} from '@/lib/worldBossSchedule';

// baseTime before the anchor so firstFutureOffset = 0 and rotation starts at index 0
const beforeAnchorTime = new Date('2025-06-01T11:00:00Z');

const baseAnchor: WorldBossAnchorRow = {
  id: 'test-anchor',
  anchor_spawn_time_utc: '2025-06-01T12:00:00Z',
  anchor_boss: 'Ashava',
  anchor_boss_slug: 'ashava',
  anchor_location_name: 'The Crucible',
  anchor_region: 'Fractured Peaks',
  anchor_nearest_waypoint: 'Yelesna',
  interval_minutes: 210,
  boss_rotation_index: 0,
  location_rotation_index: 0,
  season_version: 'current',
  algorithm_version: 'world-boss-v1',
  confidence_status: 'Confirmed',
  is_active: true,
};

const baseSettings = [
  {
    key: 'boss_pool',
    value: [
      { boss_name: 'Ashava', boss_slug: 'ashava' },
      { boss_name: 'Avarice', boss_slug: 'avarice' },
      { boss_name: 'Wandering Death', boss_slug: 'wandering-death' },
    ],
  },
  {
    key: 'location_pool',
    value: [
      { location_name: 'The Crucible', region: 'Fractured Peaks', nearest_waypoint: 'Yelesna', waypoint_confidence: 'Confirmed' },
      { location_name: 'Saraan Caldera', region: 'Scosglen', nearest_waypoint: 'Corbach', waypoint_confidence: 'Confirmed' },
      { location_name: 'Seared Basin', region: 'Kehjistan', nearest_waypoint: 'Iron Wolves Encampment', waypoint_confidence: 'Confirmed' },
    ],
  },
  {
    key: 'boss_rotation',
    value: [
      { boss_name: 'Ashava', boss_slug: 'ashava' },
      { boss_name: 'Avarice', boss_slug: 'avarice' },
      { boss_name: 'Wandering Death', boss_slug: 'wandering-death' },
    ],
  },
  {
    key: 'location_rotation',
    value: [
      { location_name: 'The Crucible', region: 'Fractured Peaks', nearest_waypoint: 'Yelesna', waypoint_confidence: 'Confirmed' },
      { location_name: 'Saraan Caldera', region: 'Scosglen', nearest_waypoint: 'Corbach', waypoint_confidence: 'Confirmed' },
      { location_name: 'Seared Basin', region: 'Kehjistan', nearest_waypoint: 'Iron Wolves Encampment', waypoint_confidence: 'Confirmed' },
    ],
  },
  {
    key: 'world_boss_algorithm',
    value: {
      interval_minutes: 210,
      algorithm_version: 'world-boss-v1',
      season_version: 'current',
      default_confidence_status: 'Predicted',
    },
  },
  {
    key: 'generation_control',
    value: { prediction_enabled: true },
  },
  {
    key: 'nahantu_rule',
    value: { enabled: false },
  },
  {
    key: 'announcement_message',
    value: { enabled: false, message: null },
  },
];

describe('validateRequiredSettings', () => {
  it('returns empty array when all keys present', () => {
    expect(validateRequiredSettings(baseSettings)).toEqual([]);
  });

  it('returns missing keys', () => {
    const partial = baseSettings.filter((s) => s.key !== 'boss_pool');
    const missing = validateRequiredSettings(partial);
    expect(missing).toContain('boss_pool');
  });
});

describe('buildWorldBossGenerationPlan', () => {
  it('generates the requested number of events', () => {
    const plan = buildWorldBossGenerationPlan(baseAnchor, baseSettings, 5);
    expect(plan.skipped).toBe(false);
    expect(plan.events).toHaveLength(5);
  });

  it('defaults to 20 events', () => {
    const plan = buildWorldBossGenerationPlan(baseAnchor, baseSettings);
    expect(plan.events).toHaveLength(20);
  });

  it('respects max limit of 20', () => {
    const plan = buildWorldBossGenerationPlan(baseAnchor, baseSettings, 50);
    expect(plan.events).toHaveLength(20);
  });

  it('generates events with correct boss rotation', () => {
    const plan = buildWorldBossGenerationPlan(baseAnchor, baseSettings, 3, beforeAnchorTime);
    expect(plan.events[0].boss_name).toBe('Ashava');
    expect(plan.events[1].boss_name).toBe('Avarice');
    expect(plan.events[2].boss_name).toBe('Wandering Death');
  });

  it('generates events with correct location rotation', () => {
    const plan = buildWorldBossGenerationPlan(baseAnchor, baseSettings, 3, beforeAnchorTime);
    expect(plan.events[0].location_name).toBe('The Crucible');
    expect(plan.events[1].location_name).toBe('Saraan Caldera');
    expect(plan.events[2].location_name).toBe('Seared Basin');
  });

  it('uses anchor interval for spawn times', () => {
    const plan = buildWorldBossGenerationPlan(baseAnchor, baseSettings, 2);
    const t0 = new Date(plan.events[0].spawn_time_utc).getTime();
    const t1 = new Date(plan.events[1].spawn_time_utc).getTime();
    expect(t1 - t0).toBe(210 * 60 * 1000);
  });

  it('sets default confidence to Predicted', () => {
    const plan = buildWorldBossGenerationPlan(baseAnchor, baseSettings, 1);
    expect(plan.events[0].confidence_status).toBe('Predicted');
  });

  it('sets source_type to algorithm', () => {
    const plan = buildWorldBossGenerationPlan(baseAnchor, baseSettings, 1);
    expect(plan.events[0].source_type).toBe('algorithm');
  });

  it('sets is_overridden to false', () => {
    const plan = buildWorldBossGenerationPlan(baseAnchor, baseSettings, 1);
    expect(plan.events[0].is_overridden).toBe(false);
  });

  it('wraps rotation when index exceeds array length', () => {
    const plan = buildWorldBossGenerationPlan(baseAnchor, baseSettings, 6, beforeAnchorTime);
    // 3 bosses, so index 3 wraps to 0
    expect(plan.events[3].boss_name).toBe('Ashava');
    expect(plan.events[3].location_name).toBe('The Crucible');
  });

  it('throws when anchor is not Confirmed', () => {
    const unconfirmed = { ...baseAnchor, confidence_status: 'Predicted' as const };
    expect(() =>
      buildWorldBossGenerationPlan(unconfirmed, baseSettings),
    ).toThrow('Confirmed');
  });

  it('skips when prediction is disabled', () => {
    const settings = baseSettings.map((s) =>
      s.key === 'generation_control'
        ? { ...s, value: { prediction_enabled: false, reason: 'Season break' } }
        : s,
    );
    const plan = buildWorldBossGenerationPlan(baseAnchor, settings, 5);
    expect(plan.skipped).toBe(true);
    expect(plan.events).toHaveLength(0);
    expect(plan.reason).toBe('Season break');
  });

  it('throws when required settings are missing', () => {
    const partial = baseSettings.filter((s) => s.key !== 'boss_rotation');
    expect(() =>
      buildWorldBossGenerationPlan(baseAnchor, partial),
    ).toThrow('Missing world boss settings');
  });

  it('generates only future events from baseTime', () => {
    const baseTime = new Date('2025-06-01T15:00:00Z');
    const plan = buildWorldBossGenerationPlan(baseAnchor, baseSettings, 5, baseTime);
    // Anchor at 12:00, interval 210min (3.5h), next at 15:30
    // All events should be after baseTime
    for (const event of plan.events) {
      expect(new Date(event.spawn_time_utc).getTime()).toBeGreaterThan(
        baseTime.getTime() - 1,
      );
    }
  });

  it('resolves location_pool data for rotation locations', () => {
    const plan = buildWorldBossGenerationPlan(baseAnchor, baseSettings, 1, beforeAnchorTime);
    expect(plan.events[0].nearest_waypoint).toBe('Yelesna');
    expect(plan.events[0].waypoint_confidence).toBe('Confirmed');
  });

  it('uses rotation_index offset for wrapping', () => {
    const anchor = { ...baseAnchor, boss_rotation_index: 2 };
    const plan = buildWorldBossGenerationPlan(anchor, baseSettings, 2, beforeAnchorTime);
    // Index 2+0 = Wandering Death, index 2+1 wraps to Ashava
    expect(plan.events[0].boss_name).toBe('Wandering Death');
    expect(plan.events[1].boss_name).toBe('Ashava');
  });
});
