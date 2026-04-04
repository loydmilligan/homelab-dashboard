/**
 * Collects Docker container status
 */

import Docker from 'dockerode';

const docker = new Docker({ socketPath: '/var/run/docker.sock' });

export interface ContainerInfo {
  id: string;
  name: string;
  image: string;
  status: string;
  running: boolean;
  created: string;
}

export async function collectDockerContainers(): Promise<ContainerInfo[]> {
  try {
    const containers = await docker.listContainers({ all: true });

    return containers.map(c => ({
      id: c.Id.slice(0, 12),
      name: c.Names[0]?.replace(/^\//, '') || 'unknown',
      image: c.Image,
      status: c.Status,
      running: c.State === 'running',
      created: new Date(c.Created * 1000).toISOString(),
    }));
  } catch (error) {
    console.error('Error collecting Docker containers:', error);
    return [];
  }
}

export async function getContainerStats(containerId: string): Promise<{
  cpu: number;
  memory: number;
} | null> {
  try {
    const container = docker.getContainer(containerId);
    const stats = await container.stats({ stream: false });

    // Calculate CPU percentage
    const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage;
    const systemDelta = stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;
    const cpuPercent = systemDelta > 0 ? (cpuDelta / systemDelta) * 100 : 0;

    // Calculate memory percentage
    const memUsage = stats.memory_stats.usage || 0;
    const memLimit = stats.memory_stats.limit || 1;
    const memPercent = (memUsage / memLimit) * 100;

    return {
      cpu: Math.round(cpuPercent * 100) / 100,
      memory: Math.round(memPercent * 100) / 100,
    };
  } catch (error) {
    return null;
  }
}
