import type { Appliance, HouseholdConfig, SimulationResult } from "../types/domain";

const DAY_MINUTES = 1440;
const HOUR_MINUTES = 60;

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

function safeArray24(): number[] {
  return Array.from({ length: 24 }, () => 0);
}

function positive(value: number): number {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

function normalizeMinute(minute: number): number {
  const clamped = clamp(minute, 0, DAY_MINUTES);
  return clamped === DAY_MINUTES ? DAY_MINUTES : ((clamped % DAY_MINUTES) + DAY_MINUTES) % DAY_MINUTES;
}

function windowLength(startMin: number, endMin: number): number {
  const start = normalizeMinute(startMin);
  const end = normalizeMinute(endMin);
  if (start === DAY_MINUTES && end === DAY_MINUTES) return 0;
  if (end >= start) return end - start;
  return DAY_MINUTES - start + end;
}

function splitWindow(startMin: number, endMin: number): Array<{ s: number; e: number }> {
  const s = clamp(startMin, 0, DAY_MINUTES);
  const e = clamp(endMin, 0, DAY_MINUTES);
  if (s === e) return [];
  if (e > s) return [{ s, e }];
  return [
    { s, e: DAY_MINUTES },
    { s: 0, e }
  ];
}

function overlapMinutes(aS: number, aE: number, bS: number, bE: number): number {
  return Math.max(0, Math.min(aE, bE) - Math.max(aS, bS));
}

function endFromDuration(startMin: number, durationMin: number): number {
  const start = clamp(startMin, 0, DAY_MINUTES);
  const duration = clamp(durationMin, 0, DAY_MINUTES);
  return (start + duration) % DAY_MINUTES;
}

function computeScheduledWindowHourly(watts: number, startMin: number, durationMin: number): number[] {
  const hourly = safeArray24();
  const safeWatts = positive(watts);
  const safeDuration = clamp(durationMin, 0, DAY_MINUTES);

  if (safeWatts <= 0 || safeDuration <= 0) return hourly;

  const endMin = endFromDuration(startMin, safeDuration);

  for (const interval of splitWindow(startMin, endMin)) {
    for (let h = 0; h < 24; h += 1) {
      const hourS = h * HOUR_MINUTES;
      const hourE = hourS + HOUR_MINUTES;
      const minutes = overlapMinutes(interval.s, interval.e, hourS, hourE);
      if (minutes > 0) {
        hourly[h] = (hourly[h] ?? 0) + (minutes / 60) * (safeWatts / 1000);
      }
    }
  }

  return hourly;
}

function centerDurationInWindow(durationMin: number, startMin: number, endMin: number): { start: number; end: number } {
  const s = normalizeMinute(startMin);
  const len = windowLength(startMin, endMin);
  if (len <= 0 || durationMin <= 0) return { start: s, end: s };
  const dur = Math.min(durationMin, len);
  const offset = (len - dur) / 2;
  const absoluteStart = s + offset;
  const absoluteEnd = absoluteStart + dur;
  const start = ((absoluteStart % DAY_MINUTES) + DAY_MINUTES) % DAY_MINUTES;
  const end = ((absoluteEnd % DAY_MINUTES) + DAY_MINUTES) % DAY_MINUTES;
  return { start, end };
}

function computeFixedWindowWattsHourly(watts: number, startMin: number, endMin: number): number[] {
  const hourly = safeArray24();
  const safeWatts = positive(watts);
  if (safeWatts <= 0) return hourly;

  for (const interval of splitWindow(startMin, endMin)) {
    for (let h = 0; h < 24; h += 1) {
      const hourS = h * HOUR_MINUTES;
      const hourE = hourS + HOUR_MINUTES;
      const minutes = overlapMinutes(interval.s, interval.e, hourS, hourE);
      if (minutes > 0) {
        hourly[h] = (hourly[h] ?? 0) + (minutes / 60) * (safeWatts / 1000);
      }
    }
  }

  return hourly;
}

function sumArray(values: number[]): number {
  return values.reduce((acc, v) => acc + v, 0);
}

function scaleHourly(hourly: number[], factor: number): number[] {
  if (factor === 1) return hourly;
  return hourly.map((value) => value * factor);
}

export function computeApplianceHourly(appliance: Appliance): number[] {
  if (!appliance.enabled) return safeArray24();

  const model = appliance.model;
  let baseHourly: number[];

  switch (model.kind) {
    case "always_on":
      baseHourly = safeArray24().map(() => positive(model.watts) / 1000);
      break;

    case "scheduled_window":
      baseHourly = computeScheduledWindowHourly(model.watts, model.startMin, model.durationMin);
      break;

    case "daily_duration": {
      const duration = clamp(model.minutesPerDay, 0, DAY_MINUTES);
      if (duration <= 0) return safeArray24();

      if (model.window) {
        const len = windowLength(model.window.startMin, model.window.endMin);
        const clampedDur = Math.min(duration, len);
        const centered = centerDurationInWindow(clampedDur, model.window.startMin, model.window.endMin);
        baseHourly = computeFixedWindowWattsHourly(model.watts, centered.start, centered.end);
      } else {
        const start = 8 * 60;
        const end = (start + duration) % DAY_MINUTES;
        baseHourly = computeFixedWindowWattsHourly(model.watts, start, end);
      }
      break;
    }

    case "count_based": {
      const watts = clamp(model.count, 0, 200) * positive(model.wattsEach);
      if (model.schedule) {
        baseHourly = computeFixedWindowWattsHourly(watts, model.schedule.startMin, model.schedule.endMin);
      } else if (model.minutesPerDay !== undefined) {
        baseHourly = computeApplianceHourly({
          ...appliance,
          quantity: 1,
          model: {
            kind: "daily_duration",
            watts,
            minutesPerDay: model.minutesPerDay
          }
        });
      } else {
        baseHourly = safeArray24();
      }
      break;
    }

    default:
      baseHourly = safeArray24();
      break;
  }

  const quantity = Math.max(1, Math.round(appliance.quantity || 1));
  return scaleHourly(baseHourly, quantity);
}

export function sumHourlies(series: number[][]): number[] {
  const result = safeArray24();
  for (const hourly of series) {
    for (let h = 0; h < 24; h += 1) {
      result[h] = (result[h] ?? 0) + (hourly[h] ?? 0);
    }
  }
  return result;
}

export function simulate(config: HouseholdConfig): SimulationResult {
  const perApplianceHourlyKwh: Record<string, number[]> = {};
  const perApplianceDailyKwh: Record<string, number> = {};

  for (const appliance of config.appliances) {
    const hourly = computeApplianceHourly(appliance);
    perApplianceHourlyKwh[appliance.id] = hourly;
    perApplianceDailyKwh[appliance.id] = sumArray(hourly);
  }

  const hourlyTotalsKwh = sumHourlies(Object.values(perApplianceHourlyKwh));
  const totalDailyKwh = sumArray(hourlyTotalsKwh);
  const totalWeeklyKwh = totalDailyKwh * 7;
  const totalMonthlyKwh = totalDailyKwh * 30.4;

  let peakHour = 0;
  for (let h = 1; h < 24; h += 1) {
    if ((hourlyTotalsKwh[h] ?? 0) > (hourlyTotalsKwh[peakHour] ?? 0)) {
      peakHour = h;
    }
  }

  return {
    hourlyTotalsKwh,
    perApplianceHourlyKwh,
    perApplianceDailyKwh,
    totalDailyKwh,
    totalWeeklyKwh,
    totalMonthlyKwh,
    peakHour
  };
}
