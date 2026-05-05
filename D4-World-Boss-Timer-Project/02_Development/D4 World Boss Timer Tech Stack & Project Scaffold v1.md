# D4 World Boss Timer Tech Stack & Project Scaffold v1

## 1. 目标
本文件用于把现有 PRD、SEO、UI、Data Spec 和 Development Tickets 转成可落地的技术实施蓝图。

目标：使用一套简单、稳定、适合 SEO 和数据修正的技术栈，快速上线 `/diablo-4-world-boss-timer/` MVP。

## 2. 推荐技术栈
### 首选方案
**Next.js + Supabase + Vercel**

| 层级 | 技术 | 原因 |
|---|---|---|
| Frontend | Next.js App Router | SEO 友好，支持 Server Components、动态路由、API Routes |
| Styling | Tailwind CSS | 快速实现 dark compact dashboard UI |
| Database | Supabase Postgres | 快速建表、数据管理、后台手动修正方便 |
| Auth / Admin | Supabase Auth 或简单 Admin Token | MVP 阶段快速保护 Admin API |
| API | Next.js Route Handlers | 与前端同项目维护，部署简单 |
| Hosting | Vercel | Next.js 部署最顺，支持 ISR、Edge、Cron |
| Analytics | Plausible / Umami / GA4 | 追踪 timer、reminder、map、FAQ、report 行为 |

## 3. 项目目录结构
```text
/app
  /diablo-4-world-boss-timer
    page.tsx
    loading.tsx
    error.tsx
  /api
    /world-boss
      /current/route.ts
      /schedule/route.ts
      /report/route.ts
    /admin
      /world-boss
        /override/route.ts
        /anchor/route.ts
        /reports/route.ts
  /admin
    /world-boss/page.tsx

/components
  /world-boss
    TimerCard.tsx
    Countdown.tsx
    ScheduleList.tsx
    LocationCard.tsx
    ReminderPanel.tsx
    AccuracyPanel.tsx
    ReportWrongTimeForm.tsx
    RewardsCards.tsx
    FAQSection.tsx
    Disclaimer.tsx
    MobileHero.tsx
    DesktopHero.tsx

/lib
  supabaseClient.ts
  worldBossSchedule.ts
  worldBossApi.ts
  timezone.ts
  seo.ts
  analytics.ts
  validators.ts
  adminAuth.ts

/data
  boss_pool.json
  location_pool.json
  world_boss_settings.json
  launch_anchor.example.json

/sql
  schema.sql
  seed.sql

/content
  homepage-copy.ts
  faq.ts
  rewards.ts
  disclaimer.ts

/types
  worldBoss.ts

/public
  /images
    /bosses
    /locations

/tests
  worldBossSchedule.test.ts
  timezone.test.ts
  seo.test.ts
```

## 4. 环境变量
```text
NEXT_PUBLIC_SITE_URL=https://your-domain.com
NEXT_PUBLIC_SITE_NAME=Diablo 4 World Boss Timer

SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

ADMIN_API_TOKEN=
CRON_SECRET=

NEXT_PUBLIC_ANALYTICS_PROVIDER=
NEXT_PUBLIC_GA_ID=
```

## 5. 数据库实施顺序
1. `world_boss_events`
2. `world_boss_anchors`
3. `world_boss_settings`
4. `world_boss_reports`
5. `world_boss_overrides`
6. `admin_audit_logs`

## 6. 核心 TypeScript 类型

> **Source of truth:** [Implementation Lock v1](D4 World Boss Timer Implementation Lock v1.md) §3. Types below are mirrored for convenience. If they conflict, follow the Implementation Lock.

```ts
export type ConfidenceStatus = 'Confirmed' | 'Predicted' | 'Needs verification';

export type SourceType = 'algorithm' | 'manual_override' | 'manual_seed';

export type WaypointConfidence = 'Confirmed' | 'Suggested' | 'Needs manual verification';

export interface WorldBossEvent {
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

export interface CurrentEventResponse {
  event: WorldBossEvent | null;
  upcoming: WorldBossEvent[];
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
  events: WorldBossEvent[];
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

export interface ApiErrorResponse {
  ok: false;
  error: {
    code: string;
    message: string;
  };
}
```

## 7. 核心算法文件
`/lib/worldBossSchedule.ts`

功能：
- 获取 active anchor
- 读取 boss rotation
- 读取 location rotation
- 读取 interval_minutes
- 生成未来 20 场
- 应用 Nahantu rule
- 写入 `world_boss_events`
- 保留 manual override

## 8. API 路由设计
### Current Event API
`GET /api/world-boss/current`

### Schedule API
`GET /api/world-boss/schedule?limit=8`

### Report API
`POST /api/world-boss/report`

### Admin Override API
`POST /api/admin/world-boss/override`

### Reset Anchor API
`POST /api/admin/world-boss/anchor`

## 9. 前端组件实施顺序
### Phase FE-1：首屏工具
1. `TimerCard.tsx`
2. `Countdown.tsx`
3. `AccuracyPanel.tsx`
4. `LocationCard.tsx`

### Phase FE-2：辅助功能
1. `ScheduleList.tsx`
2. `ReminderPanel.tsx`
3. `ReportWrongTimeForm.tsx`

### Phase FE-3：SEO 内容
1. `RewardsCards.tsx`
2. `FAQSection.tsx`
3. `Disclaimer.tsx`
4. `homepage-copy.ts`

## 10. 页面渲染策略
首页 `/diablo-4-world-boss-timer/`：
- 使用 Server Component 获取初始 current event 和 schedule。
- 页面生成核心 HTML，保证 SEO 可抓取。
- Countdown 在客户端 hydration 后每秒更新。
- SEO 文案、FAQ、Disclaimer 服务端渲染。
- 地图、图片、提醒面板延迟加载。

推荐模式：
```text
SSR/ISR for initial content
Client component for countdown
API re-fetch when countdown expires
```

## 11. SEO 实施要求
Title:
**Diablo 4 World Boss Timer – Next Spawn, Schedule & Locations**

Meta:
**Track the next Diablo 4 world boss with a live countdown, local spawn time, schedule, locations, reminders, and reward notes before your next run starts.**

Required Schema:
- FAQPage
- BreadcrumbList
- WebApplication

## 12. Admin MVP
### Option A：最快实现
使用 Supabase Table Editor 直接编辑：
- `world_boss_events`
- `world_boss_anchors`
- `world_boss_settings`
- `world_boss_reports`

### Option B：轻量 Admin 页面
路径：
`/admin/world-boss`

建议：**P0 可以先 Option A，P0.5 做 Option B。**

## 13. Cron / Revalidate
Vercel Cron:
```text
/api/cron/world-boss/generate-schedule every 15 min
/api/cron/world-boss/check-reports every 15 min
```

## 14. Analytics 实施
至少记录：
```text
view_timer_page
return_visit_timer_page
click_remind_me
select_reminder_5min
select_reminder_15min
select_reminder_30min
select_reminder_60min
click_view_map
expand_schedule
click_report_wrong_time
submit_error_report
faq_expand
```

## 15. 部署流程
1. 创建 Supabase 项目。
2. 执行 schema.sql。
3. 导入 seed.sql。
4. 配置 Vercel 环境变量。
5. 部署 Next.js 项目。
6. 上线前确认 launch anchor。
7. 生成未来 20 场。
8. 检查首页 current event 和 schedule。
9. 提交 sitemap。
10. 开启每日 QA。

## 16. 首批开发顺序
1. 建 Next.js 项目
2. 配 Tailwind
3. 建 Supabase schema
4. 导入 seed data
5. 实现 schedule generation
6. 实现 current API
7. 实现 schedule API
8. 实现 Timer Card
9. 实现 Countdown
10. 实现 Schedule List
11. 实现 Location Card
12. 实现 Accuracy Panel
13. 实现 Report API + Form
14. 实现 SEO Metadata
15. 添加 Homepage Copy
16. 添加 FAQ Schema
17. 做 fallback states
18. 做 QA
19. 确认 launch anchor
20. 部署上线
