# Sync .env.local secrets to Vercel (production + preview + development).
# Prerequisites: npx vercel login   then run from repo root:
#   powershell -ExecutionPolicy Bypass -File scripts/sync-vercel-env.ps1

param(
  [string]$EnvFile = ".env.local"
)

$ErrorActionPreference = "Stop"

$Keys = @(
  "UPI_PAYEE_ID",
  "UPI_PAYEE_NAME",
  "SCRIPTS_DOWNLOAD_SECRET",
  "PAYMENT_WEBHOOK_SECRET",
  "GEMINI_API_KEY",
  "GEMINI_MODEL",
  "ADMIN_PASSWORD",
  "ADMIN_SECRET",
  "FORCE_MOCK_ANALYSIS",
  "NEXT_PUBLIC_SITE_URL"
)

if (-not (Test-Path $EnvFile)) {
  Write-Error "Missing $EnvFile — create it from .env.example first."
}

$vars = @{}
Get-Content $EnvFile | ForEach-Object {
  $line = $_.Trim()
  if (-not $line -or $line.StartsWith("#")) { return }
  $idx = $line.IndexOf("=")
  if ($idx -lt 1) { return }
  $name = $line.Substring(0, $idx).Trim()
  $value = $line.Substring($idx + 1).Trim()
  if ($value.StartsWith('"') -and $value.EndsWith('"')) {
    $value = $value.Substring(1, $value.Length - 2)
  }
  $vars[$name] = $value
}

$whoami = npx vercel whoami 2>&1
if ($LASTEXITCODE -ne 0) {
  Write-Host "Not logged in. Run: npx vercel login"
  exit 1
}

if (-not (Test-Path ".vercel/project.json")) {
  Write-Host "Linking Vercel project (select scenenode if prompted)..."
  npx vercel link
}

$environments = @("production", "preview", "development")

foreach ($key in $Keys) {
  if (-not $vars.ContainsKey($key) -or [string]::IsNullOrWhiteSpace($vars[$key])) {
    Write-Host "Skip $key (empty in $EnvFile)"
    continue
  }

  foreach ($envName in $environments) {
    Write-Host "Set $key ($envName)..."
    $vars[$key] | npx vercel env add $key $envName --force --yes 2>$null
    if ($LASTEXITCODE -ne 0) {
      $vars[$key] | npx vercel env add $key $envName --force 2>$null
    }
  }
}

Write-Host ""
Write-Host "Environment variables synced."
Write-Host "Redeploy: npx vercel --prod"
Write-Host "Or trigger redeploy from Vercel dashboard -> Deployments -> Redeploy"
