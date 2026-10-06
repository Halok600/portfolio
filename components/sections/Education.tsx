import { site } from "@/lib/content";
import { Reveal } from "@/components/Reveal";
import { SectionHead } from "@/components/SectionHead";

export function Education({ title }: { title: string }) {
  const items = site.education.filter((e) => e.visible);
  if (items.length === 0) return null;
  return (
    <section className="wrap" id="education" aria-labelledby="education-title">
      <Reveal>
        <SectionHead id="education" title={title} />
        {items.map((e) => (
          <article key={e.id} className="xp small">
            <div className="when mono">
              <span>
                {e.start} – {e.end}
              </span>
              <span>{e.location}</span>
            </div>
            <div>
              <h3>{e.school}</h3>
              <p className="role">{e.degree}</p>
            </div>
          </article>
        ))}
      </Reveal>
    </section>
  );
}
