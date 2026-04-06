import { useState, useMemo } from 'react';
import { Card } from '../components/Card';
import { PageHero } from '../components/PageHero';

interface Secret {
  id: string;
  name: string;
  type: 'api_key' | 'token' | 'password' | 'certificate';
  service: string;
  lastRotated: string;
  rotationPolicy: number; // days
}

// Mock data - in production this would come from a secure backend
const mockSecrets: Secret[] = [
  {
    id: 'openrouter-key',
    name: 'OPENROUTER_API_KEY',
    type: 'api_key',
    service: 'OpenRouter',
    lastRotated: '2026-02-15',
    rotationPolicy: 90,
  },
  {
    id: 'ha-token',
    name: 'HA_LONG_LIVED_TOKEN',
    type: 'token',
    service: 'Home Assistant',
    lastRotated: '2025-12-01',
    rotationPolicy: 90,
  },
  {
    id: 'cf-tunnel',
    name: 'CLOUDFLARE_TUNNEL_TOKEN',
    type: 'token',
    service: 'Cloudflare',
    lastRotated: '2025-10-15',
    rotationPolicy: 180,
  },
  {
    id: 'gitea-db',
    name: 'GITEA_DB_PASSWORD',
    type: 'password',
    service: 'Gitea',
    lastRotated: '2026-01-20',
    rotationPolicy: 90,
  },
  {
    id: 'ntfy-auth',
    name: 'NTFY_AUTH_TOKEN',
    type: 'token',
    service: 'ntfy',
    lastRotated: '2026-03-01',
    rotationPolicy: 90,
  },
];

function getDaysSince(dateStr: string): number {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function getRotationStatus(secret: Secret): { status: 'ok' | 'due' | 'overdue'; days: number } {
  const daysSince = getDaysSince(secret.lastRotated);
  const daysUntilDue = secret.rotationPolicy - daysSince;

  if (daysUntilDue < 0) {
    return { status: 'overdue', days: Math.abs(daysUntilDue) };
  } else if (daysUntilDue < 14) {
    return { status: 'due', days: daysUntilDue };
  }
  return { status: 'ok', days: daysUntilDue };
}

const typeIcons: Record<string, string> = {
  api_key: '🔑',
  token: '🎫',
  password: '🔐',
  certificate: '📜',
};

function SecretRow({ secret }: { secret: Secret }) {
  const rotation = getRotationStatus(secret);

  const statusBadges = {
    ok: 'bg-green-900/30 text-green-400',
    due: 'bg-amber-900/30 text-amber-400',
    overdue: 'bg-red-900/30 text-red-400',
  };

  return (
    <tr className="border-b border-gray-800 last:border-0">
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <span>{typeIcons[secret.type]}</span>
          <div>
            <div className="font-mono text-sm text-gray-200">{secret.name}</div>
            <div className="text-xs text-gray-500">{secret.service}</div>
          </div>
        </div>
      </td>
      <td className="py-3 px-4 text-sm text-gray-400 capitalize">
        {secret.type.replace('_', ' ')}
      </td>
      <td className="py-3 px-4 text-sm text-gray-400">
        {new Date(secret.lastRotated).toLocaleDateString()}
        <div className="text-xs text-gray-500">
          {getDaysSince(secret.lastRotated)} days ago
        </div>
      </td>
      <td className="py-3 px-4 text-sm text-gray-400">
        {secret.rotationPolicy} days
      </td>
      <td className="py-3 px-4">
        <span className={`px-2 py-1 text-xs rounded ${statusBadges[rotation.status]}`}>
          {rotation.status === 'ok' && `${rotation.days}d remaining`}
          {rotation.status === 'due' && `Due in ${rotation.days}d`}
          {rotation.status === 'overdue' && `${rotation.days}d overdue`}
        </span>
      </td>
    </tr>
  );
}

export function Crets() {
  const [filter, setFilter] = useState<'all' | 'due' | 'overdue'>('all');

  const filteredSecrets = useMemo(() => {
    if (filter === 'all') return mockSecrets;
    return mockSecrets.filter((s) => {
      const rotation = getRotationStatus(s);
      if (filter === 'due') return rotation.status === 'due';
      if (filter === 'overdue') return rotation.status === 'overdue';
      return true;
    });
  }, [filter]);

  const stats = useMemo(() => {
    let ok = 0, due = 0, overdue = 0;
    for (const secret of mockSecrets) {
      const rotation = getRotationStatus(secret);
      if (rotation.status === 'ok') ok++;
      else if (rotation.status === 'due') due++;
      else overdue++;
    }
    return { total: mockSecrets.length, ok, due, overdue };
  }, []);

  return (
    <div className="space-y-6">
      <PageHero
        title="Crets"
        subtitle="Secret inventory and rotation metadata. Values stay out of the UI; the goal here is awareness and maintenance."
        iconKey="crets"
        iconClassName="bg-gradient-to-br from-violet-500/30 via-fuchsia-500/20 to-cyan-400/20 text-violet-100"
        accentClassName="before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-gradient-to-b before:from-violet-400 before:to-cyan-400"
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2 bg-gray-800 rounded-lg p-1">
          {(['all', 'due', 'overdue'] as const).map((option) => (
            <button
              key={option}
              onClick={() => setFilter(option)}
              className={`px-3 py-1 text-sm rounded transition-colors capitalize ${
                filter === option
                  ? 'bg-gray-700 text-gray-100'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="text-center">
          <div className="text-3xl font-bold text-gray-100">{stats.total}</div>
          <div className="text-sm text-gray-400">Total Secrets</div>
        </Card>
        <Card className="text-center">
          <div className="text-3xl font-bold text-green-400">{stats.ok}</div>
          <div className="text-sm text-gray-400">OK</div>
        </Card>
        <Card className="text-center">
          <div className="text-3xl font-bold text-amber-400">{stats.due}</div>
          <div className="text-sm text-gray-400">Due Soon</div>
        </Card>
        <Card className="text-center">
          <div className="text-3xl font-bold text-red-400">{stats.overdue}</div>
          <div className="text-sm text-gray-400">Overdue</div>
        </Card>
      </div>

      {/* Secrets Table */}
      <Card className="p-0 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="text-left text-gray-400 border-b border-gray-700 bg-gray-800/50">
              <th className="py-3 px-4 font-medium">Secret</th>
              <th className="py-3 px-4 font-medium">Type</th>
              <th className="py-3 px-4 font-medium">Last Rotated</th>
              <th className="py-3 px-4 font-medium">Policy</th>
              <th className="py-3 px-4 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredSecrets.map((secret) => (
              <SecretRow key={secret.id} secret={secret} />
            ))}
          </tbody>
        </table>
        {filteredSecrets.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            No secrets match the current filter
          </div>
        )}
      </Card>

      {/* Security Notice */}
      <div className="text-sm text-gray-500 bg-gray-800/50 rounded-lg p-4">
        <strong>Note:</strong> This page displays secret metadata only (names, rotation dates, policies).
        Actual secret values are never exposed through this interface.
      </div>
    </div>
  );
}
