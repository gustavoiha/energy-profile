import type {
  Appliance,
  ApplianceModel,
  BatteryStrategy,
  HouseholdConfig,
  HouseholdProfile,
  Producer,
  SavingsAction,
  SimulationResult,
  TariffModel,
  TariffWindow
} from "../types/domain";

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

function computeScheduledWindowHourlyForWatts(watts: number, startMin: number, durationMin: number): number[] {
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

function isWindowActiveForProfile(window: TariffWindow, profile: HouseholdProfile): boolean {
  const activeDay = !window.dayTypes || window.dayTypes.length === 0 || window.dayTypes.includes(profile.dayType);
  const activeSeason = !window.seasons || window.seasons.length === 0 || window.seasons.includes(profile.season);
  return activeDay && activeSeason;
}

export function getImportRatePerKwhAtMinute(tariff: TariffModel, profile: HouseholdProfile, minute: number): number {
  if (tariff.kind === "flat") {
    return positive(tariff.ratePerKwh);
  }

  let selectedRate = positive(tariff.defaultRatePerKwh);
  for (const window of tariff.windows) {
    if (!isWindowActiveForProfile(window, profile)) continue;
    if (!isMinuteInWindow(minute, window.startMin, window.endMin)) continue;
    selectedRate = positive(window.ratePerKwh);
  }

  return selectedRate;
}

function sellBackRatePerKwh(tariff: TariffModel): number {
  return positive(tariff.sellBackRatePerKwh ?? 0);
}

function hourlyAverageRates(tariff: TariffModel, profile: HouseholdProfile): number[] {
  const ratesByMinute = safeArrayMinutes();
  for (let minute = 0; minute < DAY_MINUTES; minute += 1) {
    ratesByMinute[minute] = getImportRatePerKwhAtMinute(tariff, profile, minute);
  }
  return compressMinutesToHourly(ratesByMinute).map((hRate) => hRate / 60);
}

function batteryPeakRateThreshold(tariff: TariffModel, profile: HouseholdProfile): number {
  if (tariff.kind === "flat") {
    return positive(tariff.ratePerKwh);
  }

  let maxRate = positive(tariff.defaultRatePerKwh);
  for (const window of tariff.windows) {
    if (!isWindowActiveForProfile(window, profile)) continue;
    maxRate = Math.max(maxRate, positive(window.ratePerKwh));
  }
  return maxRate;
}

function roundedQuantity(quantity: number): number {
  return Math.max(1, Math.round(quantity || 1));
}

function applianceScheduledShape(appliance: Appliance):
  | {
      modelKind: ApplianceModel["kind"];
      currentStartMin: number;
      durationMin: number;
      watts: number;
      windowStartMin: number;
      windowEndMin: number;
    }
  | undefined {
  if (!appliance.enabled) return undefined;

  if (appliance.model.kind === "scheduled_window") {
    return {
      modelKind: appliance.model.kind,
      currentStartMin: normalizeMinute(appliance.model.startMin),
      durationMin: clamp(appliance.model.durationMin, 0, DAY_MINUTES),
      watts: positive(appliance.model.watts) * roundedQuantity(appliance.quantity),
      windowStartMin: 0,
      windowEndMin: DAY_MINUTES
    };
  }

  if (appliance.model.kind === "daily_duration" && appliance.model.window) {
    const durationMin = clamp(appliance.model.minutesPerDay, 0, DAY_MINUTES);
    const winLen = windowLength(appliance.model.window.startMin, appliance.model.window.endMin);
    if (winLen <= 0 || durationMin <= 0) return undefined;

    const clampedDuration = Math.min(durationMin, winLen);
    const centered = centerDurationInWindow(clampedDuration, appliance.model.window.startMin, appliance.model.window.endMin);
    return {
      modelKind: appliance.model.kind,
      currentStartMin: centered.start,
      durationMin: clampedDuration,
      watts: positive(appliance.model.watts) * roundedQuantity(appliance.quantity),
      windowStartMin: normalizeMinute(appliance.model.window.startMin),
      windowEndMin: normalizeMinute(appliance.model.window.endMin)
    };
  }

  return undefined;
}

function canStartWithinWindow(start: number, duration: number, windowStart: number, windowEnd: number): boolean {
  if (windowStart === 0 && windowEnd === DAY_MINUTES) return true;
  if (duration <= 0) return false;

  const end = (start + duration) % DAY_MINUTES;
  const slices = splitWindow(start, end);
  if (slices.length === 0) return false;

  for (const slice of slices) {
    const minWithin = isMinuteInWindow(slice.s, windowStart, windowEnd);
    const endMinute = ((slice.e - 1) % DAY_MINUTES + DAY_MINUTES) % DAY_MINUTES;
    const endWithin = isMinuteInWindow(endMinute, windowStart, windowEnd);
    if (!minWithin || !endWithin) return false;
  }

  return true;
}

function estimateShiftSavingsActions(
  appliances: Appliance[],
  profile: HouseholdProfile,
  tariff: TariffModel,
  hourlyProductionKwh: number[],
  hourlyConsumptionKwh: number[]
): SavingsAction[] {
  const hourlyRate = hourlyAverageRates(tariff, profile);
  const solarCover = safeArray24().map((_, h) => clamp((hourlyProductionKwh[h] ?? 0) / Math.max(0.001, hourlyConsumptionKwh[h] ?? 0), 0, 1));
  const estimatedActions: SavingsAction[] = [];

  for (const appliance of appliances) {
    const shape = applianceScheduledShape(appliance);
    if (!shape || shape.durationMin <= 0 || shape.watts <= 0) continue;

    const weightedRate = (h: number) => {
      const rate = hourlyRate[h] ?? 0;
      const solarDiscount = 1 - (solarCover[h] ?? 0) * 0.8;
      return rate * solarDiscount;
    };

    const currentHourly = computeScheduledWindowHourlyForWatts(shape.watts, shape.currentStartMin, shape.durationMin);
    const currentCost = currentHourly.reduce((acc, kwh, h) => acc + kwh * weightedRate(h), 0);

    let bestCost = currentCost;
    let bestStart = shape.currentStartMin;

    for (let candidateStart = 0; candidateStart < DAY_MINUTES; candidateStart += 30) {
      if (!canStartWithinWindow(candidateStart, shape.durationMin, shape.windowStartMin, shape.windowEndMin)) continue;
      const candidateHourly = computeScheduledWindowHourlyForWatts(shape.watts, candidateStart, shape.durationMin);
      const candidateCost = candidateHourly.reduce((acc, kwh, h) => acc + kwh * weightedRate(h), 0);
      if (candidateCost < bestCost) {
        bestCost = candidateCost;
        bestStart = candidateStart;
      }
    }

    const savings = currentCost - bestCost;
    if (savings > 0.01 && bestStart !== shape.currentStartMin) {
      estimatedActions.push({
        applianceId: appliance.id,
        applianceName: appliance.name,
        modelKind: shape.modelKind,
        fromStartMin: shape.currentStartMin,
        toStartMin: bestStart,
        estimatedDailySavings: savings,
        reason: "Shift to cheaper tariff hours with stronger solar overlap"
      });
    }
  }

  return estimatedActions.sort((a, b) => b.estimatedDailySavings - a.estimatedDailySavings).slice(0, 3);
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
      baseHourly = computeScheduledWindowHourlyForWatts(model.watts, model.startMin, model.durationMin);
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

  const quantity = roundedQuantity(appliance.quantity);
  return scaleHourly(baseHourly, quantity);
}

export function computeProducerHourly(producer: Producer): number[] {
  if (!producer.enabled) return safeArray24();

  const quantity = roundedQuantity(producer.quantity);

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
  const perApplianceDailyCost: Record<string, number> = {};
  const perProducerHourlyKwh: Record<string, number[]> = {};
  const perProducerDailyKwh: Record<string, number> = {};
  const perProducerDailyCost: Record<string, number> = {};

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

  const importRateByMinute = safeArrayMinutes();
  for (let minute = 0; minute < DAY_MINUTES; minute += 1) {
    importRateByMinute[minute] = getImportRatePerKwhAtMinute(config.tariff, config.profile, minute);
  }

  const peakRateThreshold = batteryPeakRateThreshold(config.tariff, config.profile);

  type BatteryState = {
    producerId: string;
    strategy: BatteryStrategy;
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
    const qty = roundedQuantity(producer.quantity);
    return [
      {
        producerId: producer.id,
        strategy: model.strategy ?? "self_consumption",
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

        if (state.strategy === "peak_shaving") {
          const minuteRate = importRateByMinute[minute] ?? 0;
          if (minuteRate + 1e-9 < peakRateThreshold) continue;
        }

        const possibleOutput = Math.min(state.maxOutputPerMinKwh, state.chargeKwh);
        if (possibleOutput <= 0) continue;
        const output = Math.min(possibleOutput, deficit);
        state.chargeKwh -= output;
        state.perMinuteOutput[minute] = (state.perMinuteOutput[minute] ?? 0) + output;
        deficit -= output;
      }
    }
  }

  const batteryOutputPerMinute = safeArrayMinutes();
  for (const state of batteryStates) {
    for (let minute = 0; minute < DAY_MINUTES; minute += 1) {
      batteryOutputPerMinute[minute] = (batteryOutputPerMinute[minute] ?? 0) + (state.perMinuteOutput[minute] ?? 0);
    }
    const hourly = compressMinutesToHourly(state.perMinuteOutput);
    perProducerHourlyKwh[state.producerId] = hourly;
    perProducerDailyKwh[state.producerId] = sumArray(hourly);
  }

  const totalProductionPerMinute = safeArrayMinutes();
  const minuteImport = safeArrayMinutes();
  const minuteExport = safeArrayMinutes();
  const minuteImportCost = safeArrayMinutes();
  const minuteExportCredit = safeArrayMinutes();
  const minuteTotalCost = safeArrayMinutes();
  const minuteGrossImportCost = safeArrayMinutes();

  const sellBackRate = sellBackRatePerKwh(config.tariff);

  for (let minute = 0; minute < DAY_MINUTES; minute += 1) {
    totalProductionPerMinute[minute] = (nonBatteryProductionPerMinute[minute] ?? 0) + (batteryOutputPerMinute[minute] ?? 0);
    const consumption = consumptionPerMinute[minute] ?? 0;
    const production = totalProductionPerMinute[minute] ?? 0;
    const importKwh = Math.max(0, consumption - production);
    const exportKwh = Math.max(0, production - consumption);
    minuteImport[minute] = importKwh;
    minuteExport[minute] = exportKwh;

    const importRate = importRateByMinute[minute] ?? 0;
    const importCost = importKwh * importRate;
    const exportCredit = exportKwh * sellBackRate;
    const grossImportCost = consumption * importRate;

    minuteImportCost[minute] = importCost;
    minuteExportCredit[minute] = exportCredit;
    minuteTotalCost[minute] = importCost - exportCredit;
    minuteGrossImportCost[minute] = grossImportCost;
  }

  const hourlyProductionKwh = compressMinutesToHourly(totalProductionPerMinute);
  const hourlyTotalsKwh = safeArray24().map((_, h) => (hourlyConsumptionKwh[h] ?? 0) - (hourlyProductionKwh[h] ?? 0));
  const hourlyImportKwh = compressMinutesToHourly(minuteImport);
  const hourlyExportKwh = compressMinutesToHourly(minuteExport);
  const hourlyImportCost = compressMinutesToHourly(minuteImportCost);
  const hourlyExportCredit = compressMinutesToHourly(minuteExportCredit);
  const hourlyCost = compressMinutesToHourly(minuteTotalCost);
  const hourlyGrossImportCost = compressMinutesToHourly(minuteGrossImportCost);

  for (const appliance of config.appliances) {
    const applianceHourly = perApplianceHourlyKwh[appliance.id] ?? safeArray24();
    let applianceCost = 0;
    for (let h = 0; h < 24; h += 1) {
      const totalCons = hourlyConsumptionKwh[h] ?? 0;
      if (totalCons <= 0) continue;
      const share = (applianceHourly[h] ?? 0) / totalCons;
      applianceCost += (hourlyImportCost[h] ?? 0) * share;
    }
    perApplianceDailyCost[appliance.id] = applianceCost;
  }

  for (const producer of config.producers) {
    const producerHourly = perProducerHourlyKwh[producer.id] ?? safeArray24();
    let producerCredit = 0;
    for (let h = 0; h < 24; h += 1) {
      const totalProd = hourlyProductionKwh[h] ?? 0;
      if (totalProd <= 0) continue;
      const share = (producerHourly[h] ?? 0) / totalProd;
      const grossRate = (hourlyAverageRates(config.tariff, config.profile)[h] ?? 0) * (hourlyConsumptionKwh[h] ?? 0);
      const avoidedImportValue = Math.max(0, grossRate - (hourlyImportCost[h] ?? 0));
      const producerValue = avoidedImportValue + (hourlyExportCredit[h] ?? 0);
      producerCredit += producerValue * share;
    }
    perProducerDailyCost[producer.id] = -producerCredit;
  }

  const totalDailyConsumptionKwh = sumArray(hourlyConsumptionKwh);
  const totalDailyProductionKwh = sumArray(hourlyProductionKwh);
  const totalDailyKwh = totalDailyConsumptionKwh - totalDailyProductionKwh;
  const totalWeeklyKwh = totalDailyKwh * 7;
  const totalMonthlyKwh = totalDailyKwh * 30.4;

  const totalDailyCost = sumArray(hourlyCost);
  const totalWeeklyCost = totalDailyCost * 7;
  const totalMonthlyCost = totalDailyCost * 30.4;
  const totalDailySavings = sumArray(hourlyGrossImportCost) - totalDailyCost;
  const totalWeeklySavings = totalDailySavings * 7;
  const totalMonthlySavings = totalDailySavings * 30.4;

  let peakHour = 0;
  for (let h = 1; h < 24; h += 1) {
    if ((hourlyTotalsKwh[h] ?? 0) > (hourlyTotalsKwh[peakHour] ?? 0)) {
      peakHour = h;
    }
  }

  const savingsActions = estimateShiftSavingsActions(
    config.appliances,
    config.profile,
    config.tariff,
    hourlyProductionKwh,
    hourlyConsumptionKwh
  );

  return {
    hourlyTotalsKwh,
    hourlyConsumptionKwh,
    hourlyProductionKwh,
    hourlyImportKwh,
    hourlyExportKwh,
    hourlyCost,
    perApplianceHourlyKwh,
    perApplianceDailyKwh,
    perApplianceDailyCost,
    perProducerHourlyKwh,
    perProducerDailyKwh,
    perProducerDailyCost,
    totalDailyConsumptionKwh,
    totalDailyProductionKwh,
    totalDailyKwh,
    totalWeeklyKwh,
    totalMonthlyKwh,
    totalDailyCost,
    totalWeeklyCost,
    totalMonthlyCost,
    totalDailySavings,
    totalWeeklySavings,
    totalMonthlySavings,
    peakHour,
    savingsActions
  };
}

export function compareSimulation(current: SimulationResult, baseline: SimulationResult) {
  return {
    dailyKwhDelta: current.totalDailyKwh - baseline.totalDailyKwh,
    monthlyKwhDelta: current.totalMonthlyKwh - baseline.totalMonthlyKwh,
    dailyCostDelta: current.totalDailyCost - baseline.totalDailyCost,
    monthlyCostDelta: current.totalMonthlyCost - baseline.totalMonthlyCost
  };
}
