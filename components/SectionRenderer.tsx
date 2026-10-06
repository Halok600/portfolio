import type { ReactNode } from "react";
import { visibleSections } from "@/lib/content";
import type { SectionId } from "@/lib/schema";
import { Achievements } from "@/components/sections/Achievements";
import { AlsoBuilt } from "@/components/sections/AlsoBuilt";
import { Contact } from "@/components/sections/Contact";
import { Dsa } from "@/components/sections/Dsa";
import { Education } from "@/components/sections/Education";
import { Experience } from "@/components/sections/Experience";
import { Hero } from "@/components/sections/Hero";
import { Skills } from "@/components/sections/Skills";
import { Work } from "@/components/sections/Work";

type Render = (title: string) => ReactNode;

// Sections not listed here (tryPolyo, until Phase 2) are skipped.
const registry: Partial<Record<SectionId, Render>> = {
  hero: () => <Hero />,
  featured: (t) => <Work title={t} />,
  projects: (t) => <AlsoBuilt title={t} />,
  experience: (t) => <Experience title={t} />,
  dsa: (t) => <Dsa title={t} />,
  skills: (t) => <Skills title={t} />,
  achievements: (t) => <Achievements title={t} />,
  education: (t) => <Education title={t} />,
  contact: (t) => <Contact title={t} />,
};

export function SectionRenderer() {
  return (
    <>
      {visibleSections().map((s) => {
        const render = registry[s.id];
        return render ? <div key={s.id}>{render(s.title)}</div> : null;
      })}
    </>
  );
}
