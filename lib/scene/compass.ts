/**
 * Kompass-Band (Idee aus Prototyp A): ein schmales Band oben, das beim Drehen
 * mitläuft. Striche alle 5°, Zahlen alle 30°, dazu ein Punkt je Himmelsobjekt
 * in dessen Akzentfarbe — so sieht man, in welcher Richtung noch etwas liegt.
 * Gezeichnet wird nur, wenn sich etwas geändert hat (2D-Canvas, kein WebGL).
 */
export type CompassMarker = { id: string; az: number; color: string };

export function createCompass(canvas: HTMLCanvasElement, readout: HTMLElement | null) {
  const c = canvas.getContext("2d");
  let key = "";
  let font = "";

  const draw = (opts: {
    az: number;
    alt: number;
    markers: CompassMarker[];
    active: string | null;
    where: string;
  }) => {
    if (!c) return;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    const { az, alt, markers, active } = opts;
    const k = `${w}|${h}|${az.toFixed(1)}|${alt.toFixed(1)}|${active}|${opts.where}|${markers.map((m) => m.az.toFixed(0)).join()}`;
    if (k === key) return;
    key = k;

    if (!font && readout) font = getComputedStyle(readout).fontFamily;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0, 0, w, h);
    const span = w < 260 ? 80 : 120;
    const ppd = w / span;
    const mod = (n: number) => ((n % 360) + 360) % 360;
    const fadeAt = (x: number) => {
      const e = Math.abs(x - w / 2) / (w / 2);
      return Math.max(0, 1 - e * e);
    };
    const fg = "236,238,244";
    // gleiche Mono-Schrift wie die Textzeile (next/font vergibt einen eigenen Familiennamen)
    c.font = `400 12px ${font || "ui-monospace, monospace"}`;
    c.textAlign = "center";
    c.textBaseline = "alphabetic";

    // Striche und Gradzahlen
    const start = Math.floor((az - span / 2) / 5) * 5;
    for (let d = start; d <= az + span / 2; d += 5) {
      const x = w / 2 + (d - az) * ppd;
      const f = fadeAt(x);
      if (f <= 0) continue;
      const major = mod(d) % 30 === 0;
      c.fillStyle = `rgba(${fg},${(f * (major ? 0.6 : 0.28)).toFixed(3)})`;
      c.fillRect(Math.round(x), major ? 11 : 13, 1, major ? 7 : 4);
      if (major) {
        c.fillStyle = `rgba(${fg},${(f * 0.5).toFixed(3)})`;
        c.fillText(String(mod(d)).padStart(3, "0"), x, h - 2);
      }
    }

    // Objekt-Marker (aktives Objekt größer, mit Ring)
    for (const m of markers) {
      let dd = mod(m.az - az);
      if (dd > 180) dd -= 360;
      if (Math.abs(dd) > span / 2) continue;
      const x = w / 2 + dd * ppd;
      const f = fadeAt(x);
      const on = m.id === active;
      c.globalAlpha = f * (on ? 1 : 0.8);
      c.fillStyle = m.color;
      c.beginPath();
      c.arc(x, 5, on ? 2.3 : 1.8, 0, Math.PI * 2);
      c.fill();
      if (on) {
        c.strokeStyle = m.color;
        c.globalAlpha = f * 0.5;
        c.beginPath();
        c.arc(x, 5, 4.2, 0, Math.PI * 2);
        c.stroke();
      }
    }
    c.globalAlpha = 1;

    // Mittelmarke
    c.fillStyle = `rgba(${fg},0.85)`;
    c.fillRect(Math.round(w / 2), 9, 1, 11);

    if (readout) {
      const pad = (n: number, l: number) => Math.abs(n).toFixed(1).padStart(l, "0");
      readout.textContent = `AZ ${pad(mod(az), 5)}° · ALT ${alt < 0 ? "−" : "+"}${pad(alt, 4)}° · ${opts.where}`;
    }
  };

  return { draw };
}
