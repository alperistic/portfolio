"use client";

import { useRef, useState, type CSSProperties, type PointerEvent as RPointerEvent, type Ref } from "react";
import type { CelestialContent, ObjectId, PublicContent } from "@/content";
import { COMMITS } from "@/content/commits";
import { CONTRIBUTIONS } from "@/content/contributions";
import { ObjectBody, Tags } from "./ObjectContent";

type Props = {
  ref: Ref<HTMLElement>;
  content: PublicContent;
  id: ObjectId | null;
  open: boolean;
  next: ObjectId | null;
  /** Position in der Tour (0-basiert), -1 = nicht in der Tour. */
  step: number;
  /** Zurück; `kbd` = per Tastatur ausgelöst (Kamera blickt danach aufs Objekt). */
  onHome: (kbd: boolean) => void;
  onFocus: (id: ObjectId) => void;
  onGroupHover: (index: number | null) => void;
  /** Titel-Überschrift: dorthin springt der Fokus beim Öffnen. */
  titleRef: Ref<HTMLHeadingElement>;
  /** Tour-Autopilot: fliegt nach der Lesezeit selbst weiter. */
  auto: boolean;
  onAuto: (on: boolean) => void;
};

const MOBILE = "(max-width: 767px)";
/** Mobil: Höhen des Sheets (Anteil der Fensterhöhe) — Peek, halb offen, fast ganz. Wie in globals.css. */
const SNAPS = [0.44, 0.72, 0.92];

/**
 * Lesezeit einer Station im Autopilot (s): Grundzeit plus Wörter, gedeckelt —
 * so dauert die ganze Tour gut eine Minute.
 */
function dwellOf(o: CelestialContent) {
  const text = [
    o.lead,
    ...(o.body ?? []),
    o.quote ?? "",
    ...(o.facts ?? []).flatMap((f) => (Array.isArray(f.value) ? f.value : [f.value])),
    ...(o.stations ?? []).map((s) => `${s.title} ${s.detail ?? ""}`),
    ...(o.skillGroups ?? []).map((g) => g.title),
  ].join(" ");
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.min(12, Math.max(6.5, 4 + words * 0.075));
}

/**
 * Content-Panel: rechts (Desktop) bzw. Bottom-Sheet (Mobil).
 *
 * Typo-Hierarchie von oben nach unten: Kicker → Titel (groß, leicht) → Status →
 * Lead → Einblick → Fließtext → Abschnitte → Links → Erklärsatz (Commit-Sterne,
 * Jahresring) → Navigation (klebt unten, damit „Nächster Stern“ immer erreichbar ist).
 *
 * Mobil rastet das Sheet auf drei Höhen ein (44 / 72 / 92 % der Fensterhöhe):
 * am Griff hochziehen = mehr Platz zum Lesen, runterziehen = kleiner bzw. schließen.
 * Tippen auf den Griff schaltet eine Stufe weiter.
 */
export function Panel({ ref, content, id, open, next, step, onHome, onFocus, onGroupHover, titleRef, auto, onAuto }: Props) {
  const { ui, objects, tourOrder } = content;
  const o = id ? objects[id] : undefined;
  const n = next ? objects[next] : undefined;

  // Sheet-Stufe gilt nur für das Objekt, bei dem sie gewählt wurde (kein Effekt nötig).
  const [snapFor, setSnapFor] = useState<{ id: ObjectId; i: number } | null>(null);
  const snap = id && snapFor?.id === id ? snapFor.i : 0;
  // Mobil: Antippen des Sheets hält den Autopilot an (Desktop: Maus über dem Panel, per CSS).
  const [heldFor, setHeldFor] = useState<ObjectId | null>(null);
  const held = !!id && heldFor === id;
  const last = step === tourOrder.length - 1;
  const onAutoEnd = () => {
    if (!auto || !next) return;
    if (last) onAuto(false);
    else onFocus(next);
  };
  const el = useRef<HTMLElement | null>(null);
  const drag = useRef<{ y0: number; t0: number; dy: number; h0: number } | null>(null);

  const onGripDown = (e: RPointerEvent<HTMLElement>) => {
    if (!matchMedia(MOBILE).matches || !el.current) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { y0: e.clientY, t0: performance.now(), dy: 0, h0: el.current.offsetHeight };
    el.current.classList.add("dragging");
  };
  const onGripMove = (e: RPointerEvent<HTMLElement>) => {
    const d = drag.current;
    if (!d || !el.current) return;
    d.dy = e.clientY - d.y0;
    // Hoch: das Sheet wächst mit dem Finger (bis 92 %). Runter: es schrumpft bis zur
    // Peek-Höhe und rutscht darunter als Ganzes weg (Andeutung: gleich zu).
    const H = innerHeight;
    const peek = Math.min(d.h0, SNAPS[0] * H);
    const h = d.h0 - d.dy;
    const s = el.current.style;
    if (h >= peek) {
      s.maxHeight = `${Math.min(h, SNAPS[2] * H).toFixed(1)}px`;
      s.transform = "";
    } else {
      s.maxHeight = `${peek.toFixed(1)}px`;
      s.transform = `translateY(${(peek - h).toFixed(1)}px)`;
    }
  };
  const onGripUp = () => {
    const d = drag.current;
    drag.current = null;
    if (!d || !el.current || !id) return;
    el.current.classList.remove("dragging");
    el.current.style.maxHeight = "";
    el.current.style.transform = "";
    if (Math.abs(d.dy) < 6) {
      setSnapFor({ id, i: (snap + 1) % SNAPS.length });
      return;
    }
    const H = innerHeight;
    const v = d.dy / Math.max(performance.now() - d.t0, 1); // px/ms, + = nach unten
    // Wohin das Sheet mit Schwung käme; daran die nächste Stufe (oder schließen)
    const h = d.h0 - d.dy - v * 140;
    const peek = Math.min(d.h0, SNAPS[0] * H);
    if (h < peek - 70 || (snap === 0 && v > 0.5 && d.dy > 24)) {
      onHome(false);
      return;
    }
    let best = 0;
    SNAPS.forEach((f, i) => {
      if (Math.abs(f * H - h) < Math.abs(SNAPS[best] * H - h)) best = i;
    });
    setSnapFor({ id, i: best });
  };

  return (
    <aside
      ref={(node) => {
        el.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      }}
      className={`panel${open ? " open" : ""}${snap ? ` snap-${snap}` : ""}${held ? " held" : ""}`}
      data-id={id ?? undefined}
      aria-label={o?.title ?? undefined}
      onPointerDown={(e) => {
        if (auto && e.pointerType !== "mouse" && id) setHeldFor(id);
      }}
      aria-hidden={!open}
      inert={!open}
    >
      {o && (
        <>
          <div
            className="p-grip"
            aria-hidden="true"
            onPointerDown={onGripDown}
            onPointerMove={onGripMove}
            onPointerUp={onGripUp}
            onPointerCancel={onGripUp}
          />
          <button className="p-close" type="button" onClick={(e) => onHome(e.detail === 0)} aria-label={ui.close}>
            <svg width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="1">
              <path d="M1 1l12 12M13 1L1 13" />
            </svg>
          </button>

          <header className="p-head">
            <div className="p-kick">{o.kicker}</div>
            {/* Landepunkt für den Tastatur-Fokus beim Öffnen */}
            <h2 className="p-title" ref={titleRef} tabIndex={-1}>
              {o.title}
            </h2>
            <Tags o={o} />
          </header>

          <div className="p-body">
            <ObjectBody o={o} locale={content.locale} onGroupHover={onGroupHover} animate={open} shotLabels={ui} />
            {COMMITS.days[o.id] && <p className="p-commits">{ui.commitNote}</p>}
            {o.id === "alper" && CONTRIBUTIONS.counts.length > 0 && <p className="p-commits">{ui.ringNote}</p>}
          </div>

          <nav className="p-nav">
            {step >= 0 && (
              <div className="p-steps">
                {tourOrder.map((t, i) => (
                  <button
                    key={t}
                    type="button"
                    className={i === step ? "on" : i < step ? "done" : undefined}
                    aria-label={`${ui.tourStep} ${i + 1}: ${objects[t]?.label}`}
                    aria-current={i === step ? "step" : undefined}
                    onClick={() => t !== id && onFocus(t)}
                  >
                    {/* Autopilot: der Balken der aktuellen Station ist der Timer */}
                    {auto && open && i === step && (
                      <i
                        className="p-fill"
                        style={{ "--dwell": `${dwellOf(o)}s` } as CSSProperties}
                        onAnimationEnd={onAutoEnd}
                      />
                    )}
                  </button>
                ))}
                <span className="p-step-n">
                  {String(step + 1).padStart(2, "0")} / {String(tourOrder.length).padStart(2, "0")}
                </span>
                <button
                  type="button"
                  className={`p-auto${auto && !held ? " on" : ""}`}
                  aria-pressed={auto && !held}
                  aria-label={auto && !held ? ui.autoPause : ui.autoPlay}
                  title={auto && !held ? ui.autoPause : ui.autoPlay}
                  onClick={() => {
                    setHeldFor(null);
                    onAuto(!(auto && !held));
                  }}
                >
                  <svg viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
                    {auto && !held ? (
                      <path d="M3 2.2h2v7.6H3zM7 2.2h2v7.6H7z" />
                    ) : (
                      <path d="M3.4 2.1l6.2 3.9-6.2 3.9z" />
                    )}
                  </svg>
                </button>
              </div>
            )}
            <div className="p-nav-row">
              <button type="button" className="back" onClick={(e) => onHome(e.detail === 0)}>
                {o.id === "alper" ? ui.backFromCenter : ui.back}
              </button>
              {next && n && (
                <button type="button" className="next" onClick={() => onFocus(next)}>
                  <span className="k">{next === tourOrder[0] ? ui.restart : ui.next} →</span>
                  <span className="v">{n.label}</span>
                </button>
              )}
            </div>
          </nav>
        </>
      )}
    </aside>
  );
}
