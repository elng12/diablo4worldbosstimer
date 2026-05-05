# Anchor Reset Report

Date: 2026-05-05

## Scope

Implemented the Admin Reset Anchor endpoint:

- `POST /api/admin/world-boss/anchor`

## Files

- `app/api/admin/world-boss/anchor/route.ts`
- `lib/worldBossData.ts`
- `lib/supabaseRest.ts`

## Behavior

- Requires `ADMIN_API_TOKEN`.
- Validates JSON before touching the database.
- Rejects missing manually confirmed anchor fields.
- Rejects `TO_BE_CONFIRMED_BEFORE_LAUNCH`.
- Requires a valid ISO `anchor_spawn_time_utc`.
- Requires `boss_rotation_index` and `location_rotation_index`.
- Pre-checks generation settings before mutating active anchors.
- Closes existing active anchors.
- Inserts a new `Confirmed` active anchor.
- Deletes only future generated events where:
  - `source_type = algorithm`
  - `is_overridden = false`
  - `spawn_time_utc > now`
- Preserves manual override rows.
- Inserts the next 20 generated events from the new anchor.
- Uses `on_conflict=season_version,algorithm_version,spawn_time_utc` with duplicate-ignore semantics.
- Writes `admin_audit_logs` with previous active anchors, deleted generated event ids, and new anchor/generation counts.

## Smoke Results

Passed:

- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `POST /api/admin/world-boss/anchor` without token returns 401.
- `POST /api/admin/world-boss/anchor` with invalid timestamp returns 400.
- `POST /api/admin/world-boss/anchor` with `TO_BE_CONFIRMED_BEFORE_LAUNCH` returns 400.
- `POST /api/admin/world-boss/anchor` with valid payload but no Supabase service role returns 503.

## Remaining Next Steps

- Add Admin MVP UI to manage:
  - future 20 events
  - single-event overrides
  - anchor reset
  - reports
  - announcement message
- Configure staging Supabase credentials and run a live reset-anchor smoke test against disposable data.
