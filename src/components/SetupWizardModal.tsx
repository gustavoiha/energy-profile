import { useMemo, useState } from "react";
import { defaultFlatTariff, defaultTimeOfUseTariff } from "../data/defaults";
import type { HouseholdConfig, HouseholdProfile, HouseholdTemplate, TariffModel } from "../types/domain";
import { fmtMinuteOfDay, parseHourMinute } from "../utils/time";

export interface SetupWizardResult {
  templateId: string;
  profile: HouseholdProfile;
  tariff: TariffModel;
  producerPresetIds: string[];
}

interface SetupWizardModalProps {
  open: boolean;
  templates: HouseholdTemplate[];
  initialConfig: HouseholdConfig;
  onCancel: () => void;
  onComplete: (result: SetupWizardResult) => void;
}

function cloneTariff(tariff: TariffModel): TariffModel {
  return structuredClone(tariff);
}

function ensureTouTariff(tariff: TariffModel): TariffModel {
  if (tariff.kind === "tou") return tariff;
  const fallback = defaultTimeOfUseTariff();
  return {
    ...fallback,
    currency: tariff.currency,
    sellBackRatePerKwh: tariff.sellBackRatePerKwh
  };
}

export function SetupWizardModal({ open, templates, initialConfig, onCancel, onComplete }: SetupWizardModalProps) {
  const [step, setStep] = useState(0);
  const [templateId, setTemplateId] = useState(initialConfig.templateId);
  const [profile, setProfile] = useState<HouseholdProfile>(structuredClone(initialConfig.profile));
  const [tariff, setTariff] = useState<TariffModel>(cloneTariff(initialConfig.tariff));
  const [includeSolar, setIncludeSolar] = useState(
    initialConfig.producers.some((producer) => producer.presetId === "small-solar-panel" || producer.presetId === "medium-solar-panel")
  );
  const [includeBattery, setIncludeBattery] = useState(initialConfig.producers.some((producer) => producer.presetId === "small-battery"));

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === templateId) ?? templates[0] ?? null,
    [templateId, templates]
  );

  if (!open) return null;

  const producerPresetIds = [
    ...(includeSolar ? ["small-solar-panel"] : []),
    ...(includeBattery ? ["small-battery"] : [])
  ];

  const canAdvance = Boolean(selectedTemplate);

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-card wizard-modal" onClick={(e) => e.stopPropagation()}>
        <div className="wizard-header">
          <div>
            <h2>Setup Wizard</h2>
            <p>
              Step {step + 1} of 5
            </p>
          </div>
          <button type="button" onClick={onCancel}>
            Close
          </button>
        </div>

        {step === 0 && (
          <section className="wizard-step">
            <h3>Choose Household Template</h3>
            <div className="template-grid">
              {templates.map((template) => (
                <button
                  className={`template-card ${template.id === templateId ? "selected-template" : ""}`}
                  key={template.id}
                  onClick={() => setTemplateId(template.id)}
                >
                  <h3>{template.name}</h3>
                  <p>{template.bedrooms} bedrooms</p>
                  <p>{template.occupants} occupants</p>
                  <p>{template.appliances.length} appliances</p>
                </button>
              ))}
            </div>
          </section>
        )}

        {step === 1 && (
          <section className="wizard-step">
            <h3>Set Day Profile</h3>
            <label>
              Day Type
              <select value={profile.dayType} onChange={(e) => setProfile({ ...profile, dayType: e.target.value as "weekday" | "weekend" })}>
                <option value="weekday">Weekday</option>
                <option value="weekend">Weekend</option>
              </select>
            </label>
            <label>
              Season
              <select value={profile.season} onChange={(e) => setProfile({ ...profile, season: e.target.value as "summer" | "winter" })}>
                <option value="summer">Summer</option>
                <option value="winter">Winter</option>
              </select>
            </label>
          </section>
        )}

        {step === 2 && (
          <section className="wizard-step">
            <h3>Set Tariff</h3>
            <label>
              Tariff Type
              <select
                value={tariff.kind}
                onChange={(e) => {
                  if (e.target.value === "tou") {
                    setTariff(ensureTouTariff(tariff));
                    return;
                  }
                  const next = defaultFlatTariff();
                  setTariff({
                    ...next,
                    currency: tariff.currency,
                    sellBackRatePerKwh: tariff.sellBackRatePerKwh
                  });
                }}
              >
                <option value="flat">Flat</option>
                <option value="tou">Time Of Use</option>
              </select>
            </label>
            <label>
              Currency
              <input
                type="text"
                value={tariff.currency}
                onChange={(e) => setTariff({ ...tariff, currency: e.target.value.trim().toUpperCase() })}
              />
            </label>
            {tariff.kind === "flat" ? (
              <label>
                Import Rate ({tariff.currency}/kWh)
                <input
                  type="number"
                  min={0}
                  max={10}
                  step={0.001}
                  value={tariff.ratePerKwh}
                  onChange={(e) => setTariff({ ...tariff, ratePerKwh: Number(e.target.value) })}
                />
              </label>
            ) : (
              <>
                <label>
                  Off-Peak Rate ({tariff.currency}/kWh)
                  <input
                    type="number"
                    min={0}
                    max={10}
                    step={0.001}
                    value={tariff.defaultRatePerKwh}
                    onChange={(e) => setTariff({ ...tariff, defaultRatePerKwh: Number(e.target.value) })}
                  />
                </label>
                <div className="panel-card">
                  <h4>Peak Window</h4>
                  <label>
                    Start
                    <input
                      type="time"
                      value={fmtMinuteOfDay(tariff.windows[0]?.startMin ?? 17 * 60)}
                      onChange={(e) =>
                        setTariff({
                          ...tariff,
                          windows: [
                            {
                              id: tariff.windows[0]?.id ?? "wizard-peak",
                              startMin: parseHourMinute(e.target.value),
                              endMin: tariff.windows[0]?.endMin ?? 22 * 60,
                              ratePerKwh: tariff.windows[0]?.ratePerKwh ?? 0.3,
                              dayTypes: [profile.dayType],
                              seasons: [profile.season]
                            }
                          ]
                        })
                      }
                    />
                  </label>
                  <label>
                    End
                    <input
                      type="time"
                      value={fmtMinuteOfDay(tariff.windows[0]?.endMin ?? 22 * 60)}
                      onChange={(e) =>
                        setTariff({
                          ...tariff,
                          windows: [
                            {
                              id: tariff.windows[0]?.id ?? "wizard-peak",
                              startMin: tariff.windows[0]?.startMin ?? 17 * 60,
                              endMin: parseHourMinute(e.target.value),
                              ratePerKwh: tariff.windows[0]?.ratePerKwh ?? 0.3,
                              dayTypes: [profile.dayType],
                              seasons: [profile.season]
                            }
                          ]
                        })
                      }
                    />
                  </label>
                  <label>
                    Peak Rate
                    <input
                      type="number"
                      min={0}
                      max={10}
                      step={0.001}
                      value={tariff.windows[0]?.ratePerKwh ?? 0.3}
                      onChange={(e) =>
                        setTariff({
                          ...tariff,
                          windows: [
                            {
                              id: tariff.windows[0]?.id ?? "wizard-peak",
                              startMin: tariff.windows[0]?.startMin ?? 17 * 60,
                              endMin: tariff.windows[0]?.endMin ?? 22 * 60,
                              ratePerKwh: Number(e.target.value),
                              dayTypes: [profile.dayType],
                              seasons: [profile.season]
                            }
                          ]
                        })
                      }
                    />
                  </label>
                </div>
              </>
            )}
            <label>
              Sell-back Rate ({tariff.currency}/kWh)
              <input
                type="number"
                min={0}
                max={10}
                step={0.001}
                value={tariff.sellBackRatePerKwh ?? 0}
                onChange={(e) => setTariff({ ...tariff, sellBackRatePerKwh: Number(e.target.value) })}
              />
            </label>
          </section>
        )}

        {step === 3 && (
          <section className="wizard-step">
            <h3>Choose Production Assets</h3>
            <label className="wizard-check">
              <input
                type="checkbox"
                checked={includeSolar}
                onChange={(e) => {
                  const next = e.target.checked;
                  setIncludeSolar(next);
                  if (!next) setIncludeBattery(false);
                }}
              />
              Small solar panel
            </label>
            <label className="wizard-check">
              <input
                type="checkbox"
                checked={includeBattery}
                onChange={(e) => {
                  const next = e.target.checked;
                  setIncludeBattery(next);
                  if (next) setIncludeSolar(true);
                }}
              />
              Small battery (requires solar)
            </label>
            <p className="muted">Battery will use self-consumption strategy by default. You can edit it later.</p>
          </section>
        )}

        {step === 4 && (
          <section className="wizard-step">
            <h3>Review</h3>
            <ul className="checklist">
              <li>
                <span>Template</span>
                <strong>{selectedTemplate?.name ?? "N/A"}</strong>
              </li>
              <li>
                <span>Profile</span>
                <strong>
                  {profile.dayType}, {profile.season}
                </strong>
              </li>
              <li>
                <span>Tariff</span>
                <strong>{tariff.kind === "flat" ? "Flat" : "Time Of Use"}</strong>
              </li>
              <li>
                <span>Producers</span>
                <strong>{producerPresetIds.length > 0 ? producerPresetIds.join(", ") : "None"}</strong>
              </li>
            </ul>
          </section>
        )}

        <div className="modal-actions">
          <button type="button" onClick={() => setStep((current) => Math.max(0, current - 1))} disabled={step === 0}>
            Back
          </button>
          {step < 4 ? (
            <button type="button" onClick={() => setStep((current) => Math.min(4, current + 1))} disabled={!canAdvance}>
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={() =>
                onComplete({
                  templateId: selectedTemplate?.id ?? initialConfig.templateId,
                  profile: structuredClone(profile),
                  tariff: cloneTariff(tariff),
                  producerPresetIds
                })
              }
            >
              Apply Setup
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
