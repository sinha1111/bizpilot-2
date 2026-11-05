BizPilot - full project (bzp.zip)
=====================================
Ei folder standalone Expo project (workspace nei). Notun folder e extract korun, jemon C:\bzp

Ki ki ache (shob already apply kora):
  - orientation: default            (large screen warning)
  - android.edgeToEdgeEnabled       (edge-to-edge)
  - expo-navigation-bar soriye deya (deprecated nav bar color API)
  - app/_layout.tsx: StatusBar, Appearance.setColorScheme, ScreenFrame (landscape/tablet)
  - R8 minify + shrink + full optimization + keep rules  (app.json + plugins/withR8Optimize.js)
  - native debug symbols (FULL)
  - optimized resource shrinking + AGP 8.13.0  (plugins/withR8Optimize.js) - NOTUN, local test lagbe
  - versionCode 14 (EAS build e 15 hobe)

Prothom bar:
  cd <folder>
  npm install
  npx expo-doctor

Local test (EAS er age, 20-40 min):
  powershell -ExecutionPolicy Bypass -File tools\local-aab-test.ps1

EAS build:
  git init ; git add . ; git commit -m "bizpilot"
  eas build -p android --profile production

AGP 8.13 e kaj na korle app.json plugins e:
  ["./plugins/withR8Optimize", { "agpVersion": null }]

Janano dorkar: Play-r edge-to-edge warning (React Native, Material, react-native-screens,
keyboard-controller er bhitorer call) ar "AGP 9" bullet Expo SDK 54 e clear kora jay na.
