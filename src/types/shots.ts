export type ShotSchedule =
  | { type: 'manual' }
  | { type: 'hourly'; minute: number }
  | { type: 'daily'; hour: number; minute: number }
  | { type: 'weekly'; day_of_week: number; hour: number; minute: number }
  | { type: 'cron'; cron_expression: string };

export interface ShotRetention {
  keep_count?: number | null;
  max_age_days?: number | null;
}

export interface ShotNotificationConfig {
  channels: Array<'browser' | 'ntfy' | 'smtp'>;
  events: string[];
}

export type ShotTargetHostId = 'laptop' | 'cm4';

export interface ShotRun {
  id: string;
  job_id: string;
  status: 'queued' | 'running' | 'success' | 'failed' | 'warning';
  started_at?: string;
  completed_at?: string;
  archive_path?: string;
  size_bytes?: number;
  file_count?: number;
  error_message?: string;
}

export interface ShotJob {
  id: string;
  friendly_name: string;
  description?: string;
  tags: string[];
  target_host_id: ShotTargetHostId;
  source_path: string;
  destination_path: string;
  max_depth?: number | null;
  exclude_patterns: string[];
  schedule: ShotSchedule;
  retention: ShotRetention;
  notifications: ShotNotificationConfig;
  enabled: boolean;
  created_at: string;
  updated_at: string;
  next_run_at?: string | null;
  last_run?: ShotRun | null;
}

export interface ShotSummary {
  total_jobs: number;
  healthy_jobs: number;
  running_jobs: number;
  overdue_jobs: number;
  failed_jobs: number;
}
