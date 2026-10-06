import { site } from "@/lib/content";
import { TryPolyo as Box } from "@/components/polyo/TryPolyo";
import { Reveal } from "@/components/Reveal";
import { SectionHead } from "@/components/SectionHead";

export function TryPolyo({ title }: { title: string }) {
  const polyo = site.projects.find((p) => p.id === "polyo");
  return (
    <section className="wrap" id="tryPolyo" aria-labelledby="tryPolyo-title">
      <Reveal>
        <SectionHead id="tryPolyo" title={title} note="runs live · nothing is executed" />
        <p className="pr-intro">
          Paste code. PolyO reads it <em>without running it</em> and works out how its time and space grow. It supports Python, C++, Java, JavaScript, C and Go.
          {polyo?.links.github && (
            <>
              {" "}
              <a href={polyo.links.github} target="_blank" rel="noopener noreferrer">
                How it works ↗
              </a>
            </>
          )}
        </p>
        <Box />
      </Reveal>
    </section>
  );
}
