import { site } from "@/lib/content";
import { ExtLink, SectionShell } from "@/components/ui";

const linkClass =
  "rounded-lg border border-line px-5 py-2.5 text-sm font-medium transition-colors hover:border-accent";

export function Contact({ title }: { title: string }) {
  const { profile } = site;
  return (
    <SectionShell id="contact" title={title}>
      <p className="max-w-xl text-lg text-muted">
        Looking for an AI/ML or software engineer? The quickest way to reach me is email.
      </p>
      <p className="mt-4">
        <a
          href={`mailto:${profile.email}`}
          className="font-mono text-xl text-accent underline underline-offset-4"
        >
          {profile.email}
        </a>
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <ExtLink href={profile.links.linkedin} className={linkClass}>
          LinkedIn
        </ExtLink>
        <ExtLink href={profile.links.github} className={linkClass}>
          GitHub
        </ExtLink>
        <ExtLink href={profile.links.leetcode} className={linkClass}>
          LeetCode
        </ExtLink>
      </div>
    </SectionShell>
  );
}
