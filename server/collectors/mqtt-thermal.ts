import mqtt from 'mqtt';

export interface LaptopThermalReading {
  sensor?: string;
  ambient_temp_c?: number;
  object_temp_c?: number;
  surface_temp_c?: number;
  ts_monotonic_s?: number;
  received_at: string;
}

interface MqttThermalConfig {
  host: string;
  port: number;
  topic: string;
  username?: string;
  password?: string;
}

let cachedReading: LaptopThermalReading | null = null;
let subscriptionStarted = false;

function getConfig(): MqttThermalConfig | null {
  const host = process.env.MQTT_HOST?.trim();
  const topic = process.env.MQTT_TOPIC?.trim();
  if (!host || !topic) return null;
  const port = Number(process.env.MQTT_PORT ?? '1883');
  return {
    host,
    port: Number.isFinite(port) ? port : 1883,
    topic,
    username: process.env.MQTT_USERNAME?.trim() || undefined,
    password: process.env.MQTT_PASSWORD?.trim() || undefined,
  };
}

function normalizeReading(payload: unknown): LaptopThermalReading | null {
  if (!payload || typeof payload !== 'object') return null;
  const record = payload as Record<string, unknown>;
  const ambient = typeof record.ambient_temp_c === 'number' ? record.ambient_temp_c : undefined;
  const object = typeof record.object_temp_c === 'number' ? record.object_temp_c : undefined;
  const surface = typeof record.surface_temp_c === 'number' ? record.surface_temp_c : object;
  if (ambient == null && surface == null) return null;
  return {
    sensor: typeof record.sensor === 'string' ? record.sensor : 'mqtt-thermal',
    ambient_temp_c: ambient,
    object_temp_c: object,
    surface_temp_c: surface,
    ts_monotonic_s: typeof record.ts_monotonic_s === 'number' ? record.ts_monotonic_s : undefined,
    received_at: new Date().toISOString(),
  };
}

function startSubscription(): void {
  if (subscriptionStarted) return;
  const config = getConfig();
  if (!config) return;
  subscriptionStarted = true;

  const protocol = config.port === 8883 ? 'mqtts' : 'mqtt';
  const client = mqtt.connect(`${protocol}://${config.host}:${config.port}`, {
    username: config.username,
    password: config.password,
    reconnectPeriod: 5000,
    connectTimeout: 5000,
  });

  client.on('connect', () => {
    client.subscribe(config.topic, { qos: 0 }, (error) => {
      if (error) {
        console.error(`Failed to subscribe to MQTT topic ${config.topic}:`, error);
      }
    });
  });

  client.on('message', (_topic, message) => {
    try {
      const payload = JSON.parse(message.toString('utf8'));
      const reading = normalizeReading(payload);
      if (reading) cachedReading = reading;
    } catch (error) {
      console.error('Failed to parse MQTT thermal payload:', error);
    }
  });

  client.on('error', (error) => {
    console.error('MQTT thermal client error:', error);
  });
}

export function getLaptopMqttThermalReading(): LaptopThermalReading | null {
  startSubscription();
  return cachedReading;
}
