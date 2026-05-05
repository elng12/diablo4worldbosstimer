# D4 World Boss Timer Implementation Lock v1

## 1. Purpose

This document locks the execution decisions for the first implementation pass of `/diablo-4-world-boss-timer/`.

When older planning documents conflict with this file, use this file as the implementation source of truth.

Primary execution strategy:

**Build the P0 frontend with shared mock data first, then connect the same contract to the real API, database, schedule generator, and admin flows.**

## 2. P0 Scope Lock

| Module | P0 decision | Notes |
|---|---|---|
| Next Boss Timer Card | Functional | Uses shared mock data first, then `GET /api/world-boss/current`. |
| Live Countdown | Functional | Derived on the client from `spawn_time_utc`; never returned as canonical API data. |
| Local Spawn Time | Functional | Derived on the client from UTC. |
| Upcoming Schedule | Functional | Show 8 future events by default. |
| Location Card | Functional | Text-first location, region, waypoint, route note; map stays lazy. |
| Accuracy Panel | Functional | Shows confidence, last updated, timezone, method note, and report entry. |
| Report Wrong Time | Functional | P0 supports submitting a report through API. |
| Reminder | UI entry + local interaction only | P0 opens a reminder panel and records user intent. Real browser notifications and iCal are P1. |
| Rewards / Loot | Static content only | P0 may show static reward notes/cards. No full loot database. |
| FAQ | Functional content | Visible FAQ is P0. FAQPage JSON-LD is P0. |
| BreadcrumbList JSON-LD | Functional SEO | P0 includes breadcrumb schema for the single page. |
| WebApplication JSON-LD | Functional SEO | P0 includes basic WebApplication schema. |
| Admin Override | Functional before production | P0 may build UI-first with mocks, but production launch requires override capability. |
| Reset Anchor | Functional before production | Production launch requires confirmed anchor reset flow. |
| Analytics | Lightweight P0 | Record core clicks and page view; provider can be swapped later. |

Deferred to P1:

- Real browser notification scheduling.
- Calendar / iCal export.
- Discord / Telegram alerts.
- PWA.
- Independent schedule and locations pages.
- Boss-specific pages and deep loot pages.

## 3. Shared API Contract

### 3.1 Canonical Event Shape

Use this shape for both mock data and real API responses:

```ts
export type ConfidenceStatus = 'Confirmed' | 'Predicted' | 'Needs verification';

export type SourceType = 'algorithm' | 'manual_override' | 'manual_seed';

export type WaypointConfidence = 'Confirmed' | 'Suggested' | 'Needs manual verification';

export interface WorldBossEventDto {
  event_id: string;
  boss_name: string;
  boss_slug: 'ashava' | 'avarice' | 'wandering-death' | string;
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
```

Frontend-derived fields:

- `spawn_time_local`
- `countdown_seconds`
- formatted countdown text
- formatted local date/time
- timezone label

Static asset mapping:

- `boss_image` is not required in the API.
- The frontend maps `boss_slug` to local assets or icons.

### 3.2 Current Event Response

```ts
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
```

Endpoint:

```text
GET /api/world-boss/current
```

Rules:

- Return the next event where `spawn_time_utc > now()`.
- Include up to 8 upcoming events for first-render convenience.
- Return UTC only; frontend converts to local time.
- Do not return negative countdown values.

### 3.3 Schedule Response

```ts
export interface WorldBossScheduleResponse {
  events: WorldBossEventDto[];
  generated_at: string;
  server_time_utc: string;
  limit: number;
  max_limit: number;
}
```

Endpoint:

```text
GET /api/world-boss/schedule?limit=8
```

Rules:

- Default `limit = 8`.
- Max `limit = 20`.
- Sort by `spawn_time_utc ASC`.
- If there are no future events, return `events: []` with HTTP 200 and a clear status from the current endpoint.

### 3.4 Report Request

```ts
export interface WorldBossReportPayload {
  event_id: string | null;
  report_type: 'Wrong time' | 'Wrong boss' | 'Wrong location' | 'Notification issue' | 'Other';
  user_note?: string;
  user_timezone?: string;
  displayed_time?: string;
  page_state?: Record<string, unknown>;
}
```

Endpoint:

```text
POST /api/world-boss/report
```

Rules:

- Public endpoint, but rate limited.
- Never changes public event data directly.
- Returns `{ ok: true, report_id: string }` on success.

### 3.5 Error Envelope

All API errors should use:

```ts
export interface ApiErrorResponse {
  ok: false;
  error: {
    code: string;
    message: string;
  };
}
```

## 4. Data Generation Contract

### 4.1 Required Settings Keys

`world_boss_settings` must include these keys before schedule generation can run:

```text
boss_pool
location_pool
boss_rotation
location_rotation
world_boss_algorithm
generation_control
nahantu_rule
announcement_message
```

Required `generation_control` shape:

```json
{
  "prediction_enabled": true,
  "reason": null
}
```

P0 rule:

- `boss_rotation` and `location_rotation` are required arrays.
- They may reference pool entries by slug/name, but the generator must resolve them before writing events.
- Do not hardcode rotation in frontend components.

### 4.2 Idempotent Event Generation

The schedule generator must be safe to run every 15 minutes.

Required uniqueness:

```text
season_version + algorithm_version + spawn_time_utc
```

Implementation rule:

- Insert missing future events.
- Update only non-overridden algorithm-generated future events.
- Never overwrite `source_type = manual_override`.
- Never overwrite `is_overridden = true`.
- Never mark generated future events as `Confirmed` by default.

Default generated event:

```text
confidence_status = Predicted
source_type = algorithm
is_overridden = false
```

### 4.3 Override Strategy

P0 source of truth:

**Read from `world_boss_events` only.**

When admin overrides a single event:

1. Insert a row into `world_boss_overrides` for history.
2. Update the target row in `world_boss_events`.
3. Set `is_overridden = true`.
4. Set `source_type = manual_override`.
5. Write an `admin_audit_logs` row.

Do not require the public Current/Schedule API to join `world_boss_overrides` in P0.

### 4.4 Launch Anchor Rule

Development seed may include a placeholder anchor only for local development.

Production rule:

- Do not ship executable SQL that contains `TO_BE_CONFIRMED_BEFORE_LAUNCH`.
- Do not mark `NOW() + INTERVAL '2 hours'` as a production `Confirmed` anchor.
- Production launch requires a manually confirmed UTC spawn time, boss, location, region, waypoint, boss rotation index, and location rotation index.

### 4.5 Nahantu Rule

P0 decision:

- Do not generate extra Nahantu events by default.
- `nahantu_rule.enabled` should be `false` unless manually verified.
- If enabled in P0, it may only affect advisory copy or confidence messaging, not create extra schedule rows.

## 5. Security Contract

Admin endpoints:

- Require `ADMIN_API_TOKEN` or authenticated Supabase admin session.
- Use Supabase service role only on the server.
- Never expose service role keys to the browser.
- Write audit logs for override, anchor reset, report resolution, and settings changes.

Cron endpoints:

- Require `CRON_SECRET`.
- Reject unauthenticated requests.

Public report endpoint:

- Validate payload.
- Limit note length.
- Rate limit by IP/session when possible.
- Do not trust client-sent `page_state`.

## 6. UI Acceptance Contract

### 6.1 Mobile First-Screen Target

Required test viewport:

```text
360x640
```

At `360x640`, the first viewport must show:

- Compact header or logo.
- Page title or compact timer title.
- Boss name.
- Countdown.
- Local spawn time.
- Location name and region.
- Confidence status.
- Primary `Remind Me` CTA.

Allowed within the first 120px below the first viewport:

- Nearest waypoint.
- Last updated.
- View Map CTA.
- Longer route note.

Rules:

- Hero intro may be shortened or visually de-emphasized on small mobile.
- Long location and waypoint text may wrap to two lines.
- Buttons may stack vertically if needed.
- Countdown uses tabular numbers and must not resize layout each second.

### 6.2 Required Frontend States

Mock UI must cover these states before real API integration:

- `Confirmed`
- `Predicted`
- `Needs verification`
- API loading
- Current API failed
- Schedule API failed
- No active anchor
- Event expired / checking next spawn
- Timezone detection failed
- Notification unsupported
- Notification permission denied
- Report submitted

### 6.3 Automated QA Baseline

Use Playwright or equivalent browser checks for:

- `360x640` first viewport visibility.
- Desktop two-column layout.
- Countdown updates once per second.
- Countdown recalibrates on visibility change.
- Countdown never shows a negative value.
- Map is not loaded before user intent.
- FAQ content is present in rendered HTML.
- One H1 only.
- No internal publishing notes appear in rendered page.

## 7. SEO and Content Lock

P0 SEO metadata:

```text
Title: Diablo 4 World Boss Timer – Next Spawn, Schedule & Locations
Meta: Track the next Diablo 4 world boss with a live countdown, local spawn time, schedule, locations, reminders, and reward notes before your next run starts.
```

Exact-match count rule:

- Count only public rendered page body and headings.
- Do not count title, meta tags, JSON-LD, comments, or internal publishing notes.
- Target public rendered body exact match count: 4-6.

P0 links:

- Use page anchors for schedule, locations, rewards, and FAQ until independent P1 pages exist.
- Replace anchors with real internal links after P1 pages launch.

Homepage copy rule:

- Public copy must be separated from publishing notes.
- Internal editing notes must never be rendered.

## 8. UI-First Build Order

1. Create shared TypeScript DTOs and mock data.
2. Build the P0 page shell with Tailwind and static mocked data.
3. Build Timer Card, Countdown, Location, Accuracy, Schedule, Reminder entry, Report form, FAQ, and Disclaimer states.
4. Run mobile first-screen visual QA at `360x640`.
5. Add SEO metadata and JSON-LD.
6. Add route handlers with mocked responses matching the final contract.
7. Implement database schema and seed, including rotation settings.
8. Implement idempotent schedule generation.
9. Connect current and schedule APIs to real data.
10. Implement report API.
11. Implement admin override and reset anchor.
12. Replace mock data with API data in the page.
13. Run frontend, API, SEO, and launch QA.

## 9. Definition of Ready for Production Launch

The project is ready for production launch only when:

- P0 page passes `360x640` first-screen QA.
- Public API responses match this contract.
- Future 20 events are generated from a confirmed production anchor.
- Generated events are idempotent and not duplicated by cron.
- Admin can override a wrong event.
- Admin can reset anchor.
- Reports can be submitted and reviewed.
- Homepage copy excludes internal publishing notes.
- FAQPage, BreadcrumbList, and WebApplication JSON-LD are present.
- Sitemap and robots are present.
- Production anchor has been manually verified.
