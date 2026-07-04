$ErrorActionPreference = "Stop"

$Repo = if ($env:MAKCODE_REPO) { $env:MAKCODE_REPO } else { "Shahnawazpathan/makcode-dev" }
$Version = if ($env:VERSION) { $env:VERSION } else { "latest" }
$InstallDir = if ($env:MAKCODE_INSTALL_DIR) { $env:MAKCODE_INSTALL_DIR } else { Join-Path $env:LOCALAPPDATA "Programs\MakCode" }

$Arch = switch ($env:PROCESSOR_ARCHITECTURE) {
  "ARM64" { "arm64" }
  "AMD64" { "x64" }
  default { throw "Unsupported arch: $env:PROCESSOR_ARCHITECTURE" }
}

New-Item -ItemType Directory -Force -Path $InstallDir | Out-Null

$BaseUrls = if ($Version -eq "latest") {
  @("https://github.com/$Repo/releases/latest/download")
} elseif ($Version.StartsWith("v")) {
  @("https://github.com/$Repo/releases/download/$Version")
} else {
  @("https://github.com/$Repo/releases/download/$Version", "https://github.com/$Repo/releases/download/v$Version")
}

$Assets = if ($Arch -eq "x64") {
  @("makcode-windows-x64.zip", "makcode-windows-x64-baseline.zip")
} else {
  @("makcode-windows-$Arch.zip")
}
$Zip = Join-Path $env:TEMP $Assets[0]
$Downloaded = $false

foreach ($BaseUrl in $BaseUrls) {
  foreach ($Asset in $Assets) {
    try {
      Invoke-WebRequest "$BaseUrl/$Asset" -OutFile $Zip
      $Downloaded = $true
      break
    } catch {
      if (($BaseUrl -eq $BaseUrls[-1]) -and ($Asset -eq $Assets[-1])) {
        throw "Could not download $Asset from $BaseUrl. Make sure the release includes Windows assets."
      }
    }
  }
  if ($Downloaded) { break }
}

if (-not $Downloaded) {
  throw "Could not download a MakCode Windows release asset."
}

if ($env:MAKCODE_PARENT_PID) {
  $StageDir = Join-Path $env:TEMP "makcode-stage-$([guid]::NewGuid())"
  Expand-Archive $Zip -DestinationPath $StageDir -Force

  $Updater = Join-Path $env:TEMP "makcode-update-$([guid]::NewGuid()).ps1"
  $QuotedStageDir = $StageDir.Replace("'", "''")
  $QuotedInstallDir = $InstallDir.Replace("'", "''")
  $QuotedUpdater = $Updater.Replace("'", "''")
  @"
`$ErrorActionPreference = "Stop"
`$PidToWait = $env:MAKCODE_PARENT_PID
`$StageDir = '$QuotedStageDir'
`$InstallDir = '$QuotedInstallDir'
try {
  Wait-Process -Id `$PidToWait -Timeout 120 -ErrorAction SilentlyContinue
} catch {}
Start-Sleep -Milliseconds 500
New-Item -ItemType Directory -Force -Path `$InstallDir | Out-Null
Copy-Item -Path (Join-Path `$StageDir "*") -Destination `$InstallDir -Recurse -Force
Remove-Item -LiteralPath `$StageDir -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -LiteralPath '$QuotedUpdater' -Force -ErrorAction SilentlyContinue
"@ | Set-Content -Path $Updater -Encoding UTF8

  Start-Process powershell -WindowStyle Hidden -ArgumentList @("-NoProfile", "-ExecutionPolicy", "Bypass", "-File", $Updater)
  Write-Host "MakCode update staged. Restart MakCode to use the new version."
} else {
  Expand-Archive $Zip -DestinationPath $InstallDir -Force
}

$UserPath = [Environment]::GetEnvironmentVariable("Path", "User")
$Paths = ($UserPath -split ";").Where({ $_ })
if ($Paths -notcontains $InstallDir) {
  [Environment]::SetEnvironmentVariable("Path", ($Paths + $InstallDir) -join ";", "User")
}

Write-Host "MakCode installed to $InstallDir\makcode.exe"
Write-Host "Open a new terminal, then run: makcode"
