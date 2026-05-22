# Capacitor + WebView
-keep class com.getcapacitor.** { *; }
-keep @com.getcapacitor.annotation.CapacitorPlugin class * { *; }
-keepclassmembers class * {
    @com.getcapacitor.annotation.CapacitorPlugin *;
}
-keep public class * extends com.getcapacitor.Plugin
-keep public class * extends com.getcapacitor.BridgeActivity
-keep class com.astarmarketplace.app.** { *; }

# Firebase / FCM (push)
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.firebase.**
-dontwarn com.google.android.gms.**

# AndroidX
-keep class androidx.core.content.FileProvider { *; }

# Keep line numbers for crash reports (optional; remove to obfuscate further)
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile
