import { featuredProjects } from "@/lib/content";
import { RichText } from "@/components/RichText";
import { ProjectLinks, SectionShell, StackTags } from "@/components/ui";

export function Featured({ title }: { title: string }) {
  const items = featuredProjects();
  if (items.length === 0) return null;
  return (
    <SectionShell id="featured" title={title}>
      <div className="grid gap-6">
        {items.map((p) => (
          <article key={p.id} className="rounded-2xl border border-line bg-surface p-6 md:p-8">
            <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
              <h3 className="text-2xl font-semibold">{p.title}</h3>
              <ProjectLinks links={p.links} title={p.title} />
            </header>
            <p className="mt-2 text-muted">{p.oneLiner}</p>
            <ul className="mt-5 space-y-3 text-[0.95rem] leading-relaxed text-muted">
              {p.bullets.map((b, i) => (
                <li key={i} className="flex gap-3">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                  <span>
                    <RichText text={b} />
                  </span>
                </li>
              ))}
            </ul>
            <StackTags stack={p.stack} />
          </article>
        ))}
      </div>
    </SectionShell>
  );
}
