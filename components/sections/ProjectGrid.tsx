import { gridProjects } from "@/lib/content";
import { ProjectLinks, SectionShell, StackTags } from "@/components/ui";

export function ProjectGrid({ title }: { title: string }) {
  const items = gridProjects();
  if (items.length === 0) return null;
  return (
    <SectionShell id="projects" title={title}>
      <div className="grid gap-6 md:grid-cols-2">
        {items.map((p) => (
          <article key={p.id} className="flex flex-col rounded-2xl border border-line bg-surface p-6">
            <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
              <h3 className="text-lg font-semibold">{p.title}</h3>
              <ProjectLinks links={p.links} title={p.title} />
            </header>
            <p className="mt-2 text-sm leading-relaxed text-muted">{p.oneLiner}</p>
            <StackTags stack={p.stack} />
          </article>
        ))}
      </div>
    </SectionShell>
  );
}
