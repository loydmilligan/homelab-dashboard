import { useStatePolling } from '../hooks/useStatePolling';
import { Card, CardHeader } from '../components/Card';
import { StatusChip } from '../components/StatusChip';
import { PageHero } from '../components/PageHero';
import { deriveDashboardSummary } from '../lib/summary';
import { SummaryBanner, SummaryIndicators, SummaryKpiStrip } from '../components/SummarySurface';

export function Overview() {
  const { state, loading, error } = useStatePolling();

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

  const summary = deriveDashboardSummary(state);
  const prioritizedHosts = (summary.hostPressure.length > 0 ? summary.hostPressure : state.hosts).slice(0, 4);
  const prioritizedBackups = (summary.degradedBackups.length > 0 ? summary.degradedBackups : state.backups).slice(0, 4);
  const prioritizedAccessPaths = (summary.degradedAccessPaths.length > 0 ? summary.degradedAccessPaths : state.access_paths).slice(0, 4);

  return (
    <div className="space-y-6">
      <PageHero
        title="Overview"
        subtitle="Shost's control-room summary for hosts, Wapps health, Yots activity, and Shots backup status."
        iconKey="overview"
        iconClassName="bg-gradient-to-br from-cyan-500/30 via-sky-500/20 to-lime-400/20 text-cyan-200"
        accentClassName="before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-gradient-to-b before:from-cyan-400 before:to-lime-400"
      />

      <SummaryBanner summary={summary} />
      <SummaryKpiStrip metrics={summary.metrics} />
      <SummaryIndicators indicators={summary.indicators} />

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader
            title="Host Pressure"
            subtitle="Live host telemetry prioritized by pressure and degraded status."
          />
          <div className="space-y-3">
            {prioritizedHosts.map((host) => (
              <div key={host.id} className="flex flex-col gap-2 rounded-xl bg-gray-800/35 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <span className="text-gray-100">{host.name}</span>
                  <span className="ml-2 text-sm text-gray-500">{host.role}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-gray-400 sm:text-right">
                    CPU {Math.round(host.metrics?.cpu_pct ?? 0)}% · RAM {Math.round(host.metrics?.ram_pct ?? 0)}%
                  </span>
                  <StatusChip status={host.status} size="sm" />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Shots Readiness"
            subtitle="Backup freshness and degraded runs surfaced from the current summary model."
          />
          <div className="space-y-3">
            {prioritizedBackups.map((backup) => (
              <div key={backup.id} className="flex flex-col gap-2 rounded-xl bg-gray-800/35 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="text-sm text-gray-200">{backup.name}</div>
                  <div className="text-xs text-gray-500">
                    Last success: {backup.last_success ? new Date(backup.last_success).toLocaleString() : 'No successful run yet'}
                  </div>
                </div>
                <StatusChip status={backup.status} size="sm" />
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader
            title="Access Paths"
            subtitle="These access-path signals are still inventory-backed until Works is upgraded."
          />
          <div className="grid gap-3 sm:grid-cols-2">
            {prioritizedAccessPaths.map((path) => (
              <div key={path.id} className="rounded-xl bg-gray-800/35 px-3 py-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm text-gray-200">{path.name}</div>
                  <StatusChip status={path.status} size="sm" />
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  {path.endpoint ?? 'Inventory-backed path; live reachability not implemented yet.'}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Surfaced Signals"
            subtitle="Current degraded services and secret hygiene risks from the shared summary model."
          />
          <div className="space-y-2 text-sm">
            {summary.degradedServices.slice(0, 3).map((service) => (
              <div key={service.id} className="flex items-center justify-between gap-3 rounded-lg bg-gray-800/40 px-3 py-2">
                <div className="text-gray-300">{service.name}</div>
                <StatusChip status={service.status} size="sm" />
              </div>
            ))}
            {summary.rotationRiskSecrets.slice(0, 2).map((secret) => (
              <div key={secret.id} className="flex items-center justify-between gap-3 rounded-lg bg-gray-800/40 px-3 py-2">
                <div className="text-gray-300">{secret.name}</div>
                <span className="text-xs text-amber-300">Rotation or presence risk</span>
              </div>
            ))}
            {summary.degradedServices.length === 0 && summary.rotationRiskSecrets.length === 0 && (
              <div className="rounded-lg bg-emerald-500/10 px-3 py-2 text-emerald-300">
                No degraded services or secret hygiene risks are surfaced right now.
              </div>
            )}
          </div>
        </Card>
      </div>

      <Card className="border-gray-800/80 bg-gray-950/40">
        <div className="flex flex-col gap-2 text-xs text-gray-500 md:flex-row md:items-center md:justify-between">
          <div>{summary.provenanceNote}</div>
          <div>
            Last updated: {new Date(summary.generatedAt).toLocaleString()}
          </div>
        </div>
      </Card>
    </div>
  );
}
