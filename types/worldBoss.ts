// D4 World Boss Timer — Shared TypeScript DTOs
// Source of truth: Implementation Lock v1 §3

export type ConfidenceStatus = 'Confirmed' | 'Predicted' | 'Needs verification';

export type SourceType = 'algorithm' | 'manual_override' | 'manual_seed';

export type WaypointConfidence = 'Confirmed' | 'Suggested' | 'Needs manual verification';

export const REPORT_TYPES = ['Wrong time', 'Wrong boss', 'Wrong location', 'Notification issue', 'Other'] as const;

export type ReportType = (typeof REPORT_TYPES)[number];

export interface WorldBossEventDto {
  event_id: string;
  boss_name: string;
  /** Known values: 'ashava' | 'avarice' | 'wandering-death', but extensible for future bosses */
  boss_slug: string;
  spawn_time_utc: string;
  region: string | null;
  location_name: string | null;
  nearest_waypoint: string | null;
  waypoint_confidence: WaypointConfidence | null;
  route_note: string | null;
  confidence_status: ConfidenceStatus;
  source_type: SourceType;
  is_overridden: boolean;
  last_updated_at: string;
  algorithm_version: string | null;
  season_version: string | null;
}

export interface CurrentEventResponse {
  event: WorldBossEventDto | null;
  upcoming: WorldBossEventDto[];
  server_time_utc: string;
  generated_at: string;
  stale_after_seconds: number;
  status: 'ok' | 'no_active_anchor' | 'no_future_events' | 'needs_verification';
  announcement: {
    enabled: boolean;
    message: string | null;
  };
}

export interface WorldBossScheduleResponse {
  events: WorldBossEventDto[];
  generated_at: string;
  server_time_utc: string;
  limit: number;
  max_limit: number;
}

export interface WorldBossReportPayload {
  event_id: string | null;
  report_type: 'Wrong time' | 'Wrong boss' | 'Wrong location' | 'Notification issue' | 'Other';
  user_note?: string;
  user_timezone?: string;
  displayed_time?: string;
  page_state?: Record<string, unknown>;
}

export interface AdminWorldBossReportDto {
  id: string;
  event_id: string | null;
  report_type: ReportType;
  user_note: string | null;
  user_timezone: string | null;
  displayed_time: string | null;
  status: 'open' | 'resolved' | 'ignored';
  created_at: string | null;
}

export interface ApiErrorResponse {
  ok: false;
  error: {
    code: string;
    message: string;
  };
}
