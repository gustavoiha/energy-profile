import type { HouseholdProfile } from "../types/domain";

interface ProfileEditorProps {
  profile: HouseholdProfile;
  onChange: (profile: HouseholdProfile) => void;
}

export function ProfileEditor({ profile, onChange }: ProfileEditorProps) {
  return (
    <section className="panel-card">
      <h4 title="Day type and season scope TOU windows and future profile behavior.">Day Profile</h4>
      <label>
        Day Type
        <select value={profile.dayType} onChange={(e) => onChange({ ...profile, dayType: e.target.value as "weekday" | "weekend" })}>
          <option value="weekday">Weekday</option>
          <option value="weekend">Weekend</option>
        </select>
      </label>
      <label>
        Season
        <select value={profile.season} onChange={(e) => onChange({ ...profile, season: e.target.value as "summer" | "winter" })}>
          <option value="summer">Summer</option>
          <option value="winter">Winter</option>
        </select>
      </label>
    </section>
  );
}
