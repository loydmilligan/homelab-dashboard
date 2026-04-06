import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Router } from 'express';
import { load, dump } from 'js-yaml';
import type { Service } from '../collectors/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SERVICES_FILE = join(__dirname, '..', '..', 'inventory', 'services.yaml');

// Fields that are runtime-only and should not be persisted to YAML
const RUNTIME_FIELDS = ['status', 'container_status', 'response_ms', 'last_check'] as const;

function readServices(): Service[] {
  if (!existsSync(SERVICES_FILE)) return [];
  const content = readFileSync(SERVICES_FILE, 'utf-8');
  const parsed = load(content) as { services?: Service[] };
  return parsed.services ?? [];
}

function writeServices(services: Service[]): void {
  const clean = services.map((s) => {
    const copy = { ...s };
    for (const field of RUNTIME_FIELDS) delete (copy as Record<string, unknown>)[field];
    // Drop undefined fields
    for (const key of Object.keys(copy)) {
      if ((copy as Record<string, unknown>)[key] === undefined) {
        delete (copy as Record<string, unknown>)[key];
      }
    }
    return copy;
  });
  const content =
    '# Homelab Services Inventory\n# Edit this file to add/modify services\n\n' +
    dump({ services: clean }, { lineWidth: -1 });
  writeFileSync(SERVICES_FILE, content, 'utf-8');
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

const router = Router();

router.post('/', (req, res) => {
  const services = readServices();
  const body = req.body as Partial<Service> & { id?: string };

  if (!body.name || !body.host_id || !body.category) {
    res.status(400).json({ error: 'name, host_id, and category are required' });
    return;
  }

  const id = body.id?.trim() || slugify(body.name);
  if (services.some((s) => s.id === id)) {
    res.status(409).json({ error: `Service with id '${id}' already exists` });
    return;
  }

  const service: Partial<Service> = {
    id,
    name: body.name,
    host_id: body.host_id,
    category: body.category,
    status: 'unknown' as const,
  };
  if (body.url) service.url = body.url;
  if (body.check_type) service.check_type = body.check_type;
  if (body.check_target) service.check_target = body.check_target;
  if (body.container_name) service.container_name = body.container_name;
  if (body.tags?.length) service.tags = body.tags;
  if (body.exposes?.length) service.exposes = body.exposes;
  if (body.depends_on?.length) service.depends_on = body.depends_on;
  if (body.backup_policy) service.backup_policy = body.backup_policy;

  services.push(service as Service);
  writeServices(services);
  res.status(201).json({ service });
});

router.put('/:id', (req, res) => {
  const services = readServices();
  const idx = services.findIndex((s) => s.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Service not found' });
    return;
  }

  const body = req.body as Partial<Service>;
  const existing = services[idx];

  services[idx] = {
    ...existing,
    ...(body.name !== undefined && { name: body.name }),
    ...(body.host_id !== undefined && { host_id: body.host_id }),
    ...(body.category !== undefined && { category: body.category }),
    url: body.url || undefined,
    check_type: body.check_type || undefined,
    check_target: body.check_target || undefined,
    container_name: body.container_name || undefined,
    tags: body.tags?.length ? body.tags : undefined,
    exposes: body.exposes?.length ? body.exposes : undefined,
    depends_on: body.depends_on?.length ? body.depends_on : undefined,
    backup_policy: body.backup_policy || undefined,
  };

  writeServices(services);
  res.json({ service: services[idx] });
});

router.delete('/:id', (req, res) => {
  const services = readServices();
  const idx = services.findIndex((s) => s.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Service not found' });
    return;
  }

  services.splice(idx, 1);
  writeServices(services);
  res.status(204).send();
});

export { router as servicesRouter };
