/**
 * Home Assistant IoT collector.
 */

import type { Device, IoTHub } from './types.js';

const DEFAULT_HA_PORT = '8123';
const TIMEOUT_MS = 8000;

type HaState = {
  entity_id: string;
  state: string;
  last_changed?: string;
  attributes?: {
    friendly_name?: string;
    device_class?: string;
    unit_of_measurement?: string;
    battery_level?: number;
    [key: string]: unknown;
  };
};

const AREA_KEYWORDS: Array<{ match: RegExp; area: string }> = [
  { match: /bathroom/i, area: 'bathroom' },
  { match: /bedroom/i, area: 'bedroom' },
  { match: /closet/i, area: 'closet' },
  { match: /entry|doorbell|front door/i, area: 'entry' },
  { match: /hall/i, area: 'hallway' },
  { match: /kitchen/i, area: 'kitchen' },
  { match: /laundry|washing machine|dryer/i, area: 'laundry-room' },
  { match: /living/i, area: 'living-room' },
  { match: /office|desk|laptop/i, area: 'office' },
];

const EXCLUDED_PATTERNS = [
  /backup/i,
  /^sensor\.sun_/,
  /pixel/i,
  /bridge/i,
  /turntable/i,
  /3dprinter/i,
  /power strip/i,
  /energy/i,
  /current/i,
  /voltage/i,
  /frequency/i,
];

function getHaConfig() {
  const token = process.env.HA_LONG_LIVED_ACCESS_TOKEN?.trim();
  const host = process.env.HA_HOST?.trim();
  const port = process.env.HA_PORT?.trim() || DEFAULT_HA_PORT;

  if (!token || !host) {
    return null;
  }

  return {
    token,
    baseUrl: `http://${host}:${port}`,
  };
}

function normalizeName(value: string) {
  return value
    .replace(/\b(door|occupancy|motion|battery|temperature|humidity)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function inferArea(input: string) {
  for (const entry of AREA_KEYWORDS) {
    if (entry.match.test(input)) {
      return entry.area;
    }
  }
  return undefined;
}

function isExcluded(state: HaState) {
  const haystack = `${state.entity_id} ${state.attributes?.friendly_name ?? ''}`;
  return EXCLUDED_PATTERNS.some((pattern) => pattern.test(haystack));
}

function baseKeyForEntity(state: HaState) {
  const id = state.entity_id.replace(/^(binary_sensor|sensor)\./, '');

  return id
    .replace(/_(battery_low|battery|voltage|contact|occupancy|motion|temperature|humidity)$/i, '')
    .replace(/__+/g, '_');
}

function classifyDevice(state: HaState): Device['type'] | null {
  const deviceClass = state.attributes?.device_class ?? '';
  const haystack = `${state.entity_id} ${state.attributes?.friendly_name ?? ''}`.toLowerCase();

  if (['door', 'opening'].includes(deviceClass) || haystack.includes('contact')) {
    return 'contact';
  }
  if (['occupancy', 'motion', 'presence'].includes(deviceClass) || haystack.includes('motion')) {
    return 'motion';
  }
  if (deviceClass === 'temperature') {
    return 'temperature';
  }
  if (deviceClass === 'humidity') {
    return 'humidity';
  }
  if (['moisture', 'smoke', 'gas', 'safety'].includes(deviceClass) || /leak|smoke/.test(haystack)) {
    return 'safety';
  }
  return null;
}

function mapStateToStatus(state: HaState): Device['status'] {
  if (state.state === 'unavailable' || state.state === 'unknown') {
    return 'offline';
  }
  return 'online';
}

function valueFromState(state: HaState) {
  const unit = state.attributes?.unit_of_measurement;
  if (unit) {
    return `${state.state}${unit}`;
  }
  if (state.state === 'on') {
    return 'active';
  }
  if (state.state === 'off') {
    return 'idle';
  }
  return state.state;
}

async function fetchHaStates(config: { token: string; baseUrl: string }) {
  const response = await fetch(`${config.baseUrl}/api/states`, {
    headers: {
      Authorization: `Bearer ${config.token}`,
      'Content-Type': 'application/json',
    },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`Home Assistant request failed with status ${response.status}`);
  }

  return (await response.json()) as HaState[];
}

export async function collectHomeAssistantIot(
  configuredHubs: IoTHub[],
): Promise<{ iot_hubs: IoTHub[]; devices: Device[] }> {
  const config = getHaConfig();
  if (!config) {
    return { iot_hubs: configuredHubs, devices: [] };
  }

  try {
    const states = await fetchHaStates(config);
    const batteryByBaseKey = new Map<string, number>();
    const relevant: HaState[] = [];

    for (const state of states) {
      if (isExcluded(state)) {
        continue;
      }

      const deviceClass = state.attributes?.device_class ?? '';
      const key = baseKeyForEntity(state);

      if (deviceClass === 'battery' || /_battery$/i.test(state.entity_id)) {
        const batteryValue = Number(state.state);
        if (!Number.isNaN(batteryValue)) {
          batteryByBaseKey.set(key, Math.round(batteryValue));
        }
        continue;
      }

      if (classifyDevice(state)) {
        relevant.push(state);
      }
    }

    const devices: Device[] = relevant.map((state) => {
      const type = classifyDevice(state) ?? 'sensor';
      const friendlyName = state.attributes?.friendly_name ?? state.entity_id;
      const area = inferArea(`${state.entity_id} ${friendlyName}`);
      const battery = batteryByBaseKey.get(baseKeyForEntity(state));

      return {
        id: state.entity_id,
        name: normalizeName(friendlyName) || friendlyName,
        hub_id: 'zigbee2mqtt',
        type,
        area,
        status: mapStateToStatus(state),
        last_seen: state.last_changed,
        attributes: {
          battery_pct: battery,
          value: valueFromState(state),
          device_class: state.attributes?.device_class,
          unit: state.attributes?.unit_of_measurement,
        },
      };
    });

    const zigbeeHub = configuredHubs.find((hub) => hub.id === 'zigbee2mqtt');
    const mqttHub = configuredHubs.find((hub) => hub.id === 'mqtt-broker');
    const updatedHubs = configuredHubs.map((hub) => {
      if (hub.id === zigbeeHub?.id) {
        return {
          ...hub,
          device_count: devices.length,
          status: devices.some((device) => device.status === 'online') ? 'online' : 'degraded',
          last_seen: new Date().toISOString(),
        };
      }
      if (hub.id === mqttHub?.id) {
        return {
          ...hub,
          status: 'online',
          last_seen: new Date().toISOString(),
        };
      }
      return hub;
    });

    return { iot_hubs: updatedHubs, devices };
  } catch (error) {
    console.error('Failed to collect Home Assistant IoT state:', error);
    return {
      iot_hubs: configuredHubs.map((hub) => ({ ...hub, status: 'degraded' })),
      devices: [],
    };
  }
}
