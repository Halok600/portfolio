import { cacheLife } from "next/cache";
import { site } from "@/lib/content";
import { isFresh, relativeTime } from "@/lib/github-activity";
import { getShipped } from "@/lib/shipped";
import { Reveal } from "@/components/Reveal";
import { SectionHead } from "@/components/SectionHead";

export async function Shipped({ title }: { title: string }) {
  "use cache";
  cacheLife("hours");
  const { show, hideIfOlderThanDays } = site.recentlyShipped;
  if (!show) return null;

  const all = await getShipped();
  // the list is cached, so "now" is when it was last refreshed (within the hour)
  const now = new Date();
  const items = all.filter((i) => isFresh(i.at, now, hideIfOlderThanDays));
  if (items.length === 0) return null;

  return (
    <section className="wrap" id="shipped" aria-labelledby="shipped-title">
      <Reveal>
        <SectionHead id="shipped" title={title} note="live from GitHub" />
        {items.map((i, n) => (
          <a key={i.repo} className="sp" href={i.url} target="_blank" rel="noopener noreferrer">
            <span className="idx mono" aria-hidden="true">
              {n === 0 ? "●" : "○"}
            </span>
            <span className="rp">{i.repo}</span>
            <span className="msg">{i.message}</span>
            <span className="when mono">{relativeTime(i.at, now)} ↗</span>
          </a>
        ))}
      </Reveal>
    </section>
  );
}
