# 股市复盘笔记

一个**无需自建后端**的股市复盘 Web 应用：纯前端 + Supabase，在手机和电脑上通过浏览器访问，同一账号数据云端同步。

- **本地运行**：复制配置、用 Python 或本地服务器打开即可。
- **线上部署**：推送到 GitHub，用 Vercel 部署，获得公网地址，多设备访问。

---

## 一、准备工作（Supabase）

### 1.1 创建项目

1. 打开 [Supabase](https://supabase.com)，注册/登录。
2. **New Project**：填写名称、数据库密码、区域（如 Tokyo / Singapore），创建。
3. 进入 **Project Settings → API**，记下：
   - **Project URL**
   - **anon public** key

### 1.2 创建存储桶（存截图）

1. 左侧 **Storage** → **New bucket**。
2. 名称：`review-photos`，勾选 **Public bucket**，创建。

### 1.3 关闭邮箱验证

邮箱 + 密码注册后可直接登录，无需收邮件验证：

1. **Authentication** → **Providers** → **Email**。
2. 关闭 **Confirm email**（或 **Enable email confirmations**），保存。

### 1.4 初始化数据库表

1. **SQL Editor** → **New query**。
2. 复制本项目根目录 `supabase-schema.sql` 的全部内容，粘贴后 **Run**。
3. 将创建 `reviews`、`review_photos` 表及 RLS 策略。

---

## 二、本地使用

### 2.1 配置 Supabase 连接

1. 在项目根目录，将 `supabase-config.example.js` 复制为 `supabase-config.js`：

   ```bash
   copy supabase-config.example.js supabase-config.js
   ```

   （Linux / macOS 用 `cp`。）

2. 编辑 `supabase-config.js`，填入：

   - `url`：Supabase Project URL  
   - `anonKey`：anon public key  
   - `storageBucket`：`review-photos`（与 1.2 一致）

### 2.2 启动方式

**方式 A：本地静态服务器（推荐）**

```bash
python -m http.server 8080
```

浏览器访问：`http://localhost:8080`。

> 避免直接双击 `index.html`（`file://` 可能引起 Supabase 加载或跨域问题）。

**方式 B：同局域网手机访问**

1. 保持 `python -m http.server 8080` 运行。
2. 查本机局域网 IP（Windows：`ipconfig`；Mac：`ifconfig`），如 `192.168.1.100`。
3. 手机连同一 WiFi，浏览器打开：`http://192.168.1.100:8080`。

### 2.3 基本操作

- **注册**：邮箱 + 密码，点「注册并登录」。
- **登录**：邮箱 + 密码，点「登录」。
- **写复盘**：左侧填日期、标题、大盘 & 热点、今日操作、得失复盘、明日计划，可选标签和一张截图，点「保存今日复盘」。
- **看历史**：右侧列表按日期倒序，点某条可查看详情、编辑。

---

## 三、部署到 Vercel（多设备长期使用）

部署后获得公网地址，电脑、手机、平板打开同一链接即可使用，数据与本地同源（同一 Supabase 项目）。

### 3.1 前提

- 已完成 **一、准备工作**（Supabase 项目、表结构、存储桶、关闭邮箱验证）。
- 本机已能本地运行并正常登录、保存复盘（可选，用于自测）。

### 3.2 推送到 GitHub

1. 在 [GitHub](https://github.com) 新建仓库（如 `fupan`），不勾选 “Add a README”。
2. 在项目根目录执行：

   ```bash
   git init
   git add .
   git commit -m "init"
   git branch -M main
   git remote add origin https://github.com/你的用户名/fupan.git
   git push -u origin main
   ```

`supabase-config.js` 已在 `.gitignore` 中，不会提交；部署时由 Vercel 环境变量生成。

### 3.3 在 Vercel 部署

1. 打开 [Vercel](https://vercel.com)，用 GitHub 登录。
2. **Add New** → **Project**，导入上述仓库。
3. 在 **Configure Project** 的 **Environment Variables** 中新增：

   | Name | Value |
   |------|--------|
   | `SUPABASE_URL` | 你的 Supabase Project URL |
   | `SUPABASE_ANON_KEY` | 你的 Supabase anon public key |
   | `SUPABASE_STORAGE_BUCKET` | `review-photos` |

   环境至少勾选 **Production**，保存。

4. 点击 **Deploy**，等待构建完成。
5. 在 **Deployments** 中确认 **Status** 为 **Ready**，点 **Visit** 打开站点。

若构建失败，检查上述三个环境变量是否填写正确。

### 3.4 部署后使用

- **电脑**：浏览器打开 Vercel 给的地址（如 `https://fupan.vercel.app`），注册/登录即可。
- **手机**：用手机浏览器打开**同一地址**，登录同一账号，即可查看、编辑同一份复盘。

### 3.5 国内访问说明

`*.vercel.app` 在国内可能不稳定或无法访问。若出现「网站暂时无法打开」：

- **手机**：切换到**境外网络**（如 4G 漫游、VPN 等）后再访问，一般可正常使用。
- **电脑**：同理，使用可访问 Vercel 的网络环境。

长期在国内使用可考虑 **Cloudflare Pages** 等替代部署，流程类似（连 GitHub、填环境变量、构建）。

---

## 四、功能说明

- **账号**：邮箱 + 密码注册/登录，无需邮箱验证；同一账号多端数据一致。
- **复盘内容**：日期、标题、大盘 & 热点、今日操作、得失复盘、明日计划；可选标签（追高、止损犹豫、情绪化操作、趋势跟随、低吸、打板等）及一张截图。
- **历史**：按日期倒序列表，点某条查看详情、编辑。
- **图片**：截图存于 Supabase Storage 的 `review-photos` 桶，复盘仅存 URL。

---

## 五、项目结构

| 文件 / 目录 | 说明 |
|-------------|------|
| `index.html` | 入口页，CDN 引入 React、Supabase |
| `style.css` | 样式，适配手机与桌面 |
| `app.js` | 应用逻辑（登录、复盘 CRUD、列表与详情、图片上传） |
| `supabase-config.example.js` | 配置示例；本地复制为 `supabase-config.js` 并填写 |
| `supabase-schema.sql` | 建表与 RLS 脚本，在 Supabase SQL Editor 执行 |
| `scripts/generate-config.js` | 部署时根据环境变量生成 `supabase-config.js` |
| `vercel.json` | Vercel 构建与输出配置 |
| `package.json` | 依赖与 `build` 脚本（`npm run build`） |
| `.gitignore` | 忽略 `supabase-config.js`、`node_modules` 等 |

---

## 六、后续可扩展

- 按时间段统计盈亏、胜率（需在表中增加相应字段）。
- 错误类型分类与统计图。
- 导出一段时间复盘为 Markdown / PDF。
- PWA：可添加到手机桌面，离线缓存近期记录。

---

## 七、常见问题

- **本地打开白屏或 Supabase 报错**  
  使用 `python -m http.server 8080` 等本地服务器访问，不要用 `file://` 直接打开 `index.html`。

- **部署后登录失败**  
  检查 Vercel 环境变量 `SUPABASE_URL`、`SUPABASE_ANON_KEY`、`SUPABASE_STORAGE_BUCKET` 是否填写且已 Redeploy。

- **手机打不开部署地址**  
  多为网络限制，尝试切换境外网络（4G 漫游、VPN）后再访问。

- **保存复盘报 RLS / 权限错误**  
  确认已执行 `supabase-schema.sql`，且登录态正常；可退出后重新登录再试。
