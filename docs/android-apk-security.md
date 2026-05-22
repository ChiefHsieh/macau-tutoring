# Android APK 安全发布清单（P0）

## 1. 正式签名（必做）

```bash
keytool -genkeypair -v -keystore release-upload.jks -keyalg RSA -keysize 2048 -validity 10000 -alias key0
```

- `validity 10000` ≈ 27 年
- 复制 `android/keystore.properties.example` → `android/keystore.properties`
- **切勿**将 `.jks` / `keystore.properties` 提交到 Git、Netlify 或任何公开位置
- 离线硬盘备份密钥库与密码

所有版本必须用**同一证书**签名，否则用户无法覆盖安装。

## 2. 构建加固（仓库已配置）

`android/app/build.gradle` release：

- `minifyEnabled true`
- `shrinkResources true`
- `proguard-android-optimize.txt` + `proguard-rules.pro`

```bash
cd android
gradlew.bat assembleRelease
cd ..
npm run publish:android-apk
```

`publish:android-apk` 会复制 APK 并更新 `src/lib/android-apk-checksum.ts` 中的 SHA-256。

## 3. 第三方加固（可选）

腾讯乐固 / 360 加固保等免费加固后，**必须再次用你的正式证书签名**，否则与官网公布的 SHA-256 不一致。

加固后重新运行 `certutil -hashfile ... SHA256` 并执行 `npm run publish:android-apk`。

## 4. 权限

主清单仅声明 `INTERNET`。推送插件会合并通知相关权限（`POST_NOTIFICATIONS`、`WAKE_LOCK` 等），无通讯录/定位/相机/麦克风。

## 5. 官网下载

- 唯一渠道文案：`https://astarmarktetplace.netlify.app/zh-HK/download`
- `public/_headers`：HSTS、CSP、防点击劫持
- `public/_redirects`：`/downloads` → 下载页，禁止目录浏览式入口

## 6. Netlify 后台（请人工确认）

1. **Domain management** → HTTPS → Force HTTPS
2. **Build & deploy** → Publish directory **留空**（勿填 `out`）
3. 可选：`NEXT_PUBLIC_SITE_URL=https://astarmarktetplace.netlify.app`
4. 若 APK 放 GitHub Releases：`NEXT_PUBLIC_ANDROID_APK_URL` = Release 资产 HTTPS 链接
