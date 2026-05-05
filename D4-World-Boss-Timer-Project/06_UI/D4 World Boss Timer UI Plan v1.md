# D4 World Boss Timer UI Plan v1

## 1. UI 定位
整体 UI 方向：

**Dark compact dashboard + mobile-first timer tool**

中文理解：暗黑风外观，极简工具体验，首屏即答案。

页面不能做成复杂游戏数据库，也不能做成重内容攻略页。它首先是一个快速查询工具。

## 2. 核心 UI 原则
1. 首屏即答案
2. 倒计时最大
3. Boss 名称清楚
4. 地点必须首屏可见
5. Remind Me 是主 CTA
6. Accuracy 状态常驻
7. 移动端优先
8. 地图延迟加载
9. 暗黑风但克制
10. 不照搬 Helltides 的布局和信息层级

## 3. 视觉方向
推荐风格：
- 深色背景
- 深灰黑卡片
- 暗红主按钮
- 暗金强调文字
- 绿色 / 橙色 / 红色用于状态
- 数字大且稳定
- 卡片紧凑但不拥挤

不要使用：
- 过重火焰背景
- 大面积游戏海报
- 首屏复杂地图
- 太多事件并列展示
- 过多广告位
- 小字号倒计时

## 4. 移动端首屏结构
移动端首屏必须无需滚动即可看到：

```text
Logo / Header
H1: Diablo 4 World Boss Timer
Short intro

Next World Boss
Boss Name
Countdown
Local Spawn Time
Location
Nearest Waypoint
Accuracy Status

[Remind Me] [View Map]
```

示例：

```text
Next World Boss
Ashava

02:36:29

Spawns Today at 8:00 PM
The Crucible, Fractured Peaks
Nearest Waypoint: Yelesna

Predicted · Updated 2m ago · Your timezone

[Remind Me] [View Map]
```

## 5. 桌面端布局
桌面端建议双栏：

```text
Header

Hero Section:
Left 60%: Next Boss Timer Card
Right 40%: Upcoming Schedule

Below:
Location Card + lazy map
Reminder Panel
Loot / Rewards
How Timer Works
FAQ
Footer
```

桌面端仍然要让 Timer Card 成为第一视觉中心。

## 6. 页面模块顺序
1. Header
2. Hero / Next World Boss Timer
3. Upcoming World Boss Schedule
4. Current World Boss Location
5. Diablo 4 World Boss Locations
6. Tracker and Reminders
7. Loot and Rewards
8. How the Timer Works
9. FAQ
10. Footer

## 7. 核心组件规格

### 7.1 Next Boss Timer Card
必须包含：
- Boss name
- Boss image / icon
- Countdown
- Local spawn time
- Location
- Nearest waypoint
- Confidence status
- Last updated
- Remind Me CTA
- View Map CTA

### 7.2 Upcoming Schedule
桌面：可用表格
移动端：必须用卡片

每项包含：
- Boss name
- Spawn time
- Location
- Region
- Confidence status
- Remind button

### 7.3 Location Card
必须先展示行动信息，再展示地图：
- Current location
- Region
- Nearest waypoint
- Route note
- View Map button

地图默认延迟加载，不阻塞首屏。

### 7.4 Reminder Panel
提醒模块不应隐藏太深。

建议选项：
- 5 min
- 15 min
- 30 min
- 60 min

第一版优先：
- Browser notification
- Calendar / iCal 后置

第一版不建议做：
- Discord Bot
- Telegram Bot
- 邮件订阅

### 7.5 Accuracy Panel
必须包含：
- Status: Confirmed / Predicted / Needs verification
- Last updated
- Timezone
- Method / source note
- Report wrong time

颜色建议：
- Confirmed = green
- Predicted = amber
- Needs verification = orange / red

### 7.6 Rewards Cards
三张 Boss 卡：
- Ashava
- Avarice
- Wandering Death

每张卡展示：
- Grand Cache
- Mount Armor
- Trophy
- Seasonal reward note
- Worth farming note

## 8. 色彩规范
| Token | Value |
|---|---|
| Page Background | #0B0D12 |
| Card Background | #151922 |
| Card Border | #2A2F3A |
| Primary Red | #B8322A |
| Dark Red | #7F1D1D |
| Gold | #D6A84F |
| Text Primary | #F8FAFC |
| Text Secondary | #A1A1AA |
| Success | #22C55E |
| Warning | #F59E0B |
| Error | #EF4444 |

## 9. 字体规范
标题：Inter / system sans
正文：Inter / system sans
倒计时数字：tabular-nums

推荐字号：
- Desktop countdown: 48-72px
- Mobile countdown: 40-52px
- Body: 16px
- Helper text: 13-14px

CSS 建议：
```css
font-variant-numeric: tabular-nums;
```

## 10. 交互状态
必须设计以下状态：

### Loading
- Schedule loading
- Map loading
- Reminder permission loading

### Empty / Unknown
- Next boss unknown
- Location unknown
- Time needs verification

### Error
- API failed
- Map failed
- Timezone failed
- Notification permission denied

### Success
- Reminder set
- Calendar added
- Report submitted

## 11. 通知权限 UX
流程：
1. 用户点击 Remind Me
2. 打开提醒面板
3. 用户选择提醒时间
4. 再请求浏览器通知权限
5. 如果允许，显示提醒已设置
6. 如果拒绝，提供 Calendar / iCal 备选

不要在用户刚进入页面时立即弹通知权限。

## 12. 首屏禁止事项
- 不放大面积地图
- 不放长篇 SEO 文案
- 不放广告
- 不展示太多其他事件
- 不让用户滚动后才能看到地点
- 不使用太多动效影响加载

## 13. UI 验收标准
- 移动端首屏显示 Boss、倒计时、时间、地点、Remind Me。
- 倒计时数字视觉最突出。
- 地点和最近传送点在首屏或首屏附近可见。
- Accuracy 状态可见。
- 地图延迟加载。
- 表格在移动端转为卡片。
- 颜色对比度足够。
- 通知权限流程不打扰用户。
- 页面整体不像 Helltides 的低配复刻。
