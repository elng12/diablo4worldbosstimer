# D4 World Boss Timer PRD Short v1

## 1. 项目目标
建设一个面向英文搜索用户的 **Diablo 4 World Boss Timer** 工具页。核心目标不是做 Helltides 的低配复刻，而是先用 World Boss 单点突破，提供更快、更聚焦、更适合移动端的查询体验。

## 2. 核心定位
**A fast, mobile-first Diablo 4 World Boss Timer with next spawn, local time, locations, reminders, and accuracy status.**

中文理解：用户打开页面后，必须在 3 秒内知道下一只 World Boss 是谁、多久后刷新、在哪里刷新、是否要设置提醒。

## 3. 目标用户任务
1. 我现在要不要上线？
2. 下一只 World Boss 是谁？
3. 什么时候刷新？
4. 在哪里刷新？
5. 会不会错过？
6. 这个时间准不准？
7. 这只 Boss 值不值得打？

## 4. 核心关键词
主关键词：**diablo 4 world boss timer**

次级关键词：
- diablo 4 world boss schedule
- diablo 4 world boss locations
- diablo 4 world boss tracker
- next diablo 4 world boss
- world boss countdown
- world boss reminder
- world boss rotation
- diablo 4 world boss loot

## 5. MVP 页面
目标 URL：`/diablo-4-world-boss-timer/`

页面必须包含：
- Next World Boss Card
- Live Countdown
- Local Spawn Time
- Current Location
- Nearest Waypoint
- Reminder CTA
- Upcoming 8 Spawns
- Timer Accuracy Status
- FAQ
- Legal Disclaimer

## 6. P0 功能范围
| 功能 | 说明 |
|---|---|
| Next Boss Card | Boss 名称、倒计时、本地时间、地点、最近传送点、更新时间、置信状态 |
| Upcoming Schedule | 展示未来 8 场 Boss、时间、地点、状态 |
| Location Card | 当前地点、区域、最近传送点、路线提示，地图延迟加载 |
| Reminder Entry | Remind Me 按钮，第一版可先做浏览器提醒入口 |
| Timer Accuracy | Last Updated、Predicted / Confirmed、Timezone、Report Error |
| SEO Content | 首页最低 800 words，建议 850-1,000 words |
| Admin Override | 支持手动修正下一场 Boss、时间、地点、置信状态 |
| Fallback States | API、地图、通知、时区失败时有降级 UI |

## 7. P1 功能范围
- Browser notification：5 / 15 / 30 / 60 分钟前提醒
- Add to Calendar / iCal
- Boss Loot / Rewards Cards
- Locations 独立页
- Schedule 独立页
- FAQPage / BreadcrumbList / WebApplication Schema
- PWA / Add to Home Screen

## 8. P2 功能范围
- Waypoint 路线增强
- Boss-specific 掉落详情
- Seasonal Boss 模块
- Discord / Telegram Alerts
- Helltide Timer
- Legion Event Timer
- Diablo 4 Event Schedule 工具集

## 9. 数据方案
首版建议采用：**算法预测 + 手动覆盖 + 用户纠错**

数据状态：
- Confirmed
- Predicted
- Needs verification

必须支持 Admin Override：
- 修改 Boss
- 修改时间
- 修改地点
- 修改 Confidence
- 添加公告
- 暂停自动预测
- 查看用户反馈

## 10. 技术建议
| 层级 | 建议 |
|---|---|
| Frontend | Next.js 或 Astro + React |
| Rendering | SSG / ISR + client countdown |
| Data API | JSON endpoint |
| Storage | Supabase / PostgreSQL / Cloudflare D1 |
| Cache | Edge cache 1-5 min |
| Cron | 每 5-15 分钟检查排期 |
| Hosting | Vercel / Cloudflare Pages |

## 11. 验收标准
- 移动端首屏无需滚动即可看到 Boss、倒计时、本地时间、地点、Remind Me。
- 倒计时误差不超过 1 秒。
- 页面切后台再回来后倒计时重新校准。
- 数据无法确认时显示 Predicted 或 Needs verification。
- 首页正文不少于 800 words。
- 主关键词 exact match 控制在 4-6 次。
- H1-H3、FAQ、核心正文和主要排期可被搜索引擎抓取。
- 地图和大图不阻塞首屏加载。
- 页面底部包含非官方声明。

## 12. 上线后指标
- 首屏答案速度
- Remind Me 点击率
- 地图展开率
- Report Error 使用量
- FAQ 展开率
- 自然搜索收录情况
- 复访率

## 13. 最终执行原则
先做一个极快、极清楚、可修正数据的 World Boss Timer。P0 不追求大而全，先验证搜索流量和用户行为；P1/P2 再逐步对齐并超越竞品功能。
