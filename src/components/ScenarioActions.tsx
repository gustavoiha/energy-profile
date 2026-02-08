import { useRef } from "react";

interface ScenarioActionsProps {
  onResetScenario: () => void;
  onExportScenario: () => void;
  onImportScenario: (file: File) => void;
  onCopyShareLink: () => void;
  onOpenWizard: () => void;
}

export function ScenarioActions({
  onResetScenario,
  onExportScenario,
  onImportScenario,
  onCopyShareLink,
  onOpenWizard
}: ScenarioActionsProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <section className="panel-card">
      <h4>Scenario</h4>
      <div className="inline-actions">
        <button type="button" onClick={onOpenWizard}>
          Run Setup Wizard
        </button>
        <button type="button" onClick={onResetScenario}>
          Reset
        </button>
        <button type="button" onClick={onExportScenario}>
          Export JSON
        </button>
        <button type="button" onClick={() => fileInputRef.current?.click()}>
          Import JSON
        </button>
        <button type="button" onClick={onCopyShareLink}>
          Copy Share Link
        </button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        className="hidden-input"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onImportScenario(file);
          e.currentTarget.value = "";
        }}
      />
    </section>
  );
}
