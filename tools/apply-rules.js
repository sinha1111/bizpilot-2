// Run once inside the project folder:  node apply-rules.js
// Updates app.json (keeps versionCode etc.) with R8 + keep rules + plugin.
const fs = require("fs");
const p = "app.json";
const j = JSON.parse(fs.readFileSync(p, "utf8"));
const plugins = j.expo.plugins;

const rules = [
  "-keepattributes *Annotation*,Signature,InnerClasses,EnclosingMethod,RuntimeVisibleAnnotations",
  "-keep class com.swmansion.reanimated.** { *; }",
  "-keep class com.swmansion.worklets.** { *; }",
  "-keep class com.swmansion.gesturehandler.** { *; }",
  "-keep class com.swmansion.rnscreens.** { *; }",
  "-keep class com.th3rdwave.safeareacontext.** { *; }",
  "-keep class com.reactnativekeyboardcontroller.** { *; }",
  "-keep class com.reactnativecommunity.asyncstorage.** { *; }",
  "-keep class com.horcrux.svg.** { *; }",
  "-keep class com.facebook.react.turbomodule.** { *; }",
  "-keep class com.facebook.hermes.** { *; }",
  "-keep class com.facebook.jni.** { *; }",
  "-keep class expo.modules.** { *; }",
  "-dontwarn com.facebook.react.**",
  "-dontwarn expo.modules.**"
].join("\n");

let bp = plugins.find((x) => Array.isArray(x) && x[0] === "expo-build-properties");
if (!bp) { bp = ["expo-build-properties", { android: {} }]; plugins.push(bp); }
bp[1].android = Object.assign(bp[1].android || {}, {
  enableMinifyInReleaseBuilds: true,
  enableShrinkResourcesInReleaseBuilds: true,
  extraProguardRules: rules
});
if (!plugins.includes("./plugins/withR8Optimize")) plugins.push("./plugins/withR8Optimize");

fs.writeFileSync(p, JSON.stringify(j, null, 2) + "\n");
console.log("app.json updated. versionCode =", j.expo.android.versionCode);
