# Sync VAPID vars from .env.local to Netlify (requires: netlify login once).
# Usage: powershell -ExecutionPolicy Bypass -File scripts/set-netlify-vapid-env.ps1
$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
$envFile = Join-Path $root ".env.local"
if (-not (Test-Path $envFile)) {
  Write-Error "Missing .env.local — run: npm run generate:vapid and add keys first."
}

function Get-EnvValue([string]$name) {
  Get-Content $envFile | ForEach-Object {
    if ($_ -match "^\s*$name=(.*)$") { return $Matches[1].Trim() }
  }
  return $null
}

$publicKey = Get-EnvValue "NEXT_PUBLIC_VAPID_PUBLIC_KEY"
$privateKey = Get-EnvValue "VAPID_PRIVATE_KEY"
$subject = Get-EnvValue "VAPID_SUBJECT"
if (-not $publicKey -or -not $privateKey) {
  Write-Error "VAPID keys missing in .env.local"
}

$netlify = Get-Command netlify -ErrorAction SilentlyContinue
if (-not $netlify) {
  $netlify = "npx"
  $npxArgs = @("--yes", "netlify-cli")
} else {
  $npxArgs = @()
}

function Invoke-Netlify([string[]]$args) {
  if ($netlify -eq "npx") {
    & npx @npxArgs @args
  } else {
    & netlify @args
  }
}

Write-Host "Setting Netlify env (production + deploy-preview)..."
foreach ($ctx in @("production", "deploy-preview")) {
  Invoke-Netlify @("env:set", "NEXT_PUBLIC_VAPID_PUBLIC_KEY", $publicKey, "--context", $ctx)
  Invoke-Netlify @("env:set", "VAPID_PRIVATE_KEY", $privateKey, "--context", $ctx)
  if ($subject) {
    Invoke-Netlify @("env:set", "VAPID_SUBJECT", $subject, "--context", $ctx)
  }
}
Write-Host "Done. In Netlify UI: Deploys, then Clear cache and deploy site."
