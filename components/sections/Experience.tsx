import { site } from "@/lib/content";
import { RichText } from "@/components/RichText";
import { ExtLink, SectionShell } from "@/components/ui";

export function Experience({ title }: { title: string }) {
  const items = site.experience.filter((e) => e.visible);
  if (items.length === 0) return null;
  return (
    <SectionShell id="experience" title={title}>
      <div className="space-y-10">
        {items.map((e) => (
          <article key={e.id}>
            <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <h3 className="text-xl font-semibold">{e.org}</h3>
              <p className="font-mono text-sm text-muted">
                {e.start} – {e.end}
              </p>
            </header>
            <p className="mt-1 flex flex-wrap justify-between gap-x-4 text-muted">
              <span>{e.role}</span>
              <span className="text-sm">{e.location}</span>
            </p>
            <ul className="mt-4 space-y-3 text-[0.95rem] leading-relaxed text-muted">
              {e.bullets.map((b, i) => (
                <li key={i} className="flex gap-3">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                  <span>
                    <RichText text={b} />
                  </span>
                </li>
              ))}
            </ul>
            {e.link && (
              <ExtLink
                href={e.link}
                className="mt-4 inline-block text-sm text-muted underline decoration-line underline-offset-4 hover:text-accent"
              >
                View the project on GitHub
              </ExtLink>
            )}
          </article>
        ))}
      </div>
    </SectionShell>
  );
}
