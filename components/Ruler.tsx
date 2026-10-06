"use client";

import { useEffect, useRef } from "react";

const N = 28;

export function Ruler() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ticks = Array.from(ref.current?.children ?? []) as HTMLElement[];
    function update() {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? window.scrollY / max : 0;
      const cur = Math.min(N - 1, Math.round(p * (N - 1)));
      ticks.forEach((t, i) => {
        t.className = i < cur ? "on" : i === cur ? "cur" : "";
      });
    }
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <div className="ruler" ref={ref} aria-hidden="true">
      {Array.from({ length: N }, (_, i) => (
        <i key={i} />
      ))}
    </div>
  );
}
