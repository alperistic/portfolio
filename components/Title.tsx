"use client";

import type { CSSProperties, Ref } from "react";
import { fill, type ObjectId, type PublicContent } from "@/content";

/** Die Produkte im Titelbild, in dieser Reihenfolge. */
const PRODUCTS: ObjectId[] = ["offerre", "insertcoin", "pipeline"];

type Props = {
  ref: Ref<HTMLElement>;
  tourRef: Ref<HTMLButtonElement>;
  content: PublicContent;
  /** Eingeblendet (nach der Eröffnung, solange kein Panel offen ist). */
  shown: boolean;
  /** Panel offen: Titelbild ist weg und nicht erreichbar. */
  hidden: boolean;
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
 */
export function Title({ ref, tourRef, content, shown, hidden, onFocus, onHover, onTour }: Props) {
  const { brand, ui, objects } = content;
  const lead = objects.alper?.lead;
  const mail = objects.kontakt?.links?.find((l) => l.href?.startsWith("mailto:"));

  return (
    <section
      ref={ref}
      className={`title${shown ? " in" : ""}`}
      aria-labelledby="sky-title"
      // Eröffnung: unsichtbar, aber im Baum (jede Taste beendet sie ohnehin). Panel offen: weg.
      inert={hidden}
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
