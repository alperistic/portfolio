"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { fill, type LangLink, type ObjectId, type PublicContent } from "@/content";
import type { SubLabel, Universe as UniverseApi } from "@/lib/scene/engine";
import { createSound, type Sound } from "@/lib/sound";
import { getView, setView, useView, type Why } from "@/lib/view";
import { Legend } from "./Legend";
import { Opening } from "./Opening";
import { Panel } from "./Panel";
import { LangSwitch } from "./ViewControls";

/** Die Eröffnung läuft einmal je Sitzung (danach nur noch das Einblenden der UI). */
const INTRO_KEY = "sky-intro";
const introSeen = () => {
  try {
    return sessionStorage.getItem(INTRO_KEY) === "1";
  } catch {
    return false;
  }
};
const markIntroSeen = () => {
  try {
    sessionStorage.setItem(INTRO_KEY, "1");
  } catch {
    /* privater Modus o. Ä. — dann eben jedes Mal */
  }
};

/**
 * Direktlinks: `#offerre` usw. fliegt nach dem Laden direkt zum Objekt und
 * öffnet sein Panel (ohne Eröffnung). Der Hash folgt dem Fokus, damit man den
 * aktuellen Stand einfach kopieren und weitergeben kann. In der Listenansicht
 * springt derselbe Link per Anker zum Abschnitt.
 */
const hashId = (ids: ObjectId[]): ObjectId | null => {
  let h: string;
  try {
    h = decodeURIComponent(location.hash.slice(1)).toLowerCase();
  } catch {
    return null; // kaputte %-Folge (z. B. `#%`) = unbekannter Link
  }
  return (ids as string[]).includes(h) ? (h as ObjectId) : null;
};
const writeHash = (id: ObjectId | null) => {
  const url = new URL(location.href);
  if ((url.hash.slice(1) || null) === id) return;
  url.hash = id ?? "";
  // replaceState: kein Eintrag pro Klick im Verlauf, und kein Sprung wie bei location.hash
  history.replaceState(history.state, "", url);
};

/**
 * Die Seite: Canvas mit der three.js-Szene + React-UI darüber.
 * Die Szene wird erst im Browser geladen (dynamischer Import) — three.js
 * landet so nicht im initialen Bundle und der statische Export bleibt schlank.
 * Labels rendert React einmal; ihre Position setzt die Engine pro Frame direkt
 * am DOM (60× pro Sekunde React-State wäre unnötig teuer).
 *
 * Gestartet wird die Szene erst, wenn der Himmel wirklich gezeigt wird (nicht
 * in der Listenansicht). Fällt sie aus (kein WebGL, Kontextverlust, zu langsam),
 * übernimmt automatisch die Listenansicht.
 *
 * Tastatur: Tab geht durch die Objekt-Labels (die Kamera dreht sich mit),
 * Enter fliegt hin, Pfeil links/rechts folgt der Tour, Esc führt zurück.
 * Beim Öffnen springt der Fokus in den Panel-Titel, beim Schließen zurück aufs Label.
 *
 * Ablauf beim Start: Schleier („Kalibriere Himmel“) → Eröffnung (Titelkarte,
 * nur beim ersten Besuch je Sitzung) → die Bedienelemente blenden gestaffelt ein
 * (`<html data-intro>` steuert das per CSS). „Tour starten“ fliegt als Autopilot
 * von Station zu Station; Klang ist optional und standardmäßig aus.
 */
export default function Universe({ content, langs }: { content: PublicContent; langs: LangLink[] }) {
  const { ui, tourOrder, objects } = content;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const brandRef = useRef<HTMLDivElement>(null);
  const compassRef = useRef<HTMLDivElement>(null);
  const compassCanvasRef = useRef<HTMLCanvasElement>(null);
  const compassReadRef = useRef<HTMLDivElement>(null);
  const tourRef = useRef<HTMLButtonElement>(null);
  const legendRef = useRef<HTMLElement>(null);
  const langRef = useRef<HTMLDivElement>(null);
  const cutRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const reticleRef = useRef<HTMLDivElement>(null);
  const sound = useRef<Sound | null>(null);
  const labelEls = useRef(new Map<ObjectId, HTMLElement>());
  const subEls = useRef(new Map<string, SubLabel>());
  const api = useRef<UniverseApi | null>(null);
  /** Label, das gerade per Tastatur fokussiert ist (hebt sein Objekt hervor). */
  const kbdLabel = useRef<ObjectId | null>(null);

  const view = useView();
  const active = view?.view === "sky";
  // Einmal gezeigt, bleibt die Szene im Hintergrund erhalten (nur pausiert) — außer sie ist ausgefallen.
  const [live, setLive] = useState(false);
  if (active && !live) setLive(true);

  const [panelId, setPanelId] = useState<ObjectId | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [hint, setHint] = useState(false);
  /** Eröffnung: läuft noch (`title`) bzw. vorbei (`done`); `null` = Himmel noch nicht bereit. */
  const [phase, setPhase] = useState<"title" | "done" | null>(null);
  /** Tour-Autopilot aktiv. */
  const [auto, setAuto] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const focusedRef = useRef<ObjectId | null>(null);
  const panelOpenRef = useRef(false);
  const showPanel = useCallback((open: boolean) => {
    panelOpenRef.current = open;
    setPanelOpen(open);
  }, []);

  const nextOf = useCallback(
    (id: ObjectId) => tourOrder[(tourOrder.indexOf(id) + 1) % tourOrder.length],
    [tourOrder],
  );

  const focus = useCallback((id: ObjectId) => {
    focusedRef.current = id;
    setHint(false);
    // Panel-Inhalt sofort rendern, damit die Engine seine Größe messen kann.
    flushSync(() => {
      showPanel(false);
      setPanelId(id);
    });
    if (panelRef.current) panelRef.current.scrollTop = 0;
    api.current?.focus(id);
    writeHash(id);
  }, [showPanel]);

  /** Zurück zur Übersicht. Per Tastatur blickt die Kamera danach auf das Objekt, von dem man kam. */
  const home = useCallback((kbd = false) => {
    const from = focusedRef.current;
    focusedRef.current = null;
    setAuto(false);
    showPanel(false);
    api.current?.setSubHover(null);
    api.current?.home(kbd && from ? from : undefined);
    writeHash(null);
    // Fokus zurück aufs Label des Objekts (nicht im Nirgendwo des geschlossenen Panels lassen)
    if (from) labelEls.current.get(from)?.focus({ preventScroll: true });
  }, [showPanel, setAuto]);

  const fail = useCallback((why: Why) => {
    setReady(false);
    setLive(false);
    setView("list", why);
  }, []);

  /** Himmel → Liste. Der Fokus landet auf der passenden Überschrift der Liste. */
  const toList = () => {
    setAuto(false);
    setView("list", "user");
    const id = focusedRef.current;
    const target = document.getElementById(id && id !== "alper" ? `${id}-h` : "lv-title");
    // Sofort springen, nicht animiert durch die ganze Liste scrollen (die Liste scrollt sonst weich)
    const root = document.documentElement;
    root.style.scrollBehavior = "auto";
    window.scrollTo(0, 0);
    target?.focus({ preventScroll: true });
    // Abschnitt (mit Kicker) statt nur der Überschrift — sonst liegt sie unter der festen Kopfzeile
    if (id && id !== "alper") (target?.closest("section") ?? target)?.scrollIntoView({ block: "start" });
    root.style.scrollBehavior = "";
  };

  // Szene anlegen, sobald der Himmel das erste Mal gezeigt wird.
  useEffect(() => {
    if (!live) return;
    let disposed = false;
    let instance: UniverseApi | null = null;

    import("@/lib/scene/engine").then(({ createUniverse }) => {
      if (disposed || !canvasRef.current || !cutRef.current) return;
      try {
        const deep = hashId(tourOrder);
        instance = createUniverse({
          canvas: canvasRef.current,
          // Direktlink: keine Eröffnungsfahrt, gleich hinfliegen
          intro: !deep,
          ids: tourOrder,
          counts: {
            stations: objects.werdegang?.stations?.length ?? 0,
            skills: objects.skills?.skillGroups?.map((g) => g.skills.length) ?? [],
          },
          names: Object.fromEntries(tourOrder.map((id) => [id, objects[id]?.label ?? id])),
          centerName: ui.center,
          labels: labelEls.current,
          subLabels: [...subEls.current.values()],
          compass: compassCanvasRef.current
            ? { canvas: compassCanvasRef.current, readout: compassReadRef.current }
            : null,
          // Feste UI, die Labels nicht überdecken sollen (Marke inkl. Listen-Knopf, Kompass, …)
          obstacles: () => [
            brandRef.current,
            compassRef.current,
            langRef.current,
            // eingeklappt nur der Knopf — die unsichtbare Liste belegt sonst Platz
            legendRef.current?.querySelector(".legend-btn"),
            legendRef.current?.classList.contains("open") ? legendRef.current.querySelector(".legend-list") : null,
            panelOpenRef.current ? null : tourRef.current,
            panelOpenRef.current ? panelRef.current : null,
          ],
          veil: cutRef.current,
          reticle: reticleRef.current,
          onTravel: (kind, dur) => sound.current?.travel(kind, dur),
          onHover: (id) => sound.current?.hover(id),
          onEvent: (e) => {
            // Pulsar-Signal nur hörbar, solange man bei ihm ist
            if (e.type === "pulse" && focusedRef.current === "kontakt" && panelOpenRef.current) sound.current?.pulse();
          },
          getPanelSize: () => ({
            width: panelRef.current?.offsetWidth ?? 0,
            height: panelRef.current?.scrollHeight ?? 0,
          }),
          onSelect: (id) => {
            if (id) focus(id);
            else if (focusedRef.current || panelOpenRef.current) home();
          },
          onPanel: (id) => {
            if (focusedRef.current !== id) return;
            showPanel(true);
            sound.current?.arrive(id);
          },
          onInteract: () => setHint(false),
          onContextLost: () => {
            if (!disposed) fail("lost");
          },
          // Wer den Himmel ausdrücklich will (?view=sky oder per Knopf), bekommt keinen Rückfall.
          onSlow: getView().forced
            ? undefined
            : () => {
                if (!disposed) fail("slow");
              },
        });
      } catch (err) {
        console.warn("WebGL nicht verfügbar", err);
        fail("webgl");
        return;
      }
      api.current = instance;
      instance.setPaused(getView().view !== "sky");
      // Schleier erst lüften, wenn alle Shader kompiliert sind und das erste Bild steht.
      instance.ready.then(() => {
        if (disposed) return;
        document.documentElement.dataset.sky = "ready";
        setReady(true);
        const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
        const target = hashId(tourOrder);
        const skip = !!target || reduced || introSeen() || new URLSearchParams(location.search).has("nointro");
        markIntroSeen();
        // Jahresring je neuer Szene abgleichen — nach einem Neuaufbau bleibt `phase` gleich, der Effekt liefe nicht
        api.current?.setOpening(!skip);
        setPhase(skip ? "done" : "title");
        if (target) focus(target);
      });
    }).catch((err) => {
      // Szene-Chunk nicht geladen (z. B. Netzwerkfehler): nicht ewig „Kalibriere Himmel“ zeigen.
      console.warn("Szene konnte nicht geladen werden", err);
      if (!disposed) fail("load");
    });

    return () => {
      disposed = true;
      instance?.destroy();
      api.current = null;
      delete document.documentElement.dataset.sky;
    };
    // focus/home/showPanel/fail sind stabil (useCallback) — der Effekt läuft einmal je Start.
  }, [live, tourOrder, objects, ui.center, focus, home, showPanel, fail]);

  // Direktlink in der Listenansicht: Der Browser springt beim Laden zu früh (vor dem
  // Umschalten auf die Liste) — einmal selbst zum Abschnitt springen.
  useEffect(() => {
    const id = hashId(tourOrder);
    if (!id || getView().view !== "list") return;
    document.getElementById(id)?.scrollIntoView({ block: "start" });
  }, [tourOrder]);

  // Himmel an den Hash angleichen: dorthin fliegen bzw. zurück
  const syncHash = useCallback(() => {
    if (getView().view !== "sky" || !api.current) return;
    const id = hashId(tourOrder);
    if (id && id !== focusedRef.current) focus(id);
    else if (!id && focusedRef.current) home();
  }, [focus, home, tourOrder]);

  // Hash von Hand geändert (oder Link auf derselben Seite)
  useEffect(() => {
    addEventListener("hashchange", syncHash);
    return () => removeEventListener("hashchange", syncHash);
  }, [syncHash]);

  // Listenansicht: Szene anhalten (GPU schonen), beim Zurückkehren weiterlaufen lassen.
  // Zurück im Himmel: Hat man in der Liste einen anderen Abschnitt angesprungen,
  // fliegt die Szene dorthin, damit Fokus und Link wieder übereinstimmen.
  useEffect(() => {
    api.current?.setPaused(!active);
    sound.current?.suspend(!active);
    if (active) syncHash();
  }, [active, syncHash]);

  // Bedienelemente während der Titelkarte ausblenden, danach gestaffelt einblenden.
  useEffect(() => {
    if (!phase) return;
    const root = document.documentElement;
    root.dataset.intro = phase;
    if (phase === "title") return;
    const t = window.setTimeout(() => delete root.dataset.intro, 2600);
    return () => clearTimeout(t);
  }, [phase]);
  useEffect(
    () => () => {
      delete document.documentElement.dataset.intro;
    },
    [],
  );
  // Jahresring erst nach der Titelkarte einblenden (er liefe sonst durch den Namen).
  useEffect(() => {
    if (phase) api.current?.setOpening(phase === "title");
  }, [phase]);

  // Zieh-Hinweis, sobald die UI steht (nicht, wenn man schon unterwegs ist).
  useEffect(() => {
    if (phase !== "done") return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let hide = 0;
    const show = window.setTimeout(() => {
      if (focusedRef.current) return;
      setHint(true);
      hide = window.setTimeout(() => setHint(false), 9000);
    }, reduced ? 400 : 1600);
    return () => {
      clearTimeout(show);
      clearTimeout(hide);
    };
  }, [phase]);

  useEffect(() => () => sound.current?.dispose(), []);

  const toggleSound = () => {
    sound.current ??= createSound();
    setSoundOn(sound.current.toggle());
    sound.current.suspend(getView().view !== "sky");
  };

  const startTour = () => {
    setAuto(true);
    focus(tourOrder[0]);
  };

  // Beim Öffnen landet der Fokus im Panel (auf dem Titel).
  useEffect(() => {
    if (panelOpen && panelId) titleRef.current?.focus({ preventScroll: true });
  }, [panelOpen, panelId]);

  // Tastatur: Esc = zurück, Pfeil links/rechts = Tour (vorheriges/nächstes Objekt)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (getView().view !== "sky" || e.altKey || e.ctrlKey || e.metaKey || !api.current) return;
      if ((e.target as HTMLElement | null)?.closest?.("input, textarea, select, [contenteditable], dialog")) return;
      if (e.key === "Escape") {
        if (focusedRef.current || panelOpenRef.current) home(true);
      } else if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        e.preventDefault();
        const n = tourOrder.length;
        const i = focusedRef.current ? tourOrder.indexOf(focusedRef.current) : -1;
        focus(e.key === "ArrowRight" ? tourOrder[(i + 1) % n] : tourOrder[i < 0 ? n - 1 : (i - 1 + n) % n]);
      }
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [focus, home, tourOrder]);

  const registerSub = (key: string, parent: ObjectId, index: number, child?: number) => (el: HTMLElement | null) => {
    if (el) subEls.current.set(key, { parent, index, child, el });
    else subEls.current.delete(key);
  };

  const isKeyboardFocus = (el: Element) => {
    try {
      return el.matches(":focus-visible");
    } catch {
      return true;
    }
  };

  return (
    <div className={`sky${panelOpen ? " panel-open" : ""}`}>
      {/* Erster Tab-Stopp: Abkürzung zur Liste + Tastaturhilfe (nur sichtbar, solange fokussiert) */}
      <div className="skip">
        <button type="button" onClick={toList}>
          {ui.listView}
        </button>
        <p>{ui.keysHint}</p>
      </div>

      <canvas ref={canvasRef} className="gl" tabIndex={-1} aria-label={ui.canvasLabel} />

      <div className="reticle" ref={reticleRef} aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
        <span className="ret-r" />
      </div>

      <div className="labels">
        {tourOrder.map((id) => {
          const o = objects[id]!;
          return (
            <button
              key={id}
              type="button"
              className="lbl"
              data-id={id}
              ref={(el) => {
                if (el) labelEls.current.set(id, el);
                else labelEls.current.delete(id);
              }}
              aria-label={fill(ui.lookAt, o.label)}
              onClick={(e) => {
                e.stopPropagation();
                focus(id);
              }}
              onPointerEnter={() => api.current?.setLabelHover(id)}
              onPointerLeave={() => api.current?.setLabelHover(kbdLabel.current)}
              onFocus={(e) => {
                if (!isKeyboardFocus(e.currentTarget)) return;
                kbdLabel.current = id;
                api.current?.setLabelHover(id);
                api.current?.reveal(id);
              }}
              onBlur={() => {
                if (kbdLabel.current !== id) return;
                kbdLabel.current = null;
                api.current?.setLabelHover(null);
              }}
            >
              <span className="lbl-line" />
              <span className="lbl-txt">
                <span className="lbl-t">{o.label}</span>
                <span className="lbl-m">{o.meta}</span>
              </span>
            </button>
          );
        })}
        {objects.werdegang?.stations?.map((s, i) => (
          <div key={`st-${i}`} className="sub" aria-hidden="true" ref={registerSub(`st-${i}`, "werdegang", i)}>
            <b>{s.year}</b>
            {s.title}
          </div>
        ))}
        {objects.skills?.skillGroups?.map((g, i) => (
          <div
            key={`sk-${i}`}
            className="sub grp"
            aria-hidden="true"
            ref={registerSub(`sk-${i}`, "skills", i)}
            onPointerEnter={(e) => e.pointerType === "mouse" && api.current?.setSubHover(i)}
            onPointerLeave={(e) => e.pointerType === "mouse" && api.current?.setSubHover(null)}
            // Tippen (Mobil) bzw. Klicken hält die Gruppe fest, erneut löst sie wieder
            onClick={() => api.current?.toggleSub(i)}
          >
            {g.title}
          </div>
        ))}
        {objects.skills?.skillGroups?.flatMap((g, i) =>
          g.skills.map((sk, j) => (
            <div key={`sk-${i}-${j}`} className="skl" aria-hidden="true" ref={registerSub(`sk-${i}-${j}`, "skills", i, j)}>
              {sk}
            </div>
          )),
        )}
      </div>

      <div className="brand" ref={brandRef}>
        <p className="brand-n">{content.brand.name}</p>
        <p className="brand-s">{content.brand.subline}</p>
        <button type="button" className="to-list" onClick={toList}>
          <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true">
            <path d="M2 3.5h10M2 7h10M2 10.5h6" />
          </svg>
          {ui.listView}
        </button>
      </div>

      <div className="compass" ref={compassRef} aria-hidden="true">
        <canvas ref={compassCanvasRef} />
        <div className="compass-r" ref={compassReadRef} />
      </div>

      <div className={`hint${hint ? " show" : ""}`} aria-hidden="true">
        <svg viewBox="0 0 46 18" fill="none" stroke="currentColor" strokeWidth="1">
          <path d="M6 9H40M6 9l4-4M6 9l4 4M40 9l-4-4M40 9l-4 4" opacity=".45" />
          <circle className="dot" cx="23" cy="9" r="3.2" fill="currentColor" stroke="none" />
        </svg>
        <span>{ui.dragHint}</span>
      </div>

      <div ref={langRef} className="lang-wrap">
        <LangSwitch langs={langs} current={content.locale} label={ui.langGroup} className="lang" />
        <button type="button" className={`snd${soundOn ? " on" : ""}`} aria-pressed={soundOn} onClick={toggleSound}>
          <svg viewBox="0 0 14 12" fill="currentColor" aria-hidden="true">
            <rect x="1" y="4" width="1.4" height="4" rx=".7" />
            <rect x="4.5" y="2" width="1.4" height="8" rx=".7" />
            <rect x="8" y="3" width="1.4" height="6" rx=".7" />
            <rect x="11.5" y="4.5" width="1.4" height="3" rx=".7" />
          </svg>
          <span className="snd-t">{ui.sound}</span>
        </button>
      </div>

      <button className="tour" type="button" ref={tourRef} onClick={startTour}>
        <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true">
          <circle cx="7" cy="7" r="6.2" opacity=".5" />
          <path d="M5.6 4.6l3.6 2.4-3.6 2.4z" fill="currentColor" stroke="none" />
        </svg>
        {ui.tourStart}
      </button>

      <Legend
        ref={legendRef}
        content={content}
        active={panelId && panelOpen ? panelId : null}
        onFocus={focus}
        onHover={(id) => api.current?.setLabelHover(id ?? kbdLabel.current)}
      />

      <Panel
        ref={panelRef}
        titleRef={titleRef}
        content={content}
        id={panelId}
        open={panelOpen}
        next={panelId ? nextOf(panelId) : null}
        step={panelId ? tourOrder.indexOf(panelId) : -1}
        onHome={home}
        onFocus={focus}
        onGroupHover={(i) => api.current?.setSubHover(i)}
        auto={auto}
        onAuto={setAuto}
      />

      {phase === "title" && (
        <Opening
          name={content.brand.name}
          subline={content.brand.subline}
          skipLabel={ui.skipIntro}
          onDone={() => setPhase("done")}
        />
      )}

      <div className="cut" ref={cutRef} aria-hidden="true" />
      <div className={`veil${ready ? " gone" : ""}`} aria-hidden="true">
        <span>{ui.loading}</span>
      </div>
    </div>
  );
}
