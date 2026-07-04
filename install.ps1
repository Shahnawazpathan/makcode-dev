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

$BaseUrl = if ($Version -eq "latest") {
  "https://github.com/$Repo/releases/latest/download"
} else {
  "https://github.com/$Repo/releases/download/$Version"
}

$Assets = if ($Arch -eq "x64") {
  @("makcode-windows-x64.zip", "makcode-windows-x64-baseline.zip")
} else {
  @("makcode-windows-$Arch.zip")
}
$Zip = Join-Path $env:TEMP $Assets[0]
$Downloaded = $false

foreach ($Asset in $Assets) {
  try {
    Invoke-WebRequest "$BaseUrl/$Asset" -OutFile $Zip
    $Downloaded = $true
    break
  } catch {
    if ($Asset -eq $Assets[-1]) {
      throw "Could not download $Asset from $BaseUrl. Make sure the latest release includes Windows assets."
    }
  }
}

if (-not $Downloaded) {
  throw "Could not download a MakCode Windows release asset."
}

Expand-Archive $Zip -DestinationPath $InstallDir -Force

$UserPath = [Environment]::GetEnvironmentVariable("Path", "User")
$Paths = ($UserPath -split ";").Where({ $_ })
if ($Paths -notcontains $InstallDir) {
  [Environment]::SetEnvironmentVariable("Path", ($Paths + $InstallDir) -join ";", "User")
}

Write-Host "MakCode installed to $InstallDir\makcode.exe"
Write-Host "Open a new terminal, then run: makcode"
