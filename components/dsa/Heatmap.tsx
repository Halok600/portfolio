"use client";

import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";
import type { Cell, MonthLabel } from "@/lib/leetcode-calendar";

const CELL = 12;
const GAP = 3;
const PITCH = CELL + GAP;
const BOX = 3; // padding of the lock-on brackets around a cell
const DAYS = [
  { row: 0, name: "Mon" },
  { row: 2, name: "Wed" },
  { row: 4, name: "Fri" },
];

type Active = { w: number; d: number };

const fmt = new Intl.DateTimeFormat("en-GB", {
  weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC",
});

function describe(c: Cell): string {
  const when = fmt.format(new Date(`${c.date}T00:00:00Z`));
  const what = c.count === 0 ? "No submissions" : `${c.count} submission${c.count === 1 ? "" : "s"}`;
  return `${what} · ${when}`;
}

export function Heatmap({
  weeks, months, summary,
}: {
  weeks: (Cell | null)[][];
  months: MonthLabel[];
  summary: string;
}) {
  const [active, setActive] = useState<Active | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const W = weeks.length * PITCH - GAP;
  const H = 7 * PITCH - GAP;
  const cellAt = (a: Active | null) => (a ? weeks[a.w]?.[a.d] ?? null : null);
  const cell = cellAt(active);

  // on narrow screens the graph scrolls sideways; start at the most recent weeks
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, []);

  function onPointerOver(e: PointerEvent<SVGSVGElement>) {
    const t = e.target as SVGElement;
    if (t.dataset.w !== undefined && t.dataset.d !== undefined) {
      setActive({ w: Number(t.dataset.w), d: Number(t.dataset.d) });
    }
  }
  function onPointerLeave(e: PointerEvent<SVGSVGElement>) {
    if (e.pointerType === "mouse") setActive(null); // on touch the tooltip stays until another tap
  }

  // keyboard: one tab stop; arrow keys walk the days
  const rowsIn = (w: number): [number, number] => {
    const col = weeks[w];
    let lo = 0;
    let hi = 6;
    while (lo < 7 && !col[lo]) lo++;
    while (hi >= 0 && !col[hi]) hi--;
    return [lo, hi];
  };
  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Escape") return setActive(null);
    const last: Active = { w: weeks.length - 1, d: rowsIn(weeks.length - 1)[1] };
    const cur = active ?? last;
    let { w, d } = cur;
    const [lo, hi] = rowsIn(w);
    if (e.key === "ArrowRight") w = Math.min(weeks.length - 1, w + 1);
    else if (e.key === "ArrowLeft") w = Math.max(0, w - 1);
    else if (e.key === "ArrowDown") d = Math.min(hi, d + 1);
    else if (e.key === "ArrowUp") d = Math.max(lo, d - 1);
    else if (e.key === "Home") return (e.preventDefault(), setActive({ w: 0, d: rowsIn(0)[0] }));
    else if (e.key === "End") return (e.preventDefault(), setActive(last));
    else return;
    e.preventDefault();
    const [nlo, nhi] = rowsIn(w);
    setActive({ w, d: Math.min(nhi, Math.max(nlo, d)) });
  }

  const tipX = active ? (active.w * PITCH + CELL / 2) / W : 0;
  const tipAlign = tipX < 0.12 ? "l" : tipX > 0.88 ? "r" : "";

  return (
    <div className="hm-scroll" ref={scrollRef}>
      <div className="hm">
        <div
          className="hm-plot"
          tabIndex={0}
          role="group"
          aria-label={`${summary} Use the arrow keys to read each day.`}
          onKeyDown={onKeyDown}
          onBlur={() => setActive(null)}
        >
          {months.map((m) => (
            <span key={`${m.label}-${m.week}`} className="hm-m mono" style={{ left: `${((m.week * PITCH) / W) * 100}%` }}>
              {m.label}
            </span>
          ))}
          {DAYS.map((d) => (
            <span key={d.name} className="hm-d mono" style={{ top: `${((d.row * PITCH + CELL / 2) / H) * 100}%` }}>
              {d.name}
            </span>
          ))}

          <svg
            viewBox={`0 0 ${W} ${H}`}
            width="100%"
            aria-hidden="true"
            onPointerOver={onPointerOver}
            onPointerLeave={onPointerLeave}
          >
            {weeks.map((col, w) =>
              col.map((c, d) =>
                c ? (
                  <rect
                    key={c.date}
                    x={w * PITCH}
                    y={d * PITCH}
                    width={CELL}
                    height={CELL}
                    rx={2.5}
                    className={`c l${c.level}${active && active.w === w && active.d === d ? " hot" : ""}`}
                    data-w={w}
                    data-d={d}
                    style={{ "--w": w } as CSSProperties}
                  />
                ) : null,
              ),
            )}
            {active && cell && (
              <g
                className="hmbox"
                transform={`translate(${active.w * PITCH - BOX} ${active.d * PITCH - BOX})`}
                pointerEvents="none"
              >
                <path d="M0 5V0h5" />
                <path d={`M${CELL + 2 * BOX - 5} 0h5v5`} />
                <path d={`M${CELL + 2 * BOX} ${CELL + 2 * BOX - 5}v5h-5`} />
                <path d={`M5 ${CELL + 2 * BOX}H0v-5`} />
              </g>
            )}
          </svg>

          {active && cell && (
            <div
              className={`hm-tip mono ${tipAlign}`}
              style={{
                left: `${(((active.w * PITCH) + CELL / 2) / W) * 100}%`,
                top: `${((active.d * PITCH - BOX) / H) * 100}%`,
              }}
            >
              {describe(cell)}
            </div>
          )}
        </div>
        <p className="sr" aria-live="polite">
          {cell ? describe(cell) : ""}
        </p>
      </div>
    </div>
  );
}
