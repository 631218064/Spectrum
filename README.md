# Spectrum

Spectrum 是一个基于 Next.js + Supabase 的「慢揭晓」交友平台。  
核心机制是：匹配成功后按北京时间逐日解锁线索，第五天解锁联系方式。

## 1. 项目现状与核心能力
- 登录/注册/资料编辑（注册页与编辑页复用同一表单）。
- 5 步注册表单（账号、基础档案、生活与感官、情感模式与期待、隐私与设置）。
- 照片墙上传（1-10 张，拖拽排序，首图作为头像）。
- 匹配请求与接受/忽略流程。
- 每日消息窗口限制（按北京时间 08:00~次日 08:00，每人每 match 1 条）。
- AI 线索生成（失败自动回退模板）。
- 中英文切换（全局语言状态同步）。
- Vercel Cron：每日推进解锁进度、清理过期邀约。

## 2. 技术栈
- 前端：Next.js 14、React 18、TypeScript
- UI：Tailwind CSS、Ant Design、Framer Motion
- 鉴权/数据/存储：Supabase Auth + PostgreSQL + Storage
- 部署：Vercel

## 3. 目录结构（当前实现）
```text
.
├─ pages/
│  ├─ index.tsx                    # 主页：未登录=Landing，已登录=MatchingDashboard
│  ├─ register.tsx                 # 注册/编辑资料（/register 与 /register?mode=edit）
│  ├─ auth/
│  │  ├─ signin.tsx                # 登录页
│  │  ├─ callback.tsx              # Auth 回调
│  │  └─ confirm.tsx
│  ├─ profile/edit.tsx             # 兼容编辑入口（当前主要走 /register?mode=edit）
│  └─ api/
│     ├─ profile.ts                # 资料读取/写入
│     ├─ upload.ts                 # 照片上传
│     ├─ matches/
│     │  ├─ index.ts               # 拉取匹配主页数据
│     │  ├─ request.ts             # 发起匹配
│     │  ├─ respond.ts             # 接受/忽略邀约
│     │  └─ [id]/
│     │     ├─ message.ts          # 每日消息
│     │     └─ terminate.ts        # 结束旅程
│     ├─ location/
│     │  ├─ countries.ts
│     │  ├─ states/[countryId].ts
│     │  └─ cities/[stateId].ts
│     └─ cron/
│        ├─ daily-reveal.ts        # 每日推进 day / day5 解锁
│        └─ expire-requests.ts     # 过期邀约置为 expired
├─ components/
│  ├─ MatchingDashboard.tsx        # 匹配页（个人主页）主组件
│  ├─ MatchGeneratingOverlay.tsx   # 匹配生成过渡层
│  └─ AppPageLoader.tsx            # 通用页面加载层
├─ lib/
│  ├─ supabase.ts                  # 浏览器端 supabase client
│  ├─ supabaseAdmin.ts             # 服务端 admin client
│  ├─ registration.ts              # 注册表单 schema/校验/归一化
│  ├─ registrationTranslations.ts  # 注册页文案（zh/en）
│  ├─ matchingAlgorithm.ts         # 匹配打分逻辑
│  ├─ matchingRulesEngine.ts       # 匹配硬筛和候选挑选
│  ├─ matchRuntime.ts              # 匹配运行时（配额、快照、生成线索）
│  ├─ ai.ts                        # AI 生成与翻译线索
│  ├─ clueTemplates.ts             # AI 失败回退模板
│  └─ apiLogger.ts                 # API 日志统一格式（带 requestId）
├─ public/
│  ├─ cities.json                  # 所在地级联数据
│  └─ icon/*.svg                   # 注册步骤条图标
├─ styles/globals.css
├─ vercel.json
├─ MatchingRules.md
├─ MatchingPage.md
├─ Registration-form.md
├─ LoadingPage.md
└─ LoggingPage.md
```

## 4. 关键业务流

### 4.1 登录与主页路由
1. 访问 `/`：
   - 未登录：展示 Landing。
   - 已登录：进入 `MatchingDashboard`。
2. 若已登录但无资料：自动跳转 `/register`。

### 4.2 注册流程（/register）
1. 第 0 步创建账号：前端校验 email/password/confirm_password。
2. 调用 `supabase.auth.signUp`。
3. 若 signUp 未返回 session（线上常见），再尝试 `signInWithPassword` 获取 token。
4. 使用 token 调 `/api/upload` 上传照片、调 `/api/profile` 入库资料。
5. 成功后跳转 `/`（匹配界面）。

### 4.3 编辑资料（/register?mode=edit）
- 先拉取 `/api/profile` 返显。
- 邮箱只读显示（来自 Auth user），密码字段不显示。
- 仅提交资料字段，提交成功返回 `/`。
- 资料变更仅影响未来匹配，已建立匹配使用快照数据不变。

### 4.4 匹配请求与接受
1. 发起：`POST /api/matches/request`。
2. 接受/忽略：`POST /api/matches/respond`。
3. 接受后创建 match + 生成线索（AI 优先，模板兜底）。
4. 忽略会写入 `ignored_invitations`，7 天冷却过滤。

## 5. 主要页面与入口
- `/`：Landing + Dashboard 聚合页
- `/auth/signin`：登录页
- `/register`：注册
- `/register?mode=edit`：编辑资料

## 6. API 概览（当前）

### 6.1 资料与上传
- `GET /api/profile`：读取当前用户资料（需 `Authorization: Bearer <access_token>`）
- `POST /api/profile`：写入资料（同上）
- `POST /api/upload`：上传图片（multipart/form-data + bearer token）

### 6.2 匹配
- `GET /api/matches?lang=zh|en`：获取匹配页数据（quota/notifications/matches/me）
- `POST /api/matches/request`：发起匹配请求
- `POST /api/matches/respond`：接受/忽略请求
- `POST /api/matches/[id]/message`：发消息（受每日窗口限制）
- `POST /api/matches/[id]/terminate`：结束旅程

### 6.3 Cron
- `GET /api/cron/daily-reveal`
- `GET /api/cron/expire-requests`
- 两者都要求请求头：`Authorization: Bearer ${CRON_SECRET}`

## 7. 环境变量

从 `.env.example` 复制 `.env.local`，至少配置：

| 变量 | 必填 | 说明 |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | 是 | Supabase 项目 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 是 | 前端匿名 key |
| `SUPABASE_SERVICE_ROLE_KEY` | 是 | 服务端 admin key |
| `NEXT_PUBLIC_SITE_URL` | 建议 | 站点 URL |
| `NEXTAUTH_URL` | 建议 | 部署域名 |
| `NEXTAUTH_SECRET` | 建议 | 随机密钥 |
| `CRON_SECRET` | 若启用 cron 必填 | 保护 cron 接口 |
| `DEEPSEEK_API_KEY` | 可选 | AI 线索生成 key |
| `DEEPSEEK_API_URL` | 可选 | 默认 deepseek chat/completions；方舟 responses 需填 responses 地址 |
| `AI_CLUE_MODEL` | 可选 | AI 模型名 |
| `AI_CLUE_ENABLED` | 可选 | 是否启用 AI（默认可在代码内兜底模板） |

## 8. 本地开发
```bash
npm install
npm run dev
```

常用检查：
```bash
npx tsc --noEmit --incremental false
npm run build
```

## 9. 部署（Vercel + Supabase）
1. 推送代码到 GitHub。
2. Vercel 导入仓库。
3. 在 Vercel Project Settings 配置环境变量（不要依赖 `vercel.json` 写死敏感值）。
4. 确保 Supabase 表结构与当前代码一致（profiles/matches/match_requests/messages/ignored_invitations 等）。
5. 部署后验证：
   - 登录、注册、编辑资料
   - 匹配请求与接受
   - 线索加载与消息发送
   - Cron 鉴权

## 10. 重要时区规则
- 年龄校验与匹配解锁窗口按 `Asia/Shanghai`。
- 消息窗口按北京时间每天 08:00 切换。
- 体验期结束按“匹配成功后第二个北京时间 08:00 前”计算。

## 11. 常见问题排查

### 11.1 `Invalid token`（/api/upload 或 /api/profile）
- 确认前端提交使用的是当前会话 token（项目已修复 signUp 场景下 token 获取逻辑）。
- 确认 `NEXT_PUBLIC_SUPABASE_URL / ANON_KEY / SERVICE_ROLE_KEY` 来自同一 Supabase 项目。
- 确认请求头是 `Authorization: Bearer <token>`。

### 11.2 线上图标不显示
- 检查 `public/icon/*.svg` 是否入库。
- 若 `git add public/icon` 被忽略，检查 `.gitignore` 是否有 `Icon` 误伤规则，需加白名单：
  - `!public/icon/`
  - `!public/icon/*.svg`

### 11.3 表单字段报 schema cache 缺列
- 说明线上 DB 结构与代码不一致。
- 先迁移表结构，再重试提交。

## 12. 文档索引（业务规则）
- 注册页规范：[Registration-form.md](./Registration-form.md)
- 匹配规则：[MatchingRules.md](./MatchingRules.md)
- 匹配页交互：[MatchingPage.md](./MatchingPage.md)
- 加载页规范：[LoadingPage.md](./LoadingPage.md)
- 日志规范：[LoggingPage.md](./LoggingPage.md)

## 13. 协作约定
- 所有文档与源码统一 UTF-8。
- 注册文案维护在 `lib/registrationTranslations.ts`。
- 登录与主页文案维护在 `lib/translations.ts`。
- 变更匹配逻辑时，同步更新 `MatchingRules.md` 与对应 API。

---
如需新同学快速接手，建议先按顺序阅读：
1) `pages/index.tsx`  
2) `components/MatchingDashboard.tsx`  
3) `pages/register.tsx`  
4) `pages/api/matches/*` + `lib/matchRuntime.ts`  
5) `Registration-form.md` / `MatchingRules.md`
