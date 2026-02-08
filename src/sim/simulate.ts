import type { Appliance, HouseholdConfig, Producer, SimulationResult } from "../types/domain";

const DAY_MINUTES = 1440;
const HOUR_MINUTES = 60;

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

function safeArray24(): number[] {
  return Array.from({ length: 24 }, () => 0);
}

function safeArrayMinutes(): number[] {
  return Array.from({ length: DAY_MINUTES }, () => 0);
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

function forEachMinuteInWindow(startMin: number, endMin: number, cb: (minute: number) => void) {
  for (const interval of splitWindow(startMin, endMin)) {
    for (let minute = interval.s; minute < interval.e; minute += 1) {
      cb(minute);
    }
  }
}

function isMinuteInWindow(minute: number, startMin: number, endMin: number): boolean {
  const m = ((minute % DAY_MINUTES) + DAY_MINUTES) % DAY_MINUTES;
  const s = clamp(startMin, 0, DAY_MINUTES);
  const e = clamp(endMin, 0, DAY_MINUTES);

  if (s === e) return false;
  if (e > s) return m >= s && m < e;
  return m >= s || m < e;
}

function expandHourlyToMinutes(hourly: number[]): number[] {
  const perMinute = safeArrayMinutes();
  for (let h = 0; h < 24; h += 1) {
    const value = (hourly[h] ?? 0) / 60;
    for (let m = h * 60; m < (h + 1) * 60; m += 1) {
      perMinute[m] = value;
    }
  }
  return perMinute;
}

function compressMinutesToHourly(perMinute: number[]): number[] {
  const hourly = safeArray24();
  for (let m = 0; m < DAY_MINUTES; m += 1) {
    const h = Math.floor(m / 60);
    hourly[h] = (hourly[h] ?? 0) + (perMinute[m] ?? 0);
  }
  return hourly;
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

export function computeProducerHourly(producer: Producer): number[] {
  if (!producer.enabled) return safeArray24();

  const quantity = Math.max(1, Math.round(producer.quantity || 1));

  if (producer.model.kind === "solar_curve") {
    const hourly = safeArray24();
    const start = clamp(producer.model.startMin, 0, DAY_MINUTES);
    const end = clamp(producer.model.endMin, 0, DAY_MINUTES);
    const length = windowLength(start, end);
    if (length <= 0) return hourly;

    const peakKw = positive(producer.model.peakKw) * quantity;
    if (peakKw <= 0) return hourly;

    let elapsed = 0;
    forEachMinuteInWindow(start, end, (minute) => {
      const progress = elapsed / length;
      const kw = peakKw * Math.sin(Math.PI * progress);
      const kwh = Math.max(0, kw) / 60;
      const h = Math.floor(minute / 60) % 24;
      hourly[h] = (hourly[h] ?? 0) + kwh;
      elapsed += 1;
    });

    return hourly;
  }

  // Battery output is resolved in simulate() based on available excess energy.
  return safeArray24();
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
  const perProducerHourlyKwh: Record<string, number[]> = {};
  const perProducerDailyKwh: Record<string, number> = {};

  for (const appliance of config.appliances) {
    const hourly = computeApplianceHourly(appliance);
    perApplianceHourlyKwh[appliance.id] = hourly;
    perApplianceDailyKwh[appliance.id] = sumArray(hourly);
  }

  const nonBatteryProducers = config.producers.filter((producer) => producer.model.kind !== "battery_discharge");
  const batteryProducers = config.producers.filter((producer) => producer.model.kind === "battery_discharge");

  for (const producer of nonBatteryProducers) {
    const hourly = computeProducerHourly(producer);
    perProducerHourlyKwh[producer.id] = hourly;
    perProducerDailyKwh[producer.id] = sumArray(hourly);
  }

  const hourlyConsumptionKwh = sumHourlies(Object.values(perApplianceHourlyKwh));
  const hourlyProductionNonBatteryKwh = sumHourlies(Object.values(perProducerHourlyKwh));

  const consumptionPerMinute = expandHourlyToMinutes(hourlyConsumptionKwh);
  const nonBatteryProductionPerMinute = expandHourlyToMinutes(hourlyProductionNonBatteryKwh);

  type BatteryState = {
    producerId: string;
    capacityKwh: number;
    maxOutputPerMinKwh: number;
    startMin: number;
    endMin: number;
    chargeKwh: number;
    perMinuteOutput: number[];
  };

  const batteryStates: BatteryState[] = batteryProducers.flatMap((producer) => {
    const model = producer.model;
    if (model.kind !== "battery_discharge") return [];
    const qty = Math.max(1, Math.round(producer.quantity || 1));
    return [
      {
        producerId: producer.id,
        capacityKwh: positive(model.capacityKwh) * qty,
        maxOutputPerMinKwh: (positive(model.maxOutputKw) * qty) / 60,
        startMin: clamp(model.startMin, 0, DAY_MINUTES),
        endMin: clamp(model.endMin, 0, DAY_MINUTES),
        chargeKwh: 0,
        perMinuteOutput: safeArrayMinutes()
      }
    ];
  });

  for (let minute = 0; minute < DAY_MINUTES; minute += 1) {
    const netWithoutBattery = (nonBatteryProductionPerMinute[minute] ?? 0) - (consumptionPerMinute[minute] ?? 0);

    if (netWithoutBattery > 0) {
      let excess = netWithoutBattery;
      for (const state of batteryStates) {
        if (excess <= 0) break;
        const capacityLeft = state.capacityKwh - state.chargeKwh;
        if (capacityLeft <= 0) continue;
        const chargeIn = Math.min(capacityLeft, excess);
        state.chargeKwh += chargeIn;
        excess -= chargeIn;
      }
      continue;
    }

    if (netWithoutBattery < 0) {
      let deficit = -netWithoutBattery;
      for (const state of batteryStates) {
        if (deficit <= 0) break;
        if (!isMinuteInWindow(minute, state.startMin, state.endMin)) continue;
        const possibleOutput = Math.min(state.maxOutputPerMinKwh, state.chargeKwh);
        if (possibleOutput <= 0) continue;
        const output = Math.min(possibleOutput, deficit);
        state.chargeKwh -= output;
        state.perMinuteOutput[minute] = (state.perMinuteOutput[minute] ?? 0) + output;
        deficit -= output;
      }
    }
  }

  for (const state of batteryStates) {
    const hourly = compressMinutesToHourly(state.perMinuteOutput);
    perProducerHourlyKwh[state.producerId] = hourly;
    perProducerDailyKwh[state.producerId] = sumArray(hourly);
  }

  const hourlyProductionKwh = sumHourlies(Object.values(perProducerHourlyKwh));
  const hourlyTotalsKwh = safeArray24().map((_, h) => (hourlyConsumptionKwh[h] ?? 0) - (hourlyProductionKwh[h] ?? 0));

  const totalDailyConsumptionKwh = sumArray(hourlyConsumptionKwh);
  const totalDailyProductionKwh = sumArray(hourlyProductionKwh);
  const totalDailyKwh = totalDailyConsumptionKwh - totalDailyProductionKwh;
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
    hourlyConsumptionKwh,
    hourlyProductionKwh,
    perApplianceHourlyKwh,
    perApplianceDailyKwh,
    perProducerHourlyKwh,
    perProducerDailyKwh,
    totalDailyConsumptionKwh,
    totalDailyProductionKwh,
    totalDailyKwh,
    totalWeeklyKwh,
    totalMonthlyKwh,
    peakHour
  };
}
