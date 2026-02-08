import { computeApplianceHourly } from "../sim/simulate";
import type { Appliance, ApplianceModel } from "../types/domain";
import { fmtMinuteOfDay, parseHourMinute } from "../utils/time";
import { validateAppliance } from "../utils/validation";

interface ApplianceEditorModalProps {
  open: boolean;
  draft: Appliance;
  mode: "add" | "edit";
  onChangeDraft: (draft: Appliance) => void;
  onCancel: () => void;
  onSave: () => void;
}

const modelKinds: ApplianceModel["kind"][] = ["always_on", "scheduled_window", "daily_duration", "count_based"];

function defaultModel(kind: ApplianceModel["kind"]): ApplianceModel {
  switch (kind) {
    case "always_on":
      return { kind, watts: 100 };
    case "scheduled_window":
      return { kind, watts: 100, startMin: 18 * 60, durationMin: 120 };
    case "daily_duration":
      return { kind, watts: 100, minutesPerDay: 120 };
    case "count_based":
      return { kind, count: 1, wattsEach: 60, minutesPerDay: 180 };
    default:
      return { kind: "always_on", watts: 100 };
  }
}

function NumInput({
  value,
  onChange,
  min,
  max,
  step = 1
}: {
  value?: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <input
      type="number"
      value={value ?? ""}
      min={min}
      max={max}
      step={step}
      onChange={(e) => onChange(Number(e.target.value))}
    />
  );
}

function TimeInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return <input type="time" value={fmtMinuteOfDay(value)} onChange={(e) => onChange(parseHourMinute(e.target.value))} />;
}

function renderModelFields(draft: Appliance, onChangeDraft: (draft: Appliance) => void) {
  switch (draft.model.kind) {
    case "always_on": {
      const model = draft.model;
      return (
        <label>
          Watts
          <NumInput
            value={model.watts}
            min={0}
            max={50000}
            onChange={(v) => onChangeDraft({ ...draft, model: { kind: "always_on", watts: v } })}
          />
        </label>
      );
    }

    case "scheduled_window": {
      const model = draft.model;
      return (
        <>
          <label>
            Watts
            <NumInput
              value={model.watts}
              min={0}
              max={50000}
              onChange={(v) =>
                onChangeDraft({
                  ...draft,
                  model: {
                    kind: "scheduled_window",
                    watts: v,
                    startMin: model.startMin,
                    durationMin: model.durationMin
                  }
                })
              }
            />
          </label>
          <label>
            Start
            <TimeInput
              value={model.startMin}
              onChange={(v) =>
                onChangeDraft({
                  ...draft,
                  model: {
                    kind: "scheduled_window",
                    watts: model.watts,
                    startMin: v,
                    durationMin: model.durationMin
                  }
                })
              }
            />
          </label>
          <label>
            Duration (minutes)
            <NumInput
              value={model.durationMin}
              min={0}
              max={1440}
              onChange={(v) =>
                onChangeDraft({
                  ...draft,
                  model: {
                    kind: "scheduled_window",
                    watts: model.watts,
                    startMin: model.startMin,
                    durationMin: v
                  }
                })
              }
            />
          </label>
        </>
      );
    }

    case "daily_duration": {
      const model = draft.model;
      return (
        <>
          <label>
            Watts
            <NumInput
              value={model.watts}
              min={0}
              max={50000}
              onChange={(v) =>
                onChangeDraft({
                  ...draft,
                  model: { kind: "daily_duration", watts: v, minutesPerDay: model.minutesPerDay, window: model.window }
                })
              }
            />
          </label>
          <label>
            Minutes Per Day
            <NumInput
              value={model.minutesPerDay}
              min={0}
              max={1440}
              onChange={(v) =>
                onChangeDraft({
                  ...draft,
                  model: { kind: "daily_duration", watts: model.watts, minutesPerDay: v, window: model.window }
                })
              }
            />
          </label>
          <label>
            Window Start
            <TimeInput
              value={model.window?.startMin ?? 8 * 60}
              onChange={(v) =>
                onChangeDraft({
                  ...draft,
                  model: {
                    kind: "daily_duration",
                    watts: model.watts,
                    minutesPerDay: model.minutesPerDay,
                    window: { startMin: v, endMin: model.window?.endMin ?? 22 * 60 }
                  }
                })
              }
            />
          </label>
          <label>
            Window End
            <TimeInput
              value={model.window?.endMin ?? 22 * 60}
              onChange={(v) =>
                onChangeDraft({
                  ...draft,
                  model: {
                    kind: "daily_duration",
                    watts: model.watts,
                    minutesPerDay: model.minutesPerDay,
                    window: { startMin: model.window?.startMin ?? 8 * 60, endMin: v }
                  }
                })
              }
            />
          </label>
        </>
      );
    }

    case "count_based": {
      const model = draft.model;
      return (
        <>
          <label>
            Count
            <NumInput
              value={model.count}
              min={0}
              max={200}
              onChange={(v) =>
                onChangeDraft({
                  ...draft,
                  model: {
                    kind: "count_based",
                    count: v,
                    wattsEach: model.wattsEach,
                    minutesPerDay: model.minutesPerDay,
                    schedule: model.schedule
                  }
                })
              }
            />
          </label>
          <label>
            Watts Each
            <NumInput
              value={model.wattsEach}
              min={0}
              max={50000}
              onChange={(v) =>
                onChangeDraft({
                  ...draft,
                  model: {
                    kind: "count_based",
                    count: model.count,
                    wattsEach: v,
                    minutesPerDay: model.minutesPerDay,
                    schedule: model.schedule
                  }
                })
              }
            />
          </label>
          <label>
            Minutes Per Day (optional)
            <NumInput
              value={model.minutesPerDay}
              min={0}
              max={1440}
              onChange={(v) =>
                onChangeDraft({
                  ...draft,
                  model: {
                    kind: "count_based",
                    count: model.count,
                    wattsEach: model.wattsEach,
                    minutesPerDay: v,
                    schedule: model.schedule
                  }
                })
              }
            />
          </label>
          <label>
            Schedule Start
            <TimeInput
              value={model.schedule?.startMin ?? 18 * 60}
              onChange={(v) =>
                onChangeDraft({
                  ...draft,
                  model: {
                    kind: "count_based",
                    count: model.count,
                    wattsEach: model.wattsEach,
                    minutesPerDay: model.minutesPerDay,
                    schedule: { startMin: v, endMin: model.schedule?.endMin ?? 23 * 60 }
                  }
                })
              }
            />
          </label>
          <label>
            Schedule End
            <TimeInput
              value={model.schedule?.endMin ?? 23 * 60}
              onChange={(v) =>
                onChangeDraft({
                  ...draft,
                  model: {
                    kind: "count_based",
                    count: model.count,
                    wattsEach: model.wattsEach,
                    minutesPerDay: model.minutesPerDay,
                    schedule: { startMin: model.schedule?.startMin ?? 18 * 60, endMin: v }
                  }
                })
              }
            />
          </label>
        </>
      );
    }

    default:
      return null;
  }
}

export function ApplianceEditorModal({ open, draft, mode, onChangeDraft, onCancel, onSave }: ApplianceEditorModalProps) {
  if (!open) return null;

  const errors = validateAppliance(draft);
  const previewKwh = computeApplianceHourly(draft).reduce((acc, v) => acc + v, 0);

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-card">
        <h3>{mode === "add" ? "Add Appliance" : "Edit Appliance"}</h3>

        <label>
          Name
          <input type="text" value={draft.name} onChange={(e) => onChangeDraft({ ...draft, name: e.target.value })} />
        </label>

        <label>
          Model Kind
          <select
            value={draft.model.kind}
            onChange={(e) => onChangeDraft({ ...draft, model: defaultModel(e.target.value as ApplianceModel["kind"]) })}
          >
            {modelKinds.map((kind) => (
              <option key={kind} value={kind}>
                {kind}
              </option>
            ))}
          </select>
        </label>

        {renderModelFields(draft, onChangeDraft)}

        <p className="preview">Draft estimate: {previewKwh.toFixed(3)} kWh/day</p>

        {errors.length > 0 && (
          <div className="errors">
            {errors.map((error) => (
              <p key={error}>{error}</p>
            ))}
          </div>
        )}

        <div className="modal-actions">
          <button type="button" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" onClick={onSave} disabled={errors.length > 0}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
