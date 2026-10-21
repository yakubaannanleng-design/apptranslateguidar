$ErrorActionPreference = "Continue"
$env:NODE_OPTIONS = "--dns-result-order=ipv4first"
$env:npm_config_fetch_timeout = "300000"
$env:npm_config_fetch_retries = "10"
$env:npm_config_fetch_retry_mintimeout = "1000"
$env:npm_config_fetch_retry_maxtimeout = "30000"
$env:npm_config_maxsockets = "3"

for ($i = 1; $i -le 12; $i++) {
  Write-Output "=== Tentative $i / 12 ($(Get-Date -Format o)) ==="
  npm.cmd install --prefer-offline --no-audit --no-fund --loglevel=warn 2>&1 | ForEach-Object { $_ }
  if ($LASTEXITCODE -eq 0) {
    Write-Output "=== INSTALLATION REUSSIE ==="
    exit 0
  }
  Start-Sleep -Seconds 3
}
Write-Output "=== ECHEC APRES 12 TENTATIVES ==="
exit 1
