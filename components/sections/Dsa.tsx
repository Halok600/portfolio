import { formatDate, leetcode as lc, site } from "@/lib/content";
import { buildHeatmap } from "@/lib/leetcode-calendar";
import { Heatmap } from "@/components/dsa/Heatmap";
import { Reveal } from "@/components/Reveal";
import { SectionHead } from "@/components/SectionHead";

export function Dsa({ title }: { title: string }) {
  const { show, streakMinimum } = site.dsa;
  const total = lc.easy + lc.medium + lc.hard || 1;

  // The big numeral is "solved" when shown, otherwise the Hard count.
  const bigIsSolved = show.solved;
  const bigValue = bigIsSolved ? lc.solved : lc.hard;
  const bigLabel = bigIsSolved ? "solved" : "hard";
  const showBig = show.solved || show.hard;
  const showHardLine = show.hard && show.solved;

  const notes: string[] = [];
  if (show.contestRating) notes.push(`contest rating ${Math.round(lc.rating)}`);
  if (show.topPercent) notes.push(`top ${Math.round(lc.topPercent)}% in contests`);

  // The heatmap window ends on the day the data was fetched, so the page never depends on "today".
  const hm = buildHeatmap(lc.calendar, lc.fetchedAt.slice(0, 10));
  const stats: string[] = [];
  if (show.activeDays) stats.push(`${hm.activeDays} active days`);
  if (show.streak && hm.longestStreak > 0) stats.push(`longest streak ${hm.longestStreak} days`);
  if (show.streak && hm.currentStreak >= streakMinimum) stats.push(`current streak ${hm.currentStreak} days`);
  if (hm.busiest) stats.push(`busiest month ${hm.busiest.label}`);
  const summary = `${hm.total} submissions in the past year, ${hm.activeDays} active days, longest streak ${hm.longestStreak} days.`;

  return (
    <section className="wrap" id="dsa" aria-labelledby="dsa-title">
      <Reveal>
        <SectionHead id="dsa" title={title} note="live from LeetCode" />
        <div className="ps">
          {showBig && (
            <div className="num">
              {bigValue}
              <sup>{bigLabel}</sup>
            </div>
          )}
          <div className="col">
            {showHardLine && (
              <div className="hard">
                <b>{lc.hard}</b>
                <span className="mono">of them Hard</span>
              </div>
            )}
            {show.byDifficulty && (
              <div>
                <div className="bar" role="img" aria-label={`${lc.easy} easy, ${lc.medium} medium, ${lc.hard} hard`}>
                  <i style={{ flex: lc.easy / total }} />
                  <i style={{ flex: lc.medium / total }} />
                  <i style={{ flex: lc.hard / total }} />
                </div>
                <div className="legend mono">
                  <span>Easy {lc.easy}</span>
                  <span>Medium {lc.medium}</span>
                  <span>Hard {lc.hard}</span>
                </div>
              </div>
            )}
            {notes.length > 0 && <div className="mono foot-note">{notes.join(" · ")}</div>}
          </div>
        </div>

        {show.heatmap && (
          <div className="hm-card">
            <div className="hm-head">
              <p className="hm-title">
                <b>{hm.total}</b> submissions in the past year
              </p>
              {stats.length > 0 && <p className="mono hm-stats">{stats.join(" · ")}</p>}
            </div>
            <Heatmap weeks={hm.weeks} months={hm.months} summary={summary} />
            <div className="hm-foot mono">
              <span>
                updated {formatDate(lc.fetchedAt)} ·{" "}
                <a href={site.profile.links.leetcode} target="_blank" rel="noopener noreferrer">
                  profile ↗
                </a>
              </span>
              <span className="hm-key" aria-hidden="true">
                Less
                <svg viewBox="0 0 12 12" width="12" height="12"><rect width="12" height="12" rx="2.5" className="c l0" /></svg>
                <svg viewBox="0 0 12 12" width="12" height="12"><rect width="12" height="12" rx="2.5" className="c l1" /></svg>
                <svg viewBox="0 0 12 12" width="12" height="12"><rect width="12" height="12" rx="2.5" className="c l2" /></svg>
                <svg viewBox="0 0 12 12" width="12" height="12"><rect width="12" height="12" rx="2.5" className="c l3" /></svg>
                <svg viewBox="0 0 12 12" width="12" height="12"><rect width="12" height="12" rx="2.5" className="c l4" /></svg>
                More
              </span>
            </div>
          </div>
        )}
      </Reveal>
    </section>
  );
}
