import { gridProjects } from "@/lib/content";
import { Reveal } from "@/components/Reveal";
import { SectionHead } from "@/components/SectionHead";

export function AlsoBuilt({ title }: { title: string }) {
  const items = gridProjects();
  if (items.length === 0) return null;
  return (
    <section className="wrap" id="projects" aria-labelledby="projects-title">
      <Reveal>
        <SectionHead id="projects" title={title} />
        {items.map((p) => (
          <article key={p.id} className="ab">
            <span className="idx mono" aria-hidden="true">
              +
            </span>
            <h3>{p.title}</h3>
            <span className="meta mono">
              {[p.kind, ...(p.highlights ?? [])].filter(Boolean).join(" · ")}
            </span>
            <span className="lk mono">
              {p.links.github && (
                <a href={p.links.github} target="_blank" rel="noopener noreferrer">
                  GitHub ↗<span className="sr"> — {p.title}</span>
                </a>
              )}
              {p.links.live && (
                <a href={p.links.live} target="_blank" rel="noopener noreferrer">
                  Live ↗<span className="sr"> — {p.title}</span>
                </a>
              )}
            </span>
          </article>
        ))}
      </Reveal>
    </section>
  );
}
