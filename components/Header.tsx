import { site, visibleSections } from "@/lib/content";
import { ThemeToggle } from "@/components/ThemeToggle";

const NAV_SKIP = new Set(["hero", "tryPolyo"]);

export function Header() {
  const nav = visibleSections().filter((s) => !NAV_SKIP.has(s.id));
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-bg/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4 sm:px-6">
        <a href="#hero" className="font-mono text-sm font-medium">
          {site.profile.name}
        </a>
        <nav aria-label="Sections" className="hidden items-center gap-5 text-sm text-muted md:flex">
          {nav.map((s) => (
            <a key={s.id} href={`#${s.id}`} className="transition-colors hover:text-text">
              {s.title}
            </a>
          ))}
        </nav>
        <ThemeToggle />
      </div>
    </header>
  );
}
