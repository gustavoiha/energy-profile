import { useState } from "react";
import { producerPresets } from "../data/producerPresets";
import { ApplianceIcon } from "./ApplianceIcon";

interface AddProducerDialogProps {
  open: boolean;
  onClose: () => void;
  onAddSelection: (presetIds: string[], includeCustom: boolean) => void;
}

export function AddProducerDialog({ open, onClose, onAddSelection }: AddProducerDialogProps) {
  const [selectedPresetIds, setSelectedPresetIds] = useState<string[]>([]);
  const [isCustomSelected, setCustomSelected] = useState(false);

  if (!open) return null;

  const togglePreset = (presetId: string) => {
    setSelectedPresetIds((current) =>
      current.includes(presetId) ? current.filter((id) => id !== presetId) : [...current, presetId]
    );
  };

  const closeAndReset = () => {
    setSelectedPresetIds([]);
    setCustomSelected(false);
    onClose();
  };

  const hasSelection = selectedPresetIds.length > 0 || isCustomSelected;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" onClick={closeAndReset}>
      <div className="modal-card add-appliance-modal" onClick={(e) => e.stopPropagation()}>
        <div className="template-picker-header">
          <div>
            <h2>Add Producer</h2>
            <p>Select one or more producers, then click Add Producers.</p>
          </div>
          <button type="button" onClick={closeAndReset}>
            Close
          </button>
        </div>

        <div className="preset-grid">
          {producerPresets.map((preset) => {
            const selected = selectedPresetIds.includes(preset.id);
            return (
              <button
                key={preset.id}
                type="button"
                className={`preset-item ${selected ? "selected" : ""}`}
                onClick={() => togglePreset(preset.id)}
              >
                <span className="preset-item-main">
                  <ApplianceIcon icon={preset.icon} />
                  <span>{preset.name}</span>
                </span>
              </button>
            );
          })}

          <button
            type="button"
            className={`preset-item ${isCustomSelected ? "selected" : ""}`}
            onClick={() => setCustomSelected((current) => !current)}
          >
            <span className="preset-item-main">
              <ApplianceIcon icon="producer-custom" />
              <span>Custom Producer</span>
            </span>
          </button>
        </div>

        <div className="modal-actions">
          <button type="button" onClick={closeAndReset}>
            Cancel
          </button>
          <button
            type="button"
            className="add-custom-btn"
            disabled={!hasSelection}
            onClick={() => {
              onAddSelection(selectedPresetIds, isCustomSelected);
              closeAndReset();
            }}
          >
            Add Producers
          </button>
        </div>
      </div>
    </div>
  );
}
