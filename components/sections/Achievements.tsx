import { site } from "@/lib/content";
import { Reveal } from "@/components/Reveal";
import { SectionHead } from "@/components/SectionHead";

export function Achievements({ title }: { title: string }) {
  const items = site.achievements.filter((a) => a.visible);
  if (items.length === 0) return null;
  return (
    <section className="wrap" id="achievements" aria-labelledby="achievements-title">
      <Reveal>
        <SectionHead id="achievements" title={title} />
        {items.map((a) => (
          <div key={a.id} className="ac">
            <b>{a.title}</b>
            <p>
              {a.text}
              {a.link && (
                <>
                  {" "}
                  <a href={a.link} target="_blank" rel="noopener noreferrer" style={{ borderBottom: "1px solid var(--line)" }}>
                    Link ↗
                  </a>
                </>
              )}
            </p>
          </div>
        ))}
      </Reveal>
    </section>
  );
}
