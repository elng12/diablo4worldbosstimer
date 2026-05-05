# Prompt: Generate Diablo 4 World Boss Timer Frontend UI Draft

## Project Path
/Users/elng/web/diablo4worldbosstimer

## Priority Document (Conflict Resolution)
**If any document conflicts with the Implementation Lock, follow the Implementation Lock.**

/Users/elng/web/diablo4worldbosstimer/D4-World-Boss-Timer-Project/02_Development/D4 World Boss Timer Implementation Lock v1.md

## Reference Documents (in priority order)
1. /Users/elng/web/diablo4worldbosstimer/D4-World-Boss-Timer-Project/06_UI/D4 World Boss Timer Frontend UI Draft v1.md — **Most detailed UI spec: wireframes, design tokens, component hierarchy, interaction states, mock data fixtures. Use this as the primary UI implementation reference.**
2. /Users/elng/web/diablo4worldbosstimer/D4-World-Boss-Timer-Project/06_UI/D4 World Boss Timer UI Plan v1.md — UI direction, color/typography specs, component specs
3. /Users/elng/web/diablo4worldbosstimer/D4-World-Boss-Timer-Project/05_Content/D4 World Boss Timer Homepage Copy v2.md — Exact page copy, FAQ content, disclaimer text
4. /Users/elng/web/diablo4worldbosstimer/D4-World-Boss-Timer-Project/04_SEO/D4 World Boss Timer SEO Plan v1.md — **Heading hierarchy (H1/H2/H3 tree), keyword rules, JSON-LD requirements**
5. /Users/elng/web/diablo4worldbosstimer/D4-World-Boss-Timer-Project/04_SEO/D4 World Boss Timer SEO Metadata v1.md — **Locked meta tags (title 60 chars, description 153 chars, OG, Twitter)**
6. /Users/elng/web/diablo4worldbosstimer/D4-World-Boss-Timer-Project/04_SEO/D4 World Boss Timer SEO Metadata Sync Patch v1.md — Cross-document metadata sync source
7. /Users/elng/web/diablo4worldbosstimer/D4-World-Boss-Timer-Project/01_PRD/D4 World Boss Timer PRD Short v1.md — Product scope, acceptance criteria
8. /Users/elng/web/diablo4worldbosstimer/D4-World-Boss-Timer-Project/03_Data/D4 World Boss Timer Data Spec v1.md — Data strategy, schedule generation logic, confidence states
9. /Users/elng/web/diablo4worldbosstimer/D4-World-Boss-Timer-Project/05_Content/D4 World Boss Timer Content Brief v1.md — Keyword placement checklist (4-6 exact matches)

## TypeScript Type Priority Rule
**All TypeScript types and mock data MUST follow the Implementation Lock's DTOs:**
- `WorldBossEventDto` (Section 3.1)
- `CurrentEventResponse` (Section 3.2)
- `WorldBossScheduleResponse` (Section 3.3)
- `WorldBossReportPayload` (Section 3.4)
- `ApiErrorResponse` (Section 3.5)

**Known issue:** The Tech Stack document's `WorldBossEvent` interface is missing `waypoint_confidence` and `is_overridden`, and has incorrect nullability on several fields. Do NOT use the Tech Stack types as the type source. Only use Implementation Lock DTOs.

## Scope Rules
1. **Frontend UI draft only.** No backend, database, Supabase, Cron, admin UI, or production API logic.
2. **Use mock data only.** Mock data must match Implementation Lock DTOs exactly.
3. **Page language: English.**
4. **Target page: `/diablo-4-world-boss-timer/`**
5. **Do NOT copy Helltides' page layout, visual style, copywriting, map treatment, or information hierarchy.**
6. **This is a tool page, not a landing page.** The first viewport must directly answer: next boss, countdown, local time, location, accuracy status, Remind Me.
7. **Do not render internal publishing notes** from Homepage Copy v2. Only render public-facing copy.

## UI Direction
- Dark compact dashboard
- Mobile-first timer tool
- Near-black page background (#0B0D12)
- Charcoal cards (#151922) with subtle borders (#252B36)
- Muted red primary CTA (#9F2B25 / hover #B8322A / active #7F1D1D)
- Gold countdown accent (#D6A84F)
- Green / amber / red confidence states (#22C55E / #F59E0B / #EF4444)
- Tight radius: 8px max (cards 6-8px, buttons 6px, pills/badges 999px for small chips only)
- Tabular countdown numbers (font-variant-numeric: tabular-nums, monospace font)
- No heavy hero art, no full-page gradients, no decorative orbs
- No large map in first viewport. Map must be lazy / behind "View Map" button click.
- No cards inside cards
- System font stack only (no external font loading for P0)

## Design Tokens (from Frontend UI Draft v1, Section 6)

### Color Tokens
```
--wb-bg-page: #0B0D12
--wb-bg-surface: #11141B
--wb-bg-card: #151922
--wb-bg-card-elevated: #1A1F2A
--wb-border-subtle: #252B36
--wb-border-strong: #2A2F3A

--wb-text-primary: #F8FAFC
--wb-text-secondary: #A1A1AA
--wb-text-muted: #71717A

--wb-primary: #9F2B25
--wb-primary-hover: #B8322A
--wb-primary-active: #7F1D1D

--wb-accent-gold: #D6A84F
--wb-accent-gold-muted: #8F7138

--wb-confirmed: #22C55E
--wb-predicted: #F59E0B
--wb-needs-verification: #EF4444

--wb-focus: #D6A84F
```

### Typography Tokens
```
--wb-font-sans: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
--wb-font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace

--wb-text-xs: 12px
--wb-text-sm: 14px
--wb-text-md: 16px
--wb-text-lg: 18px
--wb-text-xl: 22px
--wb-text-h1-mobile: 24px
--wb-text-h1-desktop: 34px
--wb-text-countdown-mobile: 48px
--wb-text-countdown-desktop: 64px
```

### Spacing, Radius, Layout
```
--wb-space-1: 4px
--wb-space-2: 8px
--wb-space-3: 12px
--wb-space-4: 16px
--wb-space-5: 20px
--wb-space-6: 24px
--wb-space-8: 32px

--wb-radius-sm: 4px
--wb-radius-md: 6px
--wb-radius-lg: 8px

--wb-shell-max: 1180px
--wb-card-border: 1px solid var(--wb-border-subtle)

Page padding: 24px desktop, 16px mobile
```

### Motion Tokens
```
--wb-ease-standard: cubic-bezier(0.2, 0, 0, 1)
--wb-duration-fast: 120ms
--wb-duration-standard: 180ms
```

Motion rules:
- Button hover: color shift only
- Panel open: short opacity/height transition
- Countdown does NOT animate every second (digit swap only)
- Respect prefers-reduced-motion

## Mobile Layout (360x640 viewport)

### First Viewport Must Show (0-640px)
- Compact header (40-48px height)
- H1: "Diablo 4 World Boss Timer"
- Boss name
- Live countdown (48px, gold, tabular-nums, monospace)
- Local spawn time (e.g., "Spawns Today, 10:30 PM")
- Location name and region
- Confidence status badge (colored chip + text label)
- Primary "Remind Me" CTA (full-width button)

### Within 120px Below First Viewport (640-760px)
- Nearest waypoint (with waypoint_confidence label: "Suggested waypoint" or "Waypoint needs manual verification")
- Last updated (e.g., "Updated 2m ago")
- "View Map" CTA (secondary, below Remind Me)
- Route note if present

### Mobile Page Order (single column)
1. Header (compact: logo + menu button)
2. H1: Diablo 4 World Boss Timer
3. Next World Boss Timer Card
4. Reminder Panel entry (collapsed/inline)
5. Upcoming 8 World Boss schedule (card list, NOT table)
6. Current Location card
7. Accuracy panel
8. Static rewards / loot cards (3 cards stacked)
9. How the Timer Works section
10. FAQ section
11. Disclaimer
12. Footer

### Mobile-Specific Rules
- "Remind Me" is a full-width primary button
- "View Map" is secondary, sits below "Remind Me"
- "Report Wrong Time" is a text button or compact secondary button
- Long location and waypoint text may wrap to two lines
- Countdown uses fixed-width tabular numbers — must NOT shift layout each second
- No hero intro paragraph in the first viewport on small mobile
- Header nav collapses to a menu button
- Schedule uses cards, NOT a squeezed table
- Map stays collapsed behind "View Map"

## Desktop Layout (>=1024px)

### Constrained Dashboard Shell
- Max width: 1180px
- Page padding: 24px

### First Screen Wireframe
```
Header (56px)
Logo / World Boss Timer    Schedule  Locations  Rewards  FAQ    Remind Me

Main dashboard grid
Left column (60-64%)                          Right column (36-40%)

H1: Diablo 4 World Boss Timer                Upcoming World Boss Schedule
Short one-line utility copy                  8 compact schedule rows

Next World Boss Timer Card                   Row content:
- Boss name                                  - local time
- Countdown (64px, gold)                     - boss
- Local spawn time                           - location / region
- Location / region                          - confidence chip
- Waypoint summary                           - remind icon/button
- Confidence + updated
- Remind Me + View Map (side by side)
- Report Wrong Time (text action)
```

### Below the Fold
```
Two-column info grid
Left: Current Location card (text + lazy map)
Right: Accuracy panel

Rewards / Loot
3 compact cards in a row: Ashava, Avarice, Wandering Death

How the Timer Works
Short crawlable content, no oversized marketing block

FAQ
Crawlable questions and answers

Disclaimer

Footer
```

### Desktop-Specific Rules
- Timer Card is the strongest visual element
- Upcoming Schedule is visible in first desktop viewport but visually secondary
- Accuracy summary appears inside Timer Card, with full details in Accuracy Panel below
- Map remains hidden until "View Map" is clicked
- Schedule may use compact table/list (not a large decorative card wall)
- "Remind Me" and "View Map" side by side
- "Report Wrong Time" as lower-priority text action
- Location and Accuracy panels form a two-column grid
- Rewards use three columns

## Responsive Breakpoints
```
360-767px   Mobile: single column
768-1023px  Tablet: single column with denser grids for rewards and schedule
1024px+     Desktop: two-column dashboard hero
```

Tablet specifics:
- Timer Card remains full width
- Schedule can use two-column cards if space allows
- Rewards can become a three-card grid at 768px if text fits

## Component Hierarchy
```
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
    AnnouncementBanner          [NEW — see gap supplements below]
    ReminderPanel
      ReminderLeadTimeOptions
      NotificationSupportState
      LocalIntentConfirmation
    ReportWrongTimeDialog
      ReportTypeSelect
      UserNoteField
      SubmitReportButton
      ReportSubmittedState
      ReportErrorState          [NEW — see gap supplements below]
    RewardsCards
      RewardCard
    HowTimerWorksSection
    FAQSection
    Disclaimer
    JsonLdSchemas
      FAQPage
      BreadcrumbList
      WebApplication
    Footer
```

### Client vs Server Components
**Client components (require 'use client'):**
- Countdown (interval timer, visibility change listener)
- ReminderPanel (local state, notification permission)
- ReportWrongTimeDialog (form state, submission)
- LazyMapPanel (lazy loading trigger)
- Any retry button that calls mocked fetch functions

**Server-rendered or static components:**
- Header
- Initial timer data shell
- Schedule HTML
- Rewards cards
- How it works section
- FAQ section
- Disclaimer
- JSON-LD schemas
- Homepage copy sections

## P0 Interaction States

| State | Trigger / Source | UI Treatment | Required Actions |
|---|---|---|---|
| Confirmed | `confidence_status = "Confirmed"` | Green chip: "Confirmed"; method note says manually reviewed or corrected | Keep "Report Wrong Time" available but de-emphasized |
| Predicted | `confidence_status = "Predicted"` | Amber chip: "Predicted"; copy: "Generated from the current rotation." | Show last updated and report entry |
| Needs verification | `confidence_status = "Needs verification"` or current status `needs_verification` | Red chip: "Needs verification"; add short warning below time | Promote "Report Wrong Time"; keep reminder available but add caution copy |
| API loading | Initial current or schedule mock fetch pending | Skeleton blocks for boss, countdown, time, and schedule rows; label "Loading next spawn..." | Do NOT show fake countdown |
| Current API failed | Current endpoint returns error envelope or network error | Timer Card error state: "Unable to load the next World Boss." | Show "Retry"; if last known event exists, label it "Last known" |
| Schedule API failed | Schedule endpoint fails but current event exists | Schedule panel error: "Upcoming schedule could not load." | Show "Retry schedule"; keep Timer Card functional |
| No active anchor | Current response `status = "no_active_anchor"` and `event = null` | Empty Timer Card: "Schedule anchor needs verification." | Hide countdown; show UTC/server time if available; show report entry |
| No future events | Current response `status = "no_future_events"` and upcoming empty | Empty schedule state: "No upcoming World Boss events are available yet." | Show retry and accuracy note |
| Event expired / checking next spawn | Client countdown reaches zero before fresh event arrives | Replace countdown with "Checking next World Boss spawn..."; NEVER show negative numbers | Re-fetch current mock; retain previous location with muted style until replaced |
| Timezone detection failed | `Intl.DateTimeFormat().resolvedOptions().timeZone` unavailable or throws | Local time row becomes "UTC time shown"; warning chip "Timezone unavailable" | Provide a compact timezone select placeholder for future implementation |
| Notification unsupported | Browser lacks notification support or P0 mock says unsupported | Reminder panel disables browser notification option | Confirm local reminder intent only; do not request permission |
| Notification permission denied | Permission state is denied or mock state is denied | Warning inline: "Notifications are blocked in this browser." | Keep reminder intent saved locally; suggest using a device alarm in copy |
| Report submitted | Mock report returns `{ ok: true, report_id }` | Success banner: "Report submitted. Thanks — we will review this event." | Close form after delay or keep "Submit another report" |
| Stale data | Client-side timer exceeds `stale_after_seconds` since last fetch | Show subtle "Data may be outdated" indicator near last updated | Auto-retry fetch or show "Refresh" button |
| Announcement active | `announcement.enabled = true` | Show announcement banner below header with `announcement.message` text | Dismissible or persistent depending on severity |

## Gap Supplements (not defined in existing documents, design these in the draft)

### 1. Announcement Banner
- Position: below header, above main content
- When `announcement.enabled = true`, render a compact banner with `announcement.message`
- Style: elevated background, subtle border, dismissible if appropriate
- This corresponds to the `announcement` field in `CurrentEventResponse`

### 2. Stale Data Indicator
- When client-side time exceeds `stale_after_seconds` since `generated_at`, show a subtle "Data may be outdated" label near the "Updated X ago" text
- Provide a "Refresh" action or auto-retry

### 3. Accessibility Requirements
- All interactive elements must be keyboard accessible
- Countdown must have an aria-live region for screen readers (announce time changes at reasonable intervals, not every second)
- Report dialog must trap focus when open, return focus on close
- Confidence status badges must have accessible labels (not color-only)
- Map lazy load button must announce state changes
- Form fields must have associated labels
- Color contrast must meet WCAG 2.1 AA (4.5:1 for normal text, 3:1 for large text)

### 4. Mobile Menu
- Hamburger/menu button opens a slide-down or slide-in panel
- Contains: Schedule, Locations, Rewards, FAQ, Remind Me (anchor links)
- Close on outside tap or explicit close button
- Focus trap when open
- No heavy animation — short duration standard ease

### 5. Report Dialog Error States
- Validation: report type is required, user note max 500 characters
- API failure: show "Failed to submit report. Please try again." with retry
- Network error: same as API failure

### 6. Analytics Events (lightweight P0)
At minimum, fire these events:
- `view_timer_page` — on page load
- `return_visit_timer_page` — on page load with existing local storage flag
- `click_remind_me` — on Remind Me button click
- `select_reminder_Xmin` — on reminder time selection (5/15/30/60)
- `click_view_map` — on View Map click
- `expand_schedule` — on schedule interaction
- `click_report_wrong_time` — on Report Wrong Time click
- `submit_error_report` — on successful report submission
- `faq_expand` — on FAQ item expand

Implementation: use a simple event helper function. Provider can be swapped later.

### 7. Countdown Recalibration
- On `visibilitychange` event (page becomes visible after hidden): recalculate countdown from `spawn_time_utc` vs current time
- If countdown has reached zero, trigger re-fetch of current event
- Debounce: do not re-fetch more than once per 5 seconds
- Never show negative countdown values

## SEO Requirements (from SEO Plan v1 and SEO Metadata v1)

### Locked Meta Tags
```html
<title>Diablo 4 World Boss Timer – Next Spawn, Schedule & Locations</title>
<meta name="description" content="Track the next Diablo 4 world boss with a live countdown, local spawn time, schedule, locations, reminders, and reward notes before your next run starts." />

<meta property="og:title" content="Diablo 4 World Boss Timer – Next Spawn, Schedule & Locations" />
<meta property="og:description" content="Track the next Diablo 4 world boss with a live countdown, local spawn time, schedule, locations, reminders, and reward notes before your next run starts." />

<meta name="twitter:title" content="Diablo 4 World Boss Timer – Next Spawn, Schedule & Locations" />
<meta name="twitter:description" content="Track the next Diablo 4 world boss with a live countdown, local spawn time, schedule, locations, reminders, and reward notes before your next run starts." />
```

### Heading Structure (from SEO Plan v1 Section 8)
```
H1: Diablo 4 World Boss Timer

H2: Next Diablo 4 World Boss
  H3: World Boss Countdown
  H3: Next Spawn Time in Your Local Timezone
  H3: Current World Boss Location
  H3: Timer Accuracy and Last Updated

H2: Diablo 4 World Boss Schedule
  H3: Upcoming World Boss Spawns
  H3: World Boss Rotation

H2: Diablo 4 World Boss Locations
  H3: All World Boss Spawn Locations
  H3: Nearest Waypoints for Each World Boss Location
  H3: World Boss Map

H2: Diablo 4 World Boss Tracker and Reminders
  H3: Set a World Boss Reminder
  H3: Browser Notifications
  H3: Add World Boss Spawns to Your Calendar

H2: Diablo 4 World Boss Loot and Rewards
  H3: What Do World Bosses Drop in Diablo 4?
  H3: Ashava Rewards
  H3: Avarice Rewards
  H3: Wandering Death Rewards

H2: How the Diablo 4 World Boss Timer Works
  H3: How We Calculate the Next World Boss Spawn
  H3: Predicted vs Confirmed Spawn Times
  H3: Timezone Detection
  H3: Report an Incorrect World Boss Time

H2: Diablo 4 World Boss FAQ
```

### Keyword Placement Rule
- Exact match "Diablo 4 World Boss Timer" appears 4-6 times in rendered body and headings
- Recommended positions: Title, H1, Hero intro, Accuracy section, FAQ question, optional closing CTA
- Count only public rendered page body and headings (not title tag, meta, JSON-LD, or comments)
- Do NOT keyword stuff

### JSON-LD Schemas (P0 required)
- **FAQPage**: Use exact FAQ questions and answers from Homepage Copy v2
- **BreadcrumbList**: Home > Diablo 4 World Boss Timer
- **WebApplication**: Basic schema for the timer tool

### FAQ Content (from Homepage Copy v2)
Use these exact questions as H3, with matching answers:

1. When is the next World Boss in Diablo 4?
2. How often do World Bosses spawn in Diablo 4?
3. Where do World Bosses spawn in Diablo 4?
4. Is this Diablo 4 World Boss Timer accurate?
5. Can I get a reminder before a World Boss spawns?
6. Does the timer show my local time?
7. What do World Bosses drop in Diablo 4?

### Disclaimer Text
> This is an unofficial fan-made Diablo 4 tool. Diablo IV and related names, images, and assets belong to Blizzard Entertainment. This site is not affiliated with or endorsed by Blizzard Entertainment.

## Mock Data Requirements

### Must match Implementation Lock DTOs exactly

**WorldBossEventDto fields:**
```
event_id: string
boss_name: string
boss_slug: 'ashava' | 'avarice' | 'wandering-death' | string
spawn_time_utc: string
region: string | null
location_name: string | null
nearest_waypoint: string | null
waypoint_confidence: WaypointConfidence | null    (WaypointConfidence = 'Confirmed' | 'Suggested' | 'Needs manual verification')
route_note: string | null
confidence_status: ConfidenceStatus               (ConfidenceStatus = 'Confirmed' | 'Predicted' | 'Needs verification')
source_type: SourceType                           (SourceType = 'algorithm' | 'manual_override' | 'manual_seed')
is_overridden: boolean
last_updated_at: string
algorithm_version: string | null
season_version: string | null
```

**CurrentEventResponse fields:**
```
event: WorldBossEventDto | null
upcoming: WorldBossEventDto[]
server_time_utc: string
generated_at: string
stale_after_seconds: number
status: 'ok' | 'no_active_anchor' | 'no_future_events' | 'needs_verification'
announcement: { enabled: boolean; message: string | null }
```

**WorldBossScheduleResponse fields:**
```
events: WorldBossEventDto[]
generated_at: string
server_time_utc: string
limit: number
max_limit: number
```

### Required Mock Variants
Generate concrete mock data for ALL of these states:
1. `mockCurrentResponse` — normal "ok" state with Predicted event and 8 upcoming events
2. `confirmedCurrentResponse` — event with confidence_status = "Confirmed"
3. `needsVerificationCurrentResponse` — event with confidence_status = "Needs verification"
4. `mockScheduleResponse` — 8 future events, mixed bosses and locations
5. `noActiveAnchorResponse` — event = null, status = "no_active_anchor"
6. `noFutureEventsResponse` — event = null, upcoming = [], status = "no_future_events"
7. `currentApiFailedState` — error state for current endpoint
8. `scheduleApiFailedState` — error state for schedule endpoint
9. `eventExpiredCheckingState` — countdown at zero, checking next spawn
10. `announcementActiveResponse` — announcement.enabled = true with a message

### Mock Data Rules
- Use a dynamic mock time factory so events stay in the future
- Boss rotation: Ashava → Avarice → Wandering Death (cycle)
- Location rotation: The Crucible → Caen Adar → Saraan Caldera → Seared Basin → Fields of Desecration (cycle)
- Default interval: 210 minutes (3.5 hours)
- Default confidence: Predicted for algorithm-generated events
- Include at least one Confirmed event (manually overridden) and one Needs verification event in the schedule
- `spawn_time_local`, `countdown_seconds`, formatted countdown, and timezone labels are FRONTEND-DERIVED, not in mock data
- `boss_image` is not in API data — map from `boss_slug` locally if needed

## Notification Permission UX Flow
1. User clicks "Remind Me"
2. Opens reminder panel with time options: 5, 15, 30, 60 minutes
3. User selects a reminder time
4. THEN request browser notification permission (not before)
5. If granted: show "Reminder saved locally."
6. If denied: show "Notifications are blocked. Consider using a device alarm."
7. If unsupported: disable browser notification option entirely
8. Do NOT request notification permission on page load

## First Viewport Prohibitions
- No large map
- No long SEO copy paragraphs
- No ads
- No displaying many other events
- No user scrolling required to see location
- No heavy animations that delay load
- No cards inside cards
- No oversized hero section
- No internal publishing notes rendered

## Output Requirements
Generate a complete frontend UI draft including:
1. Mobile layout (360x640 first viewport wireframe, page order, component specs)
2. Desktop layout (>=1024px wireframe, two-column dashboard, below-fold content)
3. Tablet layout (768-1023px adjustments)
4. Component hierarchy with client/server boundary
5. Design tokens (all color, typography, spacing, radius, motion tokens as CSS custom properties)
6. All 14 P0 interaction states with specific UI treatment and copy
7. Mock data fixtures matching Implementation Lock DTOs for all required variants
8. Responsive behavior notes (breakpoints, text stability, layout shifts, lazy map)
9. SEO integration: heading hierarchy, JSON-LD schemas, meta tags, FAQ content
10. Accessibility requirements
11. Analytics event taxonomy
12. Announcement banner and stale data indicator specs
