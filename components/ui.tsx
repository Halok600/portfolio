import type { ReactNode } from "react";

export function SectionShell({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-20 py-12 md:py-16">
      <h2 id={`${id}-title`} className="mb-8 font-mono text-sm uppercase tracking-widest text-muted">
        {title}
      </h2>
      {children}
    </section>
  );
}

export function ExtLink({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
    </a>
  );
}

export function StackTags({ stack }: { stack: string[] }) {
  if (stack.length === 0) return null;
  return (
    <ul className="mt-5 flex flex-wrap gap-2" aria-label="Tech stack">
      {stack.map((t) => (
        <li key={t} className="rounded-md border border-line px-2 py-0.5 font-mono text-xs text-muted">
          {t}
        </li>
      ))}
    </ul>
  );
}

const linkClass =
  "text-sm text-muted underline decoration-line underline-offset-4 transition-colors hover:text-accent hover:decoration-accent";

export function ProjectLinks({ links, title }: { links: { github?: string; live?: string }; title: string }) {
  return (
    <div className="flex gap-4">
      {links.github && (
        <ExtLink href={links.github} className={linkClass}>
          <span className="sr-only">{title} on </span>GitHub
        </ExtLink>
      )}
      {links.live && (
        <ExtLink href={links.live} className={linkClass}>
          <span className="sr-only">{title}: </span>Live
        </ExtLink>
      )}
    </div>
  );
}
