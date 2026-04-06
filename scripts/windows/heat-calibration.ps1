$ErrorActionPreference = "Stop"

param(
    [ValidateSet("mild", "medium", "high")]
    [string]$Profile = "mild",
    [int]$DurationSeconds = 180,
    [int]$SampleIntervalSeconds = 3,
    [string]$DashboardStateUrl = "http://localhost:3088/api/state",
    [string]$OutputDir = ""
)

function Get-ProfileSettings([string]$Name) {
    switch ($Name) {
        "mild" {
            return @{
                LoadFraction = 0.25
                Notes = "Short low-intensity calibration pass."
            }
        }
        "medium" {
            return @{
                LoadFraction = 0.50
                Notes = "Moderate sustained load."
            }
        }
        "high" {
            return @{
                LoadFraction = 0.75
                Notes = "Stronger sustained load. Use with care."
            }
        }
        default {
            throw "Unknown profile: $Name"
        }
    }
}

function New-LoadJobs([int]$Count) {
    $jobs = @()
    for ($i = 0; $i -lt $Count; $i++) {
        $jobs += Start-Job -ScriptBlock {
            while ($true) {
                1..8000 | ForEach-Object { [void][Math]::Sqrt($_ * (Get-Random -Minimum 1 -Maximum 1000)) }
            }
        }
    }
    return $jobs
}

function Stop-LoadJobs([System.Collections.IEnumerable]$Jobs) {
    if (-not $Jobs) { return }
    $Jobs | ForEach-Object {
        try { Stop-Job -Job $_ -ErrorAction SilentlyContinue } catch {}
    }
    $Jobs | ForEach-Object {
        try { Remove-Job -Job $_ -Force -ErrorAction SilentlyContinue } catch {}
    }
}

function Get-WindowsCpuSnapshot {
    $processors = @(Get-CimInstance Win32_Processor)
    if ($processors.Count -eq 0) {
        throw "No Win32_Processor instances found."
    }

    $logicalProcessors = ($processors | Measure-Object -Property NumberOfLogicalProcessors -Sum).Sum
    $currentClockMhz = [math]::Round((($processors | Measure-Object -Property CurrentClockSpeed -Average).Average), 1)
    $maxClockMhz = [math]::Round((($processors | Measure-Object -Property MaxClockSpeed -Average).Average), 1)
    $loadPct = [math]::Round((($processors | Measure-Object -Property LoadPercentage -Average).Average), 1)

    $utilityPct = $null
    $performancePct = $null
    $frequencyMhz = $null
    try {
        $counterSamples = (Get-Counter '\Processor Information(_Total)\% Processor Utility',
            '\Processor Information(_Total)\% Processor Performance',
            '\Processor Information(_Total)\Processor Frequency').CounterSamples
        foreach ($sample in $counterSamples) {
            if ($sample.Path -like '*% Processor Utility') {
                $utilityPct = [math]::Round($sample.CookedValue, 1)
            } elseif ($sample.Path -like '*% Processor Performance') {
                $performancePct = [math]::Round($sample.CookedValue, 1)
            } elseif ($sample.Path -like '*Processor Frequency') {
                $frequencyMhz = [math]::Round($sample.CookedValue, 1)
            }
        }
    } catch {
    }

    return @{
        logical_processors = $logicalProcessors
        cpu_load_pct = $loadPct
        current_clock_mhz = $currentClockMhz
        max_clock_mhz = $maxClockMhz
        processor_utility_pct = $utilityPct
        processor_performance_pct = $performancePct
        processor_frequency_mhz = $frequencyMhz
    }
}

function Get-ShostLaptopSnapshot([string]$StateUrl) {
    try {
        $state = Invoke-RestMethod -Uri $StateUrl -Method Get -TimeoutSec 5
        $laptop = @($state.hosts) | Where-Object { $_.id -eq "laptop" } | Select-Object -First 1
        if ($null -eq $laptop) {
            return @{
                shost_status = "missing"
            }
        }

        return @{
            shost_status = $laptop.status
            shost_cpu_pct = $laptop.metrics.cpu_pct
            shost_ram_pct = $laptop.metrics.ram_pct
            shost_temp_c = $laptop.metrics.temp_c
            shost_ambient_temp_c = $laptop.metrics.ambient_temp_c
            shost_surface_temp_c = $laptop.metrics.surface_temp_c
            shost_temp_source = $laptop.metrics.temp_source
        }
    } catch {
        return @{
            shost_status = "error"
            shost_error = $_.Exception.Message
        }
    }
}

$profileSettings = Get-ProfileSettings $Profile
$logicalProcessors = [Environment]::ProcessorCount
$workerCount = [Math]::Max(1, [Math]::Ceiling($logicalProcessors * $profileSettings.LoadFraction))
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"

if (-not $OutputDir) {
    $OutputDir = Join-Path $PSScriptRoot "..\..\runtime\thermal-tests\$timestamp-$Profile"
}

New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null

$metadata = @{
    started_at = (Get-Date).ToString("o")
    profile = $Profile
    duration_seconds = $DurationSeconds
    sample_interval_seconds = $SampleIntervalSeconds
    logical_processors = $logicalProcessors
    worker_count = $workerCount
    load_fraction = $profileSettings.LoadFraction
    notes = $profileSettings.Notes
    dashboard_state_url = $DashboardStateUrl
}

$metadata | ConvertTo-Json | Set-Content -Path (Join-Path $OutputDir "metadata.json")

$jobs = @()
$samples = New-Object System.Collections.Generic.List[object]

Write-Host "Profile: $Profile"
Write-Host "Duration: $DurationSeconds s"
Write-Host "Workers: $workerCount / $logicalProcessors"
Write-Host "Output: $OutputDir"
Write-Host "Close non-essential apps before running stronger profiles."
Write-Host ""

try {
    $jobs = New-LoadJobs -Count $workerCount
    $endTime = (Get-Date).AddSeconds($DurationSeconds)

    while ((Get-Date) -lt $endTime) {
        $sampleTime = Get-Date
        $windowsCpu = Get-WindowsCpuSnapshot
        $shost = Get-ShostLaptopSnapshot -StateUrl $DashboardStateUrl

        $sample = [pscustomobject]@{
            timestamp = $sampleTime.ToString("o")
            elapsed_seconds = [math]::Round(($sampleTime - [datetime]$metadata.started_at).TotalSeconds, 1)
            profile = $Profile
            worker_count = $workerCount
            cpu_load_pct = $windowsCpu.cpu_load_pct
            current_clock_mhz = $windowsCpu.current_clock_mhz
            max_clock_mhz = $windowsCpu.max_clock_mhz
            processor_utility_pct = $windowsCpu.processor_utility_pct
            processor_performance_pct = $windowsCpu.processor_performance_pct
            processor_frequency_mhz = $windowsCpu.processor_frequency_mhz
            shost_status = $shost.shost_status
            shost_cpu_pct = $shost.shost_cpu_pct
            shost_ram_pct = $shost.shost_ram_pct
            shost_temp_c = $shost.shost_temp_c
            shost_ambient_temp_c = $shost.shost_ambient_temp_c
            shost_surface_temp_c = $shost.shost_surface_temp_c
            shost_temp_source = $shost.shost_temp_source
            shost_error = $shost.shost_error
        }

        $samples.Add($sample) | Out-Null
        $sample | ConvertTo-Json -Compress | Add-Content -Path (Join-Path $OutputDir "samples.ndjson")

        Write-Host ("[{0}] CPU {1}% | Freq {2} MHz | Perf {3}% | Shost Surface {4} C | Ambient {5} C" -f `
            $sampleTime.ToString("HH:mm:ss"),
            $sample.cpu_load_pct,
            $sample.processor_frequency_mhz,
            $sample.processor_performance_pct,
            $sample.shost_surface_temp_c,
            $sample.shost_ambient_temp_c)

        Start-Sleep -Seconds $SampleIntervalSeconds
    }
} finally {
    Stop-LoadJobs -Jobs $jobs
}

$samples | Export-Csv -NoTypeInformation -Path (Join-Path $OutputDir "samples.csv")
$summary = @{
    completed_at = (Get-Date).ToString("o")
    sample_count = $samples.Count
    max_cpu_load_pct = ($samples | Measure-Object -Property cpu_load_pct -Maximum).Maximum
    max_processor_frequency_mhz = ($samples | Measure-Object -Property processor_frequency_mhz -Maximum).Maximum
    max_shost_surface_temp_c = ($samples | Measure-Object -Property shost_surface_temp_c -Maximum).Maximum
    max_shost_ambient_temp_c = ($samples | Measure-Object -Property shost_ambient_temp_c -Maximum).Maximum
}
$summary | ConvertTo-Json | Set-Content -Path (Join-Path $OutputDir "summary.json")

Write-Host ""
Write-Host "Test complete."
Write-Host "Samples: $(Join-Path $OutputDir 'samples.csv')"
Write-Host "Summary: $(Join-Path $OutputDir 'summary.json')"
