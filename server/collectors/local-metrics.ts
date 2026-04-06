/**
 * Collects local system metrics using systeminformation
 */

import si from 'systeminformation';

export interface LocalMetrics {
  cpu: number;
  ram: number;
  ramTotalMb: number;
  ramUsedMb: number;
  disk: number;
  uptime: number;
  temp: number | null;
  topCpu: Array<{
    user: string;
    pid: string;
    cpu_pct: number;
    mem_pct: number;
    command: string;
  }>;
  topMem: Array<{
    user: string;
    pid: string;
    cpu_pct: number;
    mem_pct: number;
    command: string;
  }>;
  disks: Array<{
    filesystem: string;
    size: string;
    used: string;
    available: string;
    use_pct: number;
    mount: string;
  }>;
}

export async function collectLocalMetrics(): Promise<LocalMetrics> {
  try {
    const [cpu, mem, disks, time, temp, processes] = await Promise.all([
      si.currentLoad(),
      si.mem(),
      si.fsSize(),
      si.time(),
      si.cpuTemperature(),
      si.processes(),
    ]);

    // Calculate disk usage for root filesystem
    const rootDisk = disks.find(d => d.mount === '/') || disks[0];
    const diskPct = rootDisk ? Math.round((rootDisk.used / rootDisk.size) * 100) : 0;
    const processList = processes.list ?? [];
    const topCpu = processList
      .filter((process) => process.pid != null)
      .sort((a, b) => (b.pcpu ?? 0) - (a.pcpu ?? 0))
      .slice(0, 5)
      .map((process) => ({
        user: process.user || 'unknown',
        pid: String(process.pid),
        cpu_pct: Math.round((process.pcpu ?? 0) * 10) / 10,
        mem_pct: Math.round((process.pmem ?? 0) * 10) / 10,
        command: (process.name || process.command || 'unknown').slice(0, 50),
      }));
    const topMem = processList
      .filter((process) => process.pid != null)
      .sort((a, b) => (b.pmem ?? 0) - (a.pmem ?? 0))
      .slice(0, 5)
      .map((process) => ({
        user: process.user || 'unknown',
        pid: String(process.pid),
        cpu_pct: Math.round((process.pcpu ?? 0) * 10) / 10,
        mem_pct: Math.round((process.pmem ?? 0) * 10) / 10,
        command: (process.name || process.command || 'unknown').slice(0, 50),
      }));
    const diskBreakdown = disks.map((disk) => ({
      filesystem: disk.fs,
      size: `${Math.round(disk.size / (1024 ** 3))}G`,
      used: `${Math.round(disk.used / (1024 ** 3))}G`,
      available: `${Math.round((disk.size - disk.used) / (1024 ** 3))}G`,
      use_pct: Math.round(disk.use),
      mount: disk.mount || disk.fs,
    }));

    return {
      cpu: Math.round(cpu.currentLoad),
      ram: Math.round((mem.used / mem.total) * 100),
      ramTotalMb: Math.round(mem.total / (1024 ** 2)),
      ramUsedMb: Math.round(mem.used / (1024 ** 2)),
      disk: diskPct,
      uptime: time.uptime,
      temp: temp.main !== null ? Math.round(temp.main) : null,
      topCpu,
      topMem,
      disks: diskBreakdown,
    };
  } catch (error) {
    console.error('Error collecting local metrics:', error);
    return {
      cpu: 0,
      ram: 0,
      ramTotalMb: 0,
      ramUsedMb: 0,
      disk: 0,
      uptime: 0,
      temp: null,
      topCpu: [],
      topMem: [],
      disks: [],
    };
  }
}
