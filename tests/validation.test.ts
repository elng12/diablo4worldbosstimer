import { describe, it, expect } from 'vitest';
import {
  worldBossReportSchema,
  adminOverrideSchema,
  adminAnchorResetSchema,
  adminAnnouncementSchema,
  adminReportStatusSchema,
  validateOrError,
} from '@/lib/validation';

describe('worldBossReportSchema', () => {
  it('accepts a valid report', () => {
    const result = worldBossReportSchema.safeParse({
      report_type: 'Wrong time',
    });
    expect(result.success).toBe(true);
  });

  it('accepts a full report', () => {
    const result = worldBossReportSchema.safeParse({
      event_id: '550e8400-e29b-41d4-a716-446655440000',
      report_type: 'Wrong boss',
      user_note: 'Should be Avarice',
      user_timezone: 'America/New_York',
      displayed_time: 'Jun 15, 2025, 12:00 PM',
      page_state: { confidence_status: 'Predicted' },
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid report_type', () => {
    const result = worldBossReportSchema.safeParse({
      report_type: 'Invalid type',
    });
    expect(result.success).toBe(false);
  });

  it('rejects user_note over 500 chars', () => {
    const result = worldBossReportSchema.safeParse({
      report_type: 'Wrong time',
      user_note: 'x'.repeat(501),
    });
    expect(result.success).toBe(false);
  });

  it('accepts null event_id', () => {
    const result = worldBossReportSchema.safeParse({
      event_id: null,
      report_type: 'Other',
    });
    expect(result.success).toBe(true);
  });

  it('accepts missing optional fields', () => {
    const result = worldBossReportSchema.safeParse({
      report_type: 'Notification issue',
    });
    expect(result.success).toBe(true);
  });
});

describe('adminOverrideSchema', () => {
  it('accepts minimal valid override', () => {
    const result = adminOverrideSchema.safeParse({
      event_id: '550e8400-e29b-41d4-a716-446655440000',
    });
    expect(result.success).toBe(true);
  });

  it('accepts full valid override', () => {
    const result = adminOverrideSchema.safeParse({
      event_id: '550e8400-e29b-41d4-a716-446655440000',
      spawn_time_utc: '2025-06-15T12:00:00Z',
      boss_name: 'Avarice',
      confidence_status: 'Confirmed',
      expires_at: '2025-07-01T00:00:00Z',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid ISO date', () => {
    const result = adminOverrideSchema.safeParse({
      event_id: '550e8400-e29b-41d4-a716-446655440000',
      spawn_time_utc: 'not-a-date',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid confidence_status', () => {
    const result = adminOverrideSchema.safeParse({
      event_id: '550e8400-e29b-41d4-a716-446655440000',
      confidence_status: 'Invalid',
    });
    expect(result.success).toBe(false);
  });

  it('accepts null location_name', () => {
    const result = adminOverrideSchema.safeParse({
      event_id: '550e8400-e29b-41d4-a716-446655440000',
      location_name: null,
    });
    expect(result.success).toBe(true);
  });
});

describe('adminAnchorResetSchema', () => {
  const validPayload = {
    anchor_spawn_time_utc: '2025-06-15T12:00:00Z',
    anchor_boss: 'Ashava',
    anchor_boss_slug: 'ashava',
    anchor_location_name: 'The Crucible',
    anchor_region: 'Fractured Peaks',
    anchor_nearest_waypoint: 'Yelesna',
    boss_rotation_index: 0,
    location_rotation_index: 0,
  };

  it('accepts a valid anchor reset', () => {
    const result = adminAnchorResetSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it('rejects placeholder value', () => {
    const result = adminAnchorResetSchema.safeParse({
      ...validPayload,
      anchor_boss: 'TO_BE_CONFIRMED_BEFORE_LAUNCH',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid ISO date for spawn time', () => {
    const result = adminAnchorResetSchema.safeParse({
      ...validPayload,
      anchor_spawn_time_utc: 'not-a-date',
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative rotation index', () => {
    const result = adminAnchorResetSchema.safeParse({
      ...validPayload,
      boss_rotation_index: -1,
    });
    expect(result.success).toBe(false);
  });

  it('accepts optional interval_minutes', () => {
    const result = adminAnchorResetSchema.safeParse({
      ...validPayload,
      interval_minutes: 210,
    });
    expect(result.success).toBe(true);
  });

  it('rejects zero interval_minutes', () => {
    const result = adminAnchorResetSchema.safeParse({
      ...validPayload,
      interval_minutes: 0,
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty required string fields', () => {
    const result = adminAnchorResetSchema.safeParse({
      ...validPayload,
      anchor_boss: '',
    });
    expect(result.success).toBe(false);
  });
});

describe('adminAnnouncementSchema', () => {
  it('accepts enabled with message', () => {
    const result = adminAnnouncementSchema.safeParse({
      enabled: true,
      message: 'Server maintenance at 3pm',
    });
    expect(result.success).toBe(true);
  });

  it('accepts disabled with null message', () => {
    const result = adminAnnouncementSchema.safeParse({
      enabled: false,
      message: null,
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing enabled', () => {
    const result = adminAnnouncementSchema.safeParse({
      message: 'test',
    });
    expect(result.success).toBe(false);
  });

  it('rejects non-boolean enabled', () => {
    const result = adminAnnouncementSchema.safeParse({
      enabled: 'true',
    });
    expect(result.success).toBe(false);
  });

  it('rejects message over 1000 chars', () => {
    const result = adminAnnouncementSchema.safeParse({
      enabled: true,
      message: 'x'.repeat(1001),
    });
    expect(result.success).toBe(false);
  });
});

describe('adminReportStatusSchema', () => {
  it('accepts valid status values', () => {
    for (const status of ['open', 'resolved', 'ignored']) {
      const result = adminReportStatusSchema.safeParse({
        report_id: '550e8400-e29b-41d4-a716-446655440000',
        status,
      });
      expect(result.success).toBe(true);
    }
  });

  it('rejects invalid status', () => {
    const result = adminReportStatusSchema.safeParse({
      report_id: 'some-id',
      status: 'closed',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty report_id', () => {
    const result = adminReportStatusSchema.safeParse({
      report_id: '',
      status: 'resolved',
    });
    expect(result.success).toBe(false);
  });
});

describe('validateOrError', () => {
  it('returns data on valid input', () => {
    const result = validateOrError(adminAnnouncementSchema, {
      enabled: true,
      message: 'test',
    });
    if ('data' in result) {
      expect(result.data.enabled).toBe(true);
    } else {
      expect.fail('Expected data, got error');
    }
  });

  it('returns error response on invalid input', () => {
    const result = validateOrError(adminAnnouncementSchema, {
      enabled: 'not-a-bool',
    });
    if ('error' in result) {
      // It returns a NextResponse, check it exists
      expect(result.error).toBeDefined();
    } else {
      expect.fail('Expected error, got data');
    }
  });
});
