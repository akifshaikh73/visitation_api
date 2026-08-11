$ports = @(5000)

$activePort = $null
foreach ($port in $ports) {
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:$port/api/dbStatus" -TimeoutSec 3 -ErrorAction Stop
        $activePort = $port
        break
    } catch { }
}

if ($null -eq $activePort) {
    Write-Host "API server is NOT running" -ForegroundColor Red
    exit 1
}

$dbLabel = if ($response.dbStatus -eq 'remote') { 'Remote MongoDB' } else { 'Local MongoDB' }
$dbColor  = if ($response.dbStatus -eq 'remote') { 'Green' }          else { 'Yellow' }

Write-Host "API server is RUNNING on port $activePort" -ForegroundColor Green
Write-Host "Database:  $dbLabel" -ForegroundColor $dbColor
