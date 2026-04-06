import { useMemo, useState } from 'react';
import { Card } from '../components/Card';
import { PageHero } from '../components/PageHero';
import { useStatePolling } from '../hooks/useStatePolling';
import type { SecretRecord } from '../types/inventory';

function getDaysSince(dateStr: string): number {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function getRotationStatus(secret: SecretRecord): {
  status: 'ok' | 'due' | 'overdue' | 'unknown';
  days: number | null;
} {
  if (!secret.last_rotated || !secret.rotation_policy_days) {
    return { status: 'unknown', days: null };
  }

  const daysSince = getDaysSince(secret.last_rotated);
  const daysUntilDue = secret.rotation_policy_days - daysSince;

  if (daysUntilDue < 0) {
    return { status: 'overdue', days: Math.abs(daysUntilDue) };
  }
  if (daysUntilDue < 14) {
    return { status: 'due', days: daysUntilDue };
  }
  return { status: 'ok', days: daysUntilDue };
}

const typeIcons: Record<SecretRecord['type'], string> = {
  api_key: '🔑',
  token: '🎫',
  password: '🔐',
  credential: '🧾',
  certificate: '📜',
};

function ScopeBadge({ scope }: { scope: SecretRecord['scope'][number] }) {
  const styles = scope === 'cm4'
    ? 'border-sky-500/30 bg-sky-500/20 text-sky-300'
    : 'border-emerald-500/30 bg-emerald-500/20 text-emerald-300';

  return <span className={`rounded-full border px-2 py-0.5 text-xs ${styles}`}>{scope}</span>;
}

function SecretRow({ secret }: { secret: SecretRecord }) {
  const rotation = getRotationStatus(secret);
  const rotationBadge = {
    ok: 'bg-green-900/30 text-green-400',
    due: 'bg-amber-900/30 text-amber-400',
    overdue: 'bg-red-900/30 text-red-400',
    unknown: 'bg-gray-800 text-gray-400',
  } as const;

  const presenceBadge = secret.status === 'present'
    ? 'border-green-500/30 bg-green-500/15 text-green-300'
    : 'border-red-500/30 bg-red-500/15 text-red-300';

  const rotationLabel =
    rotation.status === 'ok' && rotation.days !== null
      ? `${rotation.days}d remaining`
      : rotation.status === 'due' && rotation.days !== null
        ? `Due in ${rotation.days}d`
        : rotation.status === 'overdue' && rotation.days !== null
          ? `${rotation.days}d overdue`
          : 'No policy';

  return (
    <tr className="border-b border-gray-800 last:border-0 align-top">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span>{typeIcons[secret.type]}</span>
          <div>
            <div className="font-mono text-sm text-gray-200">{secret.name}</div>
            <div className="text-xs text-gray-500">{secret.service}</div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-gray-400 capitalize">
        {secret.type.replace('_', ' ')}
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-2">
          {secret.scope.map((scope) => (
            <ScopeBadge key={`${secret.id}-${scope}`} scope={scope} />
          ))}
        </div>
        {secret.targets && secret.targets.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {secret.targets.map((target) => (
              <span
                key={`${secret.id}-${target}`}
                className="rounded bg-gray-800 px-2 py-0.5 text-xs text-gray-400"
              >
                {target}
              </span>
            ))}
          </div>
        )}
      </td>
      <td className="px-4 py-3 text-sm text-gray-400">
        {secret.last_rotated ? new Date(secret.last_rotated).toLocaleDateString() : 'Not tracked'}
        <div className="text-xs text-gray-500">
          {secret.last_rotated ? `${getDaysSince(secret.last_rotated)} days ago` : secret.source ?? 'No source'}
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-col items-start gap-2">
          <span className={`rounded px-2 py-1 text-xs ${rotationBadge[rotation.status]}`}>
            {rotationLabel}
          </span>
          <span className={`rounded-full border px-2 py-0.5 text-xs ${presenceBadge}`}>
            {secret.status === 'present' ? 'Present in env' : 'Missing from env'}
          </span>
        </div>
      </td>
    </tr>
  );
}

export function Crets() {
  const { state, loading, error } = useStatePolling();
  const [filter, setFilter] = useState<'all' | 'due' | 'overdue' | 'missing'>('all');
  const [scopeFilter, setScopeFilter] = useState<'all' | 'laptop' | 'cm4'>('all');

  const secrets = state?.secrets ?? [];

  const filteredSecrets = useMemo(() => {
    return secrets.filter((secret) => {
      if (scopeFilter !== 'all' && !secret.scope.includes(scopeFilter)) {
        return false;
      }

      if (filter === 'missing') {
        return secret.status === 'missing';
      }

      if (filter === 'all') {
        return true;
      }

      const rotation = getRotationStatus(secret);
      if (filter === 'due') {
        return rotation.status === 'due';
      }
      if (filter === 'overdue') {
        return rotation.status === 'overdue';
      }
      return true;
    });
  }, [filter, scopeFilter, secrets]);

  const stats = useMemo(() => {
    let ok = 0;
    let due = 0;
    let overdue = 0;
    let missing = 0;

    for (const secret of secrets) {
      const rotation = getRotationStatus(secret);
      if (rotation.status === 'ok') {
        ok += 1;
      } else if (rotation.status === 'due') {
        due += 1;
      } else if (rotation.status === 'overdue') {
        overdue += 1;
      }

      if (secret.status === 'missing') {
        missing += 1;
      }
    }

    return { total: secrets.length, ok, due, overdue, missing };
  }, [secrets]);

  if (loading) {
    return <div className="text-gray-400">Loading...</div>;
  }

  if (error || !state) {
    return (
      <div className="text-red-400">
        Failed to load state: {error?.message ?? 'Unknown error'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHero
        title="Crets"
        subtitle="Secret metadata, scope, rotation, and env presence. Values stay out of the UI."
        iconKey="crets"
        iconClassName="bg-gradient-to-br from-violet-500/30 via-fuchsia-500/20 to-cyan-400/20 text-violet-100"
        accentClassName="before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-gradient-to-b before:from-violet-400 before:to-cyan-400"
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 rounded-lg bg-gray-800 p-1">
          {(['all', 'due', 'overdue', 'missing'] as const).map((option) => (
            <button
              key={option}
              onClick={() => setFilter(option)}
              className={`rounded px-3 py-1 text-sm capitalize transition-colors ${
                filter === option
                  ? 'bg-gray-700 text-gray-100'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {option}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 rounded-lg bg-gray-800 p-1">
          {(['all', 'laptop', 'cm4'] as const).map((option) => (
            <button
              key={option}
              onClick={() => setScopeFilter(option)}
              className={`rounded px-3 py-1 text-sm capitalize transition-colors ${
                scopeFilter === option
                  ? 'bg-gray-700 text-gray-100'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <Card className="text-center">
          <div className="text-3xl font-bold text-gray-100">{stats.total}</div>
          <div className="text-sm text-gray-400">Total Secrets</div>
        </Card>
        <Card className="text-center">
          <div className="text-3xl font-bold text-green-400">{stats.ok}</div>
          <div className="text-sm text-gray-400">Healthy</div>
        </Card>
        <Card className="text-center">
          <div className="text-3xl font-bold text-amber-400">{stats.due}</div>
          <div className="text-sm text-gray-400">Due Soon</div>
        </Card>
        <Card className="text-center">
          <div className="text-3xl font-bold text-red-400">{stats.overdue}</div>
          <div className="text-sm text-gray-400">Overdue</div>
        </Card>
        <Card className="text-center">
          <div className="text-3xl font-bold text-rose-400">{stats.missing}</div>
          <div className="text-sm text-gray-400">Missing</div>
        </Card>
      </div>

      <div className="rounded-lg bg-gray-800/50 p-4 text-sm text-gray-500">
        Values are still kept outside Shost. This page is now the control plane for scope,
        target mapping, env presence, and rotation reminders before the encrypted sync layer exists.
      </div>

      <Card className="overflow-hidden p-0">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700 bg-gray-800/50 text-left text-gray-400">
              <th className="px-4 py-3 font-medium">Secret</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Scope / Targets</th>
              <th className="px-4 py-3 font-medium">Last Rotated</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredSecrets.map((secret) => (
              <SecretRow key={secret.id} secret={secret} />
            ))}
          </tbody>
        </table>

        {filteredSecrets.length === 0 && (
          <div className="py-8 text-center text-gray-500">
            No secrets match the current filters.
          </div>
        )}
      </Card>
    </div>
  );
}
