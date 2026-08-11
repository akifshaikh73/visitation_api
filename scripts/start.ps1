param(
    [Parameter(Position=0)]
    [ValidateSet('local', 'remote')]
    [string]$database = 'remote'
)

$projectRoot = Split-Path $PSScriptRoot -Parent
Push-Location $projectRoot

if ($database -eq 'local') {
    Write-Host "Starting API server → Local MongoDB" -ForegroundColor Yellow
    npm run local
} else {
    Write-Host "Starting API server → Remote MongoDB" -ForegroundColor Green
    npm run prod
}

Pop-Location
