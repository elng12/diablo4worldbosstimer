import { z } from 'zod';
import {
  apiErrorResponse,
  isIsoDate,
} from '@/lib/apiUtils';

/* ------------------------------------------------------------------ */
/*  Shared schemas                                                     */
/* ------------------------------------------------------------------ */

export const confidenceStatusSchema = z.enum([
  'Confirmed',
  'Predicted',
  'Needs verification',
]);

export const waypointConfidenceSchema = z.enum([
  'Confirmed',
  'Suggested',
  'Needs manual verification',
]);

export const reportTypeSchema = z.enum([
  'Wrong time',
  'Wrong boss',
  'Wrong location',
  'Notification issue',
  'Other',
]);

export const isoDateSchema = z.string().refine(isIsoDate, {
  message: 'Must be a valid ISO timestamp.',
});

/* ------------------------------------------------------------------ */
/*  Payload schemas                                                    */
/* ------------------------------------------------------------------ */

export const worldBossReportSchema = z.object({
  event_id: z.uuid().nullable().optional(),
  report_type: reportTypeSchema,
  user_note: z.string().max(500).optional(),
  user_timezone: z.string().optional(),
  displayed_time: z.string().optional(),
  page_state: z.record(z.string(), z.unknown()).optional(),
});

export const adminOverrideSchema = z.object({
  event_id: z.uuid(),
  spawn_time_utc: isoDateSchema.optional(),
  boss_name: z.string().optional(),
  boss_slug: z.string().optional(),
  location_name: z.string().nullable().optional(),
  region: z.string().nullable().optional(),
  nearest_waypoint: z.string().nullable().optional(),
  waypoint_confidence: waypointConfidenceSchema.nullable().optional(),
  route_note: z.string().nullable().optional(),
  confidence_status: confidenceStatusSchema.optional(),
  override_reason: z.string().optional(),
  created_by: z.string().optional(),
  expires_at: isoDateSchema.nullable().optional(),
});

const placeholderValue = 'TO_BE_CONFIRMED_BEFORE_LAUNCH';

const safeConfirmedString = z.string().min(1).refine(
  (val) => val !== placeholderValue,
  { message: 'Must be manually confirmed (placeholder values are not allowed).' },
);

export const adminAnchorResetSchema = z.object({
  anchor_spawn_time_utc: isoDateSchema.pipe(safeConfirmedString),
  anchor_boss: safeConfirmedString,
  anchor_boss_slug: safeConfirmedString,
  anchor_location_name: safeConfirmedString,
  anchor_region: safeConfirmedString,
  anchor_nearest_waypoint: safeConfirmedString,
  interval_minutes: z.number().int().positive().optional(),
  boss_rotation_index: z.number().int().nonnegative(),
  location_rotation_index: z.number().int().nonnegative(),
  season_version: z.string().optional(),
  algorithm_version: z.string().optional(),
  source_note: z.string().optional(),
  created_by: z.string().optional(),
});

export const adminAnnouncementSchema = z.object({
  enabled: z.boolean(),
  message: z.string().max(1000).nullable().optional(),
});

export const adminReportStatusSchema = z.object({
  report_id: z.uuid(),
  status: z.enum(['open', 'resolved', 'ignored']),
});

/* ------------------------------------------------------------------ */
/*  Validation helper                                                  */
/* ------------------------------------------------------------------ */

export function validateOrError<T>(
  schema: z.ZodType<T>,
  data: unknown,
): { data: T } | { error: ReturnType<typeof apiErrorResponse> } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { data: result.data };
  }
  const messages = result.error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join('; ');
  return {
    error: apiErrorResponse('VALIDATION_ERROR', messages, 400),
  };
}
