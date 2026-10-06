import { site } from "@/lib/content";
import { LocalTime } from "@/components/LocalTime";
import { Reveal } from "@/components/Reveal";
import { SectionHead } from "@/components/SectionHead";

export function Contact({ title }: { title: string }) {
  const { profile } = site;
  const city = profile.location.split(",")[0];
  return (
    <section className="wrap contact" id="contact" aria-labelledby="contact-title">
      <Reveal>
        <SectionHead id="contact" title={title} note={profile.status.show ? `● ${profile.status.text}` : undefined} />
        <a className="mail" href={`mailto:${profile.email}`}>
          {profile.email}
        </a>
        <div className="btns">
          <a className="btn solid" href={profile.resumePdf}>
            Résumé ↓
          </a>
          <a className="btn" href={profile.links.github} target="_blank" rel="noopener noreferrer">
            GitHub ↗
          </a>
          <a className="btn" href={profile.links.linkedin} target="_blank" rel="noopener noreferrer">
            LinkedIn ↗
          </a>
          <a className="btn" href={profile.links.leetcode} target="_blank" rel="noopener noreferrer">
            LeetCode ↗
          </a>
        </div>
      </Reveal>
      <div className="bottom mono">
        <span>© 2026 {profile.name}</span>
        <LocalTime city={city} />
        <nav aria-label="Footer">
          <a href="#featured">Work</a>
          <a href="#dsa">Problem solving</a>
          <a href="#contact">Contact</a>
        </nav>
      </div>
    </section>
  );
}
