# D4 World Boss Timer Database Schema & Seed v1

## 1. Purpose
This document defines the first PostgreSQL / Supabase database schema and seed data for the **D4 World Boss Timer** MVP.

## 2. Core Decisions
| Item | Decision |
|---|---|
| Default interval | 210 minutes / 3.5 hours |
| First anchor | Must be manually confirmed before launch |
| Generated future events | Default to `Predicted` |
| Confirmed events | Only after manual review or admin correction |
| Boss rotation | Configurable in settings, not hardcoded in frontend |
| Location rotation | Configurable in settings, not hardcoded in frontend |
| Nahantu rule | Configurable and optional |
| Competitor data | Manual QA reference only |

## 3. Required PostgreSQL Extensions
```sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

## 4. Database Schema

### 4.1 Drop Existing Tables for Local Reset
```sql
DROP TABLE IF EXISTS admin_audit_logs CASCADE;
DROP TABLE IF EXISTS world_boss_reports CASCADE;
DROP TABLE IF EXISTS world_boss_overrides CASCADE;
DROP TABLE IF EXISTS world_boss_events CASCADE;
DROP TABLE IF EXISTS world_boss_anchors CASCADE;
DROP TABLE IF EXISTS world_boss_settings CASCADE;
```

### 4.2 `world_boss_settings`
```sql
CREATE TABLE world_boss_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by TEXT
);

CREATE INDEX idx_world_boss_settings_key ON world_boss_settings (key);
```

### 4.3 `world_boss_anchors`
```sql
CREATE TABLE world_boss_anchors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anchor_spawn_time_utc TIMESTAMPTZ NOT NULL,
  anchor_boss TEXT NOT NULL,
  anchor_boss_slug TEXT,
  anchor_location_name TEXT,
  anchor_region TEXT,
  anchor_nearest_waypoint TEXT,
  interval_minutes INTEGER NOT NULL DEFAULT 210,
  boss_rotation_index INTEGER DEFAULT 0,
  location_rotation_index INTEGER DEFAULT 0,
  season_version TEXT,
  algorithm_version TEXT NOT NULL DEFAULT 'world-boss-v1',
  confidence_status TEXT NOT NULL CHECK (confidence_status IN ('Confirmed', 'Predicted', 'Needs verification')),
  is_active BOOLEAN DEFAULT FALSE,
  source_note TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_world_boss_anchors_active ON world_boss_anchors (is_active);
CREATE INDEX idx_world_boss_anchors_spawn_time ON world_boss_anchors (anchor_spawn_time_utc);

CREATE UNIQUE INDEX unique_active_world_boss_anchor
ON world_boss_anchors (is_active)
WHERE is_active = true;
```

### 4.4 `world_boss_events`
```sql
CREATE TABLE world_boss_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boss_name TEXT NOT NULL,
  boss_slug TEXT NOT NULL,
  spawn_time_utc TIMESTAMPTZ NOT NULL,
  region TEXT,
  location_name TEXT,
  nearest_waypoint TEXT,
  waypoint_confidence TEXT CHECK (waypoint_confidence IN ('Confirmed', 'Suggested', 'Needs manual verification')),
  route_note TEXT,
  confidence_status TEXT NOT NULL CHECK (confidence_status IN ('Confirmed', 'Predicted', 'Needs verification')),
  source_type TEXT NOT NULL CHECK (source_type IN ('algorithm', 'manual_override', 'manual_seed')),
  algorithm_version TEXT,
  season_version TEXT,
  is_overridden BOOLEAN DEFAULT FALSE,
  extra_location_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_world_boss_events_spawn_time ON world_boss_events (spawn_time_utc);
CREATE INDEX idx_world_boss_events_confidence ON world_boss_events (confidence_status);
CREATE INDEX idx_world_boss_events_boss_slug ON world_boss_events (boss_slug);
CREATE INDEX idx_world_boss_events_location ON world_boss_events (location_name);
CREATE INDEX idx_world_boss_events_source_type ON world_boss_events (source_type);

-- Idempotency: prevent duplicate events from cron re-runs
CREATE UNIQUE INDEX unique_event_generation_key
ON world_boss_events (season_version, algorithm_version, spawn_time_utc);
```

### 4.5 `world_boss_overrides`
```sql
CREATE TABLE world_boss_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES world_boss_events(id) ON DELETE CASCADE,
  override_spawn_time_utc TIMESTAMPTZ,
  override_boss_name TEXT,
  override_boss_slug TEXT,
  override_location_name TEXT,
  override_region TEXT,
  override_nearest_waypoint TEXT,
  override_waypoint_confidence TEXT CHECK (override_waypoint_confidence IN ('Confirmed', 'Suggested', 'Needs manual verification')),
  override_route_note TEXT,
  override_confidence_status TEXT CHECK (override_confidence_status IN ('Confirmed', 'Predicted', 'Needs verification')),
  override_reason TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX idx_world_boss_overrides_event_id ON world_boss_overrides (event_id);
CREATE INDEX idx_world_boss_overrides_expires_at ON world_boss_overrides (expires_at);
```

### 4.6 `world_boss_reports`
```sql
CREATE TABLE world_boss_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES world_boss_events(id) ON DELETE SET NULL,
  report_type TEXT NOT NULL CHECK (report_type IN ('Wrong time', 'Wrong boss', 'Wrong location', 'Notification issue', 'Other')),
  user_note TEXT,
  user_timezone TEXT,
  displayed_time TEXT,
  page_state JSONB,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'reviewing', 'resolved', 'ignored')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT
);

CREATE INDEX idx_world_boss_reports_event_id ON world_boss_reports (event_id);
CREATE INDEX idx_world_boss_reports_status ON world_boss_reports (status);
CREATE INDEX idx_world_boss_reports_created_at ON world_boss_reports (created_at);
```

### 4.7 `admin_audit_logs`
```sql
CREATE TABLE admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor TEXT,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  before_value JSONB,
  after_value JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_admin_audit_logs_created_at ON admin_audit_logs (created_at);
CREATE INDEX idx_admin_audit_logs_action ON admin_audit_logs (action);
CREATE INDEX idx_admin_audit_logs_target ON admin_audit_logs (target_type, target_id);
```

## 5. Utility Trigger for `updated_at`
```sql
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_world_boss_events_updated_at
BEFORE UPDATE ON world_boss_events
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
```

## 6. Seed Data

### 6.1 Boss Pool
```sql
INSERT INTO world_boss_settings (key, value, updated_by)
VALUES (
  'boss_pool',
  '[
    { "boss_name": "Ashava", "boss_slug": "ashava", "full_name": "Ashava, the Pestilent" },
    { "boss_name": "Avarice", "boss_slug": "avarice", "full_name": "Avarice, the Gold Cursed" },
    { "boss_name": "Wandering Death", "boss_slug": "wandering-death", "full_name": "Wandering Death, Death Given Life" }
  ]'::jsonb,
  'seed'
)
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value,
    updated_at = NOW(),
    updated_by = EXCLUDED.updated_by;
```

### 6.2 Location Pool
```sql
INSERT INTO world_boss_settings (key, value, updated_by)
VALUES (
  'location_pool',
  '[
    { "location_name": "The Crucible", "region": "Fractured Peaks", "nearest_waypoint": "Yelesna", "waypoint_confidence": "Needs manual verification", "route_note": "Travel east from Yelesna and follow the arena road." },
    { "location_name": "Caen Adar", "region": "Scosglen", "nearest_waypoint": "Corbach", "waypoint_confidence": "Needs manual verification", "route_note": "Ride northwest from Corbach and enter the arena from the southern path." },
    { "location_name": "Saraan Caldera", "region": "Dry Steppes", "nearest_waypoint": null, "waypoint_confidence": "Needs manual verification", "route_note": "Approach from the closest unlocked Dry Steppes waypoint." },
    { "location_name": "Seared Basin", "region": "Kehjistan", "nearest_waypoint": null, "waypoint_confidence": "Needs manual verification", "route_note": null },
    { "location_name": "Fields of Desecration", "region": "Hawezar", "nearest_waypoint": null, "waypoint_confidence": "Needs manual verification", "route_note": null }
  ]'::jsonb,
  'seed'
)
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value,
    updated_at = NOW(),
    updated_by = EXCLUDED.updated_by;
```

> **Note:** `route_note` values above are public-facing DTO fields. Internal editing notes such as "Verify in game before publishing" must never appear in seed data. Actual values should be verified in-game before production launch.

### 6.3 Boss Rotation
```sql
INSERT INTO world_boss_settings (key, value, updated_by)
VALUES (
  'boss_rotation',
  '[
    { "boss_name": "Ashava", "boss_slug": "ashava" },
    { "boss_name": "Avarice", "boss_slug": "avarice" },
    { "boss_name": "Wandering Death", "boss_slug": "wandering-death" }
  ]'::jsonb,
  'seed'
)
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value,
    updated_at = NOW(),
    updated_by = EXCLUDED.updated_by;
```

### 6.4 Location Rotation
```sql
INSERT INTO world_boss_settings (key, value, updated_by)
VALUES (
  'location_rotation',
  '[
    { "location_name": "The Crucible", "region": "Fractured Peaks" },
    { "location_name": "Caen Adar", "region": "Scosglen" },
    { "location_name": "Saraan Caldera", "region": "Dry Steppes" },
    { "location_name": "Seared Basin", "region": "Kehjistan" },
    { "location_name": "Fields of Desecration", "region": "Hawezar" }
  ]'::jsonb,
  'seed'
)
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value,
    updated_at = NOW(),
    updated_by = EXCLUDED.updated_by;
```

### 6.5 Generation Control
```sql
INSERT INTO world_boss_settings (key, value, updated_by)
VALUES (
  'generation_control',
  '{ "prediction_enabled": true, "reason": null }'::jsonb,
  'seed'
)
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value,
    updated_at = NOW(),
    updated_by = EXCLUDED.updated_by;
```

### 6.6 Other Settings
```sql
INSERT INTO world_boss_settings (key, value, updated_by)
VALUES
(
  'world_boss_algorithm',
  '{ "interval_minutes": 210, "algorithm_version": "world-boss-v1", "season_version": "current", "default_confidence_status": "Predicted" }'::jsonb,
  'seed'
),
(
  'nahantu_rule',
  '{ "enabled": false, "frequency": 4, "confidence": "Needs verification", "note": "Do not generate extra Nahantu events by default. Enable only after manual verification." }'::jsonb,
  'seed'
),
(
  'announcement_message',
  '{ "enabled": false, "message": null }'::jsonb,
  'seed'
)
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value,
    updated_at = NOW(),
    updated_by = EXCLUDED.updated_by;
```

> **Note on `generation_control`:** When `prediction_enabled = false`, the schedule generator must stop and not produce new events. This is the kill switch for schedule generation. See Implementation Lock §4.1.

## 7. Launch Anchor
### Development Placeholder Anchor
```sql
INSERT INTO world_boss_anchors (
  anchor_spawn_time_utc,
  anchor_boss,
  anchor_boss_slug,
  anchor_location_name,
  anchor_region,
  anchor_nearest_waypoint,
  interval_minutes,
  boss_rotation_index,
  location_rotation_index,
  season_version,
  algorithm_version,
  confidence_status,
  is_active,
  source_note,
  created_by
)
VALUES (
  NOW() + INTERVAL '2 hours',
  'Ashava',
  'ashava',
  'The Crucible',
  'Fractured Peaks',
  'Yelesna',
  210,
  0,
  0,
  'current',
  'world-boss-v1',
  'Confirmed',
  true,
  'development placeholder anchor - replace before production launch',
  'seed'
);
```

### Production Launch Anchor Template
```sql
UPDATE world_boss_anchors
SET is_active = false
WHERE is_active = true;

INSERT INTO world_boss_anchors (
  anchor_spawn_time_utc,
  anchor_boss,
  anchor_boss_slug,
  anchor_location_name,
  anchor_region,
  anchor_nearest_waypoint,
  interval_minutes,
  boss_rotation_index,
  location_rotation_index,
  season_version,
  algorithm_version,
  confidence_status,
  is_active,
  source_note,
  created_by
)
VALUES (
  'TO_BE_CONFIRMED_BEFORE_LAUNCH'::timestamptz,
  'TO_BE_CONFIRMED_BEFORE_LAUNCH',
  'TO_BE_CONFIRMED_BEFORE_LAUNCH',
  'TO_BE_CONFIRMED_BEFORE_LAUNCH',
  'TO_BE_CONFIRMED_BEFORE_LAUNCH',
  'TO_BE_CONFIRMED_BEFORE_LAUNCH',
  210,
  0,
  0,
  'current',
  'world-boss-v1',
  'Confirmed',
  true,
  'manual launch seed',
  'admin'
);
```

## 8. Example Queries
### Get Active Anchor
```sql
SELECT *
FROM world_boss_anchors
WHERE is_active = true
ORDER BY created_at DESC
LIMIT 1;
```

### Get Current Event
```sql
SELECT *
FROM world_boss_events
WHERE spawn_time_utc > NOW()
ORDER BY spawn_time_utc ASC
LIMIT 1;
```

### Get Future 8 Events
```sql
SELECT *
FROM world_boss_events
WHERE spawn_time_utc > NOW()
ORDER BY spawn_time_utc ASC
LIMIT 8;
```

### Mark Event as Needs Verification
```sql
UPDATE world_boss_events
SET confidence_status = 'Needs verification',
    updated_at = NOW()
WHERE id = '<event_id>';
```

## 9. Launch Checklist
Before production launch:
- Replace development placeholder anchor.
- Confirm UTC spawn time.
- Confirm Boss name.
- Confirm location and region.
- Confirm nearest waypoint or label it as Suggested.
- Confirm boss rotation index.
- Confirm location rotation index.
- Generate future 20 events.
- Check future 8 events manually.
- Verify all generated events default to Predicted.
- Confirm anchor is marked Confirmed.
- Confirm page shows Last Updated.
- Confirm admin can override an event.
- Confirm user can submit Report Wrong Time.

## 10. Notes for Developers
- Do not hardcode boss rotation or location rotation in frontend components.
- Always store event times in UTC.
- Convert to local time on the client.
- Do not show negative countdown values.
- Do not show `Confirmed` unless event has been manually verified.
- Use `Predicted` as default for generated future events.
- Use `Needs verification` when user reports or QA conflicts are detected.
- Helltides and other competitors are QA references only, not production data sources.

### API Field Mapping
The DB column `updated_at` maps to the DTO field `last_updated_at`. API route handlers MUST alias this column in queries:

```sql
SELECT …, updated_at AS last_updated_at FROM world_boss_events …;
```

### Admin-Internal Fields
`extra_location_note` in `world_boss_events` is for admin/internal use only. Public API responses (Current, Schedule) MUST NOT include this column. It is not part of the `WorldBossEventDto` contract.
