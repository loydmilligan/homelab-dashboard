import { useState, useEffect, useRef, useMemo } from 'react';
import { useStatePolling } from '../hooks/useStatePolling';
import { Card } from '../components/Card';
import { PageHero } from '../components/PageHero';

type LogLevel = 'all' | 'error' | 'warn' | 'info' | 'debug';
type TimeRange = '100' | '500' | '1000' | '5000';

interface LogLine {
  timestamp: string;
  level: LogLevel;
  message: string;
  raw: string;
  serviceId: string;
  serviceName: string;
  hostId: string;
  hostName: string;
}

interface AggregatedLogsResponse {
  entries: Array<{
    service_id: string;
    service_name: string;
    host_id: string;
    host_name: string;
    line: string;
    timestamp: string;
  }>;
  failures?: string[];
}

function parseLogLine(entry: AggregatedLogsResponse['entries'][number]): LogLine {
  const line = entry.line;
  // Try to parse timestamp from start of line
  const timestampMatch = line.match(/^(\d{4}-\d{2}-\d{2}T[\d:.]+Z?)\s*/);
  const timestamp = entry.timestamp || timestampMatch?.[1] || '';
  const rest = timestampMatch ? line.slice(timestampMatch[0].length) : line;

  // Detect log level
  let level: LogLevel = 'info';
  const lowerLine = rest.toLowerCase();
  if (lowerLine.includes('error') || lowerLine.includes('err]') || lowerLine.includes('[error')) {
    level = 'error';
  } else if (lowerLine.includes('warn') || lowerLine.includes('warning')) {
    level = 'warn';
  } else if (lowerLine.includes('debug') || lowerLine.includes('[debug')) {
    level = 'debug';
  }

  return {
    timestamp,
    level,
    message: rest,
    raw: line,
    serviceId: entry.service_id,
    serviceName: entry.service_name,
    hostId: entry.host_id,
    hostName: entry.host_name,
  };
}

function LogLine({ log, searchTerm }: { log: LogLine; searchTerm: string }) {
  const levelColors: Record<LogLevel, string> = {
    error: 'text-red-400',
    warn: 'text-amber-400',
    info: 'text-gray-300',
    debug: 'text-gray-500',
    all: 'text-gray-300',
  };

  // Highlight search term
  const highlightMessage = (message: string) => {
    if (!searchTerm) return message;
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    const parts = message.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-yellow-500/30 text-yellow-200 px-0.5 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className={`font-mono text-xs py-0.5 ${levelColors[log.level]}`}>
      <span className="mr-2 inline-block rounded bg-gray-800 px-1.5 py-0.5 text-[10px] text-cyan-200">
        {log.hostName} / {log.serviceName}
      </span>
      {log.timestamp && (
        <span className="text-gray-600 mr-2">
          {new Date(log.timestamp).toLocaleTimeString()}
        </span>
      )}
      <span>{highlightMessage(log.message)}</span>
    </div>
  );
}

export function Tracs() {
  const { state, loading: stateLoading } = useStatePolling();
  const [selectedService, setSelectedService] = useState<string>('all');
  const [selectedHost, setSelectedHost] = useState<string>('all');
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [levelFilter, setLevelFilter] = useState<LogLevel>('all');
  const [tailLines, setTailLines] = useState<TimeRange>('100');
  const [searchTerm, setSearchTerm] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const logContainerRef = useRef<HTMLDivElement>(null);

  const hosts = useMemo(() => state?.hosts ?? [], [state?.hosts]);

  const services = useMemo(() => {
    if (!state?.services) return [];
    return state.services.filter((s) => s.container_name);
  }, [state?.services]);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      setError(null);
      setWarning(null);
      try {
        const params = new URLSearchParams({ tail: tailLines });
        if (selectedService && selectedService !== 'all') {
          params.set('service_id', selectedService);
        }
        if (selectedHost && selectedHost !== 'all') {
          params.set('host_id', selectedHost);
        }

        const response = await fetch(`/api/logs?${params.toString()}`);
        if (!response.ok) {
          throw new Error('Failed to fetch logs');
        }
        const data = (await response.json()) as AggregatedLogsResponse;
        setLogs(data.entries.map(parseLogLine));
        if (data.failures && data.failures.length > 0) {
          setWarning(`Some logs could not be fetched: ${data.failures.join(' | ')}`);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setLogs([]);
      } finally {
        setLoading(false);
      }
    };

    void fetchLogs();
  }, [selectedService, selectedHost, tailLines]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  // Parse and filter logs
  const parsedLogs = useMemo(() => {
    return logs.filter((log) => {
        // Level filter
        if (levelFilter !== 'all' && log.level !== levelFilter) {
          return false;
        }
        if (selectedHost !== 'all' && log.hostId !== selectedHost) {
          return false;
        }
        // Search filter
        if (searchTerm && !log.raw.toLowerCase().includes(searchTerm.toLowerCase())) {
          return false;
        }
        return true;
      });
  }, [logs, levelFilter, searchTerm, selectedHost]);

  const handleRefresh = async () => {
    setLoading(true);
    setWarning(null);
    try {
      const params = new URLSearchParams({ tail: tailLines });
      if (selectedService && selectedService !== 'all') {
        params.set('service_id', selectedService);
      }
      if (selectedHost && selectedHost !== 'all') {
        params.set('host_id', selectedHost);
      }
      const response = await fetch(`/api/logs?${params.toString()}`);
      if (response.ok) {
        const data = (await response.json()) as AggregatedLogsResponse;
        setLogs(data.entries.map(parseLogLine));
        if (data.failures && data.failures.length > 0) {
          setWarning(`Some logs could not be fetched: ${data.failures.join(' | ')}`);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  if (stateLoading) {
    return <div className="text-gray-400">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <PageHero
        title="Tracs"
        subtitle="Container logs, runtime traces, and fast debugging signals for the services Shost is absorbing."
        iconKey="tracs"
        iconClassName="bg-gradient-to-br from-rose-500/30 via-red-500/20 to-orange-400/20 text-rose-100"
        accentClassName="before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-gradient-to-b before:from-rose-400 before:to-orange-400"
      />

      <div className="rounded-2xl border border-gray-800 bg-gray-900/40 p-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(13rem,1fr)_minmax(10rem,0.8fr)_minmax(10rem,0.8fr)_minmax(10rem,0.8fr)_minmax(14rem,1fr)_auto_auto]">
          {/* Service Selector */}
          <select
            value={selectedService}
            onChange={(e) => setSelectedService(e.target.value)}
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-gray-600"
          >
            <option value="all">All Services</option>
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name}
              </option>
            ))}
          </select>

          <select
            value={selectedHost}
            onChange={(e) => setSelectedHost(e.target.value)}
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-gray-600"
          >
            <option value="all">All Hosts</option>
            {hosts.map((host) => (
              <option key={host.id} value={host.id}>
                {host.name}
              </option>
            ))}
          </select>

          {/* Log Level Filter */}
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value as LogLevel)}
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-gray-600"
          >
            <option value="all">All Levels</option>
            <option value="error">Errors</option>
            <option value="warn">Warnings</option>
            <option value="info">Info</option>
            <option value="debug">Debug</option>
          </select>

          {/* Tail Lines */}
          <select
            value={tailLines}
            onChange={(e) => setTailLines(e.target.value as TimeRange)}
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-gray-600"
          >
            <option value="100">Last 100</option>
            <option value="500">Last 500</option>
            <option value="1000">Last 1000</option>
            <option value="5000">Last 5000</option>
          </select>

          {/* Search */}
          <input
            type="text"
            placeholder="Search logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-gray-600"
          />

          {/* Auto-scroll toggle */}
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`rounded-lg px-3 py-2 text-sm transition-colors ${
              autoScroll
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Auto-scroll
          </button>

          {/* Refresh button */}
          <button
            onClick={handleRefresh}
            disabled={loading || !selectedService}
            className="rounded-lg bg-gray-800 px-3 py-2 text-sm text-gray-200 transition-colors hover:bg-gray-700 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400">
        <span>{parsedLogs.length} lines</span>
        <span>{selectedService === 'all' ? 'all services' : services.find((service) => service.id === selectedService)?.name ?? selectedService}</span>
        <span>{selectedHost === 'all' ? 'all hosts' : hosts.find((host) => host.id === selectedHost)?.name ?? selectedHost}</span>
        {searchTerm && <span>matching "{searchTerm}"</span>}
        <span className="hidden sm:inline">•</span>
        <span className="text-red-400">
          {parsedLogs.filter((l) => l.level === 'error').length} errors
        </span>
        <span className="text-amber-400">
          {parsedLogs.filter((l) => l.level === 'warn').length} warnings
        </span>
      </div>

      {warning ? (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          {warning}
        </div>
      ) : null}

      {/* Log Output */}
      <Card className="p-0 overflow-hidden">
        {error ? (
          <div className="p-4 text-red-400">{error}</div>
        ) : loading && logs.length === 0 ? (
          <div className="p-4 text-gray-400">Loading logs...</div>
        ) : (
          <div
            ref={logContainerRef}
            className="h-[65vh] min-h-[24rem] overflow-y-auto bg-gray-950 p-3 sm:p-4"
          >
            {parsedLogs.length > 0 ? (
              parsedLogs.map((log, i) => (
                <LogLine key={i} log={log} searchTerm={searchTerm} />
              ))
            ) : (
              <div className="text-gray-500">No logs match the current filters</div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
