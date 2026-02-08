import { defaultFlatTariff, defaultTimeOfUseTariff } from "../data/defaults";
import type { TariffModel, TimeOfUseTariff } from "../types/domain";
import { makeId } from "../utils/id";
import { fmtMinuteOfDay, parseHourMinute } from "../utils/time";
import { validateTariff } from "../utils/validation";

interface TariffEditorProps {
  tariff: TariffModel;
  onChange: (tariff: TariffModel) => void;
}

function asTou(tariff: TariffModel): TimeOfUseTariff {
  if (tariff.kind === "tou") return tariff;
  const fresh = defaultTimeOfUseTariff();
  return {
    ...fresh,
    currency: tariff.currency,
    sellBackRatePerKwh: tariff.sellBackRatePerKwh
  };
}

export function TariffEditor({ tariff, onChange }: TariffEditorProps) {
  const errors = validateTariff(tariff);

  return (
    <section className="panel-card">
      <h4 title="Tariff settings drive bill calculations and optimization.">Tariff</h4>
      <label>
        Type
        <select
          value={tariff.kind}
          onChange={(e) => {
            if (e.target.value === "tou") {
              onChange(asTou(tariff));
              return;
            }
            const fallback = defaultFlatTariff();
            onChange({
              ...fallback,
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
        <input type="text" value={tariff.currency} onChange={(e) => onChange({ ...tariff, currency: e.target.value.trim().toUpperCase() })} />
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
            onChange={(e) => onChange({ ...tariff, ratePerKwh: Number(e.target.value) })}
          />
        </label>
      ) : (
        <>
          <label>
            Default Rate ({tariff.currency}/kWh)
            <input
              type="number"
              min={0}
              max={10}
              step={0.001}
              value={tariff.defaultRatePerKwh}
              onChange={(e) => onChange({ ...tariff, defaultRatePerKwh: Number(e.target.value) })}
            />
          </label>

          <div className="tou-list">
            {tariff.windows.map((window) => (
              <div className="tou-row" key={window.id}>
                <label>
                  Start
                  <input
                    type="time"
                    value={fmtMinuteOfDay(window.startMin)}
                    onChange={(e) =>
                      onChange({
                        ...tariff,
                        windows: tariff.windows.map((item) =>
                          item.id === window.id ? { ...item, startMin: parseHourMinute(e.target.value) } : item
                        )
                      })
                    }
                  />
                </label>
                <label>
                  End
                  <input
                    type="time"
                    value={fmtMinuteOfDay(window.endMin)}
                    onChange={(e) =>
                      onChange({
                        ...tariff,
                        windows: tariff.windows.map((item) =>
                          item.id === window.id ? { ...item, endMin: parseHourMinute(e.target.value) } : item
                        )
                      })
                    }
                  />
                </label>
                <label>
                  Rate
                  <input
                    type="number"
                    min={0}
                    max={10}
                    step={0.001}
                    value={window.ratePerKwh}
                    onChange={(e) =>
                      onChange({
                        ...tariff,
                        windows: tariff.windows.map((item) =>
                          item.id === window.id ? { ...item, ratePerKwh: Number(e.target.value) } : item
                        )
                      })
                    }
                  />
                </label>
                <label>
                  Applies
                  <select
                    value={!window.dayTypes || window.dayTypes.length === 2 ? "all-days" : window.dayTypes[0]}
                    onChange={(e) =>
                      onChange({
                        ...tariff,
                        windows: tariff.windows.map((item) => {
                          if (item.id !== window.id) return item;
                          if (e.target.value === "all-days") return { ...item, dayTypes: ["weekday", "weekend"] };
                          return { ...item, dayTypes: [e.target.value as "weekday" | "weekend"] };
                        })
                      })
                    }
                  >
                    <option value="all-days">All Days</option>
                    <option value="weekday">Weekdays</option>
                    <option value="weekend">Weekends</option>
                  </select>
                </label>
                <button
                  type="button"
                  className="icon-delete-btn"
                  onClick={() => onChange({ ...tariff, windows: tariff.windows.filter((item) => item.id !== window.id) })}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() =>
              onChange({
                ...tariff,
                windows: [
                  ...tariff.windows,
                  {
                    id: makeId("tou"),
                    startMin: 17 * 60,
                    endMin: 21 * 60,
                    ratePerKwh: tariff.defaultRatePerKwh,
                    dayTypes: ["weekday", "weekend"],
                    seasons: ["summer", "winter"]
                  }
                ]
              })
            }
          >
            Add TOU Window
          </button>
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
          onChange={(e) => onChange({ ...tariff, sellBackRatePerKwh: Number(e.target.value) })}
        />
      </label>

      {errors.length > 0 && (
        <div className="errors">
          {errors.map((error) => (
            <p key={error}>{error}</p>
          ))}
        </div>
      )}
    </section>
  );
}
