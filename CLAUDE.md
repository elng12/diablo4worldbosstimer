# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Diablo 4 World Boss Timer — a mobile-first, SEO-optimized Next.js web tool that answers "When and where is the next Diablo 4 world boss?" in under 3 seconds. Dark compact dashboard UI, not a game database or guide page.

## Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run lint         # ESLint
npm run typecheck    # TypeScript check (tsc --noEmit)
DATABASE_URL=... node scripts/migrate-neon.mjs  # Run DB migration + seed
```

No test framework is configured yet.

## Architecture

**Routing**: Root `/` redirects to `/diablo-4-world-boss-timer/`. The main page uses `force-dynamic` SSR — it fetches current world boss data server-side, then hydrates a client countdown.

**Data flow**: `/lib/worldBossData.ts` is the single data access layer. All API routes and the SSR page go through it. When `DATABASE_URL` is unset, every function falls back to mock data from `/data/worldBossMock.ts`.

**Database**: Neon PostgreSQL via the `pg` driver. Connection pooling in `/lib/neonDb.ts` (singleton `Pool`, max 5 connections). No ORM — raw parameterized queries throughout. Schema is in `scripts/migrate-neon.mjs`.

**Auth**: Two simple token-gate modules — `/lib/adminAuth.ts` (checks `ADMIN_API_TOKEN` via Bearer header) and `/lib/cronAuth.ts` (checks `CRON_SECRET` via Bearer or `x-cron-secret` header). No session system, no JWT.

**Schedule generation**: `/lib/worldBossSchedule.ts` contains `buildWorldBossGenerationPlan()` — a pure function that takes an anchor row + settings rows and returns generated events. The cron endpoint `/api/cron/world-boss/generate` calls `generateFutureWorldBossSchedule()` in worldBossData.ts, which reads the active anchor from `world_boss_anchors`, validates settings, and inserts events with `ON CONFLICT DO NOTHING` for idempotency.

**Admin mutations**: Override → inserts into `world_boss_overrides`, updates `world_boss_events`, writes `admin_audit_logs`. Anchor reset → deactivates old anchors, deletes future algorithm events (preserving overrides), inserts new anchor, regenerates schedule.

**Frontend**: Single large client component `WorldBossTimerPage` receives `initialCurrent` as a prop, then polls `/api/world-boss/current` on interval. Countdown is client-derived from `spawn_time_utc`. JSON-LD schemas (FAQPage, BreadcrumbList, WebApplication) are injected server-side.

## Key Contracts

- **Implementation Lock v1** (`D4-World-Boss-Timer-Project/02_Development/D4 World Boss Timer Implementation Lock v1.md`) is the source of truth when planning documents conflict.
- `WorldBossEventDto` in `types/worldBoss.ts` is the canonical event shape shared by mock data, API routes, and frontend.
- Unique constraint on events: `(season_version, algorithm_version, spawn_time_utc)`.
- Generated events are always `confidence_status: 'Predicted'`, `source_type: 'algorithm'`, `is_overridden: false`. Never default to Confirmed.
- Public APIs never expose `extra_location_note`.

## Environment Variables

- `DATABASE_URL` — Neon PostgreSQL connection string. When absent, all data functions return mock data.
- `ADMIN_API_TOKEN` — Required for `/api/admin/*` endpoints.
- `CRON_SECRET` — Required for `/api/cron/*` endpoints.
- `NEXT_PUBLIC_SITE_URL` — Used for canonical URLs and JSON-LD. Defaults to `https://example.com`.

## Database Tables

`world_boss_settings` (key-value JSONB), `world_boss_anchors` (one active at a time), `world_boss_events`, `world_boss_overrides`, `world_boss_reports`, `admin_audit_logs`.

## Design Constraints

- Mobile 360x640 first-screen must show: boss name, countdown, local spawn time, location, confidence status, Remind Me CTA — no scrolling required.
- Countdown uses `tabular-nums`, updates every second, never shows negative values, recalibrates on visibility change.
- Map is lazy-loaded only after user intent (click "View Map").
- Boss/location rotation comes from `world_boss_settings`, never hardcoded in frontend.
- Do not copy Helltides' layout, copywriting, visual style, or information hierarchy.
