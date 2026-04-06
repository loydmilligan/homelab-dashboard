import { startShotRun } from './runner.js';
import { getShotsStore } from './store.js';

const DEFAULT_POLL_INTERVAL_MS = 30_000;

export class ShotsScheduler {
  private timer: NodeJS.Timeout | null = null;

  start() {
    if (this.timer) {
      return;
    }

    const interval = Number(process.env.SHOTS_SCHEDULER_INTERVAL_MS ?? DEFAULT_POLL_INTERVAL_MS);
    this.tick();
    this.timer = setInterval(() => {
      this.tick();
    }, interval);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private tick() {
    const store = getShotsStore();
    const dueJobs = store.listDueJobs(new Date());

    for (const job of dueJobs) {
      const run = store.createRun(job.id);
      if (!run) {
        continue;
      }

      const nextRunAt = store.computeNextRunAtForJob(job.id, new Date(run.started_at ?? Date.now()));
      store.updateJobNextRunAt(job.id, nextRunAt);
      startShotRun(run.id);
    }
  }
}

let scheduler: ShotsScheduler | null = null;

export function getShotsScheduler() {
  if (!scheduler) {
    scheduler = new ShotsScheduler();
  }

  return scheduler;
}
