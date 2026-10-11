"use client";

import { useRef, useState, type CSSProperties, type PointerEvent as RPointerEvent, type Ref } from "react";
import type { CelestialContent, ObjectId, PublicContent } from "@/content";
import { coordsOf } from "@/lib/scene/layout";
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
 * Typo-Hierarchie von oben nach unten: Kicker (Gold, Versalien) → Titel (groß,
 * leicht) → Status-Tags → Lead (hell) → Fließtext (gedämpft) → Abschnitte mit
 * kleinen Mono-Überschriften → Navigation.
 *
 * Mobil lässt sich das Sheet am Griff ziehen: nach oben = mehr Platz zum Lesen,
 * nach unten = kleiner bzw. schließen. Tippen auf den Griff schaltet um.
 */
export function Panel({ ref, content, id, open, next, step, onHome, onFocus, onGroupHover, titleRef, auto, onAuto }: Props) {
  const { ui, objects, tourOrder } = content;
  const o = id ? objects[id] : undefined;
  const n = next ? objects[next] : undefined;

  // Ausgeklappt gilt nur für das Objekt, bei dem es passiert ist (kein Effekt nötig).
  const [expandedFor, setExpandedFor] = useState<ObjectId | null>(null);
  const expanded = !!id && expandedFor === id;
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
  const drag = useRef<{ y0: number; t0: number; dy: number } | null>(null);

  const onGripDown = (e: RPointerEvent<HTMLElement>) => {
    if (!matchMedia(MOBILE).matches || !el.current) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { y0: e.clientY, t0: performance.now(), dy: 0 };
    el.current.classList.add("dragging");
  };
  const onGripMove = (e: RPointerEvent<HTMLElement>) => {
    const d = drag.current;
    if (!d || !el.current) return;
    d.dy = e.clientY - d.y0;
    // nach unten folgt das Sheet dem Finger, nach oben nur mit Widerstand
    const y = d.dy > 0 ? d.dy : d.dy * 0.25;
    el.current.style.transform = `translateY(${y.toFixed(1)}px)`;
  };
  const onGripUp = () => {
    const d = drag.current;
    drag.current = null;
    if (!d || !el.current || !id) return;
    el.current.classList.remove("dragging");
    el.current.style.transform = "";
    const v = d.dy / Math.max(performance.now() - d.t0, 1); // px/ms
    if (Math.abs(d.dy) < 6) setExpandedFor(expanded ? null : id);
    else if (d.dy > 90 || (v > 0.5 && d.dy > 24)) {
      if (expanded) setExpandedFor(null);
      else onHome(false);
    } else if (d.dy < -36 || v < -0.5) setExpandedFor(id);
  };

  return (
    <aside
      ref={(node) => {
        el.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      }}
      className={`panel${open ? " open" : ""}${expanded ? " expanded" : ""}${held ? " held" : ""}`}
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
            <Tags o={o} coord={coordsOf(o.id)} />
          </header>

          <div className="p-body">
            <ObjectBody o={o} locale={content.locale} onGroupHover={onGroupHover} animate={open} />
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
