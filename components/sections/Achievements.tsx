import { site } from "@/lib/content";
import { ExtLink, SectionShell } from "@/components/ui";

export function Achievements({ title }: { title: string }) {
  const items = site.achievements.filter((a) => a.visible);
  if (items.length === 0) return null;
  return (
    <SectionShell id="achievements" title={title}>
      <ul className="space-y-4">
        {items.map((a) => (
          <li key={a.id}>
            <p className="font-semibold">{a.title}</p>
            <p className="text-muted">
              {a.text}
              {a.link && (
                <>
                  {" "}
                  <ExtLink href={a.link} className="underline decoration-line underline-offset-4 hover:text-accent">
                    Link
                  </ExtLink>
                </>
              )}
            </p>
          </li>
        ))}
      </ul>
    </SectionShell>
  );
}
