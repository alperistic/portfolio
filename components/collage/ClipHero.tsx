"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { CLIP_SCENES, COLLAGE_UI, PERSON } from "@/content/collage";
import { Arrow } from "./Arrow";
import type { HeroData } from "./data";
import { useCamcorderClock, useReducedMotion, useTabHidden } from "./hooks";

/** Startzeit jeder Szene im Ablauf (ms) und Gesamtlänge — für Zeitcode und Kapitelmarken. */
const STARTS = CLIP_SCENES.map((_, i) => CLIP_SCENES.slice(0, i).reduce((a, s) => a + s.hold, 0));
const TOTAL = CLIP_SCENES.reduce((a, s) => a + s.hold, 0);
/** Wie lange ein Übergangs-Effekt stehen bleibt, bevor es normal weitergeht (ms). */
const FX_MS = { double: 1100, mirror: 1300 } as const;

const tc = (ms: number) => {
  const s = Math.floor(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
};

type Fx = { kind: "double" | "mirror"; from: number; to: number };

/**
 * Erster Bildschirm als Videoclip: Vollbild-Szenen mit harten Schnitten, ab und zu eine
 * Doppelbelichtung oder Spiegelung, die freigestellte Figur davor, darüber der
 * Camcorder-Look (Tönung, Überstrahlung, Farbrauschen, Zeilen, MiniDV-Einblendung).
 * Der Name ist nur ein kleiner Release-Stempel. Unten eine schmale Player-Leiste:
 * Abspielen/Pause steuert die Schnitte und ist zugleich die Pause für Barrierefreiheit.
 */
export function ClipHero({ data }: { data: HeroData }) {
  const reduced = useReducedMotion();
  const hidden = useTabHidden();
  const clock = useCamcorderClock();
  // null = noch nicht angefasst: läuft von selbst, außer bei reduzierter Bewegung
  const [userPlay, setUserPlay] = useState<boolean | null>(null);
  const wantsPlay = userPlay ?? !reduced;
  const playing = wantsPlay && !hidden;

  const [idx, setIdx] = useState(0);
  const [reach, setReach] = useState(0);
  const [fx, setFx] = useState<Fx | null>(null);
  const idxRef = useRef(0);
  const elapsed = useRef(0);
  const fillRef = useRef<HTMLSpanElement>(null);
  const tcRef = useRef<HTMLSpanElement>(null);

  /** Fortschritt der laufenden Szene und Zeitcode direkt ins DOM (kein Re-Render je Frame). */
  const paint = useCallback(() => {
    const i = idxRef.current;
    const p = Math.min(1, elapsed.current / CLIP_SCENES[i].hold);
    fillRef.current?.style.setProperty("--p", String(p));
    if (tcRef.current) tcRef.current.textContent = tc(STARTS[i] + elapsed.current);
  }, []);

  const goTo = useCallback((n: number, auto: boolean) => {
    const from = idxRef.current;
    idxRef.current = n;
    elapsed.current = 0;
    setIdx(n);
    setReach((r) => Math.max(r, n));
    const kind = CLIP_SCENES[n].fx;
    setFx(auto && kind ? { kind, from, to: n } : null);
  }, []);

  // Uhrwerk: läuft nur, solange gespielt wird und der Tab sichtbar ist
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      elapsed.current += Math.min(now - last, 250);
      last = now;
      if (elapsed.current >= CLIP_SCENES[idxRef.current].hold) {
        goTo((idxRef.current + 1) % CLIP_SCENES.length, true);
      }
      paint();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, goTo, paint]);

  // Vor dem Zeichnen: neue Szene beginnt bei 0, kein Aufblitzen eines alten Füllstands
  useLayoutEffect(paint, [idx, paint]);

  // Übergangs-Effekt nach kurzer Zeit wieder lösen
  useEffect(() => {
    if (!fx) return;
    const t = window.setTimeout(() => setFx(null), FX_MS[fx.kind]);
    return () => window.clearTimeout(t);
  }, [fx]);

  const scene = CLIP_SCENES[idx];
  const toggle = () => setUserPlay(!wantsPlay);

  return (
    <section
      className="clip"
      data-playing={playing ? "" : undefined}
      data-tint={scene.tint}
      aria-labelledby="c-name"
    >
      <div className="clip-frame" role="img" aria-label={`${PERSON.alt}, in front of changing city scenes at night and at golden hour (stand-in photos)`}>
        <div className="clip-scenes">
          {CLIP_SCENES.map((s, i) => {
            // Bilder erst laden, wenn die Szene dran ist oder als nächste kommt
            const load = i <= reach + 1;
            const on = i === idx;
            const ghost = fx?.kind === "double" && fx.from === i && fx.to === idx;
            const mirror = on && fx?.kind === "mirror";
            const cls = `clip-scene${on ? " is-on" : ""}${ghost ? " is-ghost" : ""}${mirror ? " is-mirror" : ""}`;
            return (
              <div key={s.id} className={cls} style={{ "--focus": s.focus ?? "50% 50%" } as CSSProperties}>
                {load && (
                  <>
                    {/* Statischer Export ohne Bild-Optimierung: Dateien sind vorab passend verkleinert */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      className="clip-img"
                      src={s.src}
                      alt=""
                      decoding="async"
                      fetchPriority={i === 0 ? "high" : "low"}
                    />
                    {/* Überstrahlung: dieselbe Datei, nur die Lichter, weich und aufgehellt darüber */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img className="clip-bloom" src={s.src} alt="" decoding="async" />
                    {s.fx === "mirror" && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img className="clip-mirror" src={s.src} alt="" decoding="async" />
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>

        <div className="clip-person">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={PERSON.src}
            alt=""
            width={PERSON.width}
            height={PERSON.height}
            fetchPriority="high"
            decoding="async"
          />
        </div>

        <div className="clip-tint" aria-hidden="true" />
        <div className="clip-noise" aria-hidden="true" />
        <div className="clip-lines" aria-hidden="true" />
      </div>

      {/* MiniDV-Einblendung */}
      <div className="osd" aria-hidden="true">
        <p className="osd-state">
          {playing ? <PlayIcon /> : <PauseIcon />}
          <span>{playing ? "PLAY" : "PAUSE"}</span>
          <span className="osd-sp">SP</span>
        </p>
        <p className="osd-date">
          <span>{clock?.[0] ?? " "}</span>
          <span>{clock?.[1] ?? " "}</span>
        </p>
      </div>

      {data.x && (
        <a className="follow" href={data.x.href} target="_blank" rel="noopener">
          <span className="follow-main">{COLLAGE_UI.followX}</span>
          <span className="follow-handle">
            {data.x.text}
            <Arrow />
          </span>
        </a>
      )}

      <header className="clip-title">
        <h1 id="c-name" className="stamp stamp--name">
          {data.name}
        </h1>
        <p className="clip-role">{data.role}</p>
        <p className="clip-strength">{data.strength}</p>
      </header>

      <div className="bar">
        <div className="bar-chapters">
          {CLIP_SCENES.map((s, i) => (
            <button
              key={s.id}
              type="button"
              className={`bar-ch${i < idx ? " is-past" : ""}${i === idx ? " is-on" : ""}`}
              style={{ flexGrow: s.hold }}
              onClick={() => goTo(i, false)}
              aria-label={`${COLLAGE_UI.scene} ${i + 1}: ${s.title}`}
              aria-current={i === idx ? "true" : undefined}
            >
              <span className="bar-fill" ref={i === idx ? fillRef : undefined} />
            </button>
          ))}
        </div>

        <div className="bar-row">
          <button
            type="button"
            className="bar-play"
            onClick={toggle}
            aria-label={wantsPlay ? COLLAGE_UI.pause : COLLAGE_UI.play}
          >
            {wantsPlay ? <PauseIcon /> : <PlayIcon />}
          </button>
          <p className="bar-tc" aria-hidden="true">
            <span ref={tcRef}>00:00</span>
            <span className="bar-dim"> / {tc(TOTAL)}</span>
          </p>
          <p className="bar-scene">
            <span className="bar-dim">{String(idx + 1).padStart(2, "0")}</span> {scene.title}
            <span className="bar-dim bar-place"> · {data.place}</span>
          </p>

          <nav className="bar-links" aria-label="Projects">
            {data.projects.map((p) => (
              <a key={p.href} className="bar-project" href={p.href} target="_blank" rel="noopener">
                {p.title}
              </a>
            ))}
            <a className="bar-tracklist" href="#tracklist">
              {COLLAGE_UI.toTracklist}
              <span aria-hidden="true"> ↓</span>
            </a>
          </nav>
        </div>
      </div>
    </section>
  );
}

function PlayIcon() {
  return (
    <svg className="ico" viewBox="0 0 12 12" aria-hidden="true">
      <path d="M3 1.8v8.4L10 6z" fill="currentColor" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg className="ico" viewBox="0 0 12 12" aria-hidden="true">
      <path d="M2.6 2h2.3v8H2.6zM7.1 2h2.3v8H7.1z" fill="currentColor" />
    </svg>
  );
}
