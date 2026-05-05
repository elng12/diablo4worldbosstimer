# D4 World Boss Timer Frontend UI Draft v1

## 1. Source of Truth

This draft is for the P0 frontend UI of `/diablo-4-world-boss-timer/`.

Implementation source of truth:

- `02_Development/D4 World Boss Timer Implementation Lock v1.md`

Supporting references:

- `06_UI/D4 World Boss Timer UI Plan v1.md`
- `05_Content/D4 World Boss Timer Homepage Copy v2.md`
- `01_PRD/D4 World Boss Timer PRD Short v1.md`

Conflict rule:

- If any reference conflicts with the Implementation Lock, follow the Implementation Lock.

Scope lock:

- Build a frontend UI draft only.
- Use mock data only.
- Do not build real backend, database, Supabase, Cron, admin, or production API logic.
- Mock data must match `WorldBossEventDto`, `CurrentEventResponse`, and `WorldBossScheduleResponse`.
- Page language is English.
- This is a compact timer tool page, not a landing page.
- Do not copy the Helltides page layout, visual hierarchy, map treatment, or copy structure.
- Do not load a large map in the first viewport. Map UI stays behind `View Map`.

Locked metadata:

- Title: `Diablo 4 World Boss Timer – Next Spawn, Schedule & Locations`
- Meta description: `Track the next Diablo 4 world boss with a live countdown, local spawn time, schedule, locations, reminders, and reward notes before your next run starts.`

## 2. Product UI Positioning

Design direction:

- Dark compact dashboard.
- Mobile-first timer tool.
- Near-black page background.
- Charcoal cards with restrained borders.
- Muted red primary CTA.
- Gold countdown accent.
- Green / amber / red confidence states.
- Tight radius, 8px maximum.
- Tabular countdown numbers.
- No heavy hero art.
- No first-viewport map.

Primary user question:

> When and where is the next Diablo 4 world boss, and can I trust the time?

The first viewport must answer:

- Next boss.
- Live countdown.
- Local spawn time.
- Location.
- Region.
- Confidence status.
- Last updated, where space allows.
- Primary `Remind Me` entry.

## 3. Mobile Layout

Required QA viewport:

```text
360x640
```

At 360x640, the first viewport must show:

- Compact header or logo.
- H1 or compact timer title.
- Boss name.
- Countdown.
- Local spawn time.
- Location name and region.
- Confidence status.
- Primary `Remind Me` CTA.

Allowed within the first 120px below the viewport:

- Nearest waypoint.
- Last updated.
- `View Map` CTA.
- Longer route note.

### 3.1 360x640 First-Viewport Wireframe

Approximate vertical allocation:

```text
0-44      Compact header
          D4 Boss Timer                         Menu

48-84     H1
          Diablo 4 World Boss Timer

92-560    Next World Boss Timer Card
          Next World Boss        Predicted chip
          Ashava

          02:29:58

          Spawns Today, 10:30 PM
          Your local time: America/New_York

          Caen Adar
          Scosglen

          Remind Me

560-640   Card lower metadata can begin here
          Suggested waypoint: Corbach
          Updated 2m ago

640-760   Within 120px after first viewport
          View Map
          Ride northwest from Corbach...
```

### 3.2 Mobile Page Order

Use a single-column layout:

1. Header.
2. H1.
3. Next World Boss Timer Card.
4. Collapsed or inline Reminder Panel entry.
5. Upcoming 8 World Boss schedule.
6. Current Location card.
7. Accuracy panel.
8. Static rewards / loot cards.
9. How the timer works.
10. FAQ section.
11. Disclaimer.

### 3.3 Mobile Timer Card Structure

Visible labels and copy:

```text
Next World Boss
Ashava
02:29:58
Spawns Today, 10:30 PM
Caen Adar, Scosglen
Predicted
Remind Me
```

Secondary details:

```text
Suggested waypoint: Corbach
Updated 2m ago
View Map
Report Wrong Time
```

Mobile behavior:

- `Remind Me` is a full-width primary button.
- `View Map` is secondary and may sit below `Remind Me`.
- `Report Wrong Time` is a text button or compact secondary button.
- Long location and waypoint values may wrap to two lines.
- Countdown uses fixed-width tabular numbers and must not shift every second.
- No hero intro paragraph in the first viewport on small mobile.
- Header nav collapses to a menu button or anchor list toggle.

## 4. Desktop Layout

Breakpoint target:

```text
>= 1024px
```

Use a constrained dashboard shell:

```text
Max width: 1180px
Page padding: 24px desktop, 16px mobile
```

### 4.1 Desktop First Screen Wireframe

```text
Header
Logo / World Boss Timer       Schedule  Locations  Rewards  FAQ       Remind Me

Main dashboard grid
Left column, 60-64%                         Right column, 36-40%

H1: Diablo 4 World Boss Timer               Upcoming World Boss Schedule
Short one-line utility copy                 8 compact schedule rows

Next World Boss Timer Card                  Row content:
- Boss name                                 - local time
- Countdown                                 - boss
- local spawn time                          - location / region
- location / region                         - confidence chip
- waypoint summary                          - remind icon/button
- confidence + updated
- Remind Me
- View Map
- Report Wrong Time
```

### 4.2 Desktop Below the Fold

```text
Two-column info grid
Left: Current Location card
Right: Accuracy panel

Rewards / Loot
3 compact cards: Ashava, Avarice, Wandering Death

How the Timer Works
Short crawlable content, no oversized marketing block

FAQ
Crawlable questions and answers

Disclaimer
```

Desktop behavior:

- Timer Card remains the strongest visual element.
- Upcoming Schedule is visible in the first desktop viewport but visually secondary.
- Accuracy summary appears inside Timer Card, with full details repeated in the Accuracy Panel below.
- Map remains hidden until `View Map` is clicked.
- Schedule may be a compact table or list; avoid a large decorative card wall.

## 5. Component Hierarchy

Recommended Next.js App Router hierarchy:

```text
app/diablo-4-world-boss-timer/page.tsx
  WorldBossPageShell
    HeaderNav
    MainToolGrid
      NextBossTimerCard
        ConfidenceBadge
        Countdown
        LocalSpawnTime
        LocationSummary
        ReminderEntry
        ViewMapButton
        ReportWrongTimeEntry
      UpcomingSchedule
        ScheduleEventRow | ScheduleEventCard
        ConfidenceBadge
        MiniReminderButton
    LocationAndAccuracyGrid
      CurrentLocationCard
        LazyMapPanel
      AccuracyPanel
        ConfidenceExplainer
        LastUpdated
        TimezoneStatus
        MethodNote
        ReportWrongTimeEntry
    ReminderPanel
      ReminderLeadTimeOptions
      NotificationSupportState
      LocalIntentConfirmation
    ReportWrongTimeDialog
      ReportTypeSelect
      UserNoteField
      SubmitReportButton
      ReportSubmittedState
    RewardsCards
      RewardCard
    HowTimerWorksSection
    FAQSection
    Disclaimer
    JsonLdSchemas
      FAQPage
      BreadcrumbList
      WebApplication
```

Client components:

- `Countdown`.
- `ReminderPanel`.
- `ReportWrongTimeDialog`.
- `LazyMapPanel`.
- Any retry button that calls mocked fetch functions.

Server-rendered or static components:

- Header.
- Initial timer data shell.
- Schedule HTML.
- Rewards.
- How it works.
- FAQ.
- Disclaimer.
- JSON-LD.

## 6. Design Tokens

### 6.1 Color Tokens

```css
:root {
  --wb-bg-page: #0B0D12;
  --wb-bg-surface: #11141B;
  --wb-bg-card: #151922;
  --wb-bg-card-elevated: #1A1F2A;
  --wb-border-subtle: #252B36;
  --wb-border-strong: #2A2F3A;

  --wb-text-primary: #F8FAFC;
  --wb-text-secondary: #A1A1AA;
  --wb-text-muted: #71717A;

  --wb-primary: #9F2B25;
  --wb-primary-hover: #B8322A;
  --wb-primary-active: #7F1D1D;

  --wb-accent-gold: #D6A84F;
  --wb-accent-gold-muted: #8F7138;

  --wb-confirmed: #22C55E;
  --wb-predicted: #F59E0B;
  --wb-needs-verification: #EF4444;

  --wb-focus: #D6A84F;
}
```

Usage notes:

- Page background uses `--wb-bg-page`.
- Cards use `--wb-bg-card`.
- Countdown uses `--wb-accent-gold`.
- Primary `Remind Me` uses muted red.
- Confidence states use green / amber / red, with text labels always present.
- Avoid full-page gradients and decorative orbs.

### 6.2 Typography Tokens

Use a system font stack. Do not require external font loading for P0.

```css
:root {
  --wb-font-sans: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --wb-font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;

  --wb-text-xs: 12px;
  --wb-text-sm: 14px;
  --wb-text-md: 16px;
  --wb-text-lg: 18px;
  --wb-text-xl: 22px;
  --wb-text-h1-mobile: 24px;
  --wb-text-h1-desktop: 34px;
  --wb-text-countdown-mobile: 48px;
  --wb-text-countdown-desktop: 64px;
}
```

Countdown CSS:

```css
.countdown {
  font-family: var(--wb-font-mono);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0;
  line-height: 0.95;
}
```

### 6.3 Spacing, Radius, Layout

```css
:root {
  --wb-space-1: 4px;
  --wb-space-2: 8px;
  --wb-space-3: 12px;
  --wb-space-4: 16px;
  --wb-space-5: 20px;
  --wb-space-6: 24px;
  --wb-space-8: 32px;

  --wb-radius-sm: 4px;
  --wb-radius-md: 6px;
  --wb-radius-lg: 8px;

  --wb-shell-max: 1180px;
  --wb-card-border: 1px solid var(--wb-border-subtle);
}
```

Rules:

- Cards: 6px or 8px radius.
- Buttons: 6px radius.
- Pills / badges: 999px radius is acceptable for small status chips only.
- No cards inside cards.
- No oversized hero section.
- Use dense but readable spacing.

### 6.4 Motion Tokens

```css
:root {
  --wb-ease-standard: cubic-bezier(0.2, 0, 0, 1);
  --wb-duration-fast: 120ms;
  --wb-duration-standard: 180ms;
}
```

Motion usage:

- Button hover: color shift only.
- Panel open: short opacity/height transition.
- Countdown does not animate every second.
- Respect `prefers-reduced-motion`.

## 7. P0 Interaction States

| State | Trigger / source | UI treatment | Required actions |
|---|---|---|---|
| Confirmed | `confidence_status = "Confirmed"` | Green chip: `Confirmed`; method note says manually reviewed or corrected. | Keep `Report Wrong Time` available but de-emphasized. |
| Predicted | `confidence_status = "Predicted"` | Amber chip: `Predicted`; copy: `Generated from the current rotation.` | Show last updated and report entry. |
| Needs verification | `confidence_status = "Needs verification"` or current status `needs_verification` | Red chip: `Needs verification`; add short warning below time. | Promote `Report Wrong Time`; keep reminder available but add caution copy. |
| API loading | Initial current or schedule mock fetch pending | Skeleton blocks for boss, countdown, time, and schedule rows; label `Loading next spawn...`. | Do not show fake countdown. |
| Current API failed | Current endpoint returns error envelope or network error | Timer Card error state: `Unable to load the next World Boss.` | Show `Retry`; if last known event exists, label it `Last known`. |
| Schedule API failed | Schedule endpoint fails but current event exists | Schedule panel error: `Upcoming schedule could not load.` | Show `Retry schedule`; keep Timer Card functional. |
| No active anchor | Current response `status = "no_active_anchor"` and `event = null` | Empty Timer Card: `Schedule anchor needs verification.` | Hide countdown; show UTC/server time if available; show report entry. |
| No future events | Current response `status = "no_future_events"` and upcoming empty | Empty schedule state: `No upcoming World Boss events are available yet.` | Show retry and accuracy note. |
| Event expired / checking next spawn | Client countdown reaches zero before fresh event arrives | Replace countdown with `Checking next World Boss spawn...`; never show negative numbers. | Re-fetch current mock; retain previous location with muted style until replaced. |
| Timezone detection failed | `Intl.DateTimeFormat().resolvedOptions().timeZone` unavailable or throws | Local time row becomes `UTC time shown`; warning chip `Timezone unavailable`. | Provide a compact timezone select placeholder for future implementation. |
| Notification unsupported | Browser lacks notification support or P0 mock says unsupported | Reminder panel disables browser notification option. | Confirm local reminder intent only; do not request permission. |
| Notification permission denied | Permission state is denied or mock state is denied | Warning inline: `Notifications are blocked in this browser.` | Keep reminder intent saved locally; suggest using a device alarm in copy. |
| Report submitted | Mock report returns `{ ok: true, report_id }` | Success banner: `Report submitted. Thanks - we will review this event.` | Close form after delay or keep `Submit another report`. |

## 8. Core Component Drafts

### 8.1 Header

Desktop:

```text
D4 Boss Timer     Schedule  Locations  Rewards  FAQ        Remind Me
```

Mobile:

```text
D4 Boss Timer                                      Menu
```

Notes:

- Header height: 40-48px mobile, 56px desktop.
- Use anchor links for `Schedule`, `Locations`, `Rewards`, and `FAQ` in P0.
- Primary nav CTA scrolls or opens the Reminder Panel.

### 8.2 Next World Boss Timer Card

Required fields:

- Boss name.
- Live countdown.
- Local spawn time.
- Current location.
- Region.
- Nearest waypoint.
- Confidence status.
- Last updated.
- `Remind Me`.
- `View Map`.
- `Report Wrong Time`.

Card layout:

```text
Next World Boss                         Predicted
Ashava

02:29:58

Spawns Today, 10:30 PM
Caen Adar, Scosglen
Suggested waypoint: Corbach
Updated 2m ago

Remind Me
View Map
Report Wrong Time
```

Desktop additions:

- Put `Remind Me` and `View Map` side by side.
- Keep `Report Wrong Time` as a lower-priority text action.
- Optional small boss emblem or icon may be mapped from `boss_slug`, but no heavy boss art is required.

### 8.3 Upcoming 8 World Boss Schedule

Desktop table columns:

```text
Time | Boss | Location | Region | Status | Remind
```

Mobile card fields:

```text
10:30 PM Today
Ashava
Caen Adar, Scosglen
Predicted
Remind
```

Rules:

- Show exactly 8 events from current response `upcoming` or schedule response `events`.
- Sort ascending by `spawn_time_utc`.
- Convert UTC to local time in the browser.
- If schedule API fails, keep the current timer card and show a schedule-only error state.

### 8.4 Current Location Card

Default state:

```text
Current Location
Caen Adar
Scosglen
Suggested waypoint: Corbach
Ride northwest from Corbach and enter the arena from the southern path.

View Map
```

Map behavior:

- `View Map` sets local UI state to `mapRequested = true`.
- Only after user intent should the map placeholder, image, iframe, or dynamic map module render.
- If map fails, keep all text directions visible.
- First viewport must not include a large map.

### 8.5 Accuracy Panel

Content:

```text
Timer Accuracy
Predicted
Generated from the current world boss rotation.
Updated 2m ago
Timezone: America/New_York
Source: algorithm
Algorithm: world-boss-v1
Season: S13

Report Wrong Time
```

Rules:

- Show status color and plain text together.
- Include `is_overridden` where relevant: `Manual override applied`.
- If `waypoint_confidence` is not `Confirmed`, label waypoint as `Suggested waypoint` or `Waypoint needs manual verification`.

### 8.6 Reminder Panel

P0 scope:

- UI entry and local interaction only.
- Records user intent in local state/local storage.
- Does not implement real browser notification scheduling.
- Does not implement iCal export.

Panel content:

```text
Remind Me
Choose when to be reminded before Ashava spawns.

5 min  15 min  30 min  60 min

Reminder saved for this browser session.
```

Notification states:

- Unsupported: disable browser notification row.
- Permission denied: show blocked state.
- Loading: show `Checking notification support...`.
- P0 success: `Reminder saved locally.`

### 8.7 Report Wrong Time Dialog

Fields:

- Report type:
  - Wrong time
  - Wrong boss
  - Wrong location
  - Notification issue
  - Other
- Optional note.
- Hidden/automatic page state:
  - `event_id`.
  - Displayed local time.
  - User timezone, if available.
  - Confidence status.

Success state:

```text
Report submitted. Thanks - we will review this event.
```

### 8.8 Rewards / Loot Cards

Static P0 content only:

- Ashava.
- Avarice.
- Wandering Death.

Each card:

- Grand Cache.
- Legendary gear.
- Cosmetics.
- Mount armor.
- Trophy.
- Seasonal reward note.
- Worth farming note.

Do not build a full loot database in P0.

### 8.9 FAQ and Disclaimer

FAQ:

- Must be crawlable in rendered HTML.
- Must match FAQPage JSON-LD.
- Use questions from Homepage Copy v2, trimmed if needed.

Disclaimer:

```text
This is an unofficial fan-made Diablo 4 tool. Diablo IV and related names, images, and assets belong to Blizzard Entertainment. This site is not affiliated with or endorsed by Blizzard Entertainment.
```

Do not render publishing notes.

## 9. Mock Data Assumptions

Mock data must be shared by frontend components and future mocked route handlers. Use a shared mock module, for example:

```text
types/worldBoss.ts
data/worldBossMock.ts
```

Rules:

- Mock events use the exact `WorldBossEventDto` fields from Implementation Lock.
- Mock current response uses the exact `CurrentEventResponse` shape.
- Mock schedule response uses the exact `WorldBossScheduleResponse` shape.
- `spawn_time_local`, `countdown_seconds`, formatted countdown text, and timezone labels are derived in the frontend.
- `boss_image` is not part of API data. If needed, map it locally from `boss_slug`.
- Do not hardcode production boss or location rotation inside presentational components.
- Use a dynamic mock time factory for development so events stay in the future.

Illustrative fixture only:

```ts
const MOCK_NOW_UTC = "2026-05-04T12:00:00.000Z";

export const mockCurrentResponse = {
  event: {
    event_id: "wb_mock_20260504_143000Z",
    boss_name: "Ashava",
    boss_slug: "ashava",
    spawn_time_utc: "2026-05-04T14:30:00.000Z",
    region: "Scosglen",
    location_name: "Caen Adar",
    nearest_waypoint: "Corbach",
    waypoint_confidence: "Suggested",
    route_note: "Ride northwest from Corbach and enter the arena from the southern path.",
    confidence_status: "Predicted",
    source_type: "algorithm",
    is_overridden: false,
    last_updated_at: "2026-05-04T12:02:00.000Z",
    algorithm_version: "world-boss-v1",
    season_version: "S13"
  },
  upcoming: [
    {
      event_id: "wb_mock_20260504_143000Z",
      boss_name: "Ashava",
      boss_slug: "ashava",
      spawn_time_utc: "2026-05-04T14:30:00.000Z",
      region: "Scosglen",
      location_name: "Caen Adar",
      nearest_waypoint: "Corbach",
      waypoint_confidence: "Suggested",
      route_note: "Ride northwest from Corbach and enter the arena from the southern path.",
      confidence_status: "Predicted",
      source_type: "algorithm",
      is_overridden: false,
      last_updated_at: "2026-05-04T12:02:00.000Z",
      algorithm_version: "world-boss-v1",
      season_version: "S13"
    },
    {
      event_id: "wb_mock_20260504_180000Z",
      boss_name: "Avarice",
      boss_slug: "avarice",
      spawn_time_utc: "2026-05-04T18:00:00.000Z",
      region: "Dry Steppes",
      location_name: "Saraan Caldera",
      nearest_waypoint: null,
      waypoint_confidence: "Needs manual verification",
      route_note: "Approach from the closest unlocked Dry Steppes waypoint.",
      confidence_status: "Predicted",
      source_type: "algorithm",
      is_overridden: false,
      last_updated_at: "2026-05-04T12:02:00.000Z",
      algorithm_version: "world-boss-v1",
      season_version: "S13"
    },
    {
      event_id: "wb_mock_20260504_213000Z",
      boss_name: "Wandering Death",
      boss_slug: "wandering-death",
      spawn_time_utc: "2026-05-04T21:30:00.000Z",
      region: "Fractured Peaks",
      location_name: "The Crucible",
      nearest_waypoint: "Yelesna",
      waypoint_confidence: "Confirmed",
      route_note: "Travel east from Yelesna and follow the arena road.",
      confidence_status: "Confirmed",
      source_type: "manual_override",
      is_overridden: true,
      last_updated_at: "2026-05-04T12:08:00.000Z",
      algorithm_version: "world-boss-v1",
      season_version: "S13"
    }
  ],
  server_time_utc: MOCK_NOW_UTC,
  generated_at: "2026-05-04T12:02:00.000Z",
  stale_after_seconds: 300,
  status: "ok",
  announcement: {
    enabled: false,
    message: null
  }
};
```

Schedule fixture:

- Use `events` from the same event array.
- Include exactly 8 future events by default.
- Return:

```ts
export const mockScheduleResponse = {
  events: mockUpcomingEightEvents,
  generated_at: "2026-05-04T12:02:00.000Z",
  server_time_utc: MOCK_NOW_UTC,
  limit: 8,
  max_limit: 20
};
```

Mock variants required for UI state QA:

- `confirmedCurrentResponse`.
- `predictedCurrentResponse`.
- `needsVerificationCurrentResponse`.
- `loadingState`.
- `currentApiFailedState`.
- `scheduleApiFailedState`.
- `noActiveAnchorResponse`.
- `eventExpiredCheckingState`.
- `timezoneFailedState`.
- `notificationUnsupportedState`.
- `notificationDeniedState`.
- `reportSubmittedState`.

## 10. Responsive Behavior Notes

Breakpoints:

```text
360-767px   Mobile single column.
768-1023px  Tablet single column with denser grids for rewards and schedule.
1024px+     Desktop two-column dashboard hero.
```

Mobile:

- Keep H1 short and visible.
- Hide long intro copy from first viewport.
- Timer Card appears before schedule.
- `Remind Me` full width.
- Schedule uses cards, not a squeezed table.
- `View Map` is below the main CTA.
- The map stays collapsed.

Tablet:

- Timer Card remains full width.
- Schedule can use two-column cards if space allows.
- Rewards can become a three-card grid at 768px if text fits.

Desktop:

- Timer Card and schedule share the first screen.
- Timer column is wider than schedule.
- Schedule can use a compact table/list.
- Location and Accuracy panels form a two-column grid.
- Rewards use three columns.

Text and layout stability:

- Do not scale font size with viewport width.
- Use explicit min/max widths and stable grid tracks.
- Countdown width should be stable with `ch` units or equivalent.
- Long location names wrap cleanly.
- Button text must not overflow at 360px.
- Countdown must never display negative values.

Lazy map:

- Initial state renders only text location details and a `View Map` button.
- On click, render a compact map panel below the location text.
- If the map fails, keep text directions and show `Map unavailable`.
- No map network request should happen before click/user intent.

## 11. P0 QA Checklist for the Draft

- At 360x640, first viewport shows header, title, boss, countdown, local time, location, region, confidence, and `Remind Me`.
- Nearest waypoint, last updated, `View Map`, and route note appear within 120px below the first viewport or earlier.
- Desktop uses a two-column dashboard, not a marketing hero.
- Countdown uses tabular numbers and recalibrates after visibility changes.
- Countdown never shows negative values.
- Map is lazy and not loaded before `View Map`.
- Current API failed and Schedule API failed are independent UI states.
- No active anchor and no future events states are distinct.
- Timezone detection failure falls back to UTC.
- Reminder states cover unsupported and permission denied without implementing real scheduling.
- Report form has a submitted state.
- FAQ is rendered as crawlable HTML.
- There is one H1: `Diablo 4 World Boss Timer`.
- Public body copy does not render internal publishing notes.
