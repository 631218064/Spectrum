```markdown
# Spectrum 交友平台

Spectrum 是一个面向女同性恋社群的“慢揭晓”式交友平台。不同于传统的即时匹配，Spectrum 通过五天的渐进式线索揭示，鼓励用户建立更深层次的情感连接。

## ✨ 功能特点

- **5 天慢揭晓机制**：每天 8:00 解锁一条关于对方的神秘线索，第五天自动公开联系方式（微信/其他）。
- **每日一条消息**：在等待揭晓的过程中，双方每天可互发一条消息，逐步增进了解。
- **随时终止**：前四天内任何一方都可随时终止匹配，匹配立即失效，释放匹配名额。
- **匹配限额**：每人每周最多同时进行 5 个匹配，避免滥用。
- **AI 生成线索**（可选）：集成 DeepSeek API，根据双方填写的资料生成个性化的浪漫线索；若 AI 不可用，自动回退到模板库。
- **双语支持**：中英文界面一键切换，吸引全球用户。
- **隐私保护**：可开启“外貌滤镜”，将真实照片替换为卡通化版本，直到第五天才公开。

## 🛠️ 技术栈

- **前端框架**：Next.js 14 (React 18) + TypeScript
- **样式**：Tailwind CSS + Framer Motion (动画)
- **图标**：Lucide React
- **后端 & 数据库**：Supabase (PostgreSQL, 认证, 存储)
- **部署**：Vercel (前端 + API 路由)
- **AI 服务**：DeepSeek API (可选)

## 📁 项目结构

```
spectrum/
├── public/                # 静态资源
├── styles/                # 全局样式
├── lib/                   # 工具库
│   ├── supabase.ts        # Supabase 客户端
│   ├── storage.ts         # 文件上传
│   ├── ai.ts              # AI 线索生成
│   ├── clueTemplates.ts   # 线索模板回退
│   ├── matchingAlgorithm.ts # 传统匹配算法
│   └── translations.ts    # 多语言配置
├── pages/                 # 页面和 API 路由
│   ├── index.tsx          # 主页面 (Landing/Onboarding/Dashboard)
│   ├── _app.tsx           # 全局组件
│   ├── auth/              # 认证相关页面
│   │   ├── signin.tsx
│   │   └── callback.ts
│   └── api/               # API 路由
│       ├── profile.ts
│       ├── matches/
│       │   ├── index.ts
│       │   ├── request.ts
│       │   ├── respond.ts
│       │   └── [id]/
│       │       ├── message.ts
│       │       └── terminate.ts
│       └── cron/
│           ├── daily-reveal.ts
│           └── expire-requests.ts
├── .env.example           # 环境变量示例
├── .gitignore
├── next.config.js
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
├── package.json
└── vercel.json            # Vercel 部署配置（含定时任务）
```

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/yourusername/spectrum.git
cd spectrum
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

复制 `.env.example` 为 `.env.local`：

```bash
# Windows PowerShell
copy .env.example .env.local
```

然后编辑 `.env.local`，填入你的 Supabase 项目信息和其他配置（见下方环境变量说明）。

### 4. 设置 Supabase

#### 创建 Supabase 项目
- 登录 [Supabase](https://supabase.com) 并创建一个新项目。
- 记下项目的 **URL** 和 **anon public key**（在 Project Settings → API 中）。

#### 执行建表语句
在 Supabase 的 SQL 编辑器中执行以下语句，创建所需的表：

```sql
-- 执行项目提供的完整 SQL 建表脚本（见下方链接或代码文件）
-- 注意：包括 users、profiles、match_requests、matches、messages 等表
```
（建表脚本可在项目 `database/schema.sql` 中找到，或参考之前对话中的 SQL）

#### 创建存储桶
- 在 Supabase Storage 中创建一个名为 `profiles` 的公开存储桶，用于存放用户头像。
- 设置存储桶的权限为允许公开读取（可通过设置 `public` 为 true）。

### 5. 运行开发服务器

```bash
npm run dev
```

访问 `http://localhost:3000` 即可看到应用。

## ☁️ 部署到 Vercel

### 准备工作
- 将代码推送到 GitHub 仓库。
- 在 [Vercel](https://vercel.com) 中导入该仓库。

### 环境变量配置
在 Vercel 项目设置中添加以下环境变量（值与本地 `.env.local` 一致）：

| 变量名 | 说明 |
|--------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | 你的 Supabase 项目 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 匿名密钥 |
| `SUPABASE_SERVICE_ROLE_KEY` | 服务角色密钥（用于 API 路由） |
| `NEXTAUTH_URL` | 你的 Vercel 部署域名（如 `https://spectrum.vercel.app`） |
| `NEXTAUTH_SECRET` | 随机字符串（可使用 `openssl rand -base64 32` 生成） |
| `DEEPSEEK_API_KEY` | （可选）DeepSeek API 密钥 |
| `AI_CLUE_ENABLED` | `true` 或 `false`，是否启用 AI 生成线索 |
| `CRON_SECRET` | （可选）保护定时任务的密钥 |

### 定时任务
如果项目中使用了 `vercel.json` 配置了 Cron 作业，Vercel 会自动触发。请确保在 `pages/api/cron/*` 的代码中验证 `Authorization` 头，防止未授权调用。

## 🔧 环境变量说明

| 变量名 | 必填 | 说明 |
|--------|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase 项目 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase 匿名密钥 |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | 服务角色密钥（仅后端使用） |
| `NEXTAUTH_URL` | ✅ | 部署域名（用于回调） |
| `NEXTAUTH_SECRET` | ✅ | 加密密钥（至少 32 字符） |
| `DEEPSEEK_API_KEY` | ❌ | DeepSeek API 密钥 |
| `AI_CLUE_ENABLED` | ❌ | 是否启用 AI 线索（默认为 false） |
| `CRON_SECRET` | ❌ | 定时任务保护密钥 |

## 📝 自定义修改

### 修改默认语言
在 `next.config.js` 中修改 `i18n.defaultLocale` 为 `'zh'` 可默认显示中文。

### 修改 AI 提示词
在 `lib/ai.ts` 中调整 `prompt` 内容，可自定义线索生成的风格。

### 调整匹配算法
在 `lib/matchingAlgorithm.ts` 中修改 `calculateMatchScore` 函数，可自定义匹配规则。

## 🤝 贡献指南

欢迎提交 Issue 或 Pull Request。请确保代码遵循项目现有的风格，并通过测试。

## 📄 许可证

[MIT](LICENSE)

---

**Happy coding!** 🌈
```