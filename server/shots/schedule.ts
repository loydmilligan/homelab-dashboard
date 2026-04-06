import type { ShotSchedule } from './types.js';

function nextMinuteBoundary(date: Date) {
  const next = new Date(date);
  next.setSeconds(0, 0);
  next.setMinutes(next.getMinutes() + 1);
  return next;
}

function parseCronPart(part: string, min: number, max: number) {
  const values = new Set<number>();

  for (const segment of part.split(',')) {
    const trimmed = segment.trim();
    if (!trimmed) {
      continue;
    }

    const [rangePart, stepPart] = trimmed.split('/');
    const step = stepPart ? Number(stepPart) : 1;
    if (!Number.isInteger(step) || step < 1) {
      throw new Error(`Invalid cron step: ${trimmed}`);
    }

    let start = min;
    let end = max;

    if (rangePart !== '*') {
      const [rangeStart, rangeEnd] = rangePart.split('-');
      start = Number(rangeStart);
      end = rangeEnd === undefined ? start : Number(rangeEnd);

      if (
        !Number.isInteger(start) ||
        !Number.isInteger(end) ||
        start < min ||
        end > max ||
        start > end
      ) {
        throw new Error(`Invalid cron range: ${trimmed}`);
      }
    }

    for (let value = start; value <= end; value += step) {
      values.add(value);
    }
  }

  return values;
}

function matchesCronExpression(cronExpression: string, date: Date) {
  const parts = cronExpression.trim().split(/\s+/);
  if (parts.length !== 5) {
    throw new Error('Cron expressions must have 5 fields');
  }

  const [minutePart, hourPart, dayPart, monthPart, weekDayPart] = parts;
  const minutes = parseCronPart(minutePart, 0, 59);
  const hours = parseCronPart(hourPart, 0, 23);
  const days = parseCronPart(dayPart, 1, 31);
  const months = parseCronPart(monthPart, 1, 12);
  const weekDays = parseCronPart(weekDayPart, 0, 6);

  return (
    minutes.has(date.getMinutes()) &&
    hours.has(date.getHours()) &&
    days.has(date.getDate()) &&
    months.has(date.getMonth() + 1) &&
    weekDays.has(date.getDay())
  );
}

function computeCronNextRun(cronExpression: string, fromDate: Date) {
  const cursor = nextMinuteBoundary(fromDate);
  const maxIterations = 366 * 24 * 60;

  for (let index = 0; index < maxIterations; index += 1) {
    if (matchesCronExpression(cronExpression, cursor)) {
      return cursor.toISOString();
    }

    cursor.setMinutes(cursor.getMinutes() + 1);
  }

  throw new Error(`Unable to resolve next cron run for expression: ${cronExpression}`);
}

export function computeNextRunAt(schedule: ShotSchedule, fromDate = new Date()) {
  if (schedule.type === 'manual') {
    return null;
  }

  if (schedule.type === 'cron') {
    return computeCronNextRun(schedule.cron_expression, fromDate);
  }

  const next = new Date(fromDate);

  if (schedule.type === 'hourly') {
    next.setSeconds(0, 0);
    next.setMinutes(schedule.minute, 0, 0);
    if (next <= fromDate) {
      next.setHours(next.getHours() + 1);
    }
    return next.toISOString();
  }

  if (schedule.type === 'daily') {
    next.setSeconds(0, 0);
    next.setHours(schedule.hour, schedule.minute, 0, 0);
    if (next <= fromDate) {
      next.setDate(next.getDate() + 1);
    }
    return next.toISOString();
  }

  next.setSeconds(0, 0);
  next.setHours(schedule.hour, schedule.minute, 0, 0);
  const dayDelta = (schedule.day_of_week - next.getDay() + 7) % 7;
  next.setDate(next.getDate() + dayDelta);
  if (next <= fromDate) {
    next.setDate(next.getDate() + 7);
  }
  return next.toISOString();
}

export function isRunDue(nextRunAt?: string | null, now = new Date()) {
  if (!nextRunAt) {
    return false;
  }

  return new Date(nextRunAt) <= now;
}
