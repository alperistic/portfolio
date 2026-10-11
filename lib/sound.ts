import type { ObjectId } from "@/content/types";

/**
 * Klang zum Himmel — komplett synthetisch (WebAudio), keine Audiodateien.
 * Standardmäßig aus; erst ein Klick auf „Ton“ legt den AudioContext an
 * (Browser erlauben Ton ohnehin erst nach einer Nutzer-Geste).
 *
 * - Grundton: tiefer, langsam atmender Akkord (A–E–A) durch einen wandernden
 *   Tiefpass, darunter gefiltertes Rauschen als „Sonnenwind“.
 * - Reise: Rauschen, dessen Filter mit dem Warp auf- und wieder zugeht.
 * - Hover: jedes Objekt hat einen eigenen leisen Ton (A-Moll-Pentatonik).
 * - Ankunft: derselbe Ton als weiche Glocke mit Quinte.
 * - Pulsar: ein kurzes Signal bei jedem Strahl-Blitz, solange man bei „Kontakt“ ist.
 *
 * Alles bewusst leise und weich (keine harten Einschwingvorgänge, Kompressor am Ende).
 */

/** Tonhöhe je Objekt in Hz (A-Moll-Pentatonik, Alper = Grundton). */
const NOTE: Record<ObjectId, number> = {
  alper: 440, // A4
  werdegang: 523.25, // C5
  offerre: 587.33, // D5
  pipeline: 659.25, // E5
  insertcoin: 783.99, // G5
  late: 392, // G4
  skills: 880, // A5
  kontakt: 1046.5, // C6
};

export type Sound = {
  readonly on: boolean;
  /** Ton an/aus. Muss aus einer Nutzer-Geste (Klick) heraus aufgerufen werden. */
  toggle: () => boolean;
  /** Pausieren, z. B. Listenansicht oder Tab im Hintergrund. */
  suspend: (s: boolean) => void;
  travel: (kind: "trip" | "turn" | "zoom" | "cut", dur: number) => void;
  hover: (id: ObjectId | null) => void;
  arrive: (id: ObjectId) => void;
  pulse: () => void;
  dispose: () => void;
};

export function createSound(): Sound {
  let ac: AudioContext | null = null;
  let master: GainNode | null = null;
  let drone: GainNode | null = null;
  let noiseBuf: AudioBuffer | null = null;
  let on = false;
  /** Stumm, weil Listenansicht (`list`) bzw. Tab im Hintergrund (`hidden`). */
  const block = { list: false, hidden: false };
  const blocked = () => block.list || block.hidden;
  let lastHover = 0;
  const stops: (() => void)[] = [];

  const build = () => {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return false;
    ac = new Ctx();
    const comp = ac.createDynamicsCompressor();
    comp.threshold.value = -20;
    comp.ratio.value = 3;
    master = ac.createGain();
    master.gain.value = 0;
    master.connect(comp).connect(ac.destination);

    // 3 s weißes Rauschen, als Schleife für Wind und Warp
    noiseBuf = ac.createBuffer(1, ac.sampleRate * 3, ac.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;

    /* ---------- Grundton ---------- */
    drone = ac.createGain();
    drone.gain.value = 0.55;
    const lp = ac.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 380;
    lp.Q.value = 0.8;
    lp.connect(drone).connect(master);
    const lfo = (freq: number, depth: number, target: AudioParam) => {
      const o = ac!.createOscillator();
      const g = ac!.createGain();
      o.frequency.value = freq;
      g.gain.value = depth;
      o.connect(g).connect(target);
      o.start();
      stops.push(() => o.stop());
    };
    lfo(0.045, 160, lp.frequency);
    for (const [f, type, gain, drift] of [
      [55, "sine", 0.34, 0.07],
      [82.41, "sine", 0.2, 0.05],
      [110.2, "triangle", 0.1, 0.11],
      [164.8, "sine", 0.05, 0.03],
    ] as const) {
      const o = ac.createOscillator();
      o.type = type;
      o.frequency.value = f;
      const g = ac.createGain();
      g.gain.value = gain;
      lfo(drift, gain * 0.45, g.gain); // langsames Atmen je Stimme
      lfo(drift * 1.7, 0.6, o.detune); // leichtes Schweben
      o.connect(g).connect(lp);
      o.start();
      stops.push(() => o.stop());
    }
    // Sonnenwind: Rauschen durch einen langsam wandernden Bandpass
    const wind = ac.createBufferSource();
    wind.buffer = noiseBuf;
    wind.loop = true;
    const bp = ac.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 520;
    bp.Q.value = 0.6;
    const wg = ac.createGain();
    wg.gain.value = 0.035;
    lfo(0.027, 300, bp.frequency);
    lfo(0.061, 0.018, wg.gain);
    wind.connect(bp).connect(wg).connect(drone);
    wind.start();
    stops.push(() => wind.stop());
    return true;
  };

  const ready = () => !!ac && !!master && on && !blocked();

  const setMaster = (v: number, t = 1.2) => {
    if (!ac || !master) return;
    master.gain.cancelScheduledValues(ac.currentTime);
    master.gain.setTargetAtTime(v, ac.currentTime, t / 3);
  };

  /** Weicher Ton: Sinus + leise Oktave, schnelles aber rundes Einschwingen, langes Ausklingen. */
  const bell = (freq: number, gain: number, decay: number, delay = 0) => {
    if (!ready()) return;
    const t = ac!.currentTime + delay;
    const g = ac!.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
    const lp = ac!.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = freq * 3;
    g.connect(lp).connect(master!);
    for (const [mul, amp, type] of [
      [1, 1, "sine"],
      [2, 0.18, "sine"],
      [3.01, 0.05, "triangle"],
    ] as const) {
      const o = ac!.createOscillator();
      o.type = type;
      o.frequency.value = freq * mul;
      const og = ac!.createGain();
      og.gain.value = amp;
      o.connect(og).connect(g);
      o.start(t);
      o.stop(t + decay + 0.05);
    }
  };

  const whoosh = (dur: number, peak: number, lo: number, hi: number) => {
    if (!ready() || !noiseBuf) return;
    const t = ac!.currentTime;
    const src = ac!.createBufferSource();
    src.buffer = noiseBuf;
    src.loop = true;
    const bp = ac!.createBiquadFilter();
    bp.type = "bandpass";
    bp.Q.value = 1.1;
    bp.frequency.setValueAtTime(lo, t);
    bp.frequency.exponentialRampToValueAtTime(hi, t + dur * 0.5);
    bp.frequency.exponentialRampToValueAtTime(lo * 1.2, t + dur);
    const g = ac!.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + dur * 0.48);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.25);
    src.connect(bp).connect(g).connect(master!);
    src.start(t);
    src.stop(t + dur + 0.3);
    // tiefes Anschwellen darunter (Schub)
    const o = ac!.createOscillator();
    o.frequency.setValueAtTime(38, t);
    o.frequency.exponentialRampToValueAtTime(66, t + dur * 0.5);
    o.frequency.exponentialRampToValueAtTime(40, t + dur);
    const og = ac!.createGain();
    og.gain.setValueAtTime(0.0001, t);
    og.gain.exponentialRampToValueAtTime(peak * 0.9, t + dur * 0.5);
    og.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.2);
    o.connect(og).connect(master!);
    o.start(t);
    o.stop(t + dur + 0.25);
  };

  const apply = () => {
    if (!ac || !on) return;
    if (blocked()) setMaster(0, 0.3);
    else {
      void ac.resume();
      setMaster(0.9, 1.5);
    }
  };
  const onVis = () => {
    block.hidden = document.hidden;
    apply();
  };
  document.addEventListener("visibilitychange", onVis);

  const api: Sound = {
    get on() {
      return on;
    },
    toggle: () => {
      if (!ac && !build()) return false;
      on = !on;
      if (on) {
        void ac!.resume();
        setMaster(blocked() ? 0 : 0.9, 2.4);
      } else setMaster(0, 0.5);
      return on;
    },
    suspend: (s) => {
      block.list = s;
      apply();
    },
    travel: (kind, dur) => {
      if (kind === "trip") whoosh(dur, 0.2, 160, 1500);
      else if (kind === "cut") whoosh(0.45, 0.06, 300, 900);
      else whoosh(Math.max(dur, 0.6), 0.05, 220, 700);
    },
    hover: (id) => {
      if (!id) return;
      const t = performance.now();
      if (t - lastHover < 90) return;
      lastHover = t;
      bell(NOTE[id], 0.028, 1.1);
    },
    arrive: (id) => {
      bell(NOTE[id] / 2, 0.05, 2.8);
      bell((NOTE[id] / 2) * 1.5, 0.028, 2.4, 0.09);
    },
    pulse: () => {
      if (!ready()) return;
      bell(NOTE.kontakt * 2, 0.012, 0.35);
      bell(NOTE.kontakt, 0.018, 0.9, 0.02);
    },
    dispose: () => {
      document.removeEventListener("visibilitychange", onVis);
      for (const s of stops) {
        try {
          s();
        } catch {
          /* schon gestoppt */
        }
      }
      void ac?.close();
      ac = null;
    },
  };
  return api;
}
