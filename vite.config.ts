import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const BUILD_SEQUENCE_FILE = join(process.cwd(), '.build-sequence');
const BUILD_SEQUENCE_START = 404;

function getBuildNumber(command: 'serve' | 'build') {
  if (command !== 'build') {
    if (!existsSync(BUILD_SEQUENCE_FILE)) {
      return `B${String(BUILD_SEQUENCE_START).padStart(6, '0')}`;
    }

    const currentValue = Number(readFileSync(BUILD_SEQUENCE_FILE, 'utf8').trim());
    return `B${String(currentValue).padStart(6, '0')}`;
  }

  const previousValue = existsSync(BUILD_SEQUENCE_FILE)
    ? Number(readFileSync(BUILD_SEQUENCE_FILE, 'utf8').trim())
    : BUILD_SEQUENCE_START;
  const nextValue = Number.isFinite(previousValue) ? previousValue + 1 : BUILD_SEQUENCE_START + 1;

  writeFileSync(BUILD_SEQUENCE_FILE, `${nextValue}\n`, 'utf8');
  return `B${String(nextValue).padStart(6, '0')}`;
}

export default defineConfig(({ command, mode }) => ({
  plugins: [react(), tailwindcss()],
  define: {
    __BUILD_NUMBER__: JSON.stringify(getBuildNumber(command)),
    'import.meta.env.VITE_CAST_AVAILABLE': JSON.stringify(
      mode === 'production' ? 'true' : process.env.VITE_CAST_AVAILABLE || 'false'
    ),
    'import.meta.env.VITE_WALLBOARD_CAST_URL': JSON.stringify(
      process.env.VITE_WALLBOARD_CAST_URL || 'https://shost-share.wolf-piano.ts.net/wallboard'
    ),
  },
  server: {
    port: 3088,
    host: true,
    allowedHosts: ['shost.mattmariani.com', 'shost-share.wolf-piano.ts.net'],
    proxy: {
      '/api': 'http://localhost:3090',
    },
  },
  build: {
    outDir: 'dist',
  },
}))
