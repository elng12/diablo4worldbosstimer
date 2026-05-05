# D4 World Boss Timer — Google SEO 最佳实践建议

审核日期: 2026-05-05 | 域名: diablo4worldbosstimer.live

---

## ✅ 已达标项

| 检查项 | 状态 |
|-------|------|
| URL 含完整主关键词 | ✅ `/diablo-4-world-boss-timer/` |
| Title (55-60 字符，含主关键词) | ✅ 60 字符 |
| Meta Description (150-160 字符) | ✅ 153 字符 |
| H1 唯一且含主关键词 | ✅ |
| 语义化 Heading 结构 (H1-H3) | ✅ |
| Canonical URL (自引用) | ✅ |
| Sitemap + lastmod | ✅ |
| Robots.txt (禁止 /api/ /admin/) | ✅ |
| OpenGraph + Twitter Card | ✅ |
| FAQPage JSON-LD | ✅ |
| BreadcrumbList JSON-LD | ✅ |
| WebApplication JSON-LD | ✅ |
| 服务端渲染 (SSR force-dynamic) | ✅ |
| 移动端适配 | ✅ |
| 安全响应头 (CSP, HSTS) | ✅ |
| 非官方声明 (footer disclaimer) | ✅ |
| 关键词密度 (exact match 4-6 次) | ✅ |

---

## 🔴 立即修复

### 1. og-image.png 404

```
HTTP/2 404  https://diablo4worldbosstimer.live/og-image.png
```

社交媒体分享无预览图，点击率损失严重。建议：
- 尺寸: 1200×630 px
- 内容: 深色背景 + "Diablo 4 World Boss Timer" 标题 + 倒计时/游戏 UI 元素
- 可在 Figma/Canva 快速制作

### 2. 内容存在事实性错误

`content/worldBossContent.ts` 第 78 行附近:

| 当前错误 | 正确应为 |
|---------|---------|
| "Caen Adar in Scosglen" | Caen Alderwood (Scosglen) |
| "Saraan Caldera in Dry Steppes" | Saraan Caldera (Scosglen) |
| "Fields of Desecration in Hawezar" | Krannik Hold (Hawezar) 或 Crane Pool (Hawezar) |

这是严重问题——Google 检测到事实性错误可能影响 EEAT 评分。

---

## 🟡 重要优化

### 3. 添加 Event Schema JSON-LD

当前 3 个 JSON-LD 缺少最能提升 CTR 的事件标记。建议添加：

```json
{
  "@context": "https://schema.org",
  "@type": "Event",
  "name": "Diablo 4 World Boss: Ashava",
  "startDate": "2026-05-05T19:30:00Z",
  "location": {
    "@type": "Place",
    "name": "The Crucible",
    "address": {
      "@type": "PostalAddress",
      "addressRegion": "Fractured Peaks"
    }
  },
  "eventStatus": "https://schema.org/EventScheduled",
  "eventAttendanceMode": "https://schema.org/OnlineEventAttendanceMode",
  "description": "Next Diablo 4 world boss spawn with live countdown."
}
```

注入到 `page.tsx`，数据来自 API 返回的 event 对象。

### 4. 首页内容扩展到 900+ words

当前约 800-850 words，在最低线上。建议在"How the Timer Works"模块后增加一段（约 60-80 words）：

> "How Often Should You Check the Timer?"
> "The Diablo 4 world boss rotation follows a 210-minute interval, which means you can check the timer about 30 minutes before each expected window. Bookmark the page and scan the confidence status — Confirmed events have been manually reviewed, while Predicted events are generated from the current rotation logic."

### 5. Core Web Vitals 监控

当前无性能监控。建议：
- 部署后跑一次 PageSpeed Insights: https://pagespeed.web.dev/
- 关注 LCP（最大内容绘制）、INP（交互延迟）、CLS（布局偏移）
- 倒计时每秒更新可能导致 INP 偏高，用 `requestAnimationFrame` 替代 `setInterval` 可优化

---

## 🟢 上线后执行

### 6. Google Search Console 提交
- 添加域名属性 `diablo4worldbosstimer.live`
- 提交 sitemap: `https://diablo4worldbosstimer.live/sitemap.xml`
- 手动请求索引 `/diablo-4-world-boss-timer/`

### 7. 性能优化
- Next.js 14 的 `optimizePackageImports` 用于 `lucide-react` 图标 tree-shaking
- 考虑 ISR (Incremental Static Regeneration) 替代 `force-dynamic`（如果数据延迟 1-5 分钟可接受）
- `next.config.mjs` 添加 `compiler: { removeConsole: { exclude: ['error'] } }`

### 8. 结构化数据验证
部署后用工具验证 JSON-LD 无错误：
- https://search.google.com/test/rich-results
- https://validator.schema.org/

### 9. 内链优化
当前所有导航链接使用锚点(#schedule, #locations, #rewards, #faq)。P1 阶段创建独立页面后用真实 URL 替换：
- `/diablo-4-world-boss-schedule/`
- `/diablo-4-world-boss-locations/`

---

## 📋 执行优先级

```
现在做（阻塞）:
  1. 修复 3 个地点名称错误
  2. 创建 og-image.png

本周:
  3. 添加 Event Schema JSON-LD
  4. 内容扩展到 900+ words
  5. Google Search Console 提交

上线后:
  6. PageSpeed Insights 跑分
  7. 结构化数据验证
  8. 内链优化 (P1)
```
