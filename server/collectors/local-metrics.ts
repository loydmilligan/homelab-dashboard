/**
 * Collects local system metrics using systeminformation
 */

import si from 'systeminformation';

export interface LocalMetrics {
  cpu: number;
  ram: number;
  disk: number;
  uptime: number;
  temp: number | null;
}

export async function collectLocalMetrics(): Promise<LocalMetrics> {
  try {
    const [cpu, mem, disk, time, temp] = await Promise.all([
      si.currentLoad(),
      si.mem(),
      si.fsSize(),
      si.time(),
      si.cpuTemperature(),
    ]);

    // Calculate disk usage for root filesystem
    const rootDisk = disk.find(d => d.mount === '/') || disk[0];
    const diskPct = rootDisk ? Math.round((rootDisk.used / rootDisk.size) * 100) : 0;

    return {
      cpu: Math.round(cpu.currentLoad),
      ram: Math.round((mem.used / mem.total) * 100),
      disk: diskPct,
      uptime: time.uptime,
      temp: temp.main !== null ? Math.round(temp.main) : null,
    };
  } catch (error) {
    console.error('Error collecting local metrics:', error);
    return {
      cpu: 0,
      ram: 0,
      disk: 0,
      uptime: 0,
      temp: null,
    };
  }
}
