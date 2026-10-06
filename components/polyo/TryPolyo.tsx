"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { GrowthChart } from "@/components/polyo/GrowthChart";
import sampleJson from "@/lib/polyo-sample.json";
import {
  EXAMPLES, LANGUAGES, MAX_CODE, engineLabel, formatBigO, looksLikeResult,
  type LanguageId, type PolyoResult,
} from "@/lib/polyo";

// validated against the strict schema by a unit test (lib/polyo.test.ts)
const SAMPLE = sampleJson as PolyoResult;
const LIVE_APP = "https://polyo.vercel.app";

type Status = "idle" | "loading" | "done" | "error";

function percent(p: PolyoResult["time"]): string {
  if (p.abstain) return "not sure";
  const parts = [p.certainty, p.confidence != null ? `${Math.round(p.confidence * 100)}%` : null];
  return parts.filter(Boolean).join(" · ");
}

export function TryPolyo() {
  const [code, setCode] = useState(EXAMPLES[0].code);
  const [language, setLanguage] = useState<LanguageId>(EXAMPLES[0].language);
  const [status, setStatus] = useState<Status>("idle");
  const [slow, setSlow] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<PolyoResult>(SAMPLE);
  const [isSample, setIsSample] = useState(true);
  const [runId, setRunId] = useState(0);
  const [picked, setPicked] = useState<string | null>(EXAMPLES[0].id);

  const rootRef = useRef<HTMLDivElement>(null);
  const latest = useRef(0);

  // Wake PolyO's free server as soon as this section is about to be seen.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          fetch("/api/polyo").catch(() => {});
          io.disconnect();
        }
      },
      { rootMargin: "400px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  async function run(payload: { code: string; language: LanguageId } = { code, language }) {
    const id = ++latest.current;
    setStatus("loading");
    setSlow(false);
    setError("");
    const timer = setTimeout(() => id === latest.current && setSlow(true), 5000);
    try {
      const res = await fetch("/api/polyo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(65_000),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error ?? "Something went wrong. Please try again.");
      if (!looksLikeResult(body)) throw new Error("PolyO returned an unexpected answer.");
      if (id !== latest.current) return; // a newer run has started
      setResult(body);
      setIsSample(false);
      setRunId((n) => n + 1);
      setStatus("done");
    } catch (e) {
      if (id !== latest.current) return;
      const timedOut = e instanceof DOMException && (e.name === "TimeoutError" || e.name === "AbortError");
      setError(timedOut ? "PolyO's server took too long to wake up. Try again in a moment." : e instanceof Error ? e.message : "Something went wrong.");
      setStatus("error");
    } finally {
      clearTimeout(timer);
      if (id === latest.current) setSlow(false);
    }
  }

  function pickExample(id: string) {
    const ex = EXAMPLES.find((x) => x.id === id);
    if (!ex) return;
    setCode(ex.code);
    setLanguage(ex.language);
    setPicked(id);
    void run({ code: ex.code, language: ex.language });
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      if (code.trim()) void run();
    }
  }

  const loading = status === "loading";
  const tag = isSample
    ? "Sample result · press Analyse to run it live"
    : `${engineLabel(result.engine)} · ${result.language_detected}`;

  return (
    <div className="pr" ref={rootRef}>
      <div className="pr-ed">
        <div className="pr-bar">
          <div className="pr-chips" role="group" aria-label="Examples">
            {EXAMPLES.map((ex) => (
              <button key={ex.id} type="button" className="chip mono" aria-pressed={picked === ex.id} onClick={() => pickExample(ex.id)} disabled={loading}>
                {ex.title}
              </button>
            ))}
          </div>
          <label className="mono pr-lang-l">
            <span className="sr">Language</span>
            <select className="pr-lang mono" value={language} onChange={(e) => { setLanguage(e.target.value as LanguageId); setPicked(null); }}>
              {LANGUAGES.map((l) => (
                <option key={l.id} value={l.id}>{l.label}</option>
              ))}
            </select>
          </label>
        </div>

        <textarea
          className="pr-code mono"
          value={code}
          onChange={(e) => { setCode(e.target.value); setPicked(null); }}
          onKeyDown={onKeyDown}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          maxLength={MAX_CODE}
          rows={12}
          aria-label="Source code to analyse"
        />

        <div className="pr-foot mono">
          <span>
            {code.length.toLocaleString("en-US")} / {MAX_CODE.toLocaleString("en-US")} characters · Ctrl + Enter to run
          </span>
          <button type="button" className="btn solid" onClick={() => void run()} disabled={loading || !code.trim()}>
            {loading ? "Analysing…" : "Analyse →"}
          </button>
        </div>
      </div>

      <div className="pr-res" aria-live="polite" aria-busy={loading}>
        {status === "done" && (
          <span key={runId} className="box" aria-hidden="true">
            <b /><b /><b /><b />
            <span className="lab">locked · {engineLabel(result.engine)}</span>
          </span>
        )}

        {loading && <div className="pr-scan" aria-hidden="true" />}
        <p className="pr-tag mono">{loading ? "Analysing…" : status === "error" ? "Could not analyse" : tag}</p>

        {loading && slow && (
          <p className="pr-wait">
            Waking up PolyO&apos;s server. It sleeps when idle, so the first run can take about 30 seconds.
          </p>
        )}

        {status === "error" ? (
          <div className="pr-err">
            <p>{error}</p>
            <p className="mono">
              <button type="button" className="chip mono" onClick={() => void run()} disabled={!code.trim()}>Try again</button>{" "}
              <a href={LIVE_APP} target="_blank" rel="noopener noreferrer">Open the full PolyO app ↗</a>
            </p>
          </div>
        ) : (
          <div className={loading ? "pr-dim" : undefined}>
            <div className="pr-big">
              <div>
                <span className="k mono">Time</span>
                <b>{formatBigO(result.time.expression ?? result.time.class)}</b>
                <span className="sub mono">{percent(result.time)}</span>
              </div>
              <div>
                <span className="k mono">Space</span>
                <b>{formatBigO(result.space.expression ?? result.space.class)}</b>
                <span className="sub mono">{percent(result.space)}</span>
              </div>
            </div>

            {result.derivation.length > 0 && (
              <ol className="pr-steps mono" aria-label="How PolyO got there">
                {result.derivation.map((d, i) => (
                  <li key={i}>
                    <i>{d.line > 0 ? `L${d.line}` : "="}</i>
                    <span>{formatBigO(d.text)}</span>
                  </li>
                ))}
              </ol>
            )}

            {result.curve && (
              <GrowthChart n={result.curve.n} series={result.curve.time.series} predicted={result.curve.time.predicted_class} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
