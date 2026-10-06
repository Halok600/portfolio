import { site } from "@/lib/content";
import { LocalTime } from "@/components/LocalTime";
import { Ruler } from "@/components/Ruler";
import { ThemeToggle } from "@/components/ThemeToggle";

export function Header() {
  const city = site.profile.location.split(",")[0];
  return (
    <header className="top">
      <div className="wrap">
        <div className="brand mono">
          <span className="dot" aria-hidden="true" />
          <span>{site.profile.name}</span>
        </div>
        <Ruler />
        <div className="actions mono">
          <LocalTime city={city} className="time" />
          <ThemeToggle />
          <a className="cta" href={site.profile.resumePdf}>
            Résumé ↓
          </a>
        </div>
      </div>
    </header>
  );
}
