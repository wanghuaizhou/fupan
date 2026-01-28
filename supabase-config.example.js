// 将此文件复制为 `supabase-config.js`，并填入你自己的 Supabase 项目配置。
// 重要：真实项目中不要把带有 anon key 的文件公开在公共仓库。

// 从 Supabase 项目设置中获取：
// - Project URL（例如：https://xxxxx.supabase.co）
// - anon 公钥（Project API keys 里的 public 区域）

window.SUPABASE_CONFIG = {
  url: "https://YOUR-PROJECT-REF.supabase.co",
  anonKey: "YOUR-ANON-PUBLIC-KEY",
  // 存储桶名称，用来存放复盘截图/图片
  storageBucket: "review-photos",
};

