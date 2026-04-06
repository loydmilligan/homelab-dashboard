$ErrorActionPreference = "Stop"

$defaultWslPath = "/home/mmariani/Projects/homelab-dashboard/runtime/laptop-temp.json"
$targetWslPath = if ($args.Length -gt 0 -and $args[0]) { $args[0] } else { $defaultWslPath }

function Convert-TenthsKelvinToCelsius([double]$value) {
    return [math]::Round(($value / 10.0) - 273.15, 1)
}

function Get-ThermalZoneTemperature {
    try {
        $zones = Get-CimInstance MSAcpi_ThermalZoneTemperature -Namespace root/wmi -ErrorAction Stop
        $valid = @($zones | Where-Object { $_.CurrentTemperature -gt 0 })
        if ($valid.Count -gt 0) {
            return @{
                temp_c = (Convert-TenthsKelvinToCelsius $valid[0].CurrentTemperature)
                source = "MSAcpi_ThermalZoneTemperature"
            }
        }
    } catch {
    }

    try {
        $ohm = Get-CimInstance -Namespace root/OpenHardwareMonitor -ClassName Sensor -ErrorAction Stop |
            Where-Object { $_.SensorType -eq "Temperature" -and $_.Value -ne $null } |
            Sort-Object Value -Descending |
            Select-Object -First 1
        if ($null -ne $ohm) {
            return @{
                temp_c = [math]::Round([double]$ohm.Value, 1)
                source = "OpenHardwareMonitor"
            }
        }
    } catch {
    }

    try {
        $lhm = Get-CimInstance -Namespace root/LibreHardwareMonitor -ClassName Sensor -ErrorAction Stop |
            Where-Object { $_.SensorType -eq "Temperature" -and $_.Value -ne $null } |
            Sort-Object Value -Descending |
            Select-Object -First 1
        if ($null -ne $lhm) {
            return @{
                temp_c = [math]::Round([double]$lhm.Value, 1)
                source = "LibreHardwareMonitor"
            }
        }
    } catch {
    }

    return $null
}

$reading = Get-ThermalZoneTemperature
if ($null -eq $reading) {
    Write-Error "No supported Windows temperature source was available."
    exit 1
}

$payload = @{
    temp_c = $reading.temp_c
    source = $reading.source
    collected_at = [DateTime]::UtcNow.ToString("o")
} | ConvertTo-Json -Compress

$escapedPayload = $payload.Replace("'", "''")
$escapedPath = $targetWslPath.Replace("'", "''")
wsl.exe sh -lc "mkdir -p \$(dirname '$escapedPath') && printf '%s' '$escapedPayload' > '$escapedPath'"

Write-Output "Wrote laptop temperature $($reading.temp_c)C from $($reading.source) to $targetWslPath"
