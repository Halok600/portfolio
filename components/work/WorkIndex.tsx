"use client";

import { useEffect, useRef, useState } from "react";
import { RichText } from "@/components/Inline";

export type WorkItem = {
  id: string;
  title: string;
  kind: string;
  highlights: string[];
  oneLiner: string;
  bullets: string[];
  stack: string[];
  links: { github?: string; live?: string };
  image?: string;
};

export function WorkIndex({ items }: { items: WorkItem[] }) {
  const [open, setOpen] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const peekRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const capRef = useRef<HTMLSpanElement>(null);

  // Cursor-following figure: pointer devices only, and no React state per mouse move.
  useEffect(() => {
    const root = rootRef.current;
    const peek = peekRef.current;
    const img = imgRef.current;
    const cap = capRef.current;
    if (!root || !peek || !img || !cap) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    items.forEach((it) => {
      if (it.image) new Image().src = it.image;
    });

    let mx = 0;
    let my = 0;
    let px = 0;
    let py = 0;
    let active = false;
    let raf = 0;

    const loop = () => {
      px += (mx - px) * 0.16;
      py += (my - py) * 0.16;
      const x = Math.min(px + 40, window.innerWidth - 380);
      const above = py - 282;
      const y = above >= 66 ? above : py + 56;
      peek.style.transform = `translate(${x}px,${y}px) rotate(${((mx - px) * 0.02).toFixed(2)}deg)`;
      raf = active ? requestAnimationFrame(loop) : 0;
    };
    const hide = () => {
      active = false;
      peek.classList.remove("show");
    };
    const show = (row: HTMLElement) => {
      const src = row.dataset.img;
      if (!src) return hide();
      img.src = src;
      cap.textContent = row.dataset.cap ?? "";
      active = true;
      peek.classList.add("show");
      if (!raf) loop();
    };
    const onMove = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
      if (!active) {
        px = mx;
        py = my;
      }
    };
    const onOver = (e: MouseEvent) => {
      const row = (e.target as HTMLElement).closest<HTMLElement>("[data-row]");
      if (row) show(row);
      else hide();
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    root.addEventListener("mouseover", onOver);
    root.addEventListener("mouseleave", hide);
    return () => {
      window.removeEventListener("mousemove", onMove);
      root.removeEventListener("mouseover", onOver);
      root.removeEventListener("mouseleave", hide);
      cancelAnimationFrame(raf);
    };
  }, [items]);

  return (
    <div className="index" ref={rootRef}>
      {items.map((it, n) => {
        const isOpen = open === it.id;
        const num = String(n + 1).padStart(2, "0");
        const host = it.links.live ? it.links.live.replace(/^https?:\/\//, "").replace(/\/$/, "") : it.title;
        return (
          <article key={it.id} className="item">
            <div className={`row${isOpen ? " sel" : ""}`} data-row data-img={it.image} data-cap={host}>
              <span className="idx mono">{num}</span>
              <h3 className="ttl">
                <button
                  type="button"
                  className="hit"
                  aria-expanded={isOpen}
                  aria-controls={`d-${it.id}`}
                  onClick={() => setOpen(isOpen ? null : it.id)}
                >
                  {it.title}
                </button>
              </h3>
              <span className="meta mono">
                <span>{it.kind}</span>
                <span>{it.highlights.join(" · ")}</span>
              </span>
              <span className="arr" aria-hidden="true">
                {isOpen ? "−" : "+"}
              </span>
              <span className="sum">
                <p>{it.oneLiner}</p>
              </span>
              <span className="box" aria-hidden="true">
                <b />
                <b />
                <b />
                <b />
                <span className="lab">id {num} · locked</span>
              </span>
            </div>
            <div className={`detail${isOpen ? " open" : ""}`} id={`d-${it.id}`} role="region" aria-label={`${it.title} details`}>
              <div>
                <div className="in">
                  <ul>
                    {it.bullets.map((b, i) => (
                      <li key={i}>
                        <span>
                          <RichText text={b} />
                        </span>
                      </li>
                    ))}
                  </ul>
                  <div className="side mono">
                    {it.links.live && (
                      <a href={it.links.live} target="_blank" rel="noopener noreferrer">
                        Live ↗<span className="sr"> — {it.title}</span>
                      </a>
                    )}
                    {it.links.github && (
                      <a href={it.links.github} target="_blank" rel="noopener noreferrer">
                        GitHub ↗<span className="sr"> — {it.title}</span>
                      </a>
                    )}
                    <span className="stk">{it.stack.join(" · ")}</span>
                  </div>
                </div>
              </div>
            </div>
          </article>
        );
      })}
      <div className="peek" ref={peekRef} aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img ref={imgRef} alt="" src="" />
        <span className="cap" ref={capRef} />
      </div>
    </div>
  );
}
