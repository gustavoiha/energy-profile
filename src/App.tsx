import { Suspense, lazy, useEffect, useMemo, useState } from "react";
import { AddApplianceDialog } from "./components/AddApplianceDialog";
import { AddProducerDialog } from "./components/AddProducerDialog";
import { ApplianceEditorModal } from "./components/ApplianceEditorModal";
import { ProducerEditorModal } from "./components/ProducerEditorModal";
import { SetupWizardModal, type SetupWizardResult } from "./components/SetupWizardModal";
import { TemplatePickerPage } from "./components/TemplatePickerPage";
import { defaultFlatTariff, defaultProfile } from "./data/defaults";
import { appliancePresets, createApplianceFromPreset } from "./data/appliancePresets";
import { createProducerFromPreset, producerPresets } from "./data/producerPresets";
import { householdTemplates } from "./data/templates";
import type { Appliance, HouseholdConfig, HouseholdTemplate, Producer } from "./types/domain";
import { makeId } from "./utils/id";
import { validateAppliance, validateProducer } from "./utils/validation";

const SimulatorPage = lazy(async () => import("./components/SimulatorPage").then((mod) => ({ default: mod.SimulatorPage })));

const SCENARIO_STORAGE_KEY = "energy-profile:scenario.v2";
const BASELINE_STORAGE_KEY = "energy-profile:baseline.v2";
const WIZARD_COMPLETED_KEY = "energy-profile:wizard-completed.v1";

interface EditorState {
  isOpen: boolean;
  mode: "add" | "edit";
  draft: Appliance;
  editingId?: string;
}

interface ProducerEditorState {
  isOpen: boolean;
  mode: "add" | "edit";
  draft: Producer;
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

function defaultProducerDraft(): Producer {
  return {
    id: makeId("producer"),
    name: "Custom Producer",
    enabled: true,
    quantity: 1,
    icon: "producer-custom",
    model: {
      kind: "solar_curve",
      peakKw: 1,
      startMin: 7 * 60,
      endMin: 18 * 60
    }
  };
}

function buildConfig(template: HouseholdTemplate, seed?: Pick<HouseholdConfig, "profile" | "tariff">): HouseholdConfig {
  return {
    templateId: template.id,
    bedrooms: template.bedrooms,
    occupants: template.occupants,
    profile: seed?.profile ? structuredClone(seed.profile) : defaultProfile(),
    tariff: seed?.tariff ? structuredClone(seed.tariff) : defaultFlatTariff(),
    appliances: template.appliances.map((appliance) => ({
      ...structuredClone(appliance),
      id: makeId("appliance"),
      quantity: appliance.quantity ?? 1,
      icon: appliance.icon ?? "custom",
      enabled: appliance.enabled ?? true
    })),
    producers: template.producers.map((producer) => ({
      ...structuredClone(producer),
      id: makeId("producer"),
      quantity: producer.quantity ?? 1,
      icon: producer.icon ?? "producer-custom",
      enabled: producer.enabled ?? true
    }))
  };
}

function starterConfig(): HouseholdConfig | null {
  const starter = householdTemplates.find((template) => template.id === "starter-flat") ?? householdTemplates[0];
  return starter ? buildConfig(starter) : null;
}

function normalizeConfig(input: unknown): HouseholdConfig | null {
  if (!input || typeof input !== "object") return null;
  const candidate = input as Partial<HouseholdConfig>;
  if (!candidate.templateId || !Array.isArray(candidate.appliances) || !Array.isArray(candidate.producers)) {
    return null;
  }

  const fallbackTemplate = householdTemplates.find((template) => template.id === candidate.templateId) ?? householdTemplates[0];
  if (!fallbackTemplate) return null;

  const base = buildConfig(fallbackTemplate, {
    profile: defaultProfile(),
    tariff: defaultFlatTariff()
  });

  return {
    ...base,
    ...candidate,
    profile: candidate.profile ?? defaultProfile(),
    tariff: candidate.tariff ?? defaultFlatTariff(),
    appliances: candidate.appliances.map((appliance) => ({
      ...appliance,
      id: appliance.id ?? makeId("appliance"),
      enabled: appliance.enabled ?? true,
      quantity: appliance.quantity ?? 1,
      icon: appliance.icon ?? "custom"
    })),
    producers: candidate.producers.map((producer) => ({
      ...producer,
      id: producer.id ?? makeId("producer"),
      enabled: producer.enabled ?? true,
      quantity: producer.quantity ?? 1,
      icon: producer.icon ?? "producer-custom"
    }))
  };
}

function toUrlSafeBase64(text: string): string {
  return btoa(unescape(encodeURIComponent(text))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromUrlSafeBase64(value: string): string {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = `${base64}${"=".repeat((4 - (base64.length % 4)) % 4)}`;
  return decodeURIComponent(escape(atob(padded)));
}

function configFromUrl(): HouseholdConfig | null {
  const params = new URLSearchParams(window.location.search);
  const encoded = params.get("scenario");
  if (!encoded) return null;

  try {
    const decoded = fromUrlSafeBase64(encoded);
    return normalizeConfig(JSON.parse(decoded));
  } catch {
    return null;
  }
}

function configFromStorage(key: string): HouseholdConfig | null {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return normalizeConfig(JSON.parse(raw));
  } catch {
    return null;
  }
}

function wizardCompletedFromStorage(): boolean {
  try {
    return window.localStorage.getItem(WIZARD_COMPLETED_KEY) === "true";
  } catch {
    return false;
  }
}

export default function App() {
  const initialConfig = useMemo(() => configFromUrl() ?? configFromStorage(SCENARIO_STORAGE_KEY) ?? starterConfig(), []);

  const [config, setConfig] = useState<HouseholdConfig | null>(initialConfig);
  const [baselineConfig, setBaselineConfig] = useState<HouseholdConfig | null>(() => configFromStorage(BASELINE_STORAGE_KEY));
  const [isWizardOpen, setWizardOpen] = useState(() => Boolean(initialConfig) && !wizardCompletedFromStorage());
  const [wizardSession, setWizardSession] = useState(0);
  const [isTemplateDialogOpen, setTemplateDialogOpen] = useState(initialConfig === null);
  const [isAddDialogOpen, setAddDialogOpen] = useState(false);
  const [isAddProducerDialogOpen, setAddProducerDialogOpen] = useState(false);
  const [editor, setEditor] = useState<EditorState>({
    isOpen: false,
    mode: "add",
    draft: defaultDraft()
  });
  const [producerEditor, setProducerEditor] = useState<ProducerEditorState>({
    isOpen: false,
    mode: "add",
    draft: defaultProducerDraft()
  });

  useEffect(() => {
    if (!config) return;
    window.localStorage.setItem(SCENARIO_STORAGE_KEY, JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    if (!baselineConfig) {
      window.localStorage.removeItem(BASELINE_STORAGE_KEY);
      return;
    }
    window.localStorage.setItem(BASELINE_STORAGE_KEY, JSON.stringify(baselineConfig));
  }, [baselineConfig]);

  const selectTemplate = (templateId: string) => {
    const template = householdTemplates.find((t) => t.id === templateId);
    if (!template) return;
    setConfig((current) => buildConfig(template, current ? { profile: current.profile, tariff: current.tariff } : undefined));
    setTemplateDialogOpen(false);
  };

  const resetScenario = () => {
    setConfig((current) => {
      if (!current) return current;
      const template = householdTemplates.find((t) => t.id === current.templateId) ?? householdTemplates[0];
      if (!template) return current;
      return buildConfig(template, { profile: current.profile, tariff: current.tariff });
    });
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

  const addProducerFromSelection = (presetIds: string[], includeCustom: boolean) => {
    for (const presetId of presetIds) {
      addProducerFromPreset(presetId);
    }
    if (includeCustom) {
      openAddProducer();
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

  const toggleApplianceEnabled = (id: string) => {
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
      return {
        ...current,
        appliances: current.appliances.filter((appliance) => appliance.id !== id)
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

  const toggleProducerEnabled = (id: string) => {
    setConfig((current) => {
      if (!current) return current;
      return {
        ...current,
        producers: current.producers.map((producer) =>
          producer.id === id ? { ...producer, enabled: !producer.enabled } : producer
        )
      };
    });
  };

  const removeProducer = (id: string) => {
    setConfig((current) => {
      if (!current) return current;
      return {
        ...current,
        producers: current.producers.filter((producer) => producer.id !== id)
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

  const openAddProducer = () => {
    setProducerEditor({ isOpen: true, mode: "add", draft: defaultProducerDraft() });
  };

  const openEditProducer = (id: string) => {
    if (!config) return;
    const producer = config.producers.find((item) => item.id === id);
    if (!producer) return;
    setProducerEditor({
      isOpen: true,
      mode: "edit",
      draft: structuredClone(producer),
      editingId: id
    });
  };

  const saveProducerEditor = () => {
    const errors = validateProducer(producerEditor.draft);
    if (errors.length > 0) return;

    setConfig((current) => {
      if (!current) return current;
      if (producerEditor.mode === "add") {
        return {
          ...current,
          producers: [
            ...current.producers,
            { ...producerEditor.draft, id: makeId("producer"), icon: "producer-custom", presetId: undefined }
          ]
        };
      }

      return {
        ...current,
        producers: current.producers.map((producer) =>
          producer.id === producerEditor.editingId
            ? { ...producerEditor.draft, id: producer.id, icon: "producer-custom", presetId: undefined }
            : producer
        )
      };
    });

    setProducerEditor({ isOpen: false, mode: "add", draft: defaultProducerDraft() });
  };

  const exportScenario = () => {
    if (!config) return;
    const serialized = JSON.stringify(config, null, 2);
    const blob = new Blob([serialized], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "energy-scenario.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  const importScenario = async (file: File) => {
    const content = await file.text();
    try {
      const parsed = JSON.parse(content);
      const normalized = normalizeConfig(parsed);
      if (!normalized) {
        window.alert("Invalid scenario format.");
        return;
      }
      setConfig(normalized);
    } catch {
      window.alert("Invalid JSON file.");
    }
  };

  const copyShareLink = async () => {
    if (!config) return;
    const encoded = toUrlSafeBase64(JSON.stringify(config));
    const url = new URL(window.location.href);
    url.searchParams.set("scenario", encoded);
    const share = url.toString();

    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(share);
      return;
    }

    window.prompt("Copy this scenario link", share);
  };

  const setBaseline = () => {
    if (!config) return;
    setBaselineConfig(structuredClone(config));
  };

  const clearBaseline = () => {
    setBaselineConfig(null);
  };

  const openWizard = () => {
    setWizardSession((current) => current + 1);
    setWizardOpen(true);
  };

  const applyWizard = (result: SetupWizardResult) => {
    const template = householdTemplates.find((candidate) => candidate.id === result.templateId);
    if (!template) return;

    const wizardConfig = buildConfig(template, {
      profile: result.profile,
      tariff: result.tariff
    });

    const selectedProducers = result.producerPresetIds
      .map((presetId) => producerPresets.find((preset) => preset.id === presetId))
      .filter((preset): preset is NonNullable<typeof preset> => Boolean(preset))
      .map((preset) => createProducerFromPreset(preset, makeId("producer")));

    setConfig({
      ...wizardConfig,
      producers: selectedProducers
    });
    setWizardOpen(false);
    window.localStorage.setItem(WIZARD_COMPLETED_KEY, "true");
  };

  return (
    <div className="app-shell">
      {config && (
        <Suspense
          fallback={
            <div className="empty-state">
              <p>Loading simulator...</p>
            </div>
          }
        >
          <SimulatorPage
            config={config}
            baselineConfig={baselineConfig}
            onEdit={openEdit}
            onIncrement={incrementQuantity}
            onDecrement={decrementQuantity}
            onToggleEnabled={toggleApplianceEnabled}
            onRemove={removeAppliance}
            onEditProducer={openEditProducer}
            onIncrementProducer={incrementProducerQuantity}
            onDecrementProducer={decrementProducerQuantity}
            onToggleProducerEnabled={toggleProducerEnabled}
            onRemoveProducer={removeProducer}
            onChangeTariff={(tariff) => setConfig((current) => (current ? { ...current, tariff } : current))}
            onChangeProfile={(profile) => setConfig((current) => (current ? { ...current, profile } : current))}
            onOpenAddDialog={() => setAddDialogOpen(true)}
            onOpenAddProducerDialog={() => setAddProducerDialogOpen(true)}
            onOpenTemplates={() => setTemplateDialogOpen(true)}
            onSetBaseline={setBaseline}
            onClearBaseline={clearBaseline}
            onResetScenario={resetScenario}
            onExportScenario={exportScenario}
            onImportScenario={importScenario}
            onCopyShareLink={copyShareLink}
            onOpenWizard={openWizard}
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

      {config && (
        <SetupWizardModal
          key={`wizard-${wizardSession}-${config.templateId}`}
          open={isWizardOpen}
          templates={householdTemplates}
          initialConfig={config}
          onCancel={() => setWizardOpen(false)}
          onComplete={applyWizard}
        />
      )}

      <AddApplianceDialog open={isAddDialogOpen} onClose={() => setAddDialogOpen(false)} onAddSelection={addFromSelection} />

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

      <ProducerEditorModal
        open={producerEditor.isOpen}
        draft={producerEditor.draft}
        mode={producerEditor.mode}
        onChangeDraft={(draft) => setProducerEditor((current) => ({ ...current, draft }))}
        onCancel={() => setProducerEditor((current) => ({ ...current, isOpen: false }))}
        onSave={saveProducerEditor}
      />
    </div>
  );
}
