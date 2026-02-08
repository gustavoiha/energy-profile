import { computeProducerHourly } from "../sim/simulate";
import type { Producer, ProducerModel } from "../types/domain";
import { fmtMinuteOfDay, parseHourMinute } from "../utils/time";
import { validateProducer } from "../utils/validation";

interface ProducerEditorModalProps {
  open: boolean;
  draft: Producer;
  mode: "add" | "edit";
  onChangeDraft: (draft: Producer) => void;
  onCancel: () => void;
  onSave: () => void;
}

const modelKinds: ProducerModel["kind"][] = ["solar_curve", "battery_discharge"];

function defaultModel(kind: ProducerModel["kind"]): ProducerModel {
  switch (kind) {
    case "solar_curve":
      return { kind, peakKw: 1.2, startMin: 7 * 60, endMin: 18 * 60 };
    case "battery_discharge":
      return {
        kind,
        capacityKwh: 4,
        maxOutputKw: 1,
        startMin: 18 * 60,
        endMin: 24 * 60,
        strategy: "self_consumption"
      };
    default:
      return { kind: "solar_curve", peakKw: 1.2, startMin: 7 * 60, endMin: 18 * 60 };
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

function renderModelFields(draft: Producer, onChangeDraft: (draft: Producer) => void) {
  switch (draft.model.kind) {
    case "solar_curve": {
      const model = draft.model;
      return (
        <>
          <label>
            Peak kW
            <NumInput
              value={model.peakKw}
              min={0}
              max={200}
              step={0.1}
              onChange={(v) => onChangeDraft({ ...draft, model: { ...model, peakKw: v } })}
            />
          </label>
          <label>
            Start
            <TimeInput value={model.startMin} onChange={(v) => onChangeDraft({ ...draft, model: { ...model, startMin: v } })} />
          </label>
          <label>
            End
            <TimeInput value={model.endMin} onChange={(v) => onChangeDraft({ ...draft, model: { ...model, endMin: v } })} />
          </label>
        </>
      );
    }

    case "battery_discharge": {
      const model = draft.model;
      return (
        <>
          <label>
            Capacity (kWh)
            <NumInput
              value={model.capacityKwh}
              min={0}
              max={1000}
              step={0.1}
              onChange={(v) => onChangeDraft({ ...draft, model: { ...model, capacityKwh: v } })}
            />
          </label>
          <label>
            Max Output (kW)
            <NumInput
              value={model.maxOutputKw}
              min={0}
              max={200}
              step={0.1}
              onChange={(v) => onChangeDraft({ ...draft, model: { ...model, maxOutputKw: v } })}
            />
          </label>
          <label>
            Window Start
            <TimeInput value={model.startMin} onChange={(v) => onChangeDraft({ ...draft, model: { ...model, startMin: v } })} />
          </label>
          <label>
            Window End
            <TimeInput value={model.endMin} onChange={(v) => onChangeDraft({ ...draft, model: { ...model, endMin: v } })} />
          </label>
          <label>
            Strategy
            <select
              value={model.strategy ?? "self_consumption"}
              onChange={(e) =>
                onChangeDraft({
                  ...draft,
                  model: {
                    ...model,
                    strategy: e.target.value === "peak_shaving" ? "peak_shaving" : "self_consumption"
                  }
                })
              }
            >
              <option value="self_consumption">Self-consumption</option>
              <option value="peak_shaving">Peak-shaving</option>
            </select>
          </label>
        </>
      );
    }

    default:
      return null;
  }
}

export function ProducerEditorModal({ open, draft, mode, onChangeDraft, onCancel, onSave }: ProducerEditorModalProps) {
  if (!open) return null;

  const errors = validateProducer(draft);
  const previewKwh = computeProducerHourly(draft).reduce((acc, v) => acc + v, 0);

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-card">
        <h3>{mode === "add" ? "Add Producer" : "Edit Producer"}</h3>

        <label>
          Name
          <input type="text" value={draft.name} onChange={(e) => onChangeDraft({ ...draft, name: e.target.value })} />
        </label>

        <label>
          Model Kind
          <select
            value={draft.model.kind}
            onChange={(e) => onChangeDraft({ ...draft, model: defaultModel(e.target.value as ProducerModel["kind"]) })}
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
