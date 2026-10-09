// Pure calendar maths for the contribution heatmap. All dates are UTC ISO strings (YYYY-MM-DD).

export type Level = 0 | 1 | 2 | 3 | 4;
export type Cell = { date: string; count: number; level: Level };
export type MonthLabel = { label: string; week: number };

export type Heatmap = {
  weeks: (Cell | null)[][]; // 53 columns (Monday first) of 7 rows; null = outside the window
  months: MonthLabel[];
  total: number;
  activeDays: number;
  longestStreak: number;
  currentStreak: number;
  busiest: { label: string; total: number } | null;
};

const DAY = 86_400_000;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const toMs = (iso: string) => Date.parse(`${iso}T00:00:00Z`);
const toIso = (ms: number) => new Date(ms).toISOString().slice(0, 10);

export function levelFor(count: number): Level {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count <= 3) return 2;
  if (count <= 7) return 3;
  return 4;
}

export function buildHeatmap(calendar: Record<string, number>, endIso: string): Heatmap {
  const end = toMs(endIso);
  const start = end - 364 * DAY;
  const startDow = (new Date(start).getUTCDay() + 6) % 7; // Monday = 0
  const gridStart = start - startDow * DAY;
  const weekCount = Math.ceil((end - gridStart + DAY) / (7 * DAY));

  const weeks: (Cell | null)[][] = [];
  let total = 0;
  let activeDays = 0;
  const monthTotals = new Map<number, number>();
  const active: number[] = [];

  for (let w = 0; w < weekCount; w++) {
    const col: (Cell | null)[] = [];
    for (let d = 0; d < 7; d++) {
      const ms = gridStart + (w * 7 + d) * DAY;
      if (ms < start || ms > end) {
        col.push(null);
        continue;
      }
      const date = toIso(ms);
      const count = calendar[date] ?? 0;
      col.push({ date, count, level: levelFor(count) });
      if (count > 0) {
        total += count;
        activeDays += 1;
        active.push(ms);
        const m = new Date(ms).getUTCMonth();
        monthTotals.set(m, (monthTotals.get(m) ?? 0) + count);
      }
    }
    weeks.push(col);
  }

  // streaks over the active days inside the window
  let longestStreak = 0;
  let run = 0;
  active.forEach((ms, i) => {
    run = i > 0 && ms - active[i - 1] === DAY ? run + 1 : 1;
    longestStreak = Math.max(longestStreak, run);
  });
  let currentStreak = 0;
  const last = active[active.length - 1];
  if (last !== undefined && end - last <= DAY) {
    currentStreak = 1;
    for (let i = active.length - 1; i > 0 && active[i] - active[i - 1] === DAY; i--) currentStreak++;
  }

  // a month is labelled above the column that contains its 1st
  const raw: MonthLabel[] = [{ label: MONTHS[new Date(start).getUTCMonth()], week: 0 }];
  for (let w = 1; w < weeks.length; w++) {
    for (let d = 0; d < 7; d++) {
      const cell = weeks[w][d];
      if (cell && cell.date.endsWith("-01")) {
        raw.push({ label: MONTHS[Number(cell.date.slice(5, 7)) - 1], week: w });
      }
    }
  }
  // drop the opening label if the next one is too close to leave room for the text
  const months = raw.length > 1 && raw[1].week - raw[0].week < 3 ? raw.slice(1) : raw;

  let busiest: Heatmap["busiest"] = null;
  for (const [m, t] of monthTotals) {
    if (!busiest || t > busiest.total) busiest = { label: MONTHS[m], total: t };
  }

  return { weeks, months, total, activeDays, longestStreak, currentStreak, busiest };
}
