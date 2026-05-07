#!/usr/bin/env node
/**
 * D4 World Boss Timer — Neon database migration
 * Creates tables and seeds initial settings.
 *
 * Usage:  DATABASE_URL=... node scripts/migrate-neon.mjs
 */
import pg from 'pg';
const { Client } = pg;

const DDL_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS world_boss_settings (
    key  TEXT PRIMARY KEY,
    value JSONB NOT NULL DEFAULT '{}'
  )`,
  `CREATE TABLE IF NOT EXISTS world_boss_anchors (
    id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    anchor_spawn_time_utc  TIMESTAMPTZ NOT NULL,
    anchor_boss            TEXT NOT NULL,
    anchor_boss_slug       TEXT,
    anchor_location_name   TEXT,
    anchor_region          TEXT,
    anchor_nearest_waypoint TEXT,
    interval_minutes       INTEGER NOT NULL DEFAULT 210,
    boss_rotation_index    INTEGER NOT NULL DEFAULT 0,
    location_rotation_index INTEGER NOT NULL DEFAULT 0,
    season_version         TEXT NOT NULL DEFAULT 'current',
    algorithm_version      TEXT NOT NULL DEFAULT 'world-boss-v1',
    confidence_status      TEXT NOT NULL DEFAULT 'Confirmed'
      CHECK (confidence_status IN ('Predicted', 'Confirmed', 'Needs verification')),
    is_active              BOOLEAN NOT NULL DEFAULT true,
    source_note            TEXT,
    created_by             TEXT DEFAULT 'admin_api',
    created_at             TIMESTAMPTZ DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS world_boss_events (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    boss_name            TEXT NOT NULL,
    boss_slug            TEXT NOT NULL,
    spawn_time_utc       TIMESTAMPTZ NOT NULL,
    region               TEXT,
    location_name        TEXT,
    nearest_waypoint     TEXT,
    waypoint_confidence  TEXT
      CHECK (waypoint_confidence IS NULL OR waypoint_confidence IN ('Confirmed', 'Suggested', 'Unconfirmed')),
    route_note           TEXT,
    confidence_status    TEXT NOT NULL DEFAULT 'Predicted'
      CHECK (confidence_status IN ('Predicted', 'Confirmed', 'Needs verification')),
    source_type          TEXT NOT NULL DEFAULT 'algorithm'
      CHECK (source_type IN ('algorithm', 'manual_override', 'report_verified')),
    is_overridden        BOOLEAN NOT NULL DEFAULT false,
    updated_at           TIMESTAMPTZ DEFAULT now(),
    algorithm_version    TEXT NOT NULL DEFAULT 'world-boss-v1',
    season_version       TEXT NOT NULL DEFAULT 'current',
    extra_location_note  TEXT,
    UNIQUE (season_version, algorithm_version, spawn_time_utc)
  )`,
  `CREATE TABLE IF NOT EXISTS world_boss_overrides (
    id                         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id                   UUID NOT NULL REFERENCES world_boss_events(id),
    override_spawn_time_utc    TIMESTAMPTZ,
    override_boss_name         TEXT,
    override_boss_slug         TEXT,
    override_location_name     TEXT,
    override_region            TEXT,
    override_nearest_waypoint  TEXT,
    override_waypoint_confidence TEXT
      CHECK (override_waypoint_confidence IS NULL OR override_waypoint_confidence IN ('Confirmed', 'Suggested', 'Unconfirmed')),
    override_route_note        TEXT,
    override_confidence_status TEXT
      CHECK (override_confidence_status IS NULL OR override_confidence_status IN ('Predicted', 'Confirmed', 'Needs verification')),
    override_reason            TEXT,
    created_by                 TEXT DEFAULT 'admin_api',
    expires_at                 TIMESTAMPTZ,
    created_at                 TIMESTAMPTZ DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS world_boss_reports (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id      UUID REFERENCES world_boss_events(id) ON DELETE SET NULL,
    report_type   TEXT NOT NULL
      CHECK (report_type IN ('wrong_time', 'wrong_boss', 'wrong_location', 'no_spawn', 'other')),
    user_note     TEXT,
    user_timezone TEXT,
    displayed_time TEXT,
    page_state    JSONB,
    status        TEXT NOT NULL DEFAULT 'open'
      CHECK (status IN ('open', 'reviewing', 'resolved', 'dismissed')),
    created_at    TIMESTAMPTZ DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS admin_audit_logs (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor        TEXT NOT NULL,
    action       TEXT NOT NULL,
    target_type  TEXT NOT NULL,
    target_id    TEXT NOT NULL,
    before_value JSONB,
    after_value  JSONB,
    details      JSONB,
    created_at   TIMESTAMPTZ DEFAULT now()
  )`,
];

const INDEX_STATEMENTS = [
  `CREATE INDEX IF NOT EXISTS idx_events_spawn_time ON world_boss_events (spawn_time_utc)`,
  `CREATE INDEX IF NOT EXISTS idx_events_confidence_status ON world_boss_events (confidence_status)`,
  `CREATE INDEX IF NOT EXISTS idx_events_source_type ON world_boss_events (source_type)`,
  `CREATE INDEX IF NOT EXISTS idx_anchors_is_active ON world_boss_anchors (is_active)`,
  `CREATE INDEX IF NOT EXISTS idx_reports_status ON world_boss_reports (status)`,
  `CREATE INDEX IF NOT EXISTS idx_reports_created_at ON world_boss_reports (created_at)`,
  `CREATE INDEX IF NOT EXISTS idx_overrides_event_id ON world_boss_overrides (event_id)`,
  `CREATE INDEX IF NOT EXISTS idx_audit_logs_target ON admin_audit_logs (target_type, target_id)`,
];

const SEED_STATEMENTS = [
  `INSERT INTO world_boss_settings (key, value) VALUES
    ('boss_pool', '[
      {"boss_name":"Ashava","boss_slug":"ashava"},
      {"boss_name":"Avarice","boss_slug":"avarice"},
      {"boss_name":"Wandering Death","boss_slug":"wandering-death"}
    ]'::jsonb),
    ('location_pool', '[
      {"location_name":"The Crucible","region":"Fractured Peaks","nearest_waypoint":"Yelesna","waypoint_confidence":"Confirmed","route_note":null},
      {"location_name":"Saraan Caldera","region":"Scosglen","nearest_waypoint":"Corbach","waypoint_confidence":"Confirmed","route_note":null},
      {"location_name":"Caen Alderwood","region":"Scosglen","nearest_waypoint":"Tirmair","waypoint_confidence":"Suggested","route_note":null},
      {"location_name":"Seared Basin","region":"Kehjistan","nearest_waypoint":"Iron Wolves Encampment","waypoint_confidence":"Confirmed","route_note":null},
      {"location_name":"Fields of Hatred","region":"Kehjistan","nearest_waypoint":"Alzuuda","waypoint_confidence":"Suggested","route_note":null},
      {"location_name":"Krannik Hold","region":"Hawezar","nearest_waypoint":"Wejinhani","waypoint_confidence":"Confirmed","route_note":null},
      {"location_name":"Crane Pool","region":"Hawezar","nearest_waypoint":"Backwater","waypoint_confidence":"Suggested","route_note":null},
      {"location_name":"Ruins of Rakhat Keep: Inner","region":"Nahantu","nearest_waypoint":"Zarbinzet","waypoint_confidence":"Suggested","route_note":null}
    ]'::jsonb),
    ('boss_rotation', '[
      {"boss_name":"Ashava","boss_slug":"ashava"},
      {"boss_name":"Avarice","boss_slug":"avarice"},
      {"boss_name":"Wandering Death","boss_slug":"wandering-death"}
    ]'::jsonb),
    ('location_rotation', '[
      {"location_name":"The Crucible","region":"Fractured Peaks","nearest_waypoint":"Yelesna","waypoint_confidence":"Confirmed"},
      {"location_name":"Saraan Caldera","region":"Scosglen","nearest_waypoint":"Corbach","waypoint_confidence":"Confirmed"},
      {"location_name":"Caen Alderwood","region":"Scosglen","nearest_waypoint":"Tirmair","waypoint_confidence":"Suggested"},
      {"location_name":"Seared Basin","region":"Kehjistan","nearest_waypoint":"Iron Wolves Encampment","waypoint_confidence":"Confirmed"},
      {"location_name":"Fields of Hatred","region":"Kehjistan","nearest_waypoint":"Alzuuda","waypoint_confidence":"Suggested"},
      {"location_name":"Krannik Hold","region":"Hawezar","nearest_waypoint":"Wejinhani","waypoint_confidence":"Confirmed"},
      {"location_name":"Crane Pool","region":"Hawezar","nearest_waypoint":"Backwater","waypoint_confidence":"Suggested"},
      {"location_name":"Ruins of Rakhat Keep: Inner","region":"Nahantu","nearest_waypoint":"Zarbinzet","waypoint_confidence":"Suggested"}
    ]'::jsonb),
    ('world_boss_algorithm', '{
      "interval_minutes":210,
      "algorithm_version":"world-boss-v1",
      "season_version":"current",
      "default_confidence_status":"Predicted"
    }'::jsonb),
    ('generation_control', '{"prediction_enabled":true}'::jsonb),
    ('nahantu_rule', '{"enabled":true}'::jsonb),
    ('announcement_message', '{"enabled":false,"message":null}'::jsonb)
  ON CONFLICT (key) DO NOTHING`,
];

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  await client.connect();
  console.log('Connected to Neon.');

  console.log('Creating tables...');
  for (const stmt of DDL_STATEMENTS) {
    await client.query(stmt);
  }
  console.log('Tables created.');

  console.log('Creating indexes...');
  for (const stmt of INDEX_STATEMENTS) {
    await client.query(stmt);
  }
  console.log('Indexes created.');

  console.log('Seeding settings...');
  for (const stmt of SEED_STATEMENTS) {
    await client.query(stmt);
  }
  console.log('Settings seeded (skipped if already present).');

  const tables = await client.query(
    "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename"
  );
  console.log('Tables:', tables.rows.map((r) => r.tablename).join(', '));

  const settings = await client.query('SELECT key FROM world_boss_settings ORDER BY key');
  console.log('Settings keys:', settings.rows.map((r) => r.key).join(', '));

  await client.end();
  console.log('Migration complete.');
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
