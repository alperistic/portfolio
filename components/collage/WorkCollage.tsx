"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { COLLAGE_UI, PROJECT_SCENES, type CollageProject } from "@/content/collage";
import { Arrow } from "./Arrow";
import { PROJECT_ORDER, type WorkData, type WorkPiece } from "./data";
import { pad, Scene, usePlayback, useReducedMotion, useTabHidden } from "./Scene";

/** Leicht gedreht, wie aufgeklebt — je Projekt fest, damit nichts zappelt. */
const ROT: Record<CollageProject, number> = { offerre: -3.2, insertcoin: 2.4, pipeline: -1.6 };

/** Warum der Wechsel gerade steht: Zeiger drauf, Tastatur-Fokus oder angetippt. */
type Hold = { hover: boolean; focus: boolean; pin: boolean };

/**
 * Zweites Kapitel, Arbeits-Collage: hinter den aufgeklebten Einblicken läuft die
 * Szene des Projekts, das gerade vorn ist. Ohne Zutun wechselt sie langsam durch
 * (nur solange das Kapitel im Bild ist); Hover, Fokus oder Tap holt ein Projekt
 * nach vorn und hält es dort.
 */
export function WorkCollage({ data }: { data: WorkData }) {
  const reduced = useReducedMotion();
  const hidden = useTabHidden();
  const root = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);
  const [active, setActive] = useState<CollageProject>(PROJECT_ORDER[0]);
  const [hold, setHold] = useState<Hold>({ hover: false, focus: false, pin: false });

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const scene = PROJECT_SCENES.find((s) => s.project === active) ?? PROJECT_SCENES[0];
  const paused = reduced || hidden || !inView || hold.hover || hold.focus || hold.pin;

  useEffect(() => {
    if (paused) return;
    const t = window.setTimeout(() => {
      setActive((a) => PROJECT_ORDER[(PROJECT_ORDER.indexOf(a) + 1) % PROJECT_ORDER.length]);
    }, scene.hold + 1200);
    return () => window.clearTimeout(t);
  }, [active, paused, scene.hold]);

  // Esc löst ein angetipptes Projekt
  useEffect(() => {
    if (!hold.pin) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setHold((h) => ({ ...h, pin: false }));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hold.pin]);

  return (
    <section ref={root} id="work" className="c-work" aria-labelledby="c-work-h">
      <div className="c-scenes" aria-hidden="true">
        {PROJECT_SCENES.map((s) => (
          <Scene key={s.id} s={s} on={s === scene} play={inView && !reduced && !hidden} />
        ))}
      </div>
      <div className="c-grade c-grade--work" aria-hidden="true" />
      <div className="c-grain" aria-hidden="true" />

      <div className="c-work-inner">
        <header className="c-work-head">
          <p className="c-roof">
            <span className="c-roof-k">{COLLAGE_UI.builtUnder}</span> <strong>{data.late.title}</strong>
            <span className="c-roof-lead"> — {data.late.lead}</span>
            {data.late.link && (
              <a href={data.late.link.href} target="_blank" rel="noopener">
                {data.late.link.label}
                <Arrow />
              </a>
            )}
          </p>
          <h2 id="c-work-h" className="c-work-h">
            {COLLAGE_UI.shipped}
          </h2>
        </header>

        <ul className={`c-pieces${hold.hover || hold.focus || hold.pin ? " is-held" : ""}`}>
          {data.pieces.map((p) => (
            <Piece
              key={p.id}
              p={p}
              on={active === p.id}
              play={inView && !reduced && !hidden}
              still={reduced}
              onEnter={() => {
                setActive(p.id);
                setHold((h) => ({ ...h, hover: true }));
              }}
              onLeave={() => setHold((h) => ({ ...h, hover: false }))}
              onFocusIn={(keyboard) => {
                setActive(p.id);
                if (keyboard) setHold((h) => ({ ...h, focus: true }));
              }}
              onFocusOut={() => setHold((h) => ({ ...h, focus: false }))}
              onTap={() => {
                setActive(p.id);
                // Nochmal auf dasselbe Stück tippen löst es wieder
                setHold((h) => ({ ...h, pin: !(h.pin && active === p.id) }));
              }}
            />
          ))}
        </ul>

        {!scene.src && (
          <p className="c-slot c-slot--work" aria-hidden="true">
            {COLLAGE_UI.workScene} {pad(PROJECT_SCENES.indexOf(scene) + 1)} · {scene.placeholder.label} ·{" "}
            {COLLAGE_UI.placeholder}
          </p>
        )}
      </div>
    </section>
  );
}

type PieceProps = {
  p: WorkPiece;
  on: boolean;
  play: boolean;
  still: boolean;
  onEnter: () => void;
  onLeave: () => void;
  onFocusIn: (keyboard: boolean) => void;
  onFocusOut: () => void;
  onTap: () => void;
};

/** Ein aufgeklebtes Stück: echter Einblick plus Name, Einzeiler, Status, Link. */
function Piece({ p, on, play, still, onEnter, onLeave, onFocusIn, onFocusOut, onTap }: PieceProps) {
  const m = p.media;
  const clip = !!m?.video && !still;
  const video = usePlayback(clip && play);

  return (
    <li
      className={`c-piece c-piece--${p.id}${on ? " is-on" : ""}`}
      style={{ "--rot": `${ROT[p.id]}deg` } as CSSProperties}
      onPointerEnter={(e) => e.pointerType === "mouse" && onEnter()}
      onPointerLeave={(e) => e.pointerType === "mouse" && onLeave()}
      onFocus={(e) => onFocusIn(e.target.matches(":focus-visible"))}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) onFocusOut();
      }}
      onClick={(e) => {
        // Ein Link öffnet sein Ziel; alles andere am Stück holt das Projekt nach vorn
        if (!(e.target instanceof Element && e.target.closest("a"))) onTap();
      }}
    >
      {m && (
        <figure className={`c-cut-wrap${m.pixelated ? " px" : ""}`}>
          <div className="c-cut">
            {clip ? (
              <video
                ref={video}
                poster={m.src}
                width={m.width}
                height={m.height}
                muted
                loop
                playsInline
                preload="metadata"
                aria-label={m.alt}
              >
                {m.video!.map((s) => (
                  <source key={s} src={s} type={s.endsWith(".webm") ? "video/webm" : "video/mp4"} />
                ))}
              </video>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={m.src} width={m.width} height={m.height} alt={m.alt} loading="lazy" decoding="async" />
            )}
          </div>
        </figure>
      )}
      <div className="c-piece-text">
        <h3 className="c-piece-name">{p.title}</h3>
        <p className="c-piece-lead">{p.lead}</p>
        <p className="c-piece-meta">
          <span className="c-status">
            <i style={{ background: p.statusColor }} aria-hidden="true" />
            {p.status}
          </span>
          {p.link && (
            <a href={p.link.href} target="_blank" rel="noopener">
              {p.link.text}
              <Arrow />
            </a>
          )}
        </p>
      </div>
    </li>
  );
}
