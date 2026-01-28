/**
 * 部署时根据环境变量生成 supabase-config.js，避免将密钥提交到仓库。
 * 用于 Vercel / Netlify 等：在项目设置中配置 SUPABASE_URL、SUPABASE_ANON_KEY、SUPABASE_STORAGE_BUCKET。
 */

const fs = require("fs");
const path = require("path");

const url = process.env.SUPABASE_URL || "";
const anonKey = process.env.SUPABASE_ANON_KEY || "";
const bucket = process.env.SUPABASE_STORAGE_BUCKET || "review-photos";

const config = `// 由 scripts/generate-config.js 根据环境变量生成，请勿手动编辑
window.SUPABASE_CONFIG = {
  url: "${url}",
  anonKey: "${anonKey}",
  storageBucket: "${bucket}",
};
`;

const outPath = path.join(__dirname, "..", "supabase-config.js");
fs.writeFileSync(outPath, config, "utf8");
console.log("已生成 supabase-config.js");

if (!url || !anonKey) {
  console.warn("警告: SUPABASE_URL 或 SUPABASE_ANON_KEY 未设置，部署后登录可能失败。");
  process.exitCode = 1;
}
