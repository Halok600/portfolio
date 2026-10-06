import { site } from "@/lib/content";
import { ExtLink } from "@/components/ui";

export function Hero() {
  const { profile } = site;
  return (
    <section id="hero" aria-label="Introduction" className="scroll-mt-20 pb-12 pt-16 md:pb-16 md:pt-28">
      {profile.status.show && (
        <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-line px-3 py-1 text-sm text-muted">
          <span className="size-2 rounded-full bg-accent" aria-hidden="true" />
          {profile.status.text}
        </p>
      )}
      <h1 className="text-4xl font-semibold tracking-tight md:text-6xl">{profile.name}</h1>
      <p className="mt-3 font-mono text-lg text-accent md:text-2xl">{profile.headline}</p>
      <p className="mt-6 max-w-2xl text-lg text-muted">{profile.tagline}</p>
      <div className="mt-8 flex flex-wrap gap-3">
        <a
          href={profile.resumePdf}
          className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-on-accent transition-opacity hover:opacity-90"
        >
          Résumé
        </a>
        <ExtLink
          href={profile.links.github}
          className="rounded-lg border border-line px-5 py-2.5 text-sm font-medium transition-colors hover:border-accent"
        >
          GitHub
        </ExtLink>
        <a
          href={`mailto:${profile.email}`}
          className="rounded-lg border border-line px-5 py-2.5 text-sm font-medium transition-colors hover:border-accent"
        >
          Email
        </a>
      </div>
    </section>
  );
}
