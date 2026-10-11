/**
 * Sternenstaub für die Eröffnung: Tausende Funken lösen sich aus der Sonne in
 * der Bildmitte, fliegen auf geschwungenen Bahnen nach unten und formen den
 * Namen. Danach glimmen sie noch etwas nach; beim Ausblenden der Titelkarte
 * zerstreuen sie sich wieder ins All.
 *
 * Reines Canvas 2D über der Szene, unabhängig von three.js. Die Zielpunkte
 * kommen aus den echten Buchstaben (`.op-c`): Jeder Buchstabe wird an seiner
 * gelayouteten Position auf eine unsichtbare Leinwand gezeichnet und abgetastet.
 * So passt der Staub exakt auf die Schrift, die danach scharf darunter einblendet.
 */

type P = {
  // Start, Kontrollpunkt (Bogen), Ziel
  sx: number;
  sy: number;
  cx: number;
  cy: number;
  tx: number;
  ty: number;
  delay: number;
  dur: number;
  size: number;
  gold: boolean;
  phase: number;
  // Zerstreuen
  vx: number;
  vy: number;
};

export type Dust = {
  /** Funken fliegen auseinander und verglühen (ms bis unsichtbar). */
  scatter: (ms: number) => void;
  stop: () => void;
};

/** Zeitpunkt (s), ab dem die scharfe Schrift unter dem Staub einblendet. */
export const SOLID_AT = 2.3;

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/**
 * Startet den Staub. Liefert `null`, wenn sich die Schrift nicht abtasten lässt —
 * dann bleibt die bisherige Buchstaben-Animation (CSS) stehen.
 */
export function startDust(canvas: HTMLCanvasElement, chars: HTMLElement[]): Dust | null {
  const ctx = canvas.getContext("2d");
  if (!ctx || !chars.length) return null;
  const W = innerWidth;
  const H = innerHeight;
  const dpr = Math.min(devicePixelRatio || 1, 2);
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);

  // 1) Buchstaben an ihrer Layout-Position auf eine Hilfsleinwand zeichnen
  const k = 2; // Abtast-Auflösung (px je CSS-px)
  const off = document.createElement("canvas");
  off.width = Math.ceil(W * k);
  off.height = Math.ceil(H * k);
  const o = off.getContext("2d", { willReadFrequently: true });
  if (!o) return null;
  const cs = getComputedStyle(chars[0]);
  const size = parseFloat(cs.fontSize);
  const upper = cs.textTransform === "uppercase";
  o.scale(k, k);
  o.font = `${cs.fontWeight} ${size}px ${cs.fontFamily}`;
  o.fillStyle = "#fff";
  o.textBaseline = "alphabetic";
  const m = o.measureText("A");
  const asc = m.fontBoundingBoxAscent || size * 0.8;
  const desc = m.fontBoundingBoxDescent || size * 0.2;
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const el of chars) {
    const r = el.getBoundingClientRect();
    if (!r.width) continue;
    const base = r.top + (r.height - (asc + desc)) / 2 + asc;
    // text-transform aus dem CSS nachbilden (die Karte setzt Großbuchstaben)
    const ch = el.textContent ?? "";
    o.fillText(upper ? ch.toLocaleUpperCase(document.documentElement.lang || undefined) : ch, r.left, base);
    minX = Math.min(minX, r.left);
    maxX = Math.max(maxX, r.right);
    minY = Math.min(minY, r.top);
    maxY = Math.max(maxY, r.bottom);
  }
  if (!Number.isFinite(minX)) return null;

  // 2) Abtasten: jeder deckende Rasterpunkt wird ein Ziel
  const x0 = Math.max(0, Math.floor(minX * k));
  const y0 = Math.max(0, Math.floor(minY * k));
  const w = Math.min(off.width - x0, Math.ceil((maxX - minX) * k));
  const h = Math.min(off.height - y0, Math.ceil((maxY - minY) * k));
  if (w <= 0 || h <= 0) return null;
  const data = o.getImageData(x0, y0, w, h).data;
  const step = (size > 34 ? 2 : 1.5) * k;
  const targets: [number, number][] = [];
  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < w; x += step) {
      if (data[(y * w + x) * 4 + 3] > 110) targets.push([(x0 + x) / k, (y0 + y) / k]);
    }
  }
  if (targets.length < 40) return null;
  // Obergrenze: auf schwachen Geräten (schmal = meist Handy) weniger Funken
  const cap = W < 768 ? 1400 : 3200;
  while (targets.length > cap) targets.splice((Math.random() * targets.length) | 0, 1);

  // 3) Funken: Start in der Sonne (Bildmitte), Bogen seitlich, Ziel im Namen
  const sunX = W / 2;
  const sunY = H / 2;
  const spanX = Math.max(1, maxX - minX);
  const ps: P[] = targets.map(([tx, ty]) => {
    const a = Math.random() * Math.PI * 2;
    const r = Math.random() * Math.min(W, H) * 0.035;
    const sx = sunX + Math.cos(a) * r;
    const sy = sunY + Math.sin(a) * r;
    // Kontrollpunkt: seitlich der Strecke, nach außen gekrümmt → spiralige Bahn
    const mx = (sx + tx) / 2;
    const my = (sy + ty) / 2;
    const dx = tx - sx;
    const dy = ty - sy;
    const bend = (0.25 + Math.random() * 0.45) * (tx < sunX ? -1 : 1);
    const u = (tx - minX) / spanX;
    return {
      sx,
      sy,
      cx: mx - dy * bend,
      cy: my + dx * bend * 0.6,
      tx,
      ty,
      // Staffelung von links nach rechts wie die Buchstaben, etwas Streuung
      delay: 0.35 + u * 0.75 + Math.random() * 0.35,
      dur: 1.25 + Math.random() * 0.55,
      size: 0.9 + Math.random() * Math.random() * 1.6,
      gold: Math.random() < 0.28,
      phase: Math.random() * Math.PI * 2,
      vx: 0,
      vy: 0,
    };
  });

  let raf = 0;
  const t0 = performance.now();
  let scat = 0; // Zeitpunkt des Zerstreuens (ms), 0 = noch nicht
  let scatDur = 700;

  const frame = (now: number) => {
    const t = (now - t0) / 1000;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = "lighter";
    // Sobald die scharfe Schrift steht, tritt der Staub zurück und glimmt nur noch
    const settle = Math.min(Math.max((t - SOLID_AT) / 1.2, 0), 1);
    const sk = scat ? Math.min((now - scat) / scatDur, 1) : 0;
    let alive = false;
    for (const p of ps) {
      const q = (t - p.delay) / p.dur;
      if (q <= 0) {
        alive = true;
        continue;
      }
      let x: number;
      let y: number;
      let a: number;
      if (q < 1) {
        const e = easeInOut(q);
        const ie = 1 - e;
        x = ie * ie * p.sx + 2 * ie * e * p.cx + e * e * p.tx;
        y = ie * ie * p.sy + 2 * ie * e * p.cy + e * e * p.ty;
        // aus der Sonne heraus aufglühen, unterwegs am hellsten
        a = Math.min(q * 4, 1) * (0.75 + 0.25 * Math.sin(q * Math.PI));
      } else {
        x = p.tx;
        y = p.ty;
        a = 0.85 + 0.15 * Math.sin(t * 2.4 + p.phase);
      }
      a *= 1 - settle * 0.45;
      if (sk > 0) {
        if (!p.vx && !p.vy) {
          // nach außen, weg von der Namensmitte, leicht nach oben (zur Sonne hin verweht)
          const dx = x - (minX + maxX) / 2;
          const dy = y - (minY + maxY) / 2;
          const d = Math.hypot(dx, dy) || 1;
          const sp = 60 + Math.random() * 160;
          p.vx = (dx / d) * sp + (Math.random() - 0.5) * 60;
          p.vy = (dy / d) * sp * 0.6 - 30 - Math.random() * 50;
        }
        const s = (sk * scatDur) / 1000;
        x += p.vx * s;
        y += p.vy * s;
        a *= 1 - sk;
      }
      if (a <= 0.01) continue;
      alive = true;
      ctx.fillStyle = p.gold ? `rgba(241,201,142,${a})` : `rgba(247,242,234,${a})`;
      const sz = p.size * (q < 1 ? 1.25 : 1);
      ctx.fillRect(x - sz / 2, y - sz / 2, sz, sz);
      // weicher Schein um jeden Funken (billiger als shadowBlur)
      ctx.globalAlpha = 0.16;
      ctx.fillRect(x - sz * 1.5, y - sz * 1.5, sz * 3, sz * 3);
      ctx.globalAlpha = 1;
    }
    if (sk >= 1 || !alive) return;
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);

  return {
    scatter: (ms) => {
      if (scat) return;
      scatDur = ms;
      scat = performance.now();
    },
    stop: () => cancelAnimationFrame(raf),
  };
}
