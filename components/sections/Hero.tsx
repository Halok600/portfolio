import { leetcode, site } from "@/lib/content";
import { buildFacts } from "@/lib/facts";
import { Emph } from "@/components/Inline";

export function Hero() {
  const { profile } = site;
  const [first, ...rest] = profile.name.split(" ");
  const facts = buildFacts(site, leetcode);

  return (
    <div className="wrap hero" id="hero">
      <div className="eyebrow mono">
        <span>{profile.status.show ? `● ${profile.status.text}` : ""}</span>
        <span>{profile.location}</span>
      </div>

      <div className="h1wrap">
        <h1 aria-label={profile.name}>
          <span className="line" aria-hidden="true">
            <span>{first}</span>
          </span>
          {rest.length > 0 && (
            <span className="line" aria-hidden="true">
              <span className="serif">{rest.join(" ")}</span>
            </span>
          )}
        </h1>
        <div className="box" aria-hidden="true">
          <b />
          <b />
          <b />
          <b />
          <span className="lab">engineer · id 01</span>
        </div>
      </div>

      <div className="lead">
        <p className="big">
          <Emph text={profile.headline} />
        </p>
        <div className="side">
          <p>{profile.tagline}</p>
          <div className="btns">
            <a className="btn solid" href={profile.resumePdf}>
              Résumé ↓
            </a>
            <a className="btn" href={`mailto:${profile.email}`}>
              Say hello ↗
            </a>
          </div>
        </div>
      </div>

      {facts.length > 0 && (
        <div className="facts mono">
          {facts.map((f) => (
            <div key={f.value}>
              <b>{f.value}</b>
              <span>{f.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
