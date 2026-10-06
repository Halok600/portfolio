import { formatDate, leetcode, site } from "@/lib/content";
import { ExtLink, SectionShell } from "@/components/ui";

function Stat({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 ${highlight ? "border-accent" : "border-line"} bg-surface`}>
      <dd className={`font-mono text-3xl font-semibold ${highlight ? "text-accent" : ""}`}>{value}</dd>
      <dt className="mt-1 text-sm text-muted">{label}</dt>
    </div>
  );
}

export function Dsa({ title }: { title: string }) {
  const { show, streakMinimum } = site.dsa;
  const lc = leetcode;
  const parts = [
    { label: "Easy", n: lc.easy, opacity: "opacity-40" },
    { label: "Medium", n: lc.medium, opacity: "opacity-70" },
    { label: "Hard", n: lc.hard, opacity: "opacity-100" },
  ];
  const total = lc.easy + lc.medium + lc.hard || 1;

  return (
    <SectionShell id="dsa" title={title}>
      <dl className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {show.solved && <Stat label="problems solved" value={String(lc.solved)} />}
        {show.hard && <Stat label="Hard solved" value={String(lc.hard)} highlight />}
        {show.activeDays && <Stat label="active days" value={String(lc.activeDays)} />}
        {show.streak && lc.streak >= streakMinimum && (
          <Stat label="day streak" value={String(lc.streak)} />
        )}
        {show.contestRating && <Stat label="contest rating" value={String(Math.round(lc.rating))} />}
        {show.topPercent && <Stat label="contest percentile (top)" value={`${Math.round(lc.topPercent)}%`} />}
      </dl>

      {show.byDifficulty && (
        <div className="mt-6">
          <div
            role="img"
            aria-label={`${lc.easy} easy, ${lc.medium} medium, ${lc.hard} hard`}
            className="flex h-3 overflow-hidden rounded-full bg-line"
          >
            {parts.map((p) => (
              <div
                key={p.label}
                className={`bg-accent ${p.opacity}`}
                style={{ width: `${(p.n / total) * 100}%` }}
              />
            ))}
          </div>
          <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-1 font-mono text-sm text-muted">
            {parts.map((p) => (
              <li key={p.label}>
                {p.label} {p.n}
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="mt-6 text-sm text-muted">
        From{" "}
        <ExtLink href={site.profile.links.leetcode} className="underline decoration-line underline-offset-4 hover:text-accent">
          LeetCode
        </ExtLink>
        , updated {formatDate(lc.fetchedAt)}.
      </p>
    </SectionShell>
  );
}
