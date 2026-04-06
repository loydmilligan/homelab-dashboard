/**
 * Service health checks via HTTP and TCP
 */

import net from 'node:net';

export interface Service {
  id: string;
  url?: string;
  check_type?: 'http' | 'tcp' | 'docker';
  check_target?: string;
  [key: string]: unknown;
}

export interface HealthResult {
  id: string;
  healthy: boolean;
  responseMs: number | null;
  timestamp: string;
  error?: string;
}

const TIMEOUT_MS = 5000;

async function checkUrl(url: string): Promise<{ ok: boolean; ms: number; error?: string }> {
  const start = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      // Don't follow redirects to auth pages
      redirect: 'manual',
    });
    clearTimeout(timeout);
    const ms = Date.now() - start;

    // 2xx or 3xx (redirect) counts as healthy
    const ok = response.status >= 200 && response.status < 400;
    return { ok, ms };
  } catch (error) {
    clearTimeout(timeout);
    const ms = Date.now() - start;
    return {
      ok: false,
      ms,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function checkTcp(target: string): Promise<{ ok: boolean; ms: number; error?: string }> {
  const [host, portValue] = target.split(':');
  const port = Number(portValue);
  if (!host || !Number.isInteger(port) || port <= 0) {
    return { ok: false, ms: 0, error: `Invalid TCP target: ${target}` };
  }

  const start = Date.now();

  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port });
    let settled = false;

    const finish = (ok: boolean, error?: string) => {
      if (settled) {
        return;
      }
      settled = true;
      socket.destroy();
      resolve({
        ok,
        ms: Date.now() - start,
        error,
      });
    };

    socket.setTimeout(TIMEOUT_MS);
    socket.once('connect', () => finish(true));
    socket.once('timeout', () => finish(false, 'Connection timed out'));
    socket.once('error', (error) => finish(false, error.message));
  });
}

export async function checkServiceHealth(services: Service[]): Promise<HealthResult[]> {
  const checkableServices = services.filter((service) => {
    const checkType = service.check_type ?? (service.url ? 'http' : undefined);
    if (!checkType || checkType === 'docker') {
      return false;
    }
    return Boolean(service.check_target ?? service.url);
  });

  const results = await Promise.all(
    checkableServices.map(async (service) => {
      const checkType = service.check_type ?? 'http';
      const target = service.check_target ?? service.url!;
      const result = checkType === 'tcp'
        ? await checkTcp(target)
        : await checkUrl(target);
      return {
        id: service.id,
        healthy: result.ok,
        responseMs: result.ms,
        timestamp: new Date().toISOString(),
        error: result.error,
      };
    })
  );

  return results;
}
