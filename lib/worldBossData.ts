import {
  mockCurrentResponse,
  mockScheduleResponse,
} from '@/data/worldBossMock';
import { isDatabaseConfigured, query, queryOne, execute, withTransaction } from '@/lib/neonDb';
import {
  buildWorldBossGenerationPlan,
  type WorldBossAnchorRow,
  type WorldBossGeneratedEvent,
} from '@/lib/worldBossSchedule';
import type {
  AdminWorldBossReportDto,
  ConfidenceStatus,
  CurrentEventResponse,
  ReportType,
  SourceType,
  WaypointConfidence,
  WorldBossEventDto,
  WorldBossReportPayload,
  WorldBossScheduleResponse,
} from '@/types/worldBoss';

const CURRENT_UPCOMING_LIMIT = 8;
const MAX_SCHEDULE_LIMIT = 20;
const STALE_AFTER_SECONDS = 300;

type WorldBossEventRow = {
  id: string;
  boss_name: string;
  boss_slug: string;
  spawn_time_utc: string;
  region: string | null;
  location_name: string | null;
  nearest_waypoint: string | null;
  waypoint_confidence: WaypointConfidence | null;
  route_note: string | null;
  confidence_status: ConfidenceStatus;
  source_type: SourceType;
  is_overridden: boolean | null;
  updated_at: string | null;
  algorithm_version: string | null;
  season_version: string | null;
};

type WorldBossSettingsRow = {
  key: string;
  value: unknown;
};

type AnnouncementSetting = {
  enabled?: boolean;
  message?: string | null;
};

type AlgorithmSetting = {
  stale_after_seconds?: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isAnnouncementSetting(value: unknown): value is AnnouncementSetting {
  if (!isRecord(value)) return false;
  return (
    (value.enabled === undefined || typeof value.enabled === 'boolean') &&
    (value.message === undefined || typeof value.message === 'string' || value.message === null)
  );
}

function isAlgorithmSetting(value: unknown): value is AlgorithmSetting {
  if (!isRecord(value)) return false;
  return (
    value.stale_after_seconds === undefined || typeof value.stale_after_seconds === 'number'
  );
}

export type AdminOverridePayload = {
  event_id: string;
  spawn_time_utc?: string;
  boss_name?: string;
  boss_slug?: string;
  location_name?: string | null;
  region?: string | null;
  nearest_waypoint?: string | null;
  waypoint_confidence?: WaypointConfidence | null;
  route_note?: string | null;
  confidence_status?: ConfidenceStatus;
  override_reason?: string;
  created_by?: string;
  expires_at?: string | null;
};

export type AdminAnchorResetPayload = {
  anchor_spawn_time_utc: string;
  anchor_boss: string;
  anchor_boss_slug: string;
  anchor_location_name: string;
  anchor_region: string;
  anchor_nearest_waypoint: string;
  interval_minutes?: number;
  boss_rotation_index: number;
  location_rotation_index: number;
  season_version?: string;
  algorithm_version?: string;
  source_note?: string;
  created_by?: string;
};

type AdminOverrideResult = {
  ok: true;
  event: WorldBossEventDto;
  override_id: string | null;
};

type ReportInsertResult = {
  ok: true;
  report_id: string;
};

type GenerateFutureScheduleResult = {
  ok: true;
  inserted_count: number;
  generated_count: number;
  skipped: boolean;
  reason: string | null;
};

type AdminAnchorResetResult = {
  ok: true;
  anchor_id: string;
  deactivated_anchor_ids: string[];
  deleted_algorithm_event_ids: string[];
  generation: GenerateFutureScheduleResult;
};

const EVENT_COLUMNS = `id, boss_name, boss_slug, spawn_time_utc, region, location_name,
         nearest_waypoint, waypoint_confidence, route_note, confidence_status,
         source_type, is_overridden, updated_at, algorithm_version, season_version`;

function nowIso() {
  return new Date().toISOString();
}

function toEventDto(row: WorldBossEventRow): WorldBossEventDto {
  return {
    event_id: row.id,
    boss_name: row.boss_name,
    boss_slug: row.boss_slug,
    spawn_time_utc: row.spawn_time_utc,
    region: row.region,
    location_name: row.location_name,
    nearest_waypoint: row.nearest_waypoint,
    waypoint_confidence: row.waypoint_confidence,
    route_note: row.route_note,
    confidence_status: row.confidence_status,
    source_type: row.source_type,
    is_overridden: row.is_overridden ?? false,
    last_updated_at: row.updated_at ?? row.spawn_time_utc,
    algorithm_version: row.algorithm_version,
    season_version: row.season_version,
  };
}

function announcementFromRows(rows: WorldBossSettingsRow[]) {
  const row = rows.find((item) => item.key === 'announcement_message');
  const value = row?.value;

  if (!isAnnouncementSetting(value)) {
    return { enabled: false, message: null };
  }

  return {
    enabled: Boolean(value.enabled && value.message),
    message: typeof value.message === 'string' ? value.message : null,
  };
}

function staleSecondsFromRows(rows: WorldBossSettingsRow[]) {
  const row = rows.find((item) => item.key === 'world_boss_algorithm');
  const value = row?.value;

  if (!isAlgorithmSetting(value)) {
    return STALE_AFTER_SECONDS;
  }

  const seconds = value.stale_after_seconds;

  return typeof seconds === 'number' && seconds > 0
    ? seconds
    : STALE_AFTER_SECONDS;
}

async function getPublicSettings() {
  if (!isDatabaseConfigured()) {
    return {
      announcement: { enabled: false, message: null },
      staleAfterSeconds: STALE_AFTER_SECONDS,
    };
  }

  const rows = await query<WorldBossSettingsRow>(
    `SELECT key, value FROM world_boss_settings WHERE key IN ('announcement_message', 'world_boss_algorithm')`,
  );

  return {
    announcement: announcementFromRows(rows),
    staleAfterSeconds: staleSecondsFromRows(rows),
  };
}

/* ------------------------------------------------------------------ */
/*  Bulk event insert helper                                          */
/* ------------------------------------------------------------------ */

function buildEventInsert(events: WorldBossGeneratedEvent[]) {
  const values = events
    .map(
      (_, i) =>
        `($${i * 12 + 1},$${i * 12 + 2},$${i * 12 + 3},$${i * 12 + 4},$${i * 12 + 5},$${i * 12 + 6},$${i * 12 + 7},$${i * 12 + 8},$${i * 12 + 9},$${i * 12 + 10},$${i * 12 + 11},$${i * 12 + 12})`,
    )
    .join(',\n');

  const params: unknown[] = [];
  for (const e of events) {
    params.push(
      e.boss_name,
      e.boss_slug,
      e.spawn_time_utc,
      e.region,
      e.location_name,
      e.nearest_waypoint,
      e.waypoint_confidence,
      e.route_note,
      e.confidence_status,
      e.source_type,
      e.algorithm_version,
      e.season_version,
    );
  }

  return { values, params };
}

/* ------------------------------------------------------------------ */
/*  Public read operations                                            */
/* ------------------------------------------------------------------ */

export async function getCurrentWorldBoss(): Promise<CurrentEventResponse> {
  if (!isDatabaseConfigured()) {
    return mockCurrentResponse;
  }

  const generatedAt = nowIso();
  const serverTime = generatedAt;
  const [rows, publicSettings] = await Promise.all([
    query<WorldBossEventRow>(
      `SELECT ${EVENT_COLUMNS}
       FROM world_boss_events
       WHERE spawn_time_utc > $1
       ORDER BY spawn_time_utc ASC
       LIMIT $2`,
      [serverTime, CURRENT_UPCOMING_LIMIT],
    ),
    getPublicSettings(),
  ]);

  const upcoming = rows.map(toEventDto);
  const event = upcoming[0] ?? null;
  const status: CurrentEventResponse['status'] = event
    ? event.confidence_status === 'Needs verification'
      ? 'needs_verification'
      : 'ok'
    : 'no_future_events';

  return {
    event,
    upcoming,
    server_time_utc: serverTime,
    generated_at: generatedAt,
    stale_after_seconds: publicSettings.staleAfterSeconds,
    status,
    announcement: publicSettings.announcement,
  };
}

export async function getWorldBossSchedule(
  requestedLimit: number,
): Promise<WorldBossScheduleResponse> {
  const safeLimit = Number.isFinite(requestedLimit)
    ? Math.min(Math.max(requestedLimit, 1), MAX_SCHEDULE_LIMIT)
    : CURRENT_UPCOMING_LIMIT;

  if (!isDatabaseConfigured()) {
    return {
      ...mockScheduleResponse,
      limit: safeLimit,
      max_limit: MAX_SCHEDULE_LIMIT,
      events: mockScheduleResponse.events.slice(0, safeLimit),
    };
  }

  const generatedAt = nowIso();
  const serverTime = generatedAt;
  const rows = await query<WorldBossEventRow>(
    `SELECT ${EVENT_COLUMNS}
     FROM world_boss_events
     WHERE spawn_time_utc > $1
     ORDER BY spawn_time_utc ASC
     LIMIT $2`,
    [serverTime, safeLimit],
  );

  return {
    events: rows.map(toEventDto),
    generated_at: generatedAt,
    server_time_utc: serverTime,
    limit: safeLimit,
    max_limit: MAX_SCHEDULE_LIMIT,
  };
}

/* ------------------------------------------------------------------ */
/*  Report                                                            */
/* ------------------------------------------------------------------ */

export async function createWorldBossReport(
  payload: WorldBossReportPayload,
): Promise<ReportInsertResult> {
  if (!isDatabaseConfigured()) {
    return {
      ok: true,
      report_id: `mock_report_${Date.now()}`,
    };
  }

  const rows = await query<{ id: string }>(
    `INSERT INTO world_boss_reports (event_id, report_type, user_note, user_timezone, displayed_time, page_state, status)
     VALUES ($1, $2, $3, $4, $5, $6, 'open')
     RETURNING id`,
    [
      payload.event_id ?? null,
      payload.report_type,
      payload.user_note ?? null,
      payload.user_timezone ?? null,
      payload.displayed_time ?? null,
      payload.page_state ? JSON.stringify(payload.page_state) : null,
    ],
  );

  return {
    ok: true,
    report_id: rows[0]?.id ?? '',
  };
}

/* ------------------------------------------------------------------ */
/*  Admin write: Override                                             */
/* ------------------------------------------------------------------ */

export async function applyWorldBossOverride(
  payload: AdminOverridePayload,
): Promise<AdminOverrideResult> {
  const existingRows = await query<WorldBossEventRow>(
    `SELECT ${EVENT_COLUMNS}
     FROM world_boss_events
     WHERE id = $1
     LIMIT 1`,
    [payload.event_id],
  );
  const existing = existingRows[0];

  if (!existing) {
    throw new Error('World boss event was not found.');
  }

  const actor = payload.created_by ?? 'admin_api';
  const updateBody = {
    boss_name: payload.boss_name ?? existing.boss_name,
    boss_slug: payload.boss_slug ?? existing.boss_slug,
    spawn_time_utc: payload.spawn_time_utc ?? existing.spawn_time_utc,
    region: payload.region === undefined ? existing.region : payload.region,
    location_name:
      payload.location_name === undefined ? existing.location_name : payload.location_name,
    nearest_waypoint:
      payload.nearest_waypoint === undefined
        ? existing.nearest_waypoint
        : payload.nearest_waypoint,
    waypoint_confidence:
      payload.waypoint_confidence === undefined
        ? existing.waypoint_confidence
        : payload.waypoint_confidence,
    route_note: payload.route_note === undefined ? existing.route_note : payload.route_note,
    confidence_status: payload.confidence_status ?? 'Confirmed',
    source_type: 'manual_override' satisfies SourceType,
    is_overridden: true,
  };

  return withTransaction(async (client) => {
    const overrideResult = await client.query<{ id: string }>(
      `INSERT INTO world_boss_overrides
         (event_id, override_spawn_time_utc, override_boss_name, override_boss_slug,
          override_location_name, override_region, override_nearest_waypoint,
          override_waypoint_confidence, override_route_note, override_confidence_status,
          override_reason, created_by, expires_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING id`,
      [
        payload.event_id,
        payload.spawn_time_utc ?? null,
        payload.boss_name ?? null,
        payload.boss_slug ?? null,
        payload.location_name === undefined ? null : payload.location_name,
        payload.region === undefined ? null : payload.region,
        payload.nearest_waypoint === undefined ? null : payload.nearest_waypoint,
        payload.waypoint_confidence === undefined ? null : payload.waypoint_confidence,
        payload.route_note === undefined ? null : payload.route_note,
        updateBody.confidence_status,
        payload.override_reason ?? null,
        actor,
        payload.expires_at ?? null,
      ],
    );

    const updatedResult = await client.query<WorldBossEventRow>(
      `UPDATE world_boss_events
       SET boss_name = $1, boss_slug = $2, spawn_time_utc = $3, region = $4,
           location_name = $5, nearest_waypoint = $6, waypoint_confidence = $7,
           route_note = $8, confidence_status = $9, source_type = $10,
           is_overridden = true, updated_at = now()
       WHERE id = $11
       RETURNING ${EVENT_COLUMNS}`,
      [
        updateBody.boss_name,
        updateBody.boss_slug,
        updateBody.spawn_time_utc,
        updateBody.region,
        updateBody.location_name,
        updateBody.nearest_waypoint,
        updateBody.waypoint_confidence,
        updateBody.route_note,
        updateBody.confidence_status,
        updateBody.source_type,
        payload.event_id,
      ],
    );
    const updated = updatedResult.rows[0];
    if (!updated) {
      throw new Error('World boss event could not be updated.');
    }

    await client.query(
      `INSERT INTO admin_audit_logs (actor, action, target_type, target_id, before_value, after_value)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        actor,
        'world_boss.override',
        'world_boss_events',
        payload.event_id,
        JSON.stringify(existing),
        JSON.stringify(updated),
      ],
    );

    return {
      ok: true as const,
      event: toEventDto(updated),
      override_id: overrideResult.rows[0]?.id ?? null,
    };
  });
}

/* ------------------------------------------------------------------ */
/*  Admin write: Generate schedule                                    */
/* ------------------------------------------------------------------ */

export async function generateFutureWorldBossSchedule(
  limit = MAX_SCHEDULE_LIMIT,
): Promise<GenerateFutureScheduleResult> {
  const [anchors, settings] = await Promise.all([
    query<WorldBossAnchorRow>(
      `SELECT id, anchor_spawn_time_utc, anchor_boss, anchor_boss_slug, anchor_location_name,
              anchor_region, anchor_nearest_waypoint, interval_minutes, boss_rotation_index,
              location_rotation_index, season_version, algorithm_version, confidence_status, is_active
       FROM world_boss_anchors
       WHERE is_active = true
       LIMIT 1`,
    ),
    query<{ key: string; value: unknown }>(
      `SELECT key, value FROM world_boss_settings`,
    ),
  ]);
  const anchor = anchors[0];

  if (!anchor) {
    throw new Error('No active world boss anchor is configured.');
  }

  const plan = buildWorldBossGenerationPlan(anchor, settings, limit);
  if (plan.skipped || !plan.events.length) {
    return {
      ok: true,
      inserted_count: 0,
      generated_count: plan.events.length,
      skipped: plan.skipped,
      reason: plan.reason,
    };
  }

  const { values, params } = buildEventInsert(plan.events);

  const insertedRows = await query<{ id: string }>(
    `INSERT INTO world_boss_events
       (boss_name, boss_slug, spawn_time_utc, region, location_name, nearest_waypoint,
        waypoint_confidence, route_note, confidence_status, source_type,
        algorithm_version, season_version)
     VALUES ${values}
     ON CONFLICT (season_version, algorithm_version, spawn_time_utc) DO NOTHING
     RETURNING id`,
    params,
  );

  return {
    ok: true,
    inserted_count: insertedRows.length,
    generated_count: plan.events.length,
    skipped: false,
    reason: plan.reason,
  };
}

/* ------------------------------------------------------------------ */
/*  Admin write: Anchor reset                                         */
/* ------------------------------------------------------------------ */

export async function resetWorldBossAnchor(
  payload: AdminAnchorResetPayload,
): Promise<AdminAnchorResetResult> {
  const actor = payload.created_by ?? 'admin_api';
  const settings = await query<{ key: string; value: unknown }>(
    `SELECT key, value FROM world_boss_settings`,
  );

  const candidateAnchor: WorldBossAnchorRow = {
    id: 'pending-anchor',
    anchor_spawn_time_utc: payload.anchor_spawn_time_utc,
    anchor_boss: payload.anchor_boss,
    anchor_boss_slug: payload.anchor_boss_slug,
    anchor_location_name: payload.anchor_location_name,
    anchor_region: payload.anchor_region,
    anchor_nearest_waypoint: payload.anchor_nearest_waypoint,
    interval_minutes: payload.interval_minutes ?? 210,
    boss_rotation_index: payload.boss_rotation_index,
    location_rotation_index: payload.location_rotation_index,
    season_version: payload.season_version ?? 'current',
    algorithm_version: payload.algorithm_version ?? 'world-boss-v1',
    confidence_status: 'Confirmed',
    is_active: true,
  };

  const previewPlan = buildWorldBossGenerationPlan(
    candidateAnchor,
    settings,
    MAX_SCHEDULE_LIMIT,
    new Date(),
  );

  if (previewPlan.skipped) {
    throw new Error(previewPlan.reason ?? 'Schedule generation is disabled.');
  }

  return withTransaction(async (client) => {
    const previousAnchorsResult = await client.query<WorldBossAnchorRow>(
      `SELECT id, anchor_spawn_time_utc, anchor_boss, anchor_boss_slug, anchor_location_name,
              anchor_region, anchor_nearest_waypoint, interval_minutes, boss_rotation_index,
              location_rotation_index, season_version, algorithm_version, confidence_status, is_active
       FROM world_boss_anchors
       WHERE is_active = true
       FOR UPDATE`,
    );
    const previousAnchors = previousAnchorsResult.rows;

    const deactivatedResult = await client.query<{ id: string }>(
      `UPDATE world_boss_anchors SET is_active = false WHERE is_active = true RETURNING id`,
    );

    const insertedAnchors = await client.query<{ id: string }>(
      `INSERT INTO world_boss_anchors
         (anchor_spawn_time_utc, anchor_boss, anchor_boss_slug, anchor_location_name,
          anchor_region, anchor_nearest_waypoint, interval_minutes, boss_rotation_index,
          location_rotation_index, season_version, algorithm_version, confidence_status,
          is_active, source_note, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       RETURNING id`,
      [
        candidateAnchor.anchor_spawn_time_utc,
        candidateAnchor.anchor_boss,
        candidateAnchor.anchor_boss_slug,
        candidateAnchor.anchor_location_name,
        candidateAnchor.anchor_region,
        candidateAnchor.anchor_nearest_waypoint,
        candidateAnchor.interval_minutes,
        candidateAnchor.boss_rotation_index,
        candidateAnchor.location_rotation_index,
        candidateAnchor.season_version,
        candidateAnchor.algorithm_version,
        candidateAnchor.confidence_status,
        true,
        payload.source_note ?? null,
        actor,
      ],
    );
    const anchorId = insertedAnchors.rows[0]?.id;

    if (!anchorId) {
      throw new Error('World boss anchor could not be created.');
    }

    const currentTime = nowIso();

    const deletedAlgorithmEvents = await client.query<{ id: string }>(
      `SELECT id FROM world_boss_events
       WHERE spawn_time_utc > $1 AND source_type = 'algorithm' AND is_overridden = false`,
      [currentTime],
    );
    const deletedAlgorithmEventIds = deletedAlgorithmEvents.rows.map((event) => event.id);

    await client.query(
      `DELETE FROM world_boss_events
       WHERE spawn_time_utc > $1 AND source_type = 'algorithm' AND is_overridden = false`,
      [currentTime],
    );

    const { values: eventValues, params: eventParams } = buildEventInsert(previewPlan.events);

    const insertedRows = await client.query<{ id: string }>(
      `INSERT INTO world_boss_events
         (boss_name, boss_slug, spawn_time_utc, region, location_name, nearest_waypoint,
          waypoint_confidence, route_note, confidence_status, source_type,
          algorithm_version, season_version)
       VALUES ${eventValues}
       ON CONFLICT (season_version, algorithm_version, spawn_time_utc) DO NOTHING
       RETURNING id`,
      eventParams,
    );

    await client.query(
      `INSERT INTO admin_audit_logs (actor, action, target_type, target_id, before_value, after_value)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        actor,
        'world_boss.anchor_reset',
        'world_boss_anchors',
        anchorId,
        JSON.stringify({
          active_anchors: previousAnchors,
          deleted_future_algorithm_event_ids: deletedAlgorithmEventIds,
        }),
        JSON.stringify({
          anchor_id: anchorId,
          anchor_spawn_time_utc: candidateAnchor.anchor_spawn_time_utc,
          anchor_boss: candidateAnchor.anchor_boss,
          anchor_boss_slug: candidateAnchor.anchor_boss_slug,
          anchor_location_name: candidateAnchor.anchor_location_name,
          anchor_region: candidateAnchor.anchor_region,
          anchor_nearest_waypoint: candidateAnchor.anchor_nearest_waypoint,
          interval_minutes: candidateAnchor.interval_minutes,
          boss_rotation_index: candidateAnchor.boss_rotation_index,
          location_rotation_index: candidateAnchor.location_rotation_index,
          season_version: candidateAnchor.season_version,
          algorithm_version: candidateAnchor.algorithm_version,
          generated_count: previewPlan.events.length,
          inserted_count: insertedRows.rows.length,
        }),
      ],
    );

    return {
      ok: true as const,
      anchor_id: anchorId,
      deactivated_anchor_ids: deactivatedResult.rows.map((a) => a.id),
      deleted_algorithm_event_ids: deletedAlgorithmEventIds,
      generation: {
        ok: true,
        inserted_count: insertedRows.rows.length,
        generated_count: previewPlan.events.length,
        skipped: false,
        reason: previewPlan.reason,
      },
    };
  });
}

/* ------------------------------------------------------------------ */
/*  Admin read operations                                             */
/* ------------------------------------------------------------------ */

type WorldBossReportRow = {
  id: string;
  event_id: string | null;
  report_type: string;
  user_note: string | null;
  user_timezone: string | null;
  displayed_time: string | null;
  status: string;
  created_at: string | null;
};

export async function getAdminWorldBossEvents(limit = MAX_SCHEDULE_LIMIT) {
  const serverTime = nowIso();
  const safeLimit = Math.min(Math.max(limit, 1), MAX_SCHEDULE_LIMIT);
  const rows = await query<WorldBossEventRow>(
    `SELECT ${EVENT_COLUMNS}
     FROM world_boss_events
     WHERE spawn_time_utc > $1
     ORDER BY spawn_time_utc ASC
     LIMIT $2`,
    [serverTime, safeLimit],
  );

  return rows.map(toEventDto);
}

export async function getAdminWorldBossReports() {
  const rows = await query<WorldBossReportRow>(
    `SELECT id, event_id, report_type, user_note, user_timezone, displayed_time, status, created_at
     FROM world_boss_reports
     ORDER BY created_at DESC
     LIMIT 100`,
  );

  return rows.map((row): AdminWorldBossReportDto => ({
    id: row.id,
    event_id: row.event_id,
    report_type: row.report_type as ReportType,
    user_note: row.user_note,
    user_timezone: row.user_timezone,
    displayed_time: row.displayed_time,
    status: row.status as 'open' | 'resolved' | 'ignored',
    created_at: row.created_at,
  }));
}

export async function updateWorldBossReportStatus(
  reportId: string,
  status: 'open' | 'resolved' | 'ignored',
) {
  await withTransaction(async (client) => {
    await client.query(
      `UPDATE world_boss_reports SET status = $1 WHERE id = $2`,
      [status, reportId],
    );

    await client.query(
      `INSERT INTO admin_audit_logs (action, target_type, target_id, actor, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        'update_report_status',
        'world_boss_report',
        reportId,
        'admin_api',
        JSON.stringify({ new_status: status }),
      ],
    );
  });

  return { ok: true as const };
}

export async function getAdminAnnouncement() {
  const row = await queryOne<WorldBossSettingsRow>(
    `SELECT key, value FROM world_boss_settings WHERE key = 'announcement_message'`,
  );

  if (!row) {
    return { enabled: false, message: null };
  }

  return announcementFromRows([row]);
}

export async function updateAdminAnnouncement(
  enabled: boolean,
  message: string | null,
) {
  const newValue: AnnouncementSetting = { enabled, message: message || null };

  await execute(
    `UPDATE world_boss_settings SET value = $1 WHERE key = 'announcement_message'`,
    [JSON.stringify(newValue)],
  );

  return { ok: true as const };
}
