import type { Appliance, Producer, TariffModel } from "../types/domain";

const MAX_WATTS = 50000;
const MAX_COUNT = 200;
const MAX_MINUTES = 1440;

const numRange = (v: number, min: number, max: number) => Number.isFinite(v) && v >= min && v <= max;

export function validateAppliance(appliance: Appliance): string[] {
  const errors: string[] = [];

  if (!appliance.name.trim()) {
    errors.push("Name is required");
  }

  if (!Number.isInteger(appliance.quantity) || appliance.quantity < 1 || appliance.quantity > 1000) {
    errors.push("Quantity must be an integer between 1 and 1,000");
  }

  const model = appliance.model;
  switch (model.kind) {
    case "always_on": {
      if (!numRange(model.watts, 0, MAX_WATTS)) errors.push("Watts must be between 0 and 50,000");
      break;
    }
    case "scheduled_window": {
      if (!numRange(model.watts, 0, MAX_WATTS)) errors.push("Watts must be between 0 and 50,000");
      if (!numRange(model.startMin, 0, MAX_MINUTES)) {
        errors.push("Start time must be between 00:00 and 24:00");
      }
      if (!numRange(model.durationMin, 0, MAX_MINUTES)) {
        errors.push("Duration must be between 0 and 1,440 minutes");
      }
      break;
    }
    case "daily_duration": {
      if (!numRange(model.watts, 0, MAX_WATTS)) errors.push("Watts must be between 0 and 50,000");
      if (!numRange(model.minutesPerDay, 0, MAX_MINUTES)) errors.push("Minutes per day must be 0 to 1,440");
      if (model.window) {
        if (!numRange(model.window.startMin, 0, MAX_MINUTES) || !numRange(model.window.endMin, 0, MAX_MINUTES)) {
          errors.push("Window times must be between 00:00 and 24:00");
        }
      }
      break;
    }
    case "count_based": {
      if (!Number.isInteger(model.count) || !numRange(model.count, 0, MAX_COUNT)) {
        errors.push("Count must be an integer between 0 and 200");
      }
      if (!numRange(model.wattsEach, 0, MAX_WATTS)) errors.push("Watts each must be between 0 and 50,000");
      if (model.minutesPerDay !== undefined && !numRange(model.minutesPerDay, 0, MAX_MINUTES)) {
        errors.push("Minutes per day must be 0 to 1,440");
      }
      if (model.schedule) {
        if (!numRange(model.schedule.startMin, 0, MAX_MINUTES) || !numRange(model.schedule.endMin, 0, MAX_MINUTES)) {
          errors.push("Schedule times must be between 00:00 and 24:00");
        }
      }
      break;
    }
    default:
      break;
  }

  return errors;
}

export function validateProducer(producer: Producer): string[] {
  const errors: string[] = [];

  if (!producer.name.trim()) {
    errors.push("Name is required");
  }

  if (!Number.isInteger(producer.quantity) || producer.quantity < 1 || producer.quantity > 1000) {
    errors.push("Quantity must be an integer between 1 and 1,000");
  }

  const model = producer.model;
  if (model.kind === "solar_curve") {
    if (!numRange(model.peakKw, 0, 200)) errors.push("Peak kW must be between 0 and 200");
    if (!numRange(model.startMin, 0, MAX_MINUTES) || !numRange(model.endMin, 0, MAX_MINUTES)) {
      errors.push("Solar window must be between 00:00 and 24:00");
    }
  }

  if (model.kind === "battery_discharge") {
    if (!numRange(model.capacityKwh, 0, 1000)) errors.push("Battery capacity must be between 0 and 1,000 kWh");
    if (!numRange(model.maxOutputKw, 0, 200)) errors.push("Battery max output must be between 0 and 200 kW");
    if (!numRange(model.startMin, 0, MAX_MINUTES) || !numRange(model.endMin, 0, MAX_MINUTES)) {
      errors.push("Battery discharge window must be between 00:00 and 24:00");
    }
  }

  return errors;
}

export function validateTariff(tariff: TariffModel): string[] {
  const errors: string[] = [];

  if (!tariff.currency.trim()) {
    errors.push("Currency is required");
  }

  if (tariff.kind === "flat") {
    if (!numRange(tariff.ratePerKwh, 0, 10)) {
      errors.push("Flat rate must be between 0 and 10");
    }
    if (tariff.sellBackRatePerKwh !== undefined && !numRange(tariff.sellBackRatePerKwh, 0, 10)) {
      errors.push("Sell-back rate must be between 0 and 10");
    }
  }

  if (tariff.kind === "tou") {
    if (!numRange(tariff.defaultRatePerKwh, 0, 10)) {
      errors.push("Default TOU rate must be between 0 and 10");
    }
    if (tariff.sellBackRatePerKwh !== undefined && !numRange(tariff.sellBackRatePerKwh, 0, 10)) {
      errors.push("Sell-back rate must be between 0 and 10");
    }
    if (tariff.windows.length === 0) {
      errors.push("Add at least one TOU window");
    }
    for (const window of tariff.windows) {
      if (!numRange(window.startMin, 0, MAX_MINUTES) || !numRange(window.endMin, 0, MAX_MINUTES)) {
        errors.push("TOU window times must be between 00:00 and 24:00");
        break;
      }
      if (!numRange(window.ratePerKwh, 0, 10)) {
        errors.push("TOU window rates must be between 0 and 10");
        break;
      }
    }
  }

  return errors;
}
