# Sync VAPID vars from .env.local to Netlify (requires: netlify login + netlify link).
# Usage: powershell -ExecutionPolicy Bypass -File scripts/set-netlify-vapid-env.ps1
$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
$envFile = Join-Path $root ".env.local"
if (-not (Test-Path $envFile)) {
  Write-Error "Missing .env.local. Run: npm run generate:vapid"
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

Write-Host "Setting Netlify env (production + deploy-preview)..."
foreach ($ctx in @("production", "deploy-preview")) {
  npx --yes netlify-cli env:set NEXT_PUBLIC_VAPID_PUBLIC_KEY $publicKey --context $ctx --force
  if ($LASTEXITCODE -ne 0) { throw "env:set NEXT_PUBLIC_VAPID_PUBLIC_KEY failed" }
  npx --yes netlify-cli env:set VAPID_PRIVATE_KEY $privateKey --context $ctx --force
  if ($LASTEXITCODE -ne 0) { throw "env:set VAPID_PRIVATE_KEY failed" }
  if ($subject) {
    npx --yes netlify-cli env:set VAPID_SUBJECT $subject --context $ctx --force
    if ($LASTEXITCODE -ne 0) { throw "env:set VAPID_SUBJECT failed" }
  }
}
Write-Host "Done. Run: npx netlify-cli deploy --prod --build"
