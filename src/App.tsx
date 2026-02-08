import { useState } from "react";
import { AddApplianceDialog } from "./components/AddApplianceDialog";
import { ApplianceEditorModal } from "./components/ApplianceEditorModal";
import { SimulatorPage } from "./components/SimulatorPage";
import { TemplatePickerPage } from "./components/TemplatePickerPage";
import { appliancePresets, createApplianceFromPreset } from "./data/appliancePresets";
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
    name: "Custom Appliance",
    enabled: true,
    quantity: 1,
    icon: "custom",
    model: { kind: "always_on", watts: 100 }
  };
}

function buildConfig(template: HouseholdTemplate): HouseholdConfig {
  return {
    templateId: template.id,
    bedrooms: template.bedrooms,
    occupants: template.occupants,
    appliances: template.appliances.map((appliance) => ({
      ...structuredClone(appliance),
      id: makeId("appliance"),
      quantity: appliance.quantity ?? 1,
      icon: appliance.icon ?? "custom"
    }))
  };
}

export default function App() {
  const [config, setConfig] = useState<HouseholdConfig | null>(null);
  const [isTemplateDialogOpen, setTemplateDialogOpen] = useState(true);
  const [isAddDialogOpen, setAddDialogOpen] = useState(false);
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

  const addFromPreset = (presetId: string) => {
    setConfig((current) => {
      if (!current) return current;
      const existing = current.appliances.find((appliance) => appliance.presetId === presetId && appliance.icon !== "custom");
      if (existing) {
        return {
          ...current,
          appliances: current.appliances.map((appliance) =>
            appliance.id === existing.id ? { ...appliance, quantity: appliance.quantity + 1 } : appliance
          )
        };
      }

      const preset = appliancePresets.find((item) => item.id === presetId);
      if (!preset) return current;
      const appliance = createApplianceFromPreset(preset, makeId("appliance"));
      return {
        ...current,
        appliances: [...current.appliances, appliance]
      };
    });
  };

  const addFromSelection = (presetIds: string[], includeCustom: boolean) => {
    for (const presetId of presetIds) {
      addFromPreset(presetId);
    }
    if (includeCustom) {
      openAdd();
    }
  };

  const incrementQuantity = (id: string) => {
    setConfig((current) => {
      if (!current) return current;
      return {
        ...current,
        appliances: current.appliances.map((appliance) =>
          appliance.id === id ? { ...appliance, quantity: appliance.quantity + 1 } : appliance
        )
      };
    });
  };

  const decrementQuantity = (id: string) => {
    setConfig((current) => {
      if (!current) return current;
      return {
        ...current,
        appliances: current.appliances
          .map((appliance) => (appliance.id === id ? { ...appliance, quantity: appliance.quantity - 1 } : appliance))
          .filter((appliance) => appliance.quantity > 0)
      };
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
          appliances: [...current.appliances, { ...editor.draft, id: makeId("appliance"), icon: "custom", presetId: undefined }]
        };
      }

      return {
        ...current,
        appliances: current.appliances.map((appliance) =>
          appliance.id === editor.editingId
            ? { ...editor.draft, id: appliance.id, icon: "custom", presetId: undefined }
            : appliance
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
          onEdit={openEdit}
          onIncrement={incrementQuantity}
          onDecrement={decrementQuantity}
          onOpenAddDialog={() => setAddDialogOpen(true)}
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

      <AddApplianceDialog
        open={isAddDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        onAddSelection={addFromSelection}
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
