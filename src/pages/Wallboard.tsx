import { useState, useEffect, useCallback } from 'react';
import { useStatePolling } from '../hooks/useStatePolling';
import { deriveDashboardSummary } from '../lib/summary';
import { SummaryKpiStrip } from '../components/SummarySurface';
import { StatusDot } from '../components/StatusChip';

declare global {
  interface Window {
    __onGCastApiAvailable: (isAvailable: boolean) => void;
  }
}

const CAST_AVAILABLE = import.meta.env.VITE_CAST_AVAILABLE === 'true';

type CastState = 'unavailable' | 'not-ready' | 'ready' | 'connecting' | 'connected';

const urlParams = new URLSearchParams(window.location.search);
const IS_CAST_MODE = urlParams.get('cast') === 'true';

export function Wallboard() {
  const { state, loading, error } = useStatePolling();
  const [castState, setCastState] = useState<CastState>('not-ready');
  const [castError, setCastError] = useState<string | null>(null);

  useEffect(() => {
    if (!CAST_AVAILABLE) {
      setCastState('unavailable');
      return;
    }

    const initCast = () => {
      try {
        console.log('Initializing Cast with app ID 278E5914...');
        const sessionRequest = new chrome.cast.SessionRequest('278E5914');
        const apiConfig = new chrome.cast.ApiConfig(
          sessionRequest,
          (session) => {
            console.log('Session created:', session);
            setCastState('ready');
          },
          (availability: chrome.cast.ReceiverAvailability) => {
            console.log('Receiver availability:', availability);
            if (availability === chrome.cast.ReceiverAvailability.AVAILABLE) {
              setCastState('ready');
            }
          },
          chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED
        );
        chrome.cast.initialize(
          apiConfig,
          () => {
            console.log('Cast initialized successfully');
            setCastState('ready');
          },
          (e: chrome.cast.Error) => {
            console.error('Cast init error:', e);
            setCastState('unavailable');
          }
        );
      } catch (e) {
        console.error('Cast initialization failed:', e);
        setCastState('unavailable');
      }
    };

    window.__onGCastApiAvailable = (isAvailable: boolean) => {
      if (isAvailable) {
        initCast();
      } else {
        setCastState('unavailable');
        setCastError('Google Cast is not available');
      }
    };

    const script = document.createElement('script');
    script.src = 'https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1';
    script.async = true;
    document.head.appendChild(script);

    const timeout = setTimeout(() => {
      if (castState === 'not-ready') {
        setCastState('unavailable');
        setCastError('Cast API timeout');
      }
    }, 5000);

    return () => {
      clearTimeout(timeout);
      const existingScript = document.head.querySelector('script[src*="cast_sender"]');
      if (existingScript) {
        document.head.removeChild(existingScript);
      }
    };
  }, []);

  const handleCast = useCallback(() => {
    if (castState !== 'ready') return;
    try {
      chrome.cast.requestSession(
        () => {
          setCastState('connected');
        },
        (requestError: chrome.cast.Error) => {
          const errorMsg = requestError?.description || requestError?.code || 'Unknown';
          setCastError(`Failed: ${errorMsg}`);
          setCastState('ready');
        }
      );
    } catch (e) {
      setCastError('Failed to cast');
    }
  }, [castState]);

  const handleStopCast = useCallback(() => {
    try {
      chrome.cast.requestSession(() => {}, () => {});
    } catch (e) {}
    setCastState('ready');
  }, []);

  if (loading) {
    return <div className="h-screen flex items-center justify-center text-gray-400">Loading...</div>;
  }

  if (error || !state) {
    return <div className="h-screen flex items-center justify-center text-red-400">Failed: {error?.message}</div>;
  }

  const summary = deriveDashboardSummary(state);
  const highlightedBackups = (summary.degradedBackups.length > 0 ? summary.degradedBackups : state.backups).slice(0, 4);

  return (
    <div className={IS_CAST_MODE ? 'p-2 text-xs bg-gray-950' : 'min-h-screen space-y-4 px-2 pb-4'}>
      {!IS_CAST_MODE && (
        <div className="flex flex-col gap-2 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="text-sm uppercase tracking-[0.32em] text-gray-500">Shost Wallboard</div>
            <h1 className="mt-1 text-2xl font-semibold text-gray-100">Castable Summary</h1>
          </div>
          <div className="flex items-center gap-2">
            <StatusDot status={summary.overallStatus} size="sm" />
            <span className="text-sm text-gray-300">{summary.overallLabel}</span>
            <CastButton state={castState} onCast={handleCast} onStop={handleStopCast} error={castError} />
          </div>
        </div>
      )}

      {IS_CAST_MODE && (
        <div className="mb-1 flex items-center justify-between">
          <div className="text-xs font-bold text-gray-100">SHOST</div>
          <StatusDot status={summary.overallStatus} size="sm" />
        </div>
      )}

      <SummaryKpiStrip metrics={summary.metrics} wallboard />

      {!IS_CAST_MODE && <SummaryBanner summary={summary} />}

      <div className="grid gap-2 xl:grid-cols-2">
        {state.hosts?.map((host) => (
          <div key={host.id} className={IS_CAST_MODE ? 'rounded border border-gray-800 bg-gray-900/60 p-1' : 'rounded-lg border border-gray-800 bg-gray-900/60 p-3'}>
            <div className="mb-1 flex items-center justify-between">
              <div>
                <div className={IS_CAST_MODE ? 'text-xs font-semibold text-gray-100' : 'text-sm font-semibold text-gray-100'}>{host.name}</div>
                {!IS_CAST_MODE && <div className="text-xs text-gray-500">{host.role}</div>}
              </div>
              <StatusDot status={host.status} size="sm" />
            </div>
            <div className="grid grid-cols-3 gap-1">
              <MetricDisplay label="CPU" value={host.metrics?.cpu_pct} />
              <MetricDisplay label="RAM" value={host.metrics?.ram_pct} />
              <MetricDisplay label="Disk" value={host.metrics?.disk_pct} />
            </div>
          </div>
        ))}
      </div>

      {!IS_CAST_MODE && (
        <div className="rounded-lg border border-gray-800 bg-gray-900/60 p-3">
          <div className="mb-2 text-xs text-gray-500">Backups</div>
          <div className="grid gap-1 md:grid-cols-2">
            {highlightedBackups.map((backup) => (
              <div key={backup.id} className="flex items-center justify-between rounded bg-gray-800/50 px-2 py-1">
                <div className="text-xs text-gray-100">{backup.name}</div>
                <StatusDot status={backup.status} size="sm" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MetricDisplay({ label, value }: { label: string; value?: number }) {
  const pct = value ?? 0;
  if (pct >= 90) return <div className="text-center"><div className={IS_CAST_MODE ? 'text-xs' : 'text-sm'}>90%+</div><div className={IS_CAST_MODE ? 'text-[10px]' : 'text-xs'}>{label}</div></div>;
  if (pct >= 80) return <div className="text-center"><div className={IS_CAST_MODE ? 'text-xs' : 'text-sm'}>80%+</div><div className={IS_CAST_MODE ? 'text-[10px]' : 'text-xs'}>{label}</div></div>;
  return (
    <div className="text-center">
      <div className={IS_CAST_MODE ? 'text-xs' : 'text-sm'}>{pct}%</div>
      <div className={IS_CAST_MODE ? 'text-[10px]' : 'text-xs'}>{label}</div>
    </div>
  );
}

function SummaryBanner({ summary }: { summary: ReturnType<typeof deriveDashboardSummary> }) {
  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900/60 p-3">
      <div className="text-xs text-gray-400">{summary.provenanceNote}</div>
    </div>
  );
}

function CastButton({ state, onCast, onStop }: { state: CastState; onCast: () => void; onStop: () => void; error: string | null }) {
  if (state === 'unavailable') {
    return <div className="text-xs text-gray-500">Cast N/A</div>;
  }
  if (state === 'connected') {
    return (
      <button onClick={onStop} className="rounded bg-red-500/20 px-2 py-1 text-xs text-red-300">
        Stop
      </button>
    );
  }
  return (
    <button onClick={onCast} className="rounded bg-blue-500/20 px-2 py-1 text-xs text-blue-300">
      Cast
    </button>
  );
}
