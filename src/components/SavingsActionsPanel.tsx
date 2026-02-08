import { fmtMinuteOfDay } from "../utils/time";
import type { SavingsAction } from "../types/domain";

interface SavingsActionsPanelProps {
  actions: SavingsAction[];
  currency: string;
}

export function SavingsActionsPanel({ actions, currency }: SavingsActionsPanelProps) {
  return (
    <section className="panel-card">
      <h4 title="Estimated daily savings from shifting flexible loads.">Savings Suggestions</h4>
      {actions.length === 0 ? (
        <p className="muted">No profitable load-shift actions found for the current setup.</p>
      ) : (
        <ul className="savings-list">
          {actions.map((action) => (
            <li key={action.applianceId}>
              <strong>{action.applianceName}</strong>
              <span>
                move {fmtMinuteOfDay(action.fromStartMin)} to {fmtMinuteOfDay(action.toStartMin)}
              </span>
              <span>
                save {currency} {action.estimatedDailySavings.toFixed(2)} / day
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
