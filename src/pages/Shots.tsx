import { useEffect, useState } from 'react';
import { Card, CardHeader, StatCard } from '../components/Card';
import { PageHero } from '../components/PageHero';
import type { ShotJob, ShotRun, ShotSchedule, ShotSummary, ShotTargetHostId } from '../types/shots';

const EMPTY_SUMMARY: ShotSummary = {
  total_jobs: 0,
  healthy_jobs: 0,
  running_jobs: 0,
  overdue_jobs: 0,
  failed_jobs: 0,
};

type FormState = {
  id?: string;
  friendly_name: string;
  description: string;
  tags: string;
  target_host_id: ShotTargetHostId;
  source_path: string;
  destination_path: string;
  max_depth: string;
  exclude_patterns: string;
  schedule_type: ShotSchedule['type'];
  hourly_minute: string;
  daily_hour: string;
  daily_minute: string;
  weekly_day_of_week: string;
  weekly_hour: string;
  weekly_minute: string;
  cron_expression: string;
  keep_count: string;
  max_age_days: string;
  channels: Array<'browser' | 'ntfy' | 'smtp'>;
  events: string[];
  enabled: boolean;
};

const DEFAULT_FORM: FormState = {
  friendly_name: '',
  description: '',
  tags: '',
  target_host_id: 'laptop',
  source_path: '',
  destination_path: '',
  max_depth: '',
  exclude_patterns: '',
  schedule_type: 'manual',
  hourly_minute: '0',
  daily_hour: '2',
  daily_minute: '0',
  weekly_day_of_week: '0',
  weekly_hour: '2',
  weekly_minute: '0',
  cron_expression: '',
  keep_count: '',
  max_age_days: '',
  channels: ['browser'],
  events: ['backup_success', 'backup_failed'],
  enabled: true,
};

const NOTIFICATION_EVENTS = [
  'backup_started',
  'backup_success',
  'backup_failed',
  'backup_upcoming',
  'backup_overdue',
] as const;

function formatSchedule(job: ShotJob) {
  switch (job.schedule.type) {
    case 'manual':
      return 'Manual';
    case 'hourly':
      return `Hourly at :${job.schedule.minute.toString().padStart(2, '0')}`;
    case 'daily':
      return `Daily ${job.schedule.hour.toString().padStart(2, '0')}:${job.schedule.minute
        .toString()
        .padStart(2, '0')}`;
    case 'weekly':
      return `Weekly day ${job.schedule.day_of_week}`;
    case 'cron':
      return `Cron ${job.schedule.cron_expression}`;
  }
}

function formatRunStatus(job: ShotJob) {
  if (!job.last_run) {
    return job.enabled ? 'Awaiting first run' : 'Disabled';
  }

  return job.last_run.status;
}

function formatTimestamp(value?: string | null) {
  if (!value) {
    return 'Not scheduled';
  }

  return new Date(value).toLocaleString();
}

function formatTargetHost(targetHostId: ShotTargetHostId) {
  return targetHostId === 'cm4' ? 'CM4' : 'Laptop';
}

function toFormState(job: ShotJob): FormState {
  return {
    id: job.id,
    friendly_name: job.friendly_name,
    description: job.description ?? '',
    tags: job.tags.join(', '),
    target_host_id: job.target_host_id,
    source_path: job.source_path,
    destination_path: job.destination_path,
    max_depth: job.max_depth === null || job.max_depth === undefined ? '' : String(job.max_depth),
    exclude_patterns: job.exclude_patterns.join(', '),
    schedule_type: job.schedule.type,
    hourly_minute: job.schedule.type === 'hourly' ? String(job.schedule.minute) : '0',
    daily_hour: job.schedule.type === 'daily' ? String(job.schedule.hour) : '2',
    daily_minute: job.schedule.type === 'daily' ? String(job.schedule.minute) : '0',
    weekly_day_of_week: job.schedule.type === 'weekly' ? String(job.schedule.day_of_week) : '0',
    weekly_hour: job.schedule.type === 'weekly' ? String(job.schedule.hour) : '2',
    weekly_minute: job.schedule.type === 'weekly' ? String(job.schedule.minute) : '0',
    cron_expression: job.schedule.type === 'cron' ? job.schedule.cron_expression : '',
    keep_count:
      job.retention.keep_count === null || job.retention.keep_count === undefined
        ? ''
        : String(job.retention.keep_count),
    max_age_days:
      job.retention.max_age_days === null || job.retention.max_age_days === undefined
        ? ''
        : String(job.retention.max_age_days),
    channels: job.notifications.channels,
    events: job.notifications.events,
    enabled: job.enabled,
  };
}

function buildPayload(form: FormState) {
  const schedule: ShotSchedule =
    form.schedule_type === 'manual'
      ? { type: 'manual' }
      : form.schedule_type === 'hourly'
        ? { type: 'hourly', minute: Number(form.hourly_minute) || 0 }
        : form.schedule_type === 'daily'
          ? {
              type: 'daily',
              hour: Number(form.daily_hour) || 0,
              minute: Number(form.daily_minute) || 0,
            }
          : form.schedule_type === 'weekly'
            ? {
                type: 'weekly',
                day_of_week: Number(form.weekly_day_of_week) || 0,
                hour: Number(form.weekly_hour) || 0,
                minute: Number(form.weekly_minute) || 0,
              }
            : { type: 'cron', cron_expression: form.cron_expression.trim() };

  return {
    friendly_name: form.friendly_name.trim(),
    description: form.description.trim() || undefined,
    tags: form.tags
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean),
    target_host_id: form.target_host_id,
    source_path: form.source_path.trim(),
    destination_path: form.destination_path.trim(),
    max_depth: form.max_depth.trim() === '' ? null : Number(form.max_depth),
    exclude_patterns: form.exclude_patterns
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean),
    schedule,
    retention: {
      keep_count: form.keep_count.trim() === '' ? null : Number(form.keep_count),
      max_age_days: form.max_age_days.trim() === '' ? null : Number(form.max_age_days),
    },
    notifications: {
      channels: form.channels,
      events: form.events,
    },
    enabled: form.enabled,
  };
}

export function Shots() {
  const [jobs, setJobs] = useState<ShotJob[]>([]);
  const [summary, setSummary] = useState<ShotSummary>(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [runningJobIds, setRunningJobIds] = useState<string[]>([]);
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [jobRuns, setJobRuns] = useState<Record<string, ShotRun[]>>({});

  async function load(showLoading = false) {
    if (showLoading) {
      setLoading(true);
    }

    try {
      const [jobsResponse, summaryResponse] = await Promise.all([
        fetch('/api/backups/jobs'),
        fetch('/api/backups/summary'),
      ]);

      if (!jobsResponse.ok || !summaryResponse.ok) {
        throw new Error('Failed to load backup state');
      }

      const jobsData = (await jobsResponse.json()) as { jobs: ShotJob[] };
      const summaryData = (await summaryResponse.json()) as ShotSummary;
      setJobs(jobsData.jobs);
      setSummary(summaryData);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      await load(true);
      if (cancelled) return;
    })();

    const interval = setInterval(() => {
      if (!cancelled) {
        void load(false);
      }
    }, 10_000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!selectedJobId) {
      return;
    }

    void (async () => {
      const response = await fetch(`/api/backups/jobs/${selectedJobId}/runs`);
      if (!response.ok) {
        return;
      }

      const payload = (await response.json()) as { runs: ShotRun[] };
      setJobRuns((current) => ({ ...current, [selectedJobId]: payload.runs }));
    })();
  }, [selectedJobId, jobs]);

  async function runNow(jobId: string) {
    setRunningJobIds((current) => [...current, jobId]);

    try {
      const response = await fetch(`/api/backups/jobs/${jobId}/run`, { method: 'POST' });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? 'Failed to start backup run');
      }

      await load(false);
      setSelectedJobId(jobId);
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : 'Unknown error');
    } finally {
      setRunningJobIds((current) => current.filter((id) => id !== jobId));
    }
  }

  async function saveJob() {
    setSaving(true);

    try {
      const payload = buildPayload(form);
      const response = await fetch(
        form.id ? `/api/backups/jobs/${form.id}` : '/api/backups/jobs',
        {
          method: form.id ? 'PUT' : 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(payload),
        },
      );

      const body = (await response.json().catch(() => null)) as { error?: string; job?: ShotJob } | null;
      if (!response.ok) {
        throw new Error(body?.error ?? 'Failed to save backup job');
      }

      setForm(DEFAULT_FORM);
      await load(false);
      if (body?.job) {
        setSelectedJobId(body.job.id);
      }
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unknown error');
    } finally {
      setSaving(false);
    }
  }

  async function deleteJob(jobId: string) {
    const confirmed = window.confirm('Delete this backup job?');
    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(`/api/backups/jobs/${jobId}`, { method: 'DELETE' });
      if (!response.ok) {
        throw new Error('Failed to delete backup job');
      }

      if (form.id === jobId) {
        setForm(DEFAULT_FORM);
      }

      if (selectedJobId === jobId) {
        setSelectedJobId(null);
      }

      await load(false);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Unknown error');
    }
  }

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function toggleChannel(channel: 'browser' | 'ntfy' | 'smtp') {
    setForm((current) => ({
      ...current,
      channels: current.channels.includes(channel)
        ? current.channels.filter((value) => value !== channel)
        : [...current.channels, channel],
    }));
  }

  function toggleEvent(eventName: string) {
    setForm((current) => ({
      ...current,
      events: current.events.includes(eventName)
        ? current.events.filter((value) => value !== eventName)
        : [...current.events, eventName],
    }));
  }

  const selectedRuns = selectedJobId ? jobRuns[selectedJobId] ?? [] : [];

  return (
    <div className="space-y-6">
      <PageHero
        title="Shots"
        subtitle="Create backup jobs, tune schedules and retention, and run backups directly from the dashboard."
        iconKey="shots"
        iconClassName="bg-gradient-to-br from-fuchsia-500/30 via-pink-500/20 to-amber-400/20 text-fuchsia-100"
        accentClassName="before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-gradient-to-b before:from-fuchsia-400 before:to-amber-400"
      />

      {loading ? <div className="text-gray-400">Loading backup state...</div> : null}
      {error ? <div className="text-red-400">Backup error: {error}</div> : null}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard label="Total Jobs" value={summary.total_jobs} />
        <StatCard label="Healthy" value={summary.healthy_jobs} status="ok" />
        <StatCard label="Running" value={summary.running_jobs} status="warn" />
        <StatCard label="Overdue" value={summary.overdue_jobs} status="warn" />
        <StatCard label="Failed" value={summary.failed_jobs} status="fail" />
      </div>

      <div className="grid xl:grid-cols-[1.2fr_0.8fr] gap-6">
        <Card>
          <CardHeader
            title={form.id ? 'Edit Backup Job' : 'Create Backup Job'}
            subtitle="This writes directly to the runtime Shots store."
            action={
              form.id ? (
                <button
                  type="button"
                  onClick={() => setForm(DEFAULT_FORM)}
                  className="rounded-md border border-gray-700 px-3 py-1.5 text-sm text-gray-300"
                >
                  New Job
                </button>
              ) : null
            }
          />

          <div className="grid md:grid-cols-2 gap-4">
            <label className="space-y-1">
              <span className="text-sm text-gray-400">Name</span>
              <input className="w-full rounded bg-gray-950 px-3 py-2 text-sm text-gray-100" value={form.friendly_name} onChange={(event) => updateField('friendly_name', event.target.value)} />
            </label>
            <label className="space-y-1">
              <span className="text-sm text-gray-400">Target Host</span>
              <select
                className="w-full rounded bg-gray-950 px-3 py-2 text-sm text-gray-100"
                value={form.target_host_id}
                onChange={(event) => updateField('target_host_id', event.target.value as ShotTargetHostId)}
              >
                <option value="laptop">Laptop</option>
                <option value="cm4">CM4</option>
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-sm text-gray-400">Tags</span>
              <input className="w-full rounded bg-gray-950 px-3 py-2 text-sm text-gray-100" value={form.tags} onChange={(event) => updateField('tags', event.target.value)} placeholder="docs, laptop, photos" />
            </label>
            <label className="space-y-1 md:col-span-2">
              <span className="text-sm text-gray-400">Description</span>
              <input className="w-full rounded bg-gray-950 px-3 py-2 text-sm text-gray-100" value={form.description} onChange={(event) => updateField('description', event.target.value)} />
            </label>
            <label className="space-y-1">
              <span className="text-sm text-gray-400">Source Path</span>
              <input className="w-full rounded bg-gray-950 px-3 py-2 text-sm text-gray-100" value={form.source_path} onChange={(event) => updateField('source_path', event.target.value)} />
            </label>
            <label className="space-y-1">
              <span className="text-sm text-gray-400">Destination Path</span>
              <input className="w-full rounded bg-gray-950 px-3 py-2 text-sm text-gray-100" value={form.destination_path} onChange={(event) => updateField('destination_path', event.target.value)} />
            </label>
            <div className="md:col-span-2 rounded-lg border border-gray-800 bg-gray-950/60 px-3 py-3 text-sm text-gray-400">
              {form.target_host_id === 'cm4'
                ? 'For CM4 jobs, source paths are CM4 host paths and destination paths must live under /shots-dest/... so the exporter can write into its dedicated backup mount.'
                : 'Laptop jobs still run inside the backend container, so source and destination paths must be visible there.'}
            </div>
            <label className="space-y-1">
              <span className="text-sm text-gray-400">Exclude Patterns</span>
              <input className="w-full rounded bg-gray-950 px-3 py-2 text-sm text-gray-100" value={form.exclude_patterns} onChange={(event) => updateField('exclude_patterns', event.target.value)} placeholder="*.tmp,node_modules" />
            </label>
            <label className="space-y-1">
              <span className="text-sm text-gray-400">Max Depth</span>
              <input className="w-full rounded bg-gray-950 px-3 py-2 text-sm text-gray-100" value={form.max_depth} onChange={(event) => updateField('max_depth', event.target.value)} placeholder="Leave blank for unlimited" />
            </label>
          </div>

          <div className="mt-4 grid md:grid-cols-2 gap-4">
            <label className="space-y-1">
              <span className="text-sm text-gray-400">Schedule</span>
              <select className="w-full rounded bg-gray-950 px-3 py-2 text-sm text-gray-100" value={form.schedule_type} onChange={(event) => updateField('schedule_type', event.target.value as ShotSchedule['type'])}>
                <option value="manual">Manual</option>
                <option value="hourly">Hourly</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="cron">Cron</option>
              </select>
            </label>
            <label className="flex items-end gap-2 text-sm text-gray-300">
              <input type="checkbox" checked={form.enabled} onChange={(event) => updateField('enabled', event.target.checked)} />
              Enabled
            </label>
          </div>

          {form.schedule_type === 'hourly' ? (
            <div className="mt-4">
              <label className="space-y-1">
                <span className="text-sm text-gray-400">Minute</span>
                <input className="w-full rounded bg-gray-950 px-3 py-2 text-sm text-gray-100" value={form.hourly_minute} onChange={(event) => updateField('hourly_minute', event.target.value)} />
              </label>
            </div>
          ) : null}

          {form.schedule_type === 'daily' ? (
            <div className="mt-4 grid md:grid-cols-2 gap-4">
              <label className="space-y-1">
                <span className="text-sm text-gray-400">Hour</span>
                <input className="w-full rounded bg-gray-950 px-3 py-2 text-sm text-gray-100" value={form.daily_hour} onChange={(event) => updateField('daily_hour', event.target.value)} />
              </label>
              <label className="space-y-1">
                <span className="text-sm text-gray-400">Minute</span>
                <input className="w-full rounded bg-gray-950 px-3 py-2 text-sm text-gray-100" value={form.daily_minute} onChange={(event) => updateField('daily_minute', event.target.value)} />
              </label>
            </div>
          ) : null}

          {form.schedule_type === 'weekly' ? (
            <div className="mt-4 grid md:grid-cols-3 gap-4">
              <label className="space-y-1">
                <span className="text-sm text-gray-400">Day</span>
                <input className="w-full rounded bg-gray-950 px-3 py-2 text-sm text-gray-100" value={form.weekly_day_of_week} onChange={(event) => updateField('weekly_day_of_week', event.target.value)} />
              </label>
              <label className="space-y-1">
                <span className="text-sm text-gray-400">Hour</span>
                <input className="w-full rounded bg-gray-950 px-3 py-2 text-sm text-gray-100" value={form.weekly_hour} onChange={(event) => updateField('weekly_hour', event.target.value)} />
              </label>
              <label className="space-y-1">
                <span className="text-sm text-gray-400">Minute</span>
                <input className="w-full rounded bg-gray-950 px-3 py-2 text-sm text-gray-100" value={form.weekly_minute} onChange={(event) => updateField('weekly_minute', event.target.value)} />
              </label>
            </div>
          ) : null}

          {form.schedule_type === 'cron' ? (
            <div className="mt-4">
              <label className="space-y-1">
                <span className="text-sm text-gray-400">Cron Expression</span>
                <input className="w-full rounded bg-gray-950 px-3 py-2 text-sm text-gray-100" value={form.cron_expression} onChange={(event) => updateField('cron_expression', event.target.value)} placeholder="*/30 * * * *" />
              </label>
            </div>
          ) : null}

          <div className="mt-4 grid md:grid-cols-2 gap-4">
            <label className="space-y-1">
              <span className="text-sm text-gray-400">Retention: Keep Count</span>
              <input className="w-full rounded bg-gray-950 px-3 py-2 text-sm text-gray-100" value={form.keep_count} onChange={(event) => updateField('keep_count', event.target.value)} />
            </label>
            <label className="space-y-1">
              <span className="text-sm text-gray-400">Retention: Max Age Days</span>
              <input className="w-full rounded bg-gray-950 px-3 py-2 text-sm text-gray-100" value={form.max_age_days} onChange={(event) => updateField('max_age_days', event.target.value)} />
            </label>
          </div>

          <div className="mt-4 grid md:grid-cols-2 gap-4">
            <div>
              <div className="mb-2 text-sm text-gray-400">Notification Channels</div>
              <div className="flex flex-wrap gap-3 text-sm text-gray-300">
                {(['browser', 'ntfy', 'smtp'] as const).map((channel) => (
                  <label key={channel} className="flex items-center gap-2">
                    <input type="checkbox" checked={form.channels.includes(channel)} onChange={() => toggleChannel(channel)} />
                    {channel}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <div className="mb-2 text-sm text-gray-400">Notification Events</div>
              <div className="flex flex-wrap gap-3 text-sm text-gray-300">
                {NOTIFICATION_EVENTS.map((eventName) => (
                  <label key={eventName} className="flex items-center gap-2">
                    <input type="checkbox" checked={form.events.includes(eventName)} onChange={() => toggleEvent(eventName)} />
                    {eventName}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button type="button" onClick={() => { void saveJob(); }} disabled={saving} className="rounded-md bg-fuchsia-600 px-4 py-2 text-sm text-white disabled:opacity-50">
              {saving ? 'Saving...' : form.id ? 'Save Changes' : 'Create Backup'}
            </button>
            <button type="button" onClick={() => setForm(DEFAULT_FORM)} className="rounded-md border border-gray-700 px-4 py-2 text-sm text-gray-300">
              Reset
            </button>
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader
              title="Jobs"
              subtitle="Edit, run, and remove jobs from here."
            />

            {jobs.length === 0 ? (
              <div className="text-gray-400">No jobs yet. Use the form to create the first backup.</div>
            ) : (
              <div className="space-y-3">
                {jobs.map((job) => (
                  <div key={job.id} className="rounded-lg border border-gray-800 bg-gray-950/40 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <button
                          type="button"
                          onClick={() => {
                            setForm(toFormState(job));
                            setSelectedJobId(job.id);
                          }}
                          className="text-left text-gray-100 font-medium hover:text-fuchsia-200"
                        >
                          {job.friendly_name}
                        </button>
                        <div className="text-sm text-gray-500">{formatTargetHost(job.target_host_id)}</div>
                        <div className="text-sm text-gray-500">{job.source_path}</div>
                        <div className="text-sm text-gray-500">{job.destination_path}</div>
                      </div>
                      <div className="text-sm sm:text-right">
                        <div className="text-gray-300">{formatRunStatus(job)}</div>
                        <div className="text-gray-500">{formatSchedule(job)}</div>
                        <div className="text-gray-600">Next: {formatTimestamp(job.next_run_at)}</div>
                      </div>
                    </div>

                    {job.tags.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {job.tags.map((tag) => (
                          <span key={tag} className="rounded-full bg-gray-800 px-2 py-0.5 text-xs text-gray-300">
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : null}

                    <div className="mt-4 flex flex-col gap-3 border-t border-gray-800 pt-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                      <div className="text-gray-500">
                        Last run: {formatTimestamp(job.last_run?.completed_at ?? job.last_run?.started_at)}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setForm(toFormState(job));
                            setSelectedJobId(job.id);
                          }}
                          className="rounded-md border border-gray-700 px-3 py-1.5 text-gray-300"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            void runNow(job.id);
                          }}
                          disabled={runningJobIds.includes(job.id)}
                          className="rounded-md border border-fuchsia-500/40 bg-fuchsia-500/10 px-3 py-1.5 text-fuchsia-100 disabled:opacity-50"
                        >
                          {runningJobIds.includes(job.id) ? 'Starting...' : 'Run Now'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            void deleteJob(job.id);
                          }}
                          className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-red-200"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <CardHeader
              title="Recent Runs"
              subtitle={selectedJobId ? 'History for the selected job.' : 'Select a job to inspect run history.'}
            />

            {selectedJobId === null ? (
              <div className="text-gray-400">Pick a job from the list to see archive history and failures.</div>
            ) : selectedRuns.length === 0 ? (
              <div className="text-gray-400">No runs recorded yet for this job.</div>
            ) : (
              <div className="space-y-3">
                {selectedRuns.slice(0, 8).map((run) => (
                  <div key={run.id} className="rounded-lg border border-gray-800 bg-gray-950/40 p-3 text-sm">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="text-gray-200">{run.status}</div>
                      <div className="text-gray-500">{formatTimestamp(run.completed_at ?? run.started_at)}</div>
                    </div>
                    <div className="mt-1 text-gray-500">
                      Files: {run.file_count ?? 0} | Size: {run.size_bytes ?? 0} bytes
                    </div>
                    {run.archive_path ? (
                      <div className="mt-1 break-all text-gray-500">{run.archive_path}</div>
                    ) : null}
                    {run.error_message ? (
                      <div className="mt-1 text-red-300">{run.error_message}</div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
