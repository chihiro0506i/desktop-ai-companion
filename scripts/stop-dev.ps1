$ErrorActionPreference = "SilentlyContinue"

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$electronPath = Join-Path $projectRoot "node_modules\electron\dist\electron.exe"

Get-Process electron -ErrorAction SilentlyContinue |
  Where-Object { $_.Path -eq $electronPath } |
  Stop-Process -Force

Get-Process esbuild -ErrorAction SilentlyContinue |
  Where-Object { $_.Path -like "$projectRoot*" } |
  Stop-Process -Force

Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue |
  ForEach-Object {
    if ($_.OwningProcess -ne $PID) {
      Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
    }
  }
