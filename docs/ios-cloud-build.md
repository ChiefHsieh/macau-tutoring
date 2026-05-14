# Windows 开发 + 云端构建 iOS（Capacitor）

本仓库已包含：

- 依赖：`@capacitor/ios`（与 `@capacitor/android` 同级）
- 工作流：`.github/workflows/ios-smoke.yml` — 在 **GitHub macOS Runner** 上执行 `cap add ios`（若缺失）、`cap sync ios`、`pod install`、**模拟器版 xcodebuild**（不要求 Distribution 证书）

`capacitor.config.ts` 中 `appId: com.astarmarketplace.app` 与 `server.url` 指向线上站点；iOS 壳加载方式与 Android 一致。

---

## 一、你每天在 Windows 上做什么

1. 照常改 Next.js / Capacitor 配置并 `git push`。
2. 打开 GitHub → **Actions** → **iOS Smoke (Capacitor)** → **Run workflow**，确认绿灯（证明 iOS 工程能编过）。
3. 首次成功后，建议把 **`ios/` 目录提交进仓库**（见下文「首次落地 ios 目录」），后续 CI 更快、也方便改原生能力（推送、图标等）。

---

## 二、首次落地 `ios/` 目录（推荐只做一次）

当前仓库可能还没有 `ios/`（Windows 本机一般不加）。任选其一：

**方式 A（推荐）**：跑通一次 GitHub Action 后，在 workflow 运行结果里下载 Artifact **`ios-project-after-sync`**，解压到仓库根目录，检查无误后提交 `ios/`。

**方式 B**：短期租用云 Mac，在项目根执行 `npm ci` → `npx cap add ios` → `npx cap sync ios`，再把 `ios/` 提交上来。

---

## 三、上架 TestFlight / App Store（需 Apple 账号 + 签名）

模拟器构建**不能**代替上架包。上架需要 **Apple Distribution 证书 + App Store Provisioning Profile**（或 Fastlane Match / Xcode Cloud 等托管方案），并在 CI 里对 **Release** 做 `archive` + 上传到 **App Store Connect**。

### 3.1 在 Apple Developer 完成

1. 加入 **Apple Developer Program**。
2. **Identifiers**：创建与 `com.astarmarketplace.app` 一致的 App ID；若要用推送，勾选 **Push Notifications**。
3. **Certificates**：创建 **Apple Distribution** 证书；在 Mac Keychain 导出 **.p12**（含私钥）并设密码。
4. **Profiles**：创建 **App Store** 类型描述文件，绑定上述 App ID 与证书，下载 **.mobileprovision**。
5. （推荐）**App Store Connect API Key**：生成 **Issuer ID、Key ID、.p8**，供 CI 上传构建（避免使用 Apple ID 密码）。

### 3.2 在 GitHub 配置 Secrets（示例命名）

将下列内容存为 **Repository secrets**（勿写入仓库）：

| Secret | 说明 |
|--------|------|
| `APPLE_TEAM_ID` | 10 位 Team ID |
| `BUILD_CERTIFICATE_BASE64` | `.p12` 文件 Base64 |
| `P12_PASSWORD` | 导出 .p12 时设置的密码 |
| `BUILD_PROVISION_PROFILE_BASE64` | `.mobileprovision` Base64 |
| `APP_STORE_CONNECT_ISSUER_ID` | App Store Connect API |
| `APP_STORE_CONNECT_KEY_ID` | API Key ID |
| `APP_STORE_CONNECT_API_KEY` | `.p8` 全文（含 `-----BEGIN PRIVATE KEY-----`） |

Base64 示例（在 Mac 或 WSL 上）：

```bash
base64 -i Certificates.p12 | pbcopy
base64 -i YourApp.mobileprovision | pbcopy
```

### 3.3 扩展 CI（需你自行添加或委托）

本仓库**暂未**内置「签名 + 上传 TestFlight」的 workflow（因涉及你方证书与 API Key）。你可：

- 使用 **Fastlane**（`gym` + `upload_to_app_store`）在 `macos-latest` 上跑；或
- 使用 **Codemagic / Bitrise** 的可视化 iOS 流水线；或
- 参考 GitHub 官方文档 [Installing an Apple certificate on macOS runners for Xcode development](https://docs.github.com/en/actions/guides/building-and-testing-swift#installing-an-apple-certificate-on-macos-runners-for-xcode-development)。

推送（FCM）到 iOS 时，还需在 Firebase 控制台添加 iOS 应用并下载 **`GoogleService-Info.plist`**，放入 Xcode 工程对应 target（勿把含密钥的 plist 明文提交到公开仓库；可用 GitHub Secret + 构建步骤写入）。

---

## 四、本地脚本（任意系统）

```bash
npx cap add ios    # 仅首次；若已有 ios/ 会提示已存在
npx cap sync ios   # 每次改插件或 capacitor.config 后
```

已在 `package.json` 中提供 `cap:add:ios` 与 `cap:sync:ios` 快捷脚本。

---

## 五、常见问题

| 现象 | 处理 |
|------|------|
| Action 里 `pod install` 失败 | 检查 `ios/App/Podfile`、Ruby/CocoaPods 版本；可尝试锁 Pod 版本或升级 Capacitor。 |
| `xcodebuild` 找不到 scheme | 在 `ios/App` 执行 `xcodebuild -workspace App.xcworkspace -list` 确认 scheme 名（Capacitor 默认多为 `App`）。 |
| 仅 Windows、不想租 Mac | 用本 **ios-smoke** 验证编译；上架用 **TestFlight** 在真机验收，签名与上传走 **Secrets + 扩展 workflow** 或 **Codemagic**。 |

---

## 六、相关文件

- `capacitor.config.ts` — `appId`、`server.url`、`webDir`
- `.github/workflows/ios-smoke.yml` — 云端模拟器构建
- `public/terms.html` — App Store 隐私政策 URL 可指向生产域名下的该文件
