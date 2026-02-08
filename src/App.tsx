import { Suspense, lazy, useState } from "react";
import { AddApplianceDialog } from "./components/AddApplianceDialog";
import { AddProducerDialog } from "./components/AddProducerDialog";
import { ApplianceEditorModal } from "./components/ApplianceEditorModal";
import { TemplatePickerPage } from "./components/TemplatePickerPage";
import { appliancePresets, createApplianceFromPreset } from "./data/appliancePresets";
import { createProducerFromPreset, producerPresets } from "./data/producerPresets";
import { householdTemplates } from "./data/templates";
import type { Appliance, HouseholdConfig, HouseholdTemplate } from "./types/domain";
import { makeId } from "./utils/id";
import { validateAppliance } from "./utils/validation";

const SimulatorPage = lazy(async () => import("./components/SimulatorPage").then((mod) => ({ default: mod.SimulatorPage })));

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
    })),
    producers: template.producers.map((producer) => ({
      ...structuredClone(producer),
      id: makeId("producer"),
      quantity: producer.quantity ?? 1,
      icon: producer.icon ?? "producer-custom"
    }))
  };
}

export default function App() {
  const initialConfig = (() => {
    const starter = householdTemplates.find((template) => template.id === "starter-flat") ?? householdTemplates[0];
    return starter ? buildConfig(starter) : null;
  })();
  const [config, setConfig] = useState<HouseholdConfig | null>(initialConfig);
  const [isTemplateDialogOpen, setTemplateDialogOpen] = useState(initialConfig === null);
  const [isAddDialogOpen, setAddDialogOpen] = useState(false);
  const [isAddProducerDialogOpen, setAddProducerDialogOpen] = useState(false);
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

  const addProducerFromPreset = (presetId: string) => {
    setConfig((current) => {
      if (!current) return current;
      const existing = current.producers.find((producer) => producer.presetId === presetId && producer.icon !== "producer-custom");
      if (existing) {
        return {
          ...current,
          producers: current.producers.map((producer) =>
            producer.id === existing.id ? { ...producer, quantity: producer.quantity + 1 } : producer
          )
        };
      }

      const preset = producerPresets.find((item) => item.id === presetId);
      if (!preset) return current;
      const producer = createProducerFromPreset(preset, makeId("producer"));
      return {
        ...current,
        producers: [...current.producers, producer]
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

  const addProducerFromSelection = (presetIds: string[]) => {
    for (const presetId of presetIds) {
      addProducerFromPreset(presetId);
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

  const incrementProducerQuantity = (id: string) => {
    setConfig((current) => {
      if (!current) return current;
      return {
        ...current,
        producers: current.producers.map((producer) =>
          producer.id === id ? { ...producer, quantity: producer.quantity + 1 } : producer
        )
      };
    });
  };

  const decrementProducerQuantity = (id: string) => {
    setConfig((current) => {
      if (!current) return current;
      return {
        ...current,
        producers: current.producers
          .map((producer) => (producer.id === id ? { ...producer, quantity: producer.quantity - 1 } : producer))
          .filter((producer) => producer.quantity > 0)
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
      {config && (
        <Suspense fallback={<div className="empty-state"><p>Loading simulator…</p></div>}>
          <SimulatorPage
            config={config}
            onEdit={openEdit}
            onIncrement={incrementQuantity}
            onDecrement={decrementQuantity}
            onIncrementProducer={incrementProducerQuantity}
            onDecrementProducer={decrementProducerQuantity}
            onOpenAddDialog={() => setAddDialogOpen(true)}
            onOpenAddProducerDialog={() => setAddProducerDialogOpen(true)}
            onOpenTemplates={() => setTemplateDialogOpen(true)}
          />
        </Suspense>
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

      <AddProducerDialog
        open={isAddProducerDialogOpen}
        onClose={() => setAddProducerDialogOpen(false)}
        onAddSelection={addProducerFromSelection}
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
