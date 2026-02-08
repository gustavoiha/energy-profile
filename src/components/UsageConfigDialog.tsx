import type { HouseholdProfile, TariffModel } from "../types/domain";
import { ProfileEditor } from "./ProfileEditor";
import { ScenarioActions } from "./ScenarioActions";
import { TariffEditor } from "./TariffEditor";

interface UsageConfigDialogProps {
  open: boolean;
  tariff: TariffModel;
  profile: HouseholdProfile;
  onClose: () => void;
  onChangeTariff: (tariff: TariffModel) => void;
  onChangeProfile: (profile: HouseholdProfile) => void;
  onResetScenario: () => void;
  onExportScenario: () => void;
  onImportScenario: (file: File) => void;
  onCopyShareLink: () => void;
  onOpenWizard: () => void;
}

export function UsageConfigDialog({
  open,
  tariff,
  profile,
  onClose,
  onChangeTariff,
  onChangeProfile,
  onResetScenario,
  onExportScenario,
  onImportScenario,
  onCopyShareLink,
  onOpenWizard
}: UsageConfigDialogProps) {
  if (!open) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="modal-card usage-config-modal" onClick={(e) => e.stopPropagation()}>
        <div className="template-picker-header">
          <div>
            <h2>Tariff & Profile Configuration</h2>
            <p>Configure pricing rules, day profile, and scenario actions.</p>
          </div>
          <button type="button" onClick={onClose}>
            Close
          </button>
        </div>

        <section className="usage-config-section">
          <TariffEditor tariff={tariff} onChange={onChangeTariff} />
          <ProfileEditor profile={profile} onChange={onChangeProfile} />
          <ScenarioActions
            onOpenWizard={onOpenWizard}
            onResetScenario={onResetScenario}
            onExportScenario={onExportScenario}
            onImportScenario={onImportScenario}
            onCopyShareLink={onCopyShareLink}
          />
        </section>
      </div>
    </div>
  );
}
