import Link from "next/link";

export default function NotFound() {
  return (
    <main id="main" className="wrap" style={{ paddingTop: "clamp(80px, 14vw, 200px)", paddingBottom: "120px" }}>
      <p className="mono" style={{ color: "var(--mut)" }}>
        404
      </p>
      <h1 style={{ fontSize: "clamp(44px, 9vw, 150px)", fontWeight: 600, letterSpacing: "-.05em", lineHeight: 0.95, margin: "18px 0 36px" }}>
        That page doesn&apos;t exist.
      </h1>
      <Link className="btn solid" href="/">
        Back to the portfolio
      </Link>
    </main>
  );
}
