import { useStatePolling } from '../hooks/useStatePolling';
import { deriveDashboardSummary } from '../lib/summary';
import { SummaryBanner, SummaryIndicators, SummaryKpiStrip } from '../components/SummarySurface';
import { StatusChip, StatusDot } from '../components/StatusChip';

export function Wallboard() {
  const { state, loading, error } = useStatePolling();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-2xl text-gray-400">Loading...</div>
      </div>
    );
  }

  if (error || !state) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-2xl text-red-400">
          Failed to load: {error?.message ?? 'Unknown error'}
        </div>
      </div>
    );
  }

  const summary = deriveDashboardSummary(state);
  const highlightedBackups = (summary.degradedBackups.length > 0 ? summary.degradedBackups : state.backups).slice(0, 3);
  const highlightedPaths = (summary.degradedAccessPaths.length > 0 ? summary.degradedAccessPaths : state.access_paths).slice(0, 3);

  return (
    <div className="min-h-screen space-y-6 px-1 pb-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="text-sm uppercase tracking-[0.32em] text-gray-500">Shost Wallboard</div>
          <h1 className="mt-2 text-4xl font-semibold text-gray-100 2xl:text-5xl">Castable Summary Surface</h1>
          <div className="mt-2 max-w-3xl text-base text-gray-400 2xl:text-lg">
            Shared with Overview so the wallboard does not drift into its own truth model.
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-full border border-gray-800 bg-gray-900/60 px-4 py-2">
          <StatusDot status={summary.overallStatus} size="lg" />
          <span className="text-xl text-gray-200">{summary.overallLabel}</span>
        </div>
      </div>

      <SummaryBanner summary={summary} compact />
      <SummaryKpiStrip metrics={summary.metrics} wallboard />
      <SummaryIndicators indicators={summary.indicators} wallboard />

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
        <div className="grid grid-cols-1 gap-6 2xl:grid-cols-2">
          {state.hosts.map((host) => (
            <div
              key={host.id}
              className="rounded-2xl border border-gray-800 bg-gray-900/60 p-5 2xl:p-6"
            >
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-100 2xl:text-3xl">{host.name}</h2>
                  <div className="mt-1 text-sm uppercase tracking-[0.18em] text-gray-500">{host.role}</div>
                </div>
                <StatusChip status={host.status} size="md" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <MetricDisplay label="CPU" value={host.metrics?.cpu_pct} />
                <MetricDisplay label="RAM" value={host.metrics?.ram_pct} />
                <MetricDisplay label="Disk" value={host.metrics?.disk_pct} />
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-gray-500 2xl:text-base">
                <span>{state.services.filter((s) => s.host_id === host.id).length} services</span>
                {host.metrics?.surface_temp_c !== undefined || host.metrics?.temp_c !== undefined ? (
                  <span>Temp {Math.round(host.metrics?.surface_temp_c ?? host.metrics?.temp_c ?? 0)}C</span>
                ) : null}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6">
            <div className="mb-4 text-sm uppercase tracking-[0.18em] text-gray-500">Secondary Signals</div>
            <div className="space-y-3">
              {highlightedBackups.map((backup) => (
                <div key={backup.id} className="rounded-xl bg-gray-800/50 px-4 py-3">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-lg text-gray-100">{backup.name}</div>
                      <div className="text-sm text-gray-500">
                        {backup.last_success ? `Last success ${new Date(backup.last_success).toLocaleString()}` : 'No successful run yet'}
                      </div>
                    </div>
                    <StatusChip status={backup.status} size="sm" />
                  </div>
                </div>
              ))}
              {highlightedPaths.map((path) => (
                <div key={path.id} className="rounded-xl bg-gray-800/50 px-4 py-3">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-lg text-gray-100">{path.name}</div>
                      <div className="text-sm text-gray-500">{path.endpoint ?? 'Inventory-backed access path'}</div>
                    </div>
                    <StatusChip status={path.status} size="sm" />
                  </div>
                </div>
              ))}
              {summary.degradedServices.slice(0, 2).map((service) => (
                <div key={service.id} className="flex items-center justify-between gap-4 rounded-xl bg-gray-800/50 px-4 py-3">
                  <div>
                    <div className="text-lg text-gray-100">{service.name}</div>
                    <div className="text-sm text-gray-500">{service.host_id}</div>
                  </div>
                  <StatusChip status={service.status} size="sm" />
                </div>
              ))}
              {highlightedBackups.length === 0 && highlightedPaths.length === 0 && summary.degradedServices.length === 0 && (
                <div className="rounded-xl bg-emerald-500/10 px-4 py-3 text-emerald-300">
                  No degraded backup, access, or Wapps signals are currently surfaced.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6">
            <div className="mb-4 text-sm uppercase tracking-[0.18em] text-gray-500">Signal Provenance</div>
            <div className="text-base text-gray-400">{summary.provenanceNote}</div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-800 bg-gray-950/40 px-5 py-3">
        <div className="flex flex-col gap-2 text-sm text-gray-500 md:flex-row md:items-center md:justify-between 2xl:text-base">
          <div>{summary.provenanceNote}</div>
          <div>Updated: {new Date(summary.generatedAt).toLocaleString()}</div>
        </div>
      </div>
    </div>
  );
}

function MetricDisplay({ label, value }: { label: string; value?: number }) {
  const pct = value ?? 0;
  let color = 'text-green-400';
  if (pct >= 90) color = 'text-red-400';
  else if (pct >= 80) color = 'text-amber-400';

  return (
    <div className="text-center">
      <div className={`text-3xl font-bold 2xl:text-4xl ${color}`}>{pct}%</div>
      <div className="text-sm text-gray-500 2xl:text-base">{label}</div>
    </div>
  );
}
