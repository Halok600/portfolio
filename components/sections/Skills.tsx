import { site } from "@/lib/content";
import { SectionShell } from "@/components/ui";

export function Skills({ title }: { title: string }) {
  if (site.skills.length === 0) return null;
  return (
    <SectionShell id="skills" title={title}>
      <dl className="space-y-5">
        {site.skills.map((row) => (
          <div key={row.id} className="grid gap-2 md:grid-cols-[11rem_1fr] md:gap-6">
            <dt className="font-medium">{row.label}</dt>
            <dd>
              <ul className="flex flex-wrap gap-2">
                {row.items.map((item) => (
                  <li key={item} className="rounded-md border border-line px-2.5 py-1 text-sm text-muted">
                    {item}
                  </li>
                ))}
              </ul>
            </dd>
          </div>
        ))}
      </dl>
    </SectionShell>
  );
}
