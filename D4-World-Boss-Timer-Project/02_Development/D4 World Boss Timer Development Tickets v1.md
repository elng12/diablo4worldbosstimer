# D4 World Boss Timer Development Tickets v1

## 1. Purpose
This document converts the PRD, SEO plan, UI plan, data spec, content brief, and homepage copy into executable development tickets.

Goal: build and launch the first version of `/diablo-4-world-boss-timer/` as a fast, SEO-friendly, mobile-first World Boss timer tool.

## 2. MVP Scope
### P0 Must Ship
- Next World Boss Timer Card
- Upcoming 8 World Boss schedule
- Current location card
- Local timezone display
- Confidence status
- Last updated status
- Report wrong time
- Basic reminder entry
- SEO homepage copy
- FAQ section
- Data seed and schedule API
- Admin override / reset anchor
- Fallback states
- Analytics events

### P1 Not Required for First Launch
- Full browser notification system
- Google Calendar / iCal export
- Discord / Telegram alerts
- PWA
- Full locations page
- Full schedule page
- Boss-specific pages

# 3. Frontend Tickets

## FE-01: Build Base Page Layout
Create the main page layout for `/diablo-4-world-boss-timer/`.

Requirements:
- Dark compact dashboard style.
- Mobile-first layout.
- Desktop two-column hero layout.
- Header, hero, schedule, location, reminders, rewards, accuracy, FAQ, footer.

Acceptance:
- Mobile layout works from 360px width.
- Desktop layout uses Timer Card as the first visual priority.
- No map or heavy visual blocks delay the first screen.

## FE-02: Build Header Navigation
Links:
- World Boss Timer
- Schedule
- Locations
- Rewards
- FAQ

Primary CTA:
- Remind Me

## FE-03: Build Next Boss Timer Card
Data:
- boss_name
- boss_slug
- boss_image
- spawn_time_utc
- spawn_time_local
- countdown_seconds
- region
- location_name
- nearest_waypoint
- confidence_status
- last_updated_at

Acceptance:
- Countdown is the most visually prominent element.
- Countdown uses tabular numbers.
- Countdown does not show negative values.
- Mobile first screen shows boss, countdown, time, location, and Remind Me.

## FE-04: Implement Countdown Logic
Requirements:
- Calculate from `spawn_time_utc`.
- Update every second.
- Recalculate when page becomes visible after being hidden.
- If countdown reaches zero, request next event.

Fallback:
`Checking next World Boss spawn...`

## FE-05: Build Upcoming Schedule Component
- Desktop: table or compact list.
- Mobile: card list.
- Each event shows boss, local time, location, status, and reminder entry.
- Shows exactly 8 upcoming events by default.

## FE-06: Build Current Location Card
Show:
- Current spawn location
- Region
- Nearest or suggested waypoint
- Route note
- View Map button

Acceptance:
- If waypoint is unverified, label it as Suggested waypoint.
- If map fails, location text still remains available.
- Map is lazy-loaded or hidden behind View Map.

## FE-07: Build Reminder Panel Entry
- Remind Me button opens a reminder panel.
- Reminder options: 5, 15, 30, 60 minutes.
- Browser notification permission is not requested immediately on page load.

## FE-08: Build Accuracy Panel
Show:
- Confirmed / Predicted / Needs verification
- Last updated
- Timezone
- Method note
- Report wrong time button

## FE-09: Build Report Wrong Time Form
Report Types:
- Wrong time
- Wrong boss
- Wrong location
- Notification issue
- Other

## FE-10: Build Rewards Cards
Cards:
- Ashava
- Avarice
- Wandering Death

Content:
- Grand Cache
- Legendary gear
- Cosmetics
- Mount armor
- Trophy
- Seasonal reward note

## FE-11: Build FAQ Section
Use H3 questions from homepage copy.
FAQ content must be crawlable and match JSON-LD.

## FE-12: Build Footer and Disclaimer
Required copy:
This is an unofficial fan-made Diablo 4 tool. Diablo IV and related names, images, and assets belong to Blizzard Entertainment. This site is not affiliated with or endorsed by Blizzard Entertainment.

# 4. Backend / Data Tickets

## BE-01: Create Database Schema
Tables:
- world_boss_events
- world_boss_anchors
- world_boss_overrides
- world_boss_reports
- world_boss_settings
- admin_audit_logs

## BE-02: Import Seed Data
Seed Files:
- boss_pool.json
- location_pool.json
- world_boss_settings.json
- launch_anchor.json

## BE-03: Implement Schedule Generation
Requirements:
- Use active anchor.
- Use `interval_minutes = 210`.
- Use configurable boss_rotation.
- Use configurable location_rotation.
- Generate future 20 events.
- Default confidence: Predicted.

## BE-04: Implement Current Event API
Endpoint:
`GET /api/world-boss/current`

## BE-05: Implement Schedule API
Endpoint:
`GET /api/world-boss/schedule?limit=8`

## BE-06: Implement Report Error API
Endpoint:
`POST /api/world-boss/report`

## BE-07: Implement Admin Override
Endpoint:
`POST /api/admin/world-boss/override`

## BE-08: Implement Reset Anchor
Endpoint:
`POST /api/admin/world-boss/anchor`

## BE-09: Implement Admin MVP
Admin can:
- View current event
- View future 20 events
- Override event
- Reset anchor
- Change confidence status
- View reports
- Resolve or ignore reports
- Add announcement

## BE-10: Implement Cron Jobs
Jobs:
- generate_future_schedule every 15 min
- check_current_event every 1-5 min
- report_summary_check every 5-15 min
- cleanup_expired_overrides hourly

# 5. SEO Tickets

## SEO-01: Implement Metadata
Title:
Diablo 4 World Boss Timer – Next Spawn, Schedule & Locations

Meta:
Track the next Diablo 4 world boss with a live countdown, local spawn time, schedule, locations, reminders, and reward notes before your next run starts.

## SEO-02: Implement Homepage Copy
- Minimum 800 words.
- Target 850-1,000 words.
- Exact match count: 4-6.

## SEO-03: Implement Heading Structure
Required H1:
Diablo 4 World Boss Timer

Required H2:
- Next Diablo 4 World Boss
- Diablo 4 World Boss Schedule
- Diablo 4 World Boss Locations
- Diablo 4 World Boss Tracker and Reminders
- Diablo 4 World Boss Loot and Rewards
- How the Diablo 4 World Boss Timer Works
- Diablo 4 World Boss FAQ

## SEO-04: Add FAQPage JSON-LD
## SEO-05: Add BreadcrumbList JSON-LD
## SEO-06: Add WebApplication JSON-LD
## SEO-07: Add Sitemap and Robots

# 6. QA Tickets

## QA-01: Test Mobile First Screen
At 360px width, without scrolling, user can see:
- Boss name
- Countdown
- Local time
- Location
- Remind Me button

## QA-02: Test Timezone Conversion
Cases:
- UTC
- America/New_York
- Europe/London
- Asia/Singapore
- Australia/Sydney

## QA-03: Test Countdown Behavior
Cases:
- Normal countdown
- Page hidden and reopened
- Event expires
- API unavailable after event expires

## QA-04: Test Fallback States
Cases:
- Current API fails
- Schedule API fails
- Map image fails
- Timezone fails
- Notification blocked
- No active anchor

## QA-05: Test SEO Requirements
Checks:
- Title 55-60 characters
- Description 150-160 characters
- Body over 800 words
- Exact match 4-6 times
- One H1 only
- FAQ schema valid
- Core copy crawlable

## QA-06: Test Admin Correction Flow
Cases:
- Override single event
- Reset anchor
- Change confidence status
- Resolve report

# 7. Analytics Tickets
Events:
- view_timer_page
- return_visit_timer_page
- click_remind_me
- select_reminder_5min
- select_reminder_15min
- select_reminder_30min
- select_reminder_60min
- enable_browser_notification
- notification_permission_granted
- notification_permission_denied
- click_view_map
- expand_schedule
- click_location_card
- click_report_wrong_time
- submit_error_report
- click_calendar_add
- faq_expand

# 8. Launch Tickets
- Confirm Launch Anchor
- Verify Boss Pool
- Verify Location Pool
- Generate Future 20 Events
- Submit to Search Engines
- Start Daily QA Process

# 9. Suggested Build Order
1. BE-01 Database schema
2. BE-02 Seed data import
3. BE-03 Schedule generation
4. BE-04 Current API
5. BE-05 Schedule API
6. FE-01 Base layout
7. FE-03 Timer Card
8. FE-04 Countdown logic
9. FE-05 Upcoming Schedule
10. FE-06 Location Card
11. BE-06 Report Error API
12. FE-09 Report Wrong Time Form
13. BE-07 Admin Override
14. BE-08 Reset Anchor
15. SEO-01 Metadata
16. SEO-02 Homepage Copy
17. SEO-04 FAQ Schema
18. QA tickets
19. Launch tickets

# 10. P0 Completion Definition
P0 is complete when:
- User can open the page and see the next World Boss timer.
- Countdown works from UTC time.
- User sees local spawn time and current location.
- Future 8 spawns are visible.
- Data is generated from a confirmed anchor.
- Admin can override a wrong event.
- Admin can reset anchor.
- User can submit wrong time report.
- Page has SEO title, description, copy, headings, FAQ, and schema.
- Page passes mobile first-screen QA.
- Page can be submitted for indexing.
