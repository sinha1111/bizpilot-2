param([Parameter(Mandatory=$true)][string]$Aab)

Add-Type -AssemblyName System.IO.Compression.FileSystem
if (-not (Test-Path $Aab)) { Write-Host "File not found: $Aab" -ForegroundColor Red; exit 1 }
$Aab = (Resolve-Path $Aab).Path
$zip = [System.IO.Compression.ZipFile]::OpenRead($Aab)
try {
  $names = $zip.Entries | ForEach-Object { $_.FullName }
  Write-Host ("AAB: {0}  ({1:N1} MB)" -f $Aab, ((Get-Item $Aab).Length/1MB))

  # 1) R8 obfuscation (mapping file)
  $mapEntry = $zip.Entries | Where-Object { $_.FullName -like "BUNDLE-METADATA/com.android.tools.build.obfuscation/proguard.map" }
  if ($mapEntry) {
    $sr = New-Object System.IO.StreamReader($mapEntry.Open())
    $total = 0; $renamed = 0; $opt = 0
    while (($line = $sr.ReadLine()) -ne $null) {
      if ($line.Length -gt 0 -and $line[0] -ne ' ' -and $line[0] -ne '#' -and $line.EndsWith(':')) {
        $parts = $line.TrimEnd(':') -split ' -> '
        if ($parts.Count -eq 2) { $total++; if ($parts[0] -ne $parts[1]) { $renamed++ } }
      }
      if ($line -match 'rewriteFrame|outlineCallsite|com\.android\.tools\.r8\.outline') { $opt++ }
    }
    $sr.Close()
    $pct = if ($total) { [math]::Round(100*$renamed/$total,1) } else { 0 }
    Write-Host ("[1] R8 obfuscation : OK  - mapping file found, {0} of {1} classes renamed ({2}%)" -f $renamed,$total,$pct) -ForegroundColor Green
    if ($pct -lt 25) { Write-Host "    WARNING: under 25% - Play may still flag obfuscation" -ForegroundColor Yellow }
    if ($opt -gt 0) { Write-Host ("[2] R8 optimization: LIKELY ON - {0} inlining/outline markers in mapping" -f $opt) -ForegroundColor Green }
    else { Write-Host "[2] R8 optimization: NO markers found - optimization is probably OFF" -ForegroundColor Red }
  } else {
    Write-Host "[1] R8 obfuscation : MISSING - no proguard.map, R8 minify was OFF" -ForegroundColor Red
    Write-Host "[2] R8 optimization: cannot check without mapping" -ForegroundColor Red
  }

  # 3) native debug symbols
  $sym = @($names | Where-Object { $_ -like "BUNDLE-METADATA/com.android.tools.build.debugsymbols/*" })
  if ($sym.Count -gt 0) { Write-Host ("[3] Native debug symbols: OK - {0} file(s)" -f $sym.Count) -ForegroundColor Green; $sym | Select-Object -First 3 | ForEach-Object { Write-Host "      $_" } }
  else { Write-Host "[3] Native debug symbols: MISSING" -ForegroundColor Red }

  # 4) architectures
  $abis = @($names | Where-Object { $_ -match '^base/lib/([^/]+)/' } | ForEach-Object { ($_ -split '/')[2] } | Sort-Object -Unique)
  Write-Host ("[4] Architectures: {0}" -f ($abis -join ", "))

  # 5) large-screen: orientation in manifest is binary, so just report file exists
  Write-Host "[5] Manifest present: $($names -contains 'base/manifest/AndroidManifest.xml')"
}
finally { $zip.Dispose() }
