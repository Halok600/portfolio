import { site } from "@/lib/content";
import { SectionShell } from "@/components/ui";

export function Education({ title }: { title: string }) {
  const items = site.education.filter((e) => e.visible);
  if (items.length === 0) return null;
  return (
    <SectionShell id="education" title={title}>
      <div className="space-y-6">
        {items.map((e) => (
          <article key={e.id}>
            <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <h3 className="text-xl font-semibold">{e.school}</h3>
              <p className="font-mono text-sm text-muted">
                {e.start} – {e.end}
              </p>
            </header>
            <p className="mt-1 flex flex-wrap justify-between gap-x-4 text-muted">
              <span>{e.degree}</span>
              <span className="text-sm">{e.location}</span>
            </p>
          </article>
        ))}
      </div>
    </SectionShell>
  );
}
