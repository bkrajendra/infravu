[CmdletBinding()]
param(
    [string]$Repo = $(if ($env:INFRAVU_REPO) { $env:INFRAVU_REPO } else { "bkrajendra/infravu" }),
    [string]$Version = $(if ($env:INFRAVU_VERSION) { $env:INFRAVU_VERSION } else { "latest" })
)

$ErrorActionPreference = "Stop"
$asset = "windows-x86_64.exe"
$installDir = if ($env:INFRAVU_INSTALL_DIR) { $env:INFRAVU_INSTALL_DIR } else { Join-Path $env:LOCALAPPDATA "InfraVu\bin" }
$binaryPath = Join-Path $installDir "infravu-agent.exe"

if ($Version -eq "latest") {
    $downloadUrl = "https://github.com/$Repo/releases/latest/download/$asset"
} else {
    $downloadUrl = "https://github.com/$Repo/releases/download/$Version/$asset"
}

New-Item -ItemType Directory -Force -Path $installDir | Out-Null
Write-Host "[infravu] downloading $asset from $Repo ($Version)"

Get-Process -Name "infravu-agent" -ErrorAction SilentlyContinue | Stop-Process -Force
Invoke-WebRequest -Uri $downloadUrl -OutFile $binaryPath

Write-Host "[infravu] installed $binaryPath"
Write-Host "[infravu] any existing agent process was stopped; start the updated binary manually"
Write-Host "[infravu] agent endpoint: http://127.0.0.1:9100/api/resources"
