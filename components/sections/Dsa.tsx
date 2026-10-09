import { cacheLife } from "next/cache";
import { formatDate, site } from "@/lib/content";
import { buildHeatmap } from "@/lib/calendar";
import { getLeetcode } from "@/lib/leetcode-live";
import { Reveal } from "@/components/Reveal";
import { SectionHead } from "@/components/SectionHead";

export async function Dsa({ title }: { title: string }) {
  "use cache";
  // the numbers inside are cached for an hour (and only minutes after a failed fetch); this just re-reads them
  cacheLife({ stale: 300, revalidate: 900, expire: 3600 });
  const { data: lc, live } = await getLeetcode();
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

  // The window ends on the day the data was fetched, so the page never depends on "today".
  const hm = buildHeatmap(lc.calendar, lc.fetchedAt.slice(0, 10));
  const stats: string[] = [`${hm.total} submissions in the past year`];
  if (show.activeDays) stats.push(`${hm.activeDays} active days`);
  if (show.streak && hm.longestStreak > 0) stats.push(`longest streak ${hm.longestStreak} days`);
  if (show.streak && hm.currentStreak >= streakMinimum) stats.push(`current streak ${hm.currentStreak} days`);
  if (hm.busiest) stats.push(`busiest month ${hm.busiest.label}`);

  return (
    <section className="wrap" id="dsa" aria-labelledby="dsa-title">
      <Reveal>
        <SectionHead id="dsa" title={title} note={live ? "live from LeetCode" : `from LeetCode, ${formatDate(lc.fetchedAt)}`} />
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
        <p className="mono foot-note dsa-stats">{stats.join(" · ")}</p>
      </Reveal>
    </section>
  );
}
