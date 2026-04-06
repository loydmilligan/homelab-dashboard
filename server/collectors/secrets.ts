/**
 * Secret metadata collector.
 */

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { load } from 'js-yaml';
import type { SecretRecord } from './types.js';

type SecretsInventory = {
  secrets?: SecretRecord[];
};

function envFilePath() {
  return join(process.cwd(), '.env');
}

function loadRuntimeEnvNames() {
  return new Set(
    Object.entries(process.env)
      .filter(([, value]) => typeof value === 'string' && value.length > 0)
      .map(([name]) => name),
  );
}

function loadEnvNames() {
  const names = loadRuntimeEnvNames();
  const file = envFilePath();

  if (!existsSync(file)) {
    return names;
  }

  const content = readFileSync(file, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }
    const index = trimmed.indexOf('=');
    if (index > 0) {
      names.add(trimmed.slice(0, index));
    }
  }

  return names;
}

function normalizeSecrets(items: SecretRecord[] | undefined, envNames: Set<string>) {
  return (items ?? []).map((item) => ({
    ...item,
    status: envNames.has(item.name) ? 'present' : 'missing',
  }));
}

export function collectSecretInventory(inventoryDir: string) {
  const file = join(inventoryDir, 'secrets.yaml');
  if (!existsSync(file)) {
    return [] as SecretRecord[];
  }

  const content = readFileSync(file, 'utf8');
  const data = load(content) as SecretsInventory;
  return normalizeSecrets(data.secrets, loadEnvNames());
}
