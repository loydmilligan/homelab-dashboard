import type { DashboardState } from '../types/inventory';

// Try API first, fallback to static file
const API_URL = '/api/state';
const STATIC_URL = '/state.json';

export async function fetchState(): Promise<DashboardState> {
  // Try the live API first
  try {
    const response = await fetch(API_URL, {
      signal: AbortSignal.timeout(3000)
    });
    if (response.ok) {
      return response.json();
    }
  } catch {
    // API not available, fall back to static
    console.log('API not available, using static state.json');
  }

  // Fallback to static file
  const response = await fetch(STATIC_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch state: ${response.status}`);
  }
  return response.json();
}
