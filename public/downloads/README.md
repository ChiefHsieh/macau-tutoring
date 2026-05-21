# Android APK hosting

Release file: `AstarMarketplace-v1.0.1.apk`

Refresh after a new build:

```bash
cd android && gradlew.bat assembleRelease
cd ..
npm run publish:android-apk
```

Bump `versionCode` / `versionName` in `android/app/build.gradle` and `src/lib/android-apk-release.ts` before each public release.
