/**
 * Service health checks via HTTP
 */

export interface Service {
  id: string;
  url?: string;
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

export async function checkServiceHealth(services: Service[]): Promise<HealthResult[]> {
  const servicesWithUrls = services.filter(s => s.url);

  const results = await Promise.all(
    servicesWithUrls.map(async (service) => {
      const result = await checkUrl(service.url!);
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
