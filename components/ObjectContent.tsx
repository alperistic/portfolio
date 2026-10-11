"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import type { CelestialContent, Fact, Locale } from "@/content";

/*
 * Inhalt eines Himmelsobjekts als semantisches HTML — dieselben Bausteine im
 * Panel (Himmel) und in der Listenansicht. Überschriften: Titel ist h2 (bzw.
 * h1 für Alper in der Liste), Skill-Gruppen sind h3.
 */

export function Tags({ o, coord }: { o: CelestialContent; coord?: string }) {
  if (!o.tags.length && !coord) return null;
  return (
    <div className="p-meta">
      {o.tags.map((t) => (
        <span key={t.text} className={`tag${t.placeholder ? " ph" : ""}`} style={{ "--c": t.color } as CSSProperties}>
          {t.color && <i />}
          {t.text}
        </span>
      ))}
      {coord && (
        <span className="p-coord" aria-hidden="true">
          {coord}
        </span>
      )}
    </div>
  );
}

const QUOTES: Record<Locale, [string, string]> = { de: ["„", "“"], en: ["“", "”"] };

type BodyProps = {
  o: CelestialContent;
  locale: Locale;
  /** Hover über einer Skill-Gruppe (Panel): hebt ihren Stern im Himmel hervor. */
  onGroupHover?: (index: number | null) => void;
  /** Panel geöffnet: Zahlen in Belegen zählen hoch (Listenansicht: nie). */
  animate?: boolean;
};

export function ObjectBody({ o, locale, onGroupHover, animate }: BodyProps) {
  const [qo, qc] = QUOTES[locale];
  return (
    <>
      <p className="lead">{o.lead}</p>
      {o.body?.map((p) => <p key={p}>{p}</p>)}
      {o.quote && (
        <blockquote className="p-quote">
          <p>
            {qo}
            {o.quote}
            {qc}
          </p>
        </blockquote>
      )}

      {o.facts && (
        <dl className="p-facts">
          {o.facts.map((f) => (
            <div key={f.label}>
              <dt>{f.label}</dt>
              <dd>
                <FactValue f={f} animate={animate} />
              </dd>
            </div>
          ))}
        </dl>
      )}

      {o.stations && (
        <ol className="p-list">
          {o.stations.map((s) => (
            <li key={s.period + s.title}>
              <span className="y">{s.period}</span>
              <span className="t">{s.title}</span>
              {s.detail && <span className="d">{s.detail}</span>}
            </li>
          ))}
        </ol>
      )}

      {o.skillGroups && (
        <ul className="p-skills">
          {o.skillGroups.map((g, i) => (
            <li
              key={g.title}
              onPointerEnter={onGroupHover && (() => onGroupHover(i))}
              onPointerLeave={onGroupHover && (() => onGroupHover(null))}
            >
              <h3 className="t">{g.title}</h3>
              <ul className="p-sk">
                {g.skills.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}

      {o.links && (
        <ul className="p-links">
          {o.links.map((l) => (
            <li key={l.label}>
              {l.href ? (
                <a href={l.href} target="_blank" rel="noopener noreferrer">
                  <span className="k">{l.label}</span>
                  <span className="v">
                    {l.text}
                    <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true">
                      <path d="M2.5 7.5l5-5M3.5 2.5h4v4" />
                    </svg>
                  </span>
                </a>
              ) : (
                <span className="ph">
                  <span className="k">{l.label}</span>
                  <span className="v">{l.text}</span>
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function FactValue({ f, animate }: { f: Fact; animate?: boolean }) {
  if (!Array.isArray(f.value)) return <>{f.value}</>;
  const chips = f.display === "chips";
  return (
    <ul className={chips ? "chips" : "items"}>
      {f.value.map((v, i) => (
        <li key={v}>{animate !== undefined && !chips && /\d\d/.test(v) ? <CountText text={v} run={animate} delay={750 + i * 120} /> : v}</li>
      ))}
    </ul>
  );
}

/**
 * Text mit hochzählenden Zahlen („~680 Commits“ zählt von 0 auf 680), sobald
 * `run` wahr wird. Nur mehrstellige Zahlen zählen; Breite je Zahl ist fest
 * (Ziffern mit fester Breite), damit nichts springt. Screenreader lesen den
 * fertigen Text, die Animation ist für sie ausgeblendet.
 */
function CountText({ text, run, delay }: { text: string; run: boolean; delay: number }) {
  const parts = text.split(/(\d+)/);
  const nums = useRef<(HTMLSpanElement | null)[]>([]);
  useEffect(() => {
    if (!run || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const els = nums.current;
    const target = parts.map((p, i) => (i % 2 && p.length > 1 ? Number(p) : NaN));
    const put = (k: number) =>
      els.forEach((el, i) => {
        if (el && !Number.isNaN(target[i])) el.textContent = String(Math.round(target[i] * k));
      });
    put(0);
    const t0 = performance.now() + delay;
    let raf = 0;
    const tick = (t: number) => {
      const k = Math.min(Math.max((t - t0) / 1400, 0), 1);
      put(1 - Math.pow(1 - k, 4));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      put(1);
    };
    // parts hängt nur an text
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run, text, delay]);
  return (
    <>
      <span className="sr">{text}</span>
      <span aria-hidden="true">
        {parts.map((p, i) =>
          i % 2 ? (
            <span
              key={i}
              className="num"
              ref={(el) => {
                nums.current[i] = el;
              }}
              style={{ minWidth: `${p.length}ch` }}
            >
              {p}
            </span>
          ) : (
            p
          ),
        )}
      </span>
    </>
  );
}
