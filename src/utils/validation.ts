import type { Appliance } from "../types/domain";

const MAX_WATTS = 50000;
const MAX_COUNT = 200;
const MAX_MINUTES = 1440;

const numRange = (v: number, min: number, max: number) => Number.isFinite(v) && v >= min && v <= max;

export function validateAppliance(appliance: Appliance): string[] {
  const errors: string[] = [];

  if (!appliance.name.trim()) {
    errors.push("Name is required");
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
      if (model.weekdays.length === 0) {
        errors.push("Select at least one weekday");
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
