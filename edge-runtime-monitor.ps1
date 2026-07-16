# edge-runtime-monitor.ps1 - Memory monitoring script for Supabase edge-runtime (Windows PowerShell)
# Usage: .\edge-runtime-monitor.ps1 -Duration 300 -AlertThreshold 80
# Example: .\edge-runtime-monitor.ps1 -Duration 300 -AlertThreshold 80

param(
    [int]$Duration = 60,           # Monitor duration in seconds (default: 60)
    [int]$AlertThreshold = 80      # Alert if memory % exceeds this (default: 80)
)

$Container = "supabase_edge_runtime_codex-hitl-starter"
$CSVPath = "$env:TEMP\edge-runtime-monitor.csv"

Write-Host "=== Supabase Edge-Runtime Memory Monitor ===" -ForegroundColor Cyan
Write-Host "Container: $Container"
Write-Host "Duration: ${Duration}s"
Write-Host "Alert Threshold: ${AlertThreshold}%"
Write-Host ""

# Check if container exists
$ContainerExists = docker ps -a --format "{{.Names}}" | Select-String "^$Container$"
if (-not $ContainerExists) {
    Write-Host "ERROR: Container '$Container' not found" -ForegroundColor Red
    exit 1
}

# Check if container is running
$ContainerRunning = docker ps --format "{{.Names}}" | Select-String "^$Container$"
if (-not $ContainerRunning) {
    Write-Host "WARNING: Container is not running. Starting..." -ForegroundColor Yellow
    docker start $Container
    Start-Sleep -Seconds 2
}

# Initialize CSV
$null = @() | Export-Csv -Path $CSVPath -NoTypeInformation -Force

$StartTime = Get-Date
$Sample = 0

Write-Host "TIME,MEM_USAGE_MB,MEM_LIMIT_MB,MEM_PERCENT,STATUS" | Tee-Object -FilePath $CSVPath -Append

while (((Get-Date) - $StartTime).TotalSeconds -lt $Duration) {
    try {
        $Stats = docker stats --no-stream $Container 2>$null | Select-Object -Last 1
        
        if ([string]::IsNullOrEmpty($Stats)) {
            Write-Host "ERROR: Failed to get stats" -ForegroundColor Red
            exit 1
        }
        
        # Parse docker stats output
        $Time = (Get-Date).ToString("HH:mm:ss")
        
        # Extract memory info (e.g., "150MiB / 2GiB")
        $MemMatch = $Stats -match '(\d+\.?\d*)(MiB|GiB)\s*/\s*(\d+\.?\d*)(MiB|GiB)'
        
        if ($MemMatch) {
            $MemUsage = $matches[1]
            $MemUsageUnit = $matches[2]
            $MemLimit = $matches[3]
            $MemLimitUnit = $matches[4]
            
            # Convert to MB
            if ($MemUsageUnit -eq "GiB") {
                $MemUsageMB = [math]::Round($MemUsage * 1024, 1)
            } else {
                $MemUsageMB = [math]::Round($MemUsage, 1)
            }
            
            if ($MemLimitUnit -eq "GiB") {
                $MemLimitMB = [math]::Round($MemLimit * 1024, 1)
            } else {
                $MemLimitMB = [math]::Round($MemLimit, 1)
            }
            
            # Calculate percentage
            $MemPercent = [math]::Round(($MemUsageMB / $MemLimitMB) * 100, 1)
            $MemPercentInt = [int]$MemPercent
            
            # Determine status
            if ($MemPercentInt -gt $AlertThreshold) {
                $Status = "⚠️ HIGH"
                $Color = "Yellow"
            } else {
                $Status = "✓ OK"
                $Color = "Green"
            }
            
            # Print current sample
            $Output = "[{0}] {1:F1}MB / {2:F0}MB ({3:F1}%) {4}" -f $Time, $MemUsageMB, $MemLimitMB, $MemPercent, $Status
            Write-Host $Output -ForegroundColor $Color
            
            # Log to CSV
            "$Time,$MemUsageMB,$MemLimitMB,$MemPercent,$Status" | Out-File -FilePath $CSVPath -Append
            
            $Sample++
        }
    }
    catch {
        Write-Host "Error: $_" -ForegroundColor Red
    }
    
    Start-Sleep -Seconds 2
}

Write-Host ""
Write-Host "=== Monitoring Complete ===" -ForegroundColor Cyan
Write-Host "Total samples: $Sample"
Write-Host ""

# Calculate statistics
Write-Host "=== Memory Statistics ===" -ForegroundColor Cyan

$Data = @()
Get-Content $CSVPath | Select-Object -Skip 1 | ForEach-Object {
    $parts = $_ -split ','
    if ($parts.Count -ge 4) {
        $Data += [PSCustomObject]@{
            Time = $parts[0]
            Usage = [double]$parts[1]
            Limit = [double]$parts[2]
            Percent = [double]$parts[3]
        }
    }
}

if ($Data.Count -gt 0) {
    $MinUsage = ($Data | Measure-Object -Property Usage -Minimum).Minimum
    $MaxUsage = ($Data | Measure-Object -Property Usage -Maximum).Maximum
    $AvgUsage = ($Data | Measure-Object -Property Usage -Average).Average
    $MinPercent = ($Data | Measure-Object -Property Percent -Minimum).Minimum
    $MaxPercent = ($Data | Measure-Object -Property Percent -Maximum).Maximum
    $AvgPercent = ($Data | Measure-Object -Property Percent -Average).Average
    
    Write-Host "Minimum: $([math]::Round($MinUsage, 1))MB ($([math]::Round($MinPercent, 1))%)"
    Write-Host "Average: $([math]::Round($AvgUsage, 1))MB ($([math]::Round($AvgPercent, 1))%)"
    Write-Host "Maximum: $([math]::Round($MaxUsage, 1))MB ($([math]::Round($MaxPercent, 1))%)"
}

# Check for anomalies
Write-Host ""
Write-Host "=== Anomaly Detection ===" -ForegroundColor Cyan

$MaxGrowth = 0
$Prev = $null

foreach ($Item in $Data) {
    if ($Prev -ne $null) {
        $Growth = $Item.Usage - $Prev.Usage
        if ($Growth -gt $MaxGrowth) {
            $MaxGrowth = $Growth
        }
    }
    $Prev = $Item
}

Write-Host "Maximum spike: $([math]::Round($MaxGrowth, 1))MB between samples"

$HighCount = ($Data | Where-Object { $_.Percent -gt $AlertThreshold }).Count

if ($HighCount -gt 0) {
    Write-Host "⚠️ WARNING: Memory exceeded ${AlertThreshold}% threshold $HighCount times" -ForegroundColor Yellow
} else {
    Write-Host "✓ Memory stayed below ${AlertThreshold}% threshold" -ForegroundColor Green
}

Write-Host ""
Write-Host "Full CSV data saved to: $CSVPath" -ForegroundColor Gray
Write-Host "To view: Get-Content $CSVPath" -ForegroundColor Gray
