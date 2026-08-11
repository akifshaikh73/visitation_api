$ports = @(5000)
$stopped = $false

foreach ($port in $ports) {
    $conns = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    foreach ($conn in $conns) {
        $proc = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
        if ($proc) {
            Stop-Process -Id $proc.Id -Force
            Write-Host "Stopped $($proc.Name) (PID $($proc.Id)) on port $port" -ForegroundColor Green
            $stopped = $true
        }
    }
}

if (-not $stopped) {
    Write-Host "No API server found on ports $($ports -join ', ')" -ForegroundColor Yellow
}
