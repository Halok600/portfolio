import { site } from "@/lib/content";
import { Reveal } from "@/components/Reveal";
import { SectionHead } from "@/components/SectionHead";

export function Skills({ title }: { title: string }) {
  if (site.skills.length === 0) return null;
  return (
    <section className="wrap" id="skills" aria-labelledby="skills-title">
      <Reveal>
        <SectionHead id="skills" title={title} />
        <dl>
          {site.skills.map((row) => (
            <div key={row.id} className="sk">
              <dt className="mono">{row.label}</dt>
              <dd>
                {row.items.map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </dd>
            </div>
          ))}
        </dl>
      </Reveal>
    </section>
  );
}
