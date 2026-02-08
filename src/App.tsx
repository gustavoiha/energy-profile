import { useState } from "react";
import { ApplianceEditorModal } from "./components/ApplianceEditorModal";
import { SimulatorPage } from "./components/SimulatorPage";
import { TemplatePickerPage } from "./components/TemplatePickerPage";
import { householdTemplates } from "./data/templates";
import type { Appliance, HouseholdConfig, HouseholdTemplate } from "./types/domain";
import { makeId } from "./utils/id";
import { validateAppliance } from "./utils/validation";

interface EditorState {
  isOpen: boolean;
  mode: "add" | "edit";
  draft: Appliance;
  editingId?: string;
}

function defaultDraft(): Appliance {
  return {
    id: makeId("appliance"),
    name: "New Appliance",
    category: "other",
    enabled: true,
    model: { kind: "always_on", watts: 100 }
  };
}

function buildConfig(template: HouseholdTemplate): HouseholdConfig {
  return {
    templateId: template.id,
    bedrooms: template.bedrooms,
    occupants: template.occupants,
    appliances: template.appliances.map((appliance) => ({ ...structuredClone(appliance), id: makeId("appliance") }))
  };
}

export default function App() {
  const [config, setConfig] = useState<HouseholdConfig | null>(null);
  const [isTemplateDialogOpen, setTemplateDialogOpen] = useState(true);
  const [editor, setEditor] = useState<EditorState>({
    isOpen: false,
    mode: "add",
    draft: defaultDraft()
  });

  const selectTemplate = (templateId: string) => {
    const template = householdTemplates.find((t) => t.id === templateId);
    if (!template) return;
    setConfig(buildConfig(template));
    setTemplateDialogOpen(false);
  };

  const toggleEnabled = (id: string) => {
    setConfig((current) => {
      if (!current) return current;
      return {
        ...current,
        appliances: current.appliances.map((appliance) =>
          appliance.id === id ? { ...appliance, enabled: !appliance.enabled } : appliance
        )
      };
    });
  };

  const removeAppliance = (id: string) => {
    setConfig((current) => {
      if (!current) return current;
      return { ...current, appliances: current.appliances.filter((appliance) => appliance.id !== id) };
    });
  };

  const openAdd = () => {
    setEditor({ isOpen: true, mode: "add", draft: defaultDraft() });
  };

  const openEdit = (id: string) => {
    if (!config) return;
    const appliance = config.appliances.find((item) => item.id === id);
    if (!appliance) return;
    setEditor({
      isOpen: true,
      mode: "edit",
      draft: structuredClone(appliance),
      editingId: id
    });
  };

  const saveEditor = () => {
    const errors = validateAppliance(editor.draft);
    if (errors.length > 0) return;

    setConfig((current) => {
      if (!current) return current;
      if (editor.mode === "add") {
        return {
          ...current,
          appliances: [...current.appliances, { ...editor.draft, id: makeId("appliance") }]
        };
      }

      return {
        ...current,
        appliances: current.appliances.map((appliance) =>
          appliance.id === editor.editingId ? { ...editor.draft, id: appliance.id } : appliance
        )
      };
    });

    setEditor({ isOpen: false, mode: "add", draft: defaultDraft() });
  };

  return (
    <div className="app-shell">
      {config ? (
        <SimulatorPage
          config={config}
          onToggle={toggleEnabled}
          onAdd={openAdd}
          onEdit={openEdit}
          onDelete={removeAppliance}
          onOpenTemplates={() => setTemplateDialogOpen(true)}
        />
      ) : (
        <div className="empty-state">
          <h2>No household selected</h2>
          <p>Select a template to begin simulation.</p>
        </div>
      )}

      <TemplatePickerPage
        open={isTemplateDialogOpen}
        templates={householdTemplates}
        onSelect={selectTemplate}
        onClose={() => setTemplateDialogOpen(false)}
        requireSelection={!config}
      />

      <ApplianceEditorModal
        open={editor.isOpen}
        draft={editor.draft}
        mode={editor.mode}
        onChangeDraft={(draft) => setEditor((current) => ({ ...current, draft }))}
        onCancel={() => setEditor((current) => ({ ...current, isOpen: false }))}
        onSave={saveEditor}
      />
    </div>
  );
}
