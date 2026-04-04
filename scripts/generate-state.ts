#!/usr/bin/env node

/**
 * Generates state.json from inventory YAML files.
 *
 * Usage:
 *   npx tsx scripts/generate-state.ts
 *   # or:
 *   npm run generate
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { load } from 'js-yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const INVENTORY_DIR = join(__dirname, '..', 'inventory');
const OUTPUT_FILE = join(__dirname, '..', 'public', 'state.json');

interface InventoryFile {
  hosts?: unknown[];
  services?: unknown[];
  network_devices?: unknown[];
  access_paths?: unknown[];
  iot_hubs?: unknown[];
  devices?: unknown[];
  checks?: unknown[];
  backups?: unknown[];
}

function loadYaml(filename: string): InventoryFile {
  const filepath = join(INVENTORY_DIR, filename);
  if (!existsSync(filepath)) {
    console.warn(`Warning: ${filename} not found, skipping`);
    return {};
  }
  const content = readFileSync(filepath, 'utf-8');
  return load(content) as InventoryFile;
}

function main() {
  console.log('Loading inventory files...');

  const hosts = loadYaml('hosts.yaml');
  const services = loadYaml('services.yaml');
  const network = loadYaml('network.yaml');
  const iot = loadYaml('iot.yaml');
  const backups = loadYaml('backups.yaml');

  const state = {
    hosts: hosts.hosts ?? [],
    services: services.services ?? [],
    network_devices: network.network_devices ?? [],
    access_paths: network.access_paths ?? [],
    iot_hubs: iot.iot_hubs ?? [],
    devices: iot.devices ?? [],
    checks: [],
    backups: backups.backups ?? [],
    generated_at: new Date().toISOString(),
  };

  // Ensure public directory exists
  const publicDir = dirname(OUTPUT_FILE);
  if (!existsSync(publicDir)) {
    mkdirSync(publicDir, { recursive: true });
  }

  writeFileSync(OUTPUT_FILE, JSON.stringify(state, null, 2));
  console.log(`Generated ${OUTPUT_FILE}`);
  console.log(`  - ${state.hosts.length} hosts`);
  console.log(`  - ${state.services.length} services`);
  console.log(`  - ${state.network_devices.length} network devices`);
  console.log(`  - ${state.access_paths.length} access paths`);
  console.log(`  - ${state.iot_hubs.length} IoT hubs`);
  console.log(`  - ${state.devices.length} devices`);
  console.log(`  - ${state.backups.length} backups`);
}

main();
