# Netlify：配置 PWA Web Push（VAPID）

本地 `.env.local` 已写入 VAPID（由 `npm run generate:vapid` 生成）。**生产环境必须在 Netlify 再配一遍**（私钥不会进 Git）。

## 方式 A：Netlify 网页（推荐）

1. 打开 [Netlify](https://app.netlify.com/) → 站点 **astarmarktetplace**
2. **Site configuration** → **Environment variables** → **Add a variable**
3. 添加以下三项（值从本机 `.env.local` 复制，与本地完全一致）：

| Key | Scopes |
|-----|--------|
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | All scopes（或至少 Production） |
| `VAPID_PRIVATE_KEY` | All scopes（**敏感**，仅 Netlify 可见） |
| `VAPID_SUBJECT` | `mailto:support@astarmarktetplace.netlify.app`（或你的联系邮箱） |

4. **Deploys** → **Trigger deploy** → **Clear cache and deploy site**

## 方式 B：Netlify CLI（已登录时）

```powershell
cd C:\Users\chief\OneDrive\Desktop\macau-tutoring
npx netlify login
powershell -ExecutionPolicy Bypass -File scripts/set-netlify-vapid-env.ps1
```

## 验证

部署 **Published** 后，用 iPhone：Safari → 加入主畫面 → 从图标打开 → 登录 → 允许通知。另一账号发消息应收到推送。
