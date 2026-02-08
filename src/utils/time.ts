export function fmtMinuteOfDay(minute: number): string {
  const safe = Math.max(0, Math.min(1440, Math.round(minute)));
  const h = Math.floor((safe % 1440) / 60);
  const m = safe % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function parseHourMinute(value: string): number {
  const [hRaw, mRaw] = value.split(":");
  const h = Number(hRaw);
  const m = Number(mRaw);
  if (!Number.isFinite(h) || !Number.isFinite(m)) {
    return 0;
  }
  return Math.max(0, Math.min(1440, h * 60 + m));
}
