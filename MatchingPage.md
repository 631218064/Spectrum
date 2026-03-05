## 项目需求：Spectrum 匹配过程页面实现（最终实现版）

### 页面概述
匹配过程页面是用户完成注册后进入的核心界面。页面用于管理进行中的匹配、处理邀约通知、查看每日线索、发送每日消息、终止匹配，以及查看本周期匹配配额。

当前实现以“后端状态为准，前端展示与触发”为原则：
- 配额、体验期、每日发送限制、每日解锁时间，均以后端返回为准。
- 前端每 30 秒拉取一次最新状态，并支持手动刷新。

---

### 顶部导航栏
- 左侧：`SPECTRUM` Logo，点击触发页面数据刷新。
- 右侧：
  - 通知中心（铃铛）：有待处理邀约时显示红点。
  - 用户菜单（缩略头像）：
    - 更新资料（跳转 `/register?mode=edit`）
    - 退出登录（退出后跳转 `/`）
  - 中英文切换按钮。

---

### 主要内容区
#### 1. 匹配配额与新增匹配
- 显示本周期剩余次数、周期起止时间（北京时间展示）。
- “新增匹配”按钮调用 `POST /api/matches/request`。
- 当前逻辑：创建的是“邀约请求”，不是立即创建 `matches` 记录。
- 配额规则：
  - 配额上限：每 7 天滚动窗口最多 5 次。
  - 扣减时机：对方同意邀约、`matches` 创建成功时扣减发起方配额。

#### 2. 通知中心（邀约）
- 展示 `notifications` 中待处理邀约。
- 点击“通知中心”按钮会立即触发一次 loadDashboard() 拉取最新通知（不必等轮询/刷新）。
- 每条邀约支持：
  - 同意：`POST /api/matches/respond` + `accept=true`
  - 忽略：`POST /api/matches/respond` + `accept=false`
- 同意后：
  - 创建 `matches`（状态 `active`）
  - 扣减发起方配额
  - 一次性生成 day1-day4 全部线索（每天 3-5 条）
  - 后续按天解锁展示

#### 3. 匹配列表与切换
- 左侧列表展示所有进行中的匹配卡片：
  - 对方昵称
  - 当前天数（`current_day`）
  - 匹配来源标签（`match_source`）
  - 体验期标识（`isInTrialPeriod=true`）
- 点击卡片切换右侧详情。
- URL hash 同步：`#match-{id}`，支持刷新后定位。

#### 4. 当前匹配详情
- 已匹配对象侧头像、昵称及资料字段保持创建时快照版本；编辑资料仅影响未来匹配。

##### a. 匹配信息
- 显示对方昵称、当前天数、匹配来源。

##### b. 匹配界面照片墙展示
- 在匹配卡片详情中，使用**照片墙组件**展示对方所有已上传照片（按用户上传顺序排列，最多10张）。
- **解锁规则**：根据匹配的 `current_day`（1-5）决定照片解锁状态。
  - 照片索引从 0 开始。
  - 已解锁照片：`index < current_day`（例如 Day1 解锁索引0，Day2 解锁索引0-1，依此类推；Day5 解锁全部）。
  - 未解锁照片：`index >= current_day`。
- **视觉样式**：
  - 已解锁照片：正常显示清晰图，支持点击放大预览。
  - 未解锁照片：应用 CSS 模糊效果（`filter: blur(4px) grayscale(0.5)`），并叠加半透明黑色遮罩和锁图标（🔒）在中央；不可点击。
- **交互**：
  - 点击已解锁照片时，打开大图预览组件（如 Ant Design 的 `Image.PreviewGroup`），可左右滑动查看所有已解锁照片。
  - 鼠标悬停在未解锁照片上，显示提示：“还需 X 天解锁”（X = `index - current_day + 1`）。
- **布局**：照片墙采用缩略图网格，每张图片尺寸：桌面端 80×80px，移动端 60×60px，圆角 12px，间距 8px，可换行。
- **边界处理**：若照片数量少于当前天数（例如用户只上传了3张，但已到Day4），则所有照片均视为已解锁，不再有模糊照片。


##### c. 已解锁线索
- 数据源：`day1_clues` ~ `day4_clues`。
- 展示规则：
  - `current_day >= N` 时展示第 N 天全部线索（当日全部展示）。
  - 未到解锁时间时展示下一次解锁时间（北京时间）。
- 线索生成规则：
  - 匹配创建时一次性生成 4 天线索。
  - 每天解锁 3-5 条（由 AI 生成，失败时可回退规则/模板）。

##### d. 每日消息互动
- 输入框限制 200 字符。
- 每个“北京时间 8:00 ~ 次日 8:00”窗口，每人每个 match 仅可发送 1 条。
- 提交接口：`POST /api/matches/[id]/message`。
- 发送成功后刷新消息列表与匹配数据。

##### e. 结束这段旅程
- 触发接口：`DELETE /api/matches/[id]/terminate`。
- 体验期判定：严格小于“匹配成功后第二个 8:00”。
- 返还规则：
  - 体验期内终止：返还本次已扣配额（仅返还被扣减方）。
    - 对于被扣减方（邀请方）：二次确认弹窗，提示文案“此时终止将返还本次匹配名额，确认终止吗？”/“If the match is terminated at this time, the current matching quota will be returned. Is it confirmed to be terminated?”
    - 对于未被扣减方（被邀请方）：二次确认弹窗，提示文案“确认终止这段旅程吗？”/“Confirm termination of this trip?”
  - 非体验期终止：不返还。
    - 对于被扣减方（邀请方）：二次确认弹窗，提示文案“此时终止不会返还本次匹配名额，确认终止吗？”/“If the match is terminated at this time, the current matching quota will not be returned. Is it confirmed to be terminated?”
    - 对于未被扣减方（被邀请方）：二次确认弹窗，提示文案“确认终止这段旅程吗？”/“Confirm termination of this trip?”
- 终止后前端逻辑隐藏该匹配；历史消息由后端异步清理。

#### 5. 更新资料
- 更新资料（注册编辑模式）需提示
  - 中文：修改资料仅对未来的匹配生效，已进行的匹配不受影响。
  - 英文：Profile updates only apply to future matches. Existing matches are not affected.

---

### 交互逻辑
#### 数据加载与同步
- 首次进入与后续轮询均调用：`GET /api/matches`。
- 轮询频率：30 秒。
- 返回结构核心字段：
  - `serverTime`
  - `quota`（used/remaining/start/end）
  - `notifications`（待处理邀约）
  - `matches`（含 `isInTrialPeriod`、`next_unlock_at`、`match_source` 等）
- 除“匹配生成线索等待页”外，页面初始化/刷新/异步加载均使用统一AppPageLoader；“匹配生成中”仍使用独立的 MatchGeneratingOverlay

#### 实时匹配与邀约关系
- 当前以“邀约-同意-建 match”流程为主。

#### 体验期与时间基准
- 全部以服务器北京时间计算。
- 前端只读取后端计算结果并展示，不自行做业务判定。

---

### 国际化支持
- 匹配页核心文案提供中英文版本。
- 时间统一以北京时间格式展示。
- 错误提示需要接口根据实际情况返回

---

### 前端状态管理
当前实现页面内状态管理（`useState + useMemo + useEffect`）：
- `data`：匹配页主数据（quota/notifications/matches）
- `selectedId`：当前选中 match
- `messages`：当前 match 消息列表
- `messageText`：输入内容
- `notifOpen` / `menuOpen`：弹层开关
- `submitting`：按钮提交中状态

---

### 响应式与可访问性
- 移动端：上下结构，左侧信息区先展示。
- 桌面端：两栏布局（左列表 + 右详情）。
- 关键按钮均提供可见禁用态与操作反馈。

---

### 错误处理
- 数据加载失败：显示“加载失败，请刷新页面”并支持重试。
- 操作失败（邀约响应/新增匹配/终止/发消息）：统一弹出失败提示并保留当前页面状态。
- 发消息失败不清空输入内容。

---

### 注意事项
- 匹配与配额的最终判定必须以后端为准。
- 终止匹配后，双方不可继续查看该匹配内容。
- 每日消息限制必须前后端双重校验。
- 新增匹配请求阶段不扣减配额；仅在 match 创建成功时扣减。

---

### 接口清单（当前实现）
- `GET /api/matches`
- `POST /api/matches/request`
- `POST /api/matches/respond`
- `POST /api/matches/[id]/message`
- `DELETE /api/matches/[id]/terminate`
