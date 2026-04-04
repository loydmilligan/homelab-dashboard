import type { DashboardState } from '../types/inventory';

const STATE_URL = '/state.json';

export async function fetchState(): Promise<DashboardState> {
  const response = await fetch(STATE_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch state: ${response.status}`);
  }
  return response.json();
}
