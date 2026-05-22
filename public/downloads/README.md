# Android APK hosting

Release file name: `AstarMarketplace-v1.0.1.apk`

## Local / before deploy

See `docs/android-apk-security.md` for signing, ProGuard, and optional 第三方加固.

```bash
npx cap sync android
cd android && gradlew.bat assembleRelease
cd ..
npm run publish:android-apk
```

`publish:android-apk` updates `src/lib/android-apk-checksum.ts` and this folder’s `checksums.json`.

## Production (Netlify)

APK is **not** committed to git (keeps Netlify deploys reliable). Use one of:

1. **GitHub Release** (recommended): upload `public/downloads/AstarMarketplace-v1.0.1.apk`, then set Netlify env:
   `NEXT_PUBLIC_ANDROID_APK_URL=https://github.com/ChiefHsieh/macau-tutoring/releases/download/TAG/AstarMarketplace-v1.0.1.apk`

2. **CI**: configure `ANDROID_KEYSTORE_*` secrets and run workflow **Android APK release**.

Without `NEXT_PUBLIC_ANDROID_APK_URL`, the site serves `/downloads/AstarMarketplace-v1.0.1.apk` only when the file is present in `public/downloads/` at build time.
