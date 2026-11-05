# Run from the project folder. Builds an arm64 AAB locally and checks it.
$ErrorActionPreference = "Stop"
npx expo prebuild --platform android --clean
Write-Host "--- config check ---" -ForegroundColor Cyan
Select-String android\build.gradle -Pattern "com.android.tools.build:gradle"
Select-String android\gradle.properties -Pattern "optimizedResourceShrinking"
Select-String android\app\build.gradle -Pattern "proguard-android-optimize|debugSymbolLevel"
Set-Location android
.\gradlew --stop
$env:NODE_ENV = "production"
$env:GRADLE_OPTS = "-Djava.net.preferIPv4Stack=true"
.\gradlew bundleRelease -PreactNativeArchitectures=arm64-v8a --no-parallel
if ($LASTEXITCODE -ne 0) { throw "bundleRelease failed" }
Set-Location ..
$aab = "android\app\build\outputs\bundle\release\app-release.aab"
powershell -ExecutionPolicy Bypass -File tools\check-google.ps1 -Aab $aab
powershell -ExecutionPolicy Bypass -File tools\check-aab.ps1 -Aab $aab
