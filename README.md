# 股市复盘笔记（Supabase Web 版）

一个**无需自建后端**的小型股市复盘笔记应用：  
纯前端 + Supabase 数据库，在手机和电脑上都可以通过浏览器访问、登录和同步数据。

> 本项目是纯静态前端（直接打开 `index.html` 就能用），不依赖 `npm`、`Node.js` 构建流程。

---

## 一、快速开始

### 1. 创建 Supabase 项目

1. 访问 Supabase 官网，注册登录，并创建一个新项目。
2. 在项目的 `Project Settings -> API` 中记下：
   - `Project URL`
   - `anon public` key
3. 在 `Storage` 中新建一个存储桶（bucket）：
   - 名称建议用：`review-photos`
   - 设置为 `Public`（方便直接访问图片）

### 1.5 关闭邮箱验证（推荐）

本应用使用**邮箱 + 密码**注册 / 登录即可，无需收邮件验证。请在 Supabase 关闭邮箱验证，否则注册后无法直接登录：

1. 在 Supabase 控制台打开你的项目
2. 左侧 **Authentication** → **Providers** → **Email**
3. 找到 **Confirm email**（或 **Enable email confirmations**）
4. **关闭**该选项，保存

完成后，注册即可直接登录，不用去邮箱点链接。

### 2. 初始化数据库表结构

1. 打开 Supabase 后台的 `SQL Editor`。
2. 将本项目根目录中的 `supabase-schema.sql` 内容复制过去执行一次。
3. 这会自动创建：
   - `reviews` 表：存储每日复盘记录
   - `review_photos` 表：存储复盘关联的图片
   - 并开启 RLS 策略，每个用户只能访问自己的数据

### 3. 配置前端的 Supabase 连接

1. 在本项目根目录下，将 `supabase-config.example.js` 复制一份：

   ```bash
   copy supabase-config.example.js supabase-config.js
   ```

2. 编辑 `supabase-config.js`，填入你自己的：
   - `url`: Supabase Project URL
   - `anonKey`: Supabase anon public key
   - `storageBucket`: 与你在存储中创建的 bucket 名称一致（默认 `review-photos`）

### 4. 启动（本地预览）

方式一：**直接双击打开**

- 在资源管理器中双击 `index.html`，用浏览器打开即可使用。

方式二：**使用任意静态服务器**

- 如果你已经有 `Node.js` / `Python` 等环境，也可以在本目录运行一个简单的静态服务器，比如：

  ```bash
  # Python 3
  python -m http.server 4173
  ```

  然后在浏览器访问 `http://localhost:4173`。

---

## 二、功能说明（MVP）

- **账号系统**
  - 邮箱 + 密码注册 / 登录（无需邮箱验证，注册后即可使用）。
  - 同一账号在任意设备登录，看到的都是同一份复盘记录。

- **每日复盘**
  - 日期、标题
  - 大盘 & 热点
  - 今日操作
  - 得失复盘
  - 明日计划
  - 常用标签（追高 / 止损犹豫 / 情绪化操作 / 趋势跟随 / 低吸 / 打板 等，可多选）

- **图片 / 截图**
  - 每条复盘可上传一张图片（如持仓、K 线、盘面截图等）。
  - 图片保存在 Supabase Storage 对应的 bucket 中，前端只保存 URL。

- **历史列表与详情**
  - 按日期倒序查看历史复盘列表。
  - 选中某一天可以查看详细文字内容和关联图片。

---

## 三、项目结构

- `index.html`：入口 HTML，使用 CDN 引入 React 和 Supabase。
- `style.css`：界面样式，适配手机和桌面端。
- `app.js`：应用主逻辑（认证、复盘记录增改、列表与详情展示、图片上传）。
- `supabase-config.example.js`：Supabase 配置示例，本地开发时复制为 `supabase-config.js` 并填写；部署时由 `scripts/generate-config.js` 根据环境变量生成。
- `supabase-schema.sql`：在 Supabase SQL 编辑器中执行的建表与权限脚本。
- `scripts/generate-config.js`：部署时根据环境变量生成 `supabase-config.js`。
- `vercel.json`：Vercel 部署配置。
- `package.json`：依赖与 `build` 脚本（部署用）。

---

## 四、部署到 Vercel（多设备长期使用）

部署后会有**公网地址**，手机、电脑、平板浏览器打开即可使用，同一账号数据云端同步。

### 1. 准备

- 已完成 **一、快速开始**（Supabase 项目、表结构、关闭邮箱验证）。
- 本机已配置 `supabase-config.js` 且能正常登录、保存复盘（可选，用于自测）。

### 2. 代码推送到 GitHub

1. 在 [GitHub](https://github.com) 新建一个仓库（名称随意，如 `stock-review-notes`），**不要**勾选 “Add a README”。
2. 在本项目根目录打开终端，执行：

   ```bash
   git init
   git add .
   git commit -m "init"
   git branch -M main
   git remote add origin https://github.com/你的用户名/stock-review-notes.git
   git push -u origin main
   ```

3. `supabase-config.js` 已加入 `.gitignore`，**不会**被提交；部署时由 Vercel 环境变量生成。

### 3. 在 Vercel 部署

1. 打开 [Vercel](https://vercel.com)，用 GitHub 登录。
2. 点击 **Add New** → **Project**，导入刚才的仓库，**不要**改 Root Directory、Framework 等，直接 **Deploy** 会失败（因为还没配环境变量）。
3. 在 **Configure Project** 页面，找到 **Environment Variables**，新增三个变量（**不要**勾选 “Preview”）：

   | Name | Value |
   |------|--------|
   | `SUPABASE_URL` | 你的 Supabase Project URL |
   | `SUPABASE_ANON_KEY` | 你的 Supabase anon public key |
   | `SUPABASE_STORAGE_BUCKET` | `review-photos`（或你的 bucket 名） |

4. 点击 **Deploy**，等构建完成。  
   若构建失败，请检查是否已填写 `SUPABASE_URL`、`SUPABASE_ANON_KEY`、`SUPABASE_STORAGE_BUCKET` 三个环境变量。

### 4. 使用

- 部署成功后，Vercel 会给出一个地址，例如：  
  `https://stock-review-notes-xxx.vercel.app`
- **电脑**：浏览器打开该地址，注册/登录即可。
- **手机**：用手机浏览器打开**同一地址**，登录同一账号，即可查看、编辑同一份复盘。

之后可在任意设备访问该链接，无需本机开服务器。

---

## 五、后续可以扩展的方向

- 按时间段统计盈亏、胜率（需要你在表结构中补充相关字段）。
- 增加「错误类型」分类，并做雷达图 / 统计图展示。
- 支持导出某一段时间的复盘为 Markdown / PDF。
- 接入 PWA（可添加到手机桌面，离线缓存最近几天的记录）。

如果你希望把这个静态版本升级成基于 Vite / React Router 的完整前端项目，我也可以在此基础上继续帮你重构和扩展。  
