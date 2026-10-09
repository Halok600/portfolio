import { buildHeatmap } from "@/lib/calendar";
import { formatDate, site } from "@/lib/content";
import type { GithubGraph } from "@/lib/github-graph";
import { Heatmap } from "@/components/dsa/Heatmap";

export function GraphCard({ graph }: { graph: GithubGraph }) {
  const hm = buildHeatmap(graph.calendar, graph.asOf);
  const { show, streakMinimum } = site.dsa;
  const stats: string[] = [`${hm.activeDays} active days`];
  if (show.streak && hm.longestStreak > 0) stats.push(`longest streak ${hm.longestStreak} days`);
  if (show.streak && hm.currentStreak >= streakMinimum) stats.push(`current streak ${hm.currentStreak} days`);
  if (hm.busiest) stats.push(`busiest month ${hm.busiest.label}`);
  const summary = `${hm.total} GitHub contributions in the past year, ${hm.activeDays} active days, longest streak ${hm.longestStreak} days.`;

  return (
    <div className="hm-card">
      <div className="hm-head">
        <p className="hm-title">
          <b>{hm.total}</b> contributions in the past year
        </p>
        <p className="mono hm-stats">{stats.join(" · ")}</p>
      </div>
      <Heatmap weeks={hm.weeks} months={hm.months} summary={summary} unit="contribution" />
      <div className="hm-foot mono">
        <span>
          updated {formatDate(`${graph.asOf}T00:00:00Z`)} ·{" "}
          <a href={site.profile.links.github} target="_blank" rel="noopener noreferrer">
            profile ↗
          </a>
        </span>
        <span className="hm-key" aria-hidden="true">
          Less
          {[0, 1, 2, 3, 4].map((l) => (
            <svg key={l} viewBox="0 0 12 12" width="12" height="12">
              <rect width="12" height="12" rx="2.5" className={`c l${l}`} />
            </svg>
          ))}
          More
        </span>
      </div>
    </div>
  );
}
