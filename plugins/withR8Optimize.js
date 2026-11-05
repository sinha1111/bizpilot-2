// BizPilot Android release hardening (v3)
//  1. R8 full optimization (proguard-android-optimize.txt). Can be switched off per
//     build with  -Pbizpilot.r8optimize=false
//  2. Native debug symbols (ndk debugSymbolLevel FULL)
//  3. Optimized resource shrinking (android.r8.optimizedResourceShrinking=true).
//     This needs AGP 8.12+, so the Android Gradle Plugin is raised to 8.13.0.
//     To go back to the stock AGP, pass { "agpVersion": null } in app.json:
//       ["./plugins/withR8Optimize", { "agpVersion": null }]
const {
  withAppBuildGradle,
  withProjectBuildGradle,
  withGradleProperties,
} = require("expo/config-plugins");

const DEFAULT_AGP = "8.13.0";

module.exports = function withR8Optimize(config, props) {
  const opts = props || {};
  const agp = opts.agpVersion === undefined ? DEFAULT_AGP : opts.agpVersion;

  config = withAppBuildGradle(config, (cfg) => {
    if (cfg.modResults.language !== "groovy") return cfg;
    let c = cfg.modResults.contents;

    c = c.replace(
      /getDefaultProguardFile\(\s*(['"])proguard-android(?:-optimize)?\.txt\1\s*\)/g,
      `getDefaultProguardFile((findProperty('bizpilot.r8optimize') ?: 'true').toString().toBoolean() ? "proguard-android-optimize.txt" : "proguard-android.txt")`
    );

    if (!c.includes("debugSymbolLevel")) {
      c = c.replace(
        /(buildTypes\s*\{[\s\S]*?\brelease\s*\{)/,
        `$1\n            ndk { debugSymbolLevel 'FULL' }`
      );
    }
    cfg.modResults.contents = c;
    return cfg;
  });

  config = withGradleProperties(config, (cfg) => {
    const items = cfg.modResults;
    const key = "android.r8.optimizedResourceShrinking";
    const i = items.findIndex((x) => x.type === "property" && x.key === key);
    if (i >= 0) items[i].value = "true";
    else items.push({ type: "property", key, value: "true" });
    return cfg;
  });

  if (agp) {
    config = withProjectBuildGradle(config, (cfg) => {
      if (cfg.modResults.language !== "groovy") return cfg;
      cfg.modResults.contents = cfg.modResults.contents.replace(
        /classpath\(\s*(['"])com\.android\.tools\.build:gradle(?::[^'"]*)?\1\s*\)/,
        `classpath('com.android.tools.build:gradle:${agp}')`
      );
      return cfg;
    });
  }

  return config;
};
