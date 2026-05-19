# ──────────────────────────────────────────────────────────
# 글리움 ProGuard / R8 Rules
# ──────────────────────────────────────────────────────────

# 스택트레이스 가독성 유지 (Play Console 크래시 디버깅용)
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# ── Capacitor ──────────────────────────────────────────────
-keep class com.getcapacitor.** { *; }
-keep @com.getcapacitor.annotation.CapacitorPlugin class * { *; }
-keepclassmembers class * {
    @com.getcapacitor.annotation.PluginMethod *;
}

# ── WebView JavaScript Interface ───────────────────────────
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
-keepattributes JavascriptInterface

# ── Firebase / Google Services ─────────────────────────────
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.firebase.**
-dontwarn com.google.android.gms.**

# ── Firebase Messaging (FCM) ───────────────────────────────
-keep class com.google.firebase.messaging.** { *; }

# ── Kotlin ─────────────────────────────────────────────────
-keep class kotlin.** { *; }
-keep class kotlinx.** { *; }
-dontwarn kotlin.**

# ── AndroidX / Support ─────────────────────────────────────
-keep class androidx.** { *; }
-dontwarn androidx.**

# ── JSON 직렬화 (JSObject 등) ──────────────────────────────
-keepclassmembers class * {
    public <init>(org.json.JSONObject);
}
-keep class org.json.** { *; }

# ── Gleaum 앱 패키지 ───────────────────────────────────────
-keep class com.gleaum.app.** { *; }
