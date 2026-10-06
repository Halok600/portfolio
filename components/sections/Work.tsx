import { featuredProjects } from "@/lib/content";
import { Reveal } from "@/components/Reveal";
import { SectionHead } from "@/components/SectionHead";
import { WorkIndex, type WorkItem } from "@/components/work/WorkIndex";

export function Work({ title }: { title: string }) {
  const items: WorkItem[] = featuredProjects().map((p) => ({
    id: p.id,
    title: p.title,
    kind: p.kind ?? "Project",
    highlights: p.highlights ?? p.stack.slice(0, 3),
    oneLiner: p.oneLiner,
    bullets: p.bullets,
    stack: p.stack,
    links: p.links,
    image: p.image,
  }));
  if (items.length === 0) return null;
  return (
    <section className="wrap" id="featured" aria-labelledby="featured-title">
      <Reveal>
        <SectionHead id="featured" title={title} note="hover to lock on · click to open" />
        <WorkIndex items={items} />
      </Reveal>
    </section>
  );
}
