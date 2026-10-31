"use client";

import type { CSSProperties } from "react";
import type { CelestialContent, Fact, Locale } from "@/content";
import { Shot } from "./Shot";

/*
 * Inhalt eines Himmelsobjekts als semantisches HTML — dieselben Bausteine im
 * Panel (Himmel) und in der Listenansicht. Überschriften: Titel ist h2 (bzw.
 * h1 für Alper in der Liste), Skill-Gruppen sind h3.
 */

/** Statuszeile: schlichter Text, davor ein kleiner Punkt in der Akzentfarbe. */
export function Tags({ o }: { o: CelestialContent }) {
  if (!o.tags.length) return null;
  return (
    <div className="p-meta">
      {o.tags.map((t) => (
        <span key={t.text} className={`tag${t.placeholder ? " ph" : ""}`} style={{ "--c": t.color } as CSSProperties}>
          {t.color && <i aria-hidden="true" />}
          {t.text}
        </span>
      ))}
    </div>
  );
}

const QUOTES: Record<Locale, [string, string]> = { de: ["„", "“"], en: ["“", "”"] };

type BodyProps = {
  o: CelestialContent;
  locale: Locale;
  /** Hover über einer Skill-Gruppe (Panel): hebt ihren Stern im Himmel hervor. */
  onGroupHover?: (index: number | null) => void;
  /** Panel geöffnet: Einblick (Clip) läuft (Listenansicht: nie). */
  animate?: boolean;
  /** Beschriftungen für den Einblick (vergrößern/schließen). */
  shotLabels: { enlarge: string; shrink: string };
};

export function ObjectBody({ o, locale, onGroupHover, animate, shotLabels }: BodyProps) {
  const [qo, qc] = QUOTES[locale];
  return (
    <>
      {o.lead && <p className="lead">{o.lead}</p>}
      {o.media && <Shot m={o.media} labels={shotLabels} active={animate} />}
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
                <FactValue f={f} />
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
                <a
                  href={l.href}
                  // mailto: öffnet das Mailprogramm, kein leerer Tab
                  {...(l.href.startsWith("mailto:") ? {} : { target: "_blank", rel: "noopener noreferrer" })}
                >
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

function FactValue({ f }: { f: Fact }) {
  if (!Array.isArray(f.value)) return <>{f.value}</>;
  return (
    <ul className={f.display === "chips" ? "chips" : "items"}>
      {f.value.map((v) => (
        <li key={v}>{v}</li>
      ))}
    </ul>
  );
}
