import { site } from "@/lib/content";
import { RichText } from "@/components/Inline";
import { Reveal } from "@/components/Reveal";
import { SectionHead } from "@/components/SectionHead";

export function Experience({ title }: { title: string }) {
  const items = site.experience.filter((e) => e.visible);
  if (items.length === 0) return null;
  return (
    <section className="wrap" id="experience" aria-labelledby="experience-title">
      <Reveal>
        <SectionHead id="experience" title={title} />
        {items.map((e) => (
          <article key={e.id} className="xp">
            <div className="when mono">
              <span>
                {e.start} – {e.end}
              </span>
              <span>{e.location}</span>
            </div>
            <div>
              <h3>{e.org}</h3>
              <p className="role">{e.role}</p>
              <ul>
                {e.bullets.map((b, i) => (
                  <li key={i}>
                    <span>
                      <RichText text={b} />
                    </span>
                  </li>
                ))}
              </ul>
              {e.link && (
                <a className="lnk mono" href={e.link} target="_blank" rel="noopener noreferrer">
                  View the project on GitHub ↗
                </a>
              )}
            </div>
          </article>
        ))}
      </Reveal>
    </section>
  );
}
