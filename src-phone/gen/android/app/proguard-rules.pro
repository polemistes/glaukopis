# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# If your project uses WebView with JS, uncomment the following
# and specify the fully qualified class name to the JavaScript interface
# class:
#-keepclassmembers class fqcn.of.javascript.interface.for.webview {
#   public *;
#}

# Uncomment this to preserve the line number information for
# debugging stack traces.
#-keepattributes SourceFile,LineNumberTable

# If you keep the line number information, uncomment this to
# hide the original source file name.
#-renamesourcefileattribute SourceFile
# The door (stage 3): Rust finds Door's two functions by their names
# (`Java_org_glaukopis_app_Door_shared`, `…_round`), so the class and its
# native functions keep theirs; and the worker WorkManager makes by name.
-keep class org.glaukopis.app.Door { native <methods>; }
-keep class org.glaukopis.app.Round { <init>(...); }
