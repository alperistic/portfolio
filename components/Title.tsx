"use client";

import { useEffect, useState, type CSSProperties, type Ref } from "react";
import { fill, type ObjectId, type PublicContent } from "@/content";

/** Die Produkte im Titelbild, in dieser Reihenfolge. */
const PRODUCTS: ObjectId[] = ["offerre", "insertcoin", "pipeline"];

type Props = {
  ref: Ref<HTMLElement>;
  tourRef: Ref<HTMLButtonElement>;
  content: PublicContent;
  /** Eingeblendet (nach der Eröffnung). */
  shown: boolean;
  /**
   * Weg für diesen Seitenaufruf (erste Interaktion mit dem Himmel, Direktlink,
   * Listenansicht): blendet aus und verlässt danach den Baum der Bedienung.
   */
  gone: boolean;
  onFocus: (id: ObjectId) => void;
  /** Hover über einem Produkt hebt sein Objekt im Himmel hervor. */
  onHover: (id: ObjectId | null) => void;
  onTour: () => void;
};

/**
 * Titelbild der Himmelsansicht (unten links): beantwortet ohne Klick, wer das
 * ist, was er macht, dass es echt ist (Produkte mit Status und Link) und
 * warum man folgen sollte. Die Hauptüberschrift der Himmelsansicht.
 * Ein Produktname fliegt zum Objekt (wie ein Klick auf sein Label im Himmel).
 *
 * Nur für den Moment des Ankommens: Sobald man sich umsieht oder ein Objekt
 * wählt, blendet es aus (350 ms) und kommt in diesem Seitenaufruf nicht zurück.
 */
export function Title({ ref, tourRef, content, shown, gone, onFocus, onHover, onTour }: Props) {
  const { brand, ui, objects } = content;
  // Nach dem Ausblenden ganz raus (display: none): nichts mehr fokussier- oder klickbar.
  const [removed, setRemoved] = useState(false);
  useEffect(() => {
    if (!gone) return;
    const t = window.setTimeout(() => setRemoved(true), 350);
    return () => clearTimeout(t);
  }, [gone]);
  const lead = objects.alper?.lead;
  const mail = objects.kontakt?.links?.find((l) => l.href?.startsWith("mailto:"));

  return (
    <section
      ref={ref}
      className={`title${shown && !gone ? " in" : ""}`}
      aria-labelledby="sky-title"
      // Eröffnung: unsichtbar, aber im Baum (jede Taste beendet sie ohnehin). Einmal weg: sofort inert.
      inert={gone}
      hidden={removed}
    >
      <h1 className="t-name" id="sky-title">
        {brand.name}
      </h1>
      <p className="t-sub">{brand.subline}</p>
      {lead && <p className="t-lead">{lead}</p>}

      <ul className="t-products">
        {PRODUCTS.map((id) => {
          const o = objects[id];
          if (!o) return null;
          const tag = o.tags[0];
          const href = o.links?.find((l) => l.href)?.href;
          return (
            <li key={id}>
              <button
                type="button"
                className="t-prod"
                aria-label={fill(ui.lookAt, o.label)}
                onClick={() => onFocus(id)}
                onPointerEnter={() => onHover(id)}
                onPointerLeave={() => onHover(null)}
              >
                {o.label}
              </button>
              {tag && (
                <span className="t-status" style={{ "--c": tag.color } as CSSProperties}>
                  {tag.color && <i aria-hidden="true" />}
                  {tag.text}
                </span>
              )}
              {href && (
                <a className="t-out" href={href} target="_blank" rel="noopener noreferrer" aria-label={fill(ui.open, o.label)}>
                  <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.1" aria-hidden="true">
                    <path d="M2.5 7.5l5-5M3.5 2.5h4v4" />
                  </svg>
                </a>
              )}
            </li>
          );
        })}
      </ul>

      <div className="t-actions">
        <button className="tour" type="button" ref={tourRef} onClick={onTour}>
          <svg viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
            <path d="M3.4 2.1l6.2 3.9-6.2 3.9z" />
          </svg>
          {ui.tourStart}
        </button>
        <div className="t-links">
          <a className="t-link" href={brand.follow.href} target="_blank" rel="me noopener">
            {brand.follow.label}
            <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.1" aria-hidden="true">
              <path d="M2.5 7.5l5-5M3.5 2.5h4v4" />
            </svg>
          </a>
          {mail?.href && (
            <a className="t-link t-mail" href={mail.href}>
              {mail.text}
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
