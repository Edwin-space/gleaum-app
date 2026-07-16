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

# ── JSON 직렬화 (JSObject 등) ──────────────────────────────
-keepclassmembers class * {
    public <init>(org.json.JSONObject);
}

# Firebase, Google Play Services, AndroidX, Kotlin, AdMob은 각 AAR의
# consumer ProGuard rules를 사용한다. 패키지 전체 keep는 R8 축소를 무력화하고
# mapping/AAB를 수백 MB로 키우므로 추가하지 않는다.
