# D4 World Boss Timer Data Spec v1

## 0. 已定案数据决策
本项目 P0 数据方案先按以下规则执行：

1. **刷新间隔固定为 210 分钟**，即 3.5 小时，作为第一版默认算法参数。
2. **上线前必须人工确认一个 Confirmed Anchor**，包括 UTC 时间、Boss 名称、地点、区域和最近传送点。
3. **未来排期由 Confirmed Anchor 自动生成**，默认生成未来 20 场，页面展示未来 8 场。
4. **自动生成的未来事件默认状态为 Predicted**，不直接显示为 Confirmed。
5. **Boss rotation 和 location rotation 必须做成后台配置项**，不得硬编码在前端。
6. **Nahantu 规则做成可开关配置项**，避免后续赛季或规则变化导致返工。
7. **单场错误使用 Admin Override 修正**，只影响指定 event。
8. **整体时间偏移或赛季机制变化时使用 Reset Anchor**，重新生成未来排期。
9. **用户反馈不自动改前台数据**，进入后台审核；同一 event 多次反馈后可标记为 Needs verification。
10. **竞品页面只作为人工 QA 参考**，不作为生产数据源自动抓取。

## 1. 数据方案目标
本数据方案用于支撑 `/diablo-4-world-boss-timer/` 主工具页的核心能力：

- 展示下一场 Diablo 4 World Boss
- 展示实时倒计时
- 展示未来排期
- 展示地点、区域、最近传送点
- 展示准确性状态
- 支持用户反馈错误
- 支持后台手动修正
- 支持未来扩展到 Helltide、Legion 和全事件 Schedule

核心原则：

**自有算法预测为主，Admin Override 兜底，用户纠错辅助，竞品只做人工校验参考。**

不建议把 Helltides 作为生产数据源自动抓取。

## 2. 数据来源策略
### 2.1 Primary Source：算法预测
默认用固定刷新间隔生成未来 World Boss 排期。

```text
interval_minutes = 210
```

算法根据当前 active anchor 生成未来事件：

```text
spawn_time_utc = anchor_spawn_time_utc + interval_minutes * n
boss = boss_rotation[n]
location = location_rotation[n]
confidence_status = Predicted
```

### 2.2 Fallback Source：Admin Override
当算法不准、赛季更新、活动异常、用户反馈集中出现时，管理员可以手动覆盖下一场 Boss、时间、地点、最近传送点、Confidence status 和页面公告。

### 2.3 Feedback Source：用户纠错
用户通过 `Report wrong time` 提交反馈。反馈不应自动修改前台数据，而是进入后台审核。

### 2.4 Competitor QA：人工校验参考
Helltides、Wowhead、社区信息只作为人工 QA 参考，不作为自动生产依赖。

## 3. 关键概念定义
### Anchor Event
Anchor 是算法生成未来排期的基准事件。

```json
{
  "anchor_spawn_time_utc": "2026-05-04T07:30:00Z",
  "anchor_boss": "Ashava",
  "anchor_boss_slug": "ashava",
  "anchor_location_name": "Caen Adar",
  "anchor_region": "Scosglen",
  "anchor_nearest_waypoint": "Corbach",
  "interval_minutes": 210,
  "boss_rotation_index": 0,
  "location_rotation_index": 1,
  "confidence_status": "Confirmed",
  "season_version": "S13",
  "algorithm_version": "world-boss-v1",
  "source_note": "Manually confirmed before production launch."
}
```

如果未来全部排期整体偏移，应重设 Anchor，而不是一条条改未来事件。

### Confidence Status
| Status | 含义 | 使用场景 |
|---|---|---|
| Confirmed | 已确认 | 人工确认、可靠校验后 |
| Predicted | 算法预测 | 默认自动生成事件 |
| Needs verification | 需要校验 | 用户反馈集中、赛季变动、数据异常 |

## 4. Boss 与地点配置
Boss rotation 和 location rotation 均应保存为后台可配置项，不写死在前端。

### Boss Pool
```json
{
  "boss_pool": [
    { "boss_name": "Ashava", "boss_slug": "ashava", "full_name": "Ashava, the Pestilent" },
    { "boss_name": "Avarice", "boss_slug": "avarice", "full_name": "Avarice, the Gold Cursed" },
    { "boss_name": "Wandering Death", "boss_slug": "wandering-death", "full_name": "Wandering Death, Death Given Life" }
  ]
}
```

### Location Pool
```json
{
  "location_pool": [
    { "location_name": "The Crucible", "region": "Fractured Peaks", "nearest_waypoint": "Yelesna", "waypoint_confidence": "Needs manual verification" },
    { "location_name": "Caen Adar", "region": "Scosglen", "nearest_waypoint": "Corbach", "waypoint_confidence": "Needs manual verification" },
    { "location_name": "Saraan Caldera", "region": "Dry Steppes", "nearest_waypoint": null, "waypoint_confidence": "Needs manual verification" },
    { "location_name": "Seared Basin", "region": "Kehjistan", "nearest_waypoint": null, "waypoint_confidence": "Needs manual verification" },
    { "location_name": "Fields of Desecration", "region": "Hawezar", "nearest_waypoint": null, "waypoint_confidence": "Needs manual verification" }
  ]
}
```

### Nahantu Rule
```json
{
  "nahantu_rule": {
    "enabled": true,
    "frequency": 4,
    "confidence": "Needs verification"
  }
}
```

## 5. 数据库设计
需要的表：
- `world_boss_events`
- `world_boss_anchors`
- `world_boss_overrides`
- `world_boss_reports`
- `world_boss_settings`
- `admin_audit_logs`

详见 **Database Schema & Seed v1**。

## 6. API 设计
### 当前 Boss
`GET /api/world-boss/current`

### 未来排期
`GET /api/world-boss/schedule?limit=8`

### 用户反馈
`POST /api/world-boss/report`

### 管理员覆盖
`POST /api/admin/world-boss/override`

### 重设 Anchor
`POST /api/admin/world-boss/anchor`

## 7. Schedule Generation 逻辑

```js
/**
 * Idempotent schedule generator. Safe to run every 15 minutes.
 * 
 * Contract (see Implementation Lock §4.2):
 * - Uniqueness key: (season_version, algorithm_version, spawn_time_utc)
 * - Insert missing future events
 * - Update only non-overridden algorithm-generated future events
 * - Never overwrite source_type = 'manual_override' or is_overridden = true
 * - Never mark generated events as Confirmed by default
 * - Check generation_control.prediction_enabled before generating
 */

function generateSchedule(anchor, settings, limit = 20) {
  // 1. Check kill switch
  const genControl = settings.generation_control;
  if (genControl && genControl.prediction_enabled === false) {
    console.warn('Schedule generation is disabled. reason:', genControl.reason);
    return [];
  }

  // 2. Apply Nahantu rule (P0 default: disabled)
  const nahantu = settings.nahantu_rule;
  if (nahantu && nahantu.enabled) {
    // If enabled in P0, only affect advisory copy/confidence,
    // do not create extra schedule rows. See Implementation Lock §4.5.
    console.info('Nahantu rule is enabled but P0 does not create extra events.');
  }

  const events = [];
  const intervalMs = anchor.interval_minutes * 60 * 1000;

  for (let i = 0; i < limit; i++) {
    const spawnTime = new Date(anchor.anchor_spawn_time_utc).getTime() + intervalMs * i;

    const boss = settings.boss_rotation[
      (anchor.boss_rotation_index + i) % settings.boss_rotation.length
    ];

    const location = settings.location_rotation[
      (anchor.location_rotation_index + i) % settings.location_rotation.length
    ];

    events.push({
      boss_name: boss.boss_name,
      spawn_time_utc: new Date(spawnTime).toISOString(),
      location_name: location.location_name,
      region: location.region,
      nearest_waypoint: location.nearest_waypoint,
      route_note: location.route_note,
      confidence_status: "Predicted",
      source_type: "algorithm",
      is_overridden: false,
      algorithm_version: anchor.algorithm_version,
      season_version: anchor.season_version
    });
  }

  return events;
}
```

**Idempotency enforcement (SQL):**
```sql
-- Upsert: insert only if the uniqueness key does not already exist
INSERT INTO world_boss_events (boss_name, boss_slug, spawn_time_utc, region, location_name,
  nearest_waypoint, waypoint_confidence, route_note, confidence_status, source_type,
  is_overridden, algorithm_version, season_version, extra_location_note)
VALUES (...)
ON CONFLICT (season_version, algorithm_version, spawn_time_utc) DO NOTHING;
```

## 8. 状态机
### Event Confidence
```text
Predicted
  ↓ admin confirms
Confirmed
  ↓ user reports / data conflict
Needs verification
  ↓ admin fixes
Confirmed or Predicted
```

### Report
```text
open → reviewing → resolved / ignored
```

## 9. Cron 与缓存策略
| Job | 频率 | 作用 |
|---|---:|---|
| generate_future_schedule | 每 15 分钟 | 保证未来排期存在 |
| check_current_event | 每 1-5 分钟 | 判断当前 event 是否过期 |
| report_summary_check | 每 5-15 分钟 | 检查集中错误反馈 |
| cleanup_expired_overrides | 每小时 | 清理过期 override |
| update_sitemap_lastmod | 每天或内容变化时 | 更新 sitemap lastmod |

## 10. 前台展示规则
- API 返回 UTC。
- 前端根据浏览器时区显示本地时间。
- 不显示负数倒计时。
- 倒计时结束但下一场未刷新时显示：`Checking next World Boss spawn...`
- `stale_after_seconds` 从 `world_boss_algorithm` 设置的 `stale_after_seconds` 字段读取（默认 300 秒）。若设置中未定义，则硬编码回退值为 300。

## 11. 异常与降级状态
| 场景 | 前台处理 |
|---|---|
| Schedule API 加载失败 | 显示 Last known spawn + Retry |
| 倒计时结束但下一场未刷新 | 显示 Checking next spawn |
| Boss 时间无法确认 | 显示 Needs verification |
| 浏览器通知被拒绝 | 提示使用 Calendar / iCal |
| 浏览器不支持通知 | 隐藏 Browser Notification |
| 时区识别失败 | 默认 UTC + 手动选择入口 |
| 地图加载失败 | 保留地点文字、传送点、路线说明 |

## 12. Admin MVP
必须支持：
- 查看当前 next event
- 查看未来 20 场 event
- 修改单场 event
- 重设 active anchor
- 修改 confidence status
- 添加 announcement
- 查看 user reports
- 标记 report 为 resolved / ignored
- 查看操作日志

## 13. Seed Data & Launch Checklist
已定案：
1. `interval_minutes = 210`
2. `boss_pool` 固定三只基础 World Boss
3. `location_pool` 固定五个基础刷新地点
4. `boss_rotation` 和 `location_rotation` 不硬编码，后台可配置
5. `nearest_waypoint` 上线前人工确认
6. `nahantu_rule` 可开关配置
7. `launch_anchor` 上线前人工确认
8. 自动生成未来事件默认 `Predicted`

## 14. 最终数据策略结论
第一版不要依赖抓取竞品数据，也不要完全人工维护。

最稳妥的数据策略是：

**Confirmed Anchor → Algorithm Prediction → Predicted Schedule → Admin Override → User Report → Manual QA**
