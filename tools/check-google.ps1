param([Parameter(Mandatory=$true)][string]$Aab)
Add-Type -AssemblyName System.IO.Compression.FileSystem
$Aab = (Resolve-Path $Aab).Path
$zip = [System.IO.Compression.ZipFile]::OpenRead($Aab)
try {
  Write-Host ("AAB: " + $Aab) -ForegroundColor Cyan
  $meta = $zip.Entries | Where-Object { $_.FullName -eq "BUNDLE-METADATA/com.android.tools.build.gradle/app-metadata.properties" }
  if ($meta) {
    $sr = New-Object System.IO.StreamReader($meta.Open()); $txt = $sr.ReadToEnd(); $sr.Close()
    $agp = ([regex]::Match($txt,'androidGradlePluginVersion=(\S+)')).Groups[1].Value
    $maj = [int]($agp.Split('.')[0]); $min = [int]($agp.Split('.')[1])
    Write-Host ("[R8] AGP used: " + $agp)
    if ($maj -ge 9) { Write-Host "[R8] Bullet 1 OK, Bullet 2 OK" -ForegroundColor Green }
    elseif ($maj -eq 8 -and $min -ge 12) { Write-Host "[R8] Bullet 1 possible (AGP 8.12+). Bullet 2 (AGP 9) NOT met" -ForegroundColor Yellow }
    else { Write-Host "[R8] Bullet 1 NOT met, Bullet 2 NOT met (AGP < 8.12)" -ForegroundColor Red }
  } else { Write-Host "[R8] metadata not found" -ForegroundColor Red }
  $enc = [System.Text.Encoding]::GetEncoding(28591)
  $needles = "setStatusBarColor","getStatusBarColor","setNavigationBarColor","getNavigationBarColor","layoutInDisplayCutoutMode"
  $found = @{}
  foreach ($e in ($zip.Entries | Where-Object { $_.FullName -like "base/dex/*.dex" })) {
    $ms = New-Object System.IO.MemoryStream
    $st = $e.Open(); $st.CopyTo($ms); $st.Close()
    $s = $enc.GetString($ms.ToArray()); $ms.Dispose()
    foreach ($n in $needles) { if ($s.IndexOf($n, [StringComparison]::Ordinal) -ge 0) { $found[$n] = $true } }
  }
  foreach ($n in $needles) {
    if ($found[$n]) { Write-Host ("[E2E] " + $n + " : PRESENT") -ForegroundColor Yellow }
    else { Write-Host ("[E2E] " + $n + " : not found") -ForegroundColor Green }
  }
}
finally { $zip.Dispose() }
