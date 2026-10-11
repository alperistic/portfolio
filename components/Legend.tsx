"use client";

import { useEffect, useId, useRef, useState, type Ref } from "react";
import type { ObjectId, PublicContent } from "@/content";
import { Glyph } from "./Glyph";

type Props = {
  ref: Ref<HTMLElement>;
  content: PublicContent;
  /** Objekt, dessen Panel gerade offen ist. */
  active: ObjectId | null;
  onFocus: (id: ObjectId) => void;
  /** Hover über einem Eintrag hebt das Objekt im Himmel hervor. */
  onHover: (id: ObjectId | null) => void;
};

/**
 * Legende (Idee aus Prototyp A): alle Objekte zum Direktanspringen.
 * Eingeklappt ist sie nur ein kleiner Knopf, damit der Himmel ruhig bleibt.
 */
export function Legend({ ref, content, active, onFocus, onHover }: Props) {
  const { ui, tourOrder, objects } = content;
  const [open, setOpen] = useState(false);
  const listId = useId();
  const wrap = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    addEventListener("pointerdown", onDown);
    addEventListener("keydown", onKey);
    return () => {
      removeEventListener("pointerdown", onDown);
      removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <nav
      className={`legend${open ? " open" : ""}`}
      aria-label={ui.legend}
      ref={(el) => {
        wrap.current = el;
        if (typeof ref === "function") ref(el);
        else if (ref) ref.current = el;
      }}
    >
      <ul id={listId} className="legend-list" inert={!open} aria-hidden={!open}>
        {tourOrder.map((id, i) => {
          const o = objects[id]!;
          return (
            <li key={id} style={{ transitionDelay: `${open ? i * 28 : 0}ms` }}>
              <button
                type="button"
                aria-current={active === id ? "true" : undefined}
                onClick={() => {
                  setOpen(false);
                  onHover(null);
                  onFocus(id);
                }}
                onPointerEnter={() => onHover(id)}
                onPointerLeave={() => onHover(null)}
                onFocus={() => onHover(id)}
                onBlur={() => onHover(null)}
              >
                <Glyph id={id} />
                <span className="lg-t">{o.label}</span>
                <span className="lg-m">{o.meta}</span>
              </button>
            </li>
          );
        })}
      </ul>
      <button
        type="button"
        className="legend-btn"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((v) => !v)}
      >
        <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true">
          <circle cx="3" cy="3.5" r="1.2" fill="currentColor" stroke="none" />
          <circle cx="3" cy="7" r="1.2" fill="currentColor" stroke="none" />
          <circle cx="3" cy="10.5" r="1.2" fill="currentColor" stroke="none" />
          <path d="M6.5 3.5h6M6.5 7h6M6.5 10.5h6" opacity=".6" />
        </svg>
        <span className="legend-l">{ui.legend}</span>
        <span className="legend-n">{String(tourOrder.length).padStart(2, "0")}</span>
      </button>
    </nav>
  );
}
