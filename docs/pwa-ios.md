# iOS PWA（加入主畫面）+ Web Push

## 已實現

| 文件 | 作用 |
|------|------|
| `src/app/manifest.ts` | Web App Manifest |
| `public/sw.js` | Service Worker + `push` / `notificationclick` |
| `src/components/pwa-bootstrap.tsx` | 註冊 SW |
| `src/components/pwa-push-bootstrap.tsx` | 登入後訂閱 Web Push 並寫入 `device_push_tokens`（`platform: web`） |
| `src/lib/push-notifications.ts` | 新訊息時同時發 **FCM（Android）** 與 **Web Push（PWA）** |
| `scripts/generate-vapid-keys.mjs` | 生成 VAPID 密鑰對 |

## 配置 VAPID（必做才能推送）

```bash
npm run generate:vapid
```

把輸出寫入 **`.env.local`** 與 **Netlify 環境變數**：

- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT`（`mailto:你的聯絡郵箱`）

然後 **重新部署**（公開密鑰會被打進前端 bundle）。

## iPhone 用戶流程

1. Safari 打開本站 → **加入主畫面**（必須，否則 iOS 不允許 Web Push）
2. 從主畫面圖示打開 → 登入
3. 允許「通知」權限（首次會彈窗一次）
4. 收到新訊息時，系統通知會帶你回到對應聊天頁

## 自測推送

已登入且完成訂閱後，可調用現有 self-test API（會同時測 Android FCM 與 Web Push）：

```http
POST /api/push/self-test
Content-Type: application/json

{ "locale": "zh-HK" }
```

## 數據庫

訂閱保存在 `device_push_tokens`：

- `platform = 'web'` → `push_token` 為 Push API subscription 的 JSON 字串
- `platform = 'android'` → FCM token（Capacitor）

## 與 Android APK

- **Android APK**：繼續用 FCM（Capacitor）
- **iOS / 瀏覽器 PWA**：用 VAPID Web Push，無需 Apple 開發者帳號
