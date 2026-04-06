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
}

function parseLogLine(line: string): LogLine {
  // Try to parse timestamp from start of line
  const timestampMatch = line.match(/^(\d{4}-\d{2}-\d{2}T[\d:.]+Z?)\s*/);
  const timestamp = timestampMatch?.[1] || '';
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

  return { timestamp, level, message: rest, raw: line };
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
  const [selectedService, setSelectedService] = useState<string>('');
  const [logs, setLogs] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [levelFilter, setLevelFilter] = useState<LogLevel>('all');
  const [tailLines, setTailLines] = useState<TimeRange>('100');
  const [searchTerm, setSearchTerm] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Get services with containers
  const services = useMemo(() => {
    if (!state?.services) return [];
    return state.services.filter((s) => s.container_status);
  }, [state?.services]);

  // Auto-select first service
  useEffect(() => {
    if (services.length > 0 && !selectedService) {
      setSelectedService(services[0].id);
    }
  }, [services, selectedService]);

  // Fetch logs when service or tail changes
  useEffect(() => {
    if (!selectedService) return;

    const fetchLogs = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `/api/containers/${selectedService}/logs?tail=${tailLines}`
        );
        if (!response.ok) {
          throw new Error('Failed to fetch logs');
        }
        const data = await response.json();
        setLogs(data.logs || '');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [selectedService, tailLines]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  // Parse and filter logs
  const parsedLogs = useMemo(() => {
    if (!logs) return [];
    return logs
      .split('\n')
      .filter((line) => line.trim())
      .map(parseLogLine)
      .filter((log) => {
        // Level filter
        if (levelFilter !== 'all' && log.level !== levelFilter) {
          return false;
        }
        // Search filter
        if (searchTerm && !log.raw.toLowerCase().includes(searchTerm.toLowerCase())) {
          return false;
        }
        return true;
      });
  }, [logs, levelFilter, searchTerm]);

  const handleRefresh = async () => {
    if (!selectedService) return;
    setLoading(true);
    try {
      const response = await fetch(
        `/api/containers/${selectedService}/logs?tail=${tailLines}`
      );
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs || '');
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

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Service Selector */}
          <select
            value={selectedService}
            onChange={(e) => setSelectedService(e.target.value)}
            className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 text-sm focus:outline-none focus:border-gray-600"
          >
            <option value="">Select service...</option>
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name}
              </option>
            ))}
          </select>

          {/* Log Level Filter */}
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value as LogLevel)}
            className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 text-sm focus:outline-none focus:border-gray-600"
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
            className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 text-sm focus:outline-none focus:border-gray-600"
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
            className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 text-sm focus:outline-none focus:border-gray-600 w-48"
          />

          {/* Auto-scroll toggle */}
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
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
            className="px-3 py-1.5 bg-gray-800 text-gray-200 rounded-lg text-sm hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-4 text-sm text-gray-400">
        <span>{parsedLogs.length} lines</span>
        {searchTerm && <span>matching "{searchTerm}"</span>}
        <span>•</span>
        <span className="text-red-400">
          {parsedLogs.filter((l) => l.level === 'error').length} errors
        </span>
        <span className="text-amber-400">
          {parsedLogs.filter((l) => l.level === 'warn').length} warnings
        </span>
      </div>

      {/* Log Output */}
      <Card className="p-0 overflow-hidden">
        {error ? (
          <div className="p-4 text-red-400">{error}</div>
        ) : !selectedService ? (
          <div className="p-4 text-gray-500">Select a service to view logs</div>
        ) : loading && !logs ? (
          <div className="p-4 text-gray-400">Loading logs...</div>
        ) : (
          <div
            ref={logContainerRef}
            className="h-[600px] overflow-y-auto p-4 bg-gray-950"
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
