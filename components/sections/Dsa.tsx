import { formatDate, leetcode as lc, site } from "@/lib/content";
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
  if (show.activeDays) notes.push(`${lc.activeDays} active days`);
  if (show.streak && lc.streak >= streakMinimum) notes.push(`${lc.streak}-day streak`);
  if (show.contestRating) notes.push(`contest rating ${Math.round(lc.rating)}`);
  if (show.topPercent) notes.push(`top ${Math.round(lc.topPercent)}% in contests`);

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
            <div className="mono foot-note">
              {notes.length > 0 && <>{notes.join(" · ")} · </>}
              updated {formatDate(lc.fetchedAt)} ·{" "}
              <a href={site.profile.links.leetcode} target="_blank" rel="noopener noreferrer" style={{ borderBottom: "1px solid var(--line)" }}>
                profile ↗
              </a>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
