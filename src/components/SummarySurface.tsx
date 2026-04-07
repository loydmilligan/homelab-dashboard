import { Card } from './Card';
import { StatusChip, StatusDot } from './StatusChip';
import type { DashboardSummary, SummaryIndicator, SummaryMetric } from '../lib/summary';

function provenanceTone(provenance: SummaryMetric['provenance'] | SummaryIndicator['provenance']) {
  switch (provenance) {
    case 'live':
      return 'text-emerald-300';
    case 'inferred':
      return 'text-amber-300';
    case 'mixed':
      return 'text-sky-300';
    case 'inventory':
    default:
      return 'text-gray-400';
  }
}

function provenanceLabel(provenance: SummaryMetric['provenance'] | SummaryIndicator['provenance']) {
  switch (provenance) {
    case 'live':
      return 'Live';
    case 'inferred':
      return 'Inferred';
    case 'mixed':
      return 'Mixed';
    case 'inventory':
    default:
      return 'Inventory';
  }
}

export function SummaryBanner({ summary, compact = false }: { summary: DashboardSummary; compact?: boolean }) {
  return (
    <div className={`rounded-2xl border px-5 py-4 ${compact ? 'border-gray-800 bg-gray-900/60' : 'border-cyan-500/20 bg-gradient-to-br from-cyan-500/12 via-sky-500/8 to-lime-400/10'}`}>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <StatusDot status={summary.overallStatus} size="lg" />
            <div className={`${compact ? 'text-2xl' : 'text-3xl'} font-semibold text-gray-100`}>
              {summary.overallLabel}
            </div>
          </div>
          <div className={`${compact ? 'text-sm' : 'text-base'} text-gray-400`}>{summary.overallDetail}</div>
        </div>
        <div className="max-w-xl text-xs text-gray-500">{summary.provenanceNote}</div>
      </div>
    </div>
  );
}

export function SummaryKpiStrip({ metrics, wallboard = false }: { metrics: SummaryMetric[]; wallboard?: boolean }) {
  const gridClass = metrics.length >= 5 ? 'grid-cols-2 xl:grid-cols-5' : 'grid-cols-2 xl:grid-cols-4';

  return (
    <div className={`grid gap-4 ${gridClass}`}>
      {metrics.map((metric) => (
        <Card key={metric.id} className={wallboard ? 'rounded-2xl p-5' : ''}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className={`font-semibold ${wallboard ? 'text-sm uppercase tracking-[0.18em] text-gray-500' : 'text-sm text-gray-400'}`}>
                {metric.label}
              </div>
              <div className={`${wallboard ? 'mt-3 text-5xl' : 'mt-2 text-3xl'} font-bold text-gray-100`}>
                {metric.value}
              </div>
            </div>
            <StatusChip status={metric.status} size={wallboard ? 'md' : 'sm'} />
          </div>
          <div className={`${wallboard ? 'mt-4 text-base' : 'mt-3 text-sm'} text-gray-400`}>
            {metric.detail}
          </div>
          <div className={`mt-3 text-xs ${provenanceTone(metric.provenance)}`}>
            {provenanceLabel(metric.provenance)}
          </div>
        </Card>
      ))}
    </div>
  );
}

export function SummaryIndicators({ indicators, wallboard = false }: { indicators: SummaryIndicator[]; wallboard?: boolean }) {
  return (
    <div className={`grid gap-3 ${wallboard ? 'grid-cols-2 xl:grid-cols-5' : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-5'}`}>
      {indicators.map((indicator) => (
        <Card key={indicator.id} className={wallboard ? 'rounded-2xl p-4' : 'py-3'}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className={`font-medium text-gray-200 ${wallboard ? 'text-base' : 'text-sm'}`}>{indicator.label}</div>
              <div className={`mt-1 ${wallboard ? 'text-lg' : 'text-sm'} text-gray-400`}>{indicator.value}</div>
            </div>
            <StatusChip status={indicator.status} size="sm" />
          </div>
          <div className={`mt-3 text-xs ${provenanceTone(indicator.provenance)}`}>
            {provenanceLabel(indicator.provenance)}
          </div>
          <div className="mt-1 text-xs text-gray-500">{indicator.note}</div>
        </Card>
      ))}
    </div>
  );
}
