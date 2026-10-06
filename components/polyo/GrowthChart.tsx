import { formatBigO, trimSaturation } from "@/lib/polyo";

const W = 380;
const H = 170;
const PAD = { l: 6, r: 78, t: 10, b: 24 };

const ln = (v: number) => Math.log(Math.max(v, 1));

/** Log-log growth curves: the predicted class in the accent colour, its neighbours muted. */
export function GrowthChart({
  n, series, predicted,
}: {
  n: number[];
  series: Record<string, number[]>;
  predicted: string;
}) {
  const names = Object.keys(series);
  if (n.length < 2 || names.length === 0) return null;

  // a series that overflows is cut at the overflow point instead of drawing a false plateau
  const lines = names.map((k) => ({ k, v: trimSaturation(series[k]) }));

  const xs = n.map(ln);
  const [x0, x1] = [Math.min(...xs), Math.max(...xs)];
  const all = lines.flatMap((l) => l.v.map(ln));
  const [y0, y1] = [Math.min(...all), Math.max(...all)];
  const px = (v: number) => PAD.l + ((ln(v) - x0) / (x1 - x0 || 1)) * (W - PAD.l - PAD.r);
  const py = (v: number) => H - PAD.b - ((ln(v) - y0) / (y1 - y0 || 1)) * (H - PAD.t - PAD.b);

  // labels sit at the end of each line, nudged apart so they never overlap
  const ends = lines
    .map((l) => ({ k: l.k, x: px(n[l.v.length - 1]) + 8, y: py(l.v[l.v.length - 1]) }))
    .sort((a, b) => a.y - b.y);
  for (let i = 1; i < ends.length; i++) {
    if (Math.abs(ends[i].x - ends[i - 1].x) < 70 && ends[i].y - ends[i - 1].y < 12) ends[i].y = ends[i - 1].y + 12;
  }
  const endOf = new Map(ends.map((e) => [e.k, e]));

  return (
    <figure className="pr-chart">
      <figcaption className="mono">Growth as the input gets bigger (log scale)</figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Predicted growth ${formatBigO(predicted)} compared with neighbouring classes`}>
        <line x1={PAD.l} x2={W - PAD.r} y1={H - PAD.b} y2={H - PAD.b} className="ax" />
        {lines.map(({ k, v }) => {
          const pts = v.map((val, i) => `${px(n[i]).toFixed(1)},${py(val).toFixed(1)}`).join(" ");
          const e = endOf.get(k);
          return (
            <g key={k} className={k === predicted ? "ln hot" : "ln"}>
              <polyline points={pts} fill="none" />
              <text x={e?.x ?? 0} y={(e?.y ?? 0) + 3} className="mono">
                {formatBigO(k)}
              </text>
            </g>
          );
        })}
        <text x={PAD.l} y={H - 6} className="mono ax-t">n = {n[0].toLocaleString("en-US")}</text>
        <text x={W - PAD.r} y={H - 6} textAnchor="end" className="mono ax-t">
          {n[n.length - 1].toLocaleString("en-US")}
        </text>
      </svg>
    </figure>
  );
}
