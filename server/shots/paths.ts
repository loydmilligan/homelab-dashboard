import { realpathSync } from 'node:fs';
import path from 'node:path';

const DISALLOWED_SOURCE_PATHS = new Set(['/', '/proc', '/sys', '/dev', '/run']);
const DEFAULT_ALLOWED_SOURCE_ROOTS = ['/home', '/srv', '/mnt', '/opt', '/tmp'];

function normalizePath(value: string) {
  return path.posix.normalize(value);
}

function resolveAllowedRoots() {
  const configured = process.env.SHOTS_SOURCE_ROOTS
    ?.split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);

  return (configured && configured.length > 0 ? configured : DEFAULT_ALLOWED_SOURCE_ROOTS).map(
    normalizePath,
  );
}

function isWithinRoot(candidate: string, root: string) {
  return candidate === root || candidate.startsWith(`${root}/`);
}

export function validateShotPath(inputPath: string, kind: 'source' | 'destination') {
  if (!inputPath.startsWith('/')) {
    return `${kind} path must be absolute`;
  }

  const normalized = normalizePath(inputPath);

  if (kind === 'source') {
    if (DISALLOWED_SOURCE_PATHS.has(normalized)) {
      return `${kind} path is not allowed`;
    }

    const allowedRoots = resolveAllowedRoots();
    if (!allowedRoots.some((root) => isWithinRoot(normalized, root))) {
      return `${kind} path must be within one of: ${allowedRoots.join(', ')}`;
    }
  }

  return null;
}

export function tryRealpath(inputPath: string) {
  try {
    return realpathSync(inputPath);
  } catch {
    return inputPath;
  }
}
