import type { HouseholdConfig } from "../types/domain";

interface OnboardingChecklistProps {
  config: HouseholdConfig;
}

function done(value: boolean): string {
  return value ? "Done" : "Pending";
}

export function OnboardingChecklist({ config }: OnboardingChecklistProps) {
  const hasAppliances = config.appliances.length > 0;
  const hasProducer = config.producers.length > 0;
  const hasTariff = config.tariff.kind === "flat" ? config.tariff.ratePerKwh > 0 : config.tariff.windows.length > 0;
  const hasProfile = Boolean(config.profile.dayType && config.profile.season);

  return (
    <section className="panel-card">
      <h4>Onboarding Checklist</h4>
      <ul className="checklist">
        <li>
          <span>Load a household template or custom setup</span>
          <strong>{done(hasAppliances)}</strong>
        </li>
        <li>
          <span>Add or edit your tariff</span>
          <strong>{done(hasTariff)}</strong>
        </li>
        <li>
          <span>Set day profile (weekday/weekend + season)</span>
          <strong>{done(hasProfile)}</strong>
        </li>
        <li>
          <span>Add production assets (solar or battery)</span>
          <strong>{done(hasProducer)}</strong>
        </li>
      </ul>
    </section>
  );
}
