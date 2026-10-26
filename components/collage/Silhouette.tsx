/**
 * Platzhalter für das freigestellte Foto: schlichte Figur (Kopf, Schultern, Oberkörper),
 * bewusst als Platzhalter erkennbar — keine Karikatur. Der Lichtsaum kommt aus dem CSS.
 */
export function Silhouette() {
  return (
    <svg className="c-silhouette" viewBox="0 0 400 900" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
      <defs>
        <linearGradient id="c-sil-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1d1613" />
          <stop offset="0.55" stopColor="#140f0d" />
          <stop offset="1" stopColor="#0c0908" />
        </linearGradient>
      </defs>
      <g fill="url(#c-sil-fill)">
        <ellipse cx="200" cy="124" rx="52" ry="66" />
        <path d="M178 186c0 18-4 30-16 38-36 10-76 18-100 38-18 16-24 48-26 88l-6 270c-2 80 4 180 10 280h320c6-100 12-200 10-280l-6-270c-2-40-8-72-26-88-24-20-64-28-100-38-12-8-16-20-16-38z" />
      </g>
      {/* Armlinien, kaum sichtbar: liest sich als Körper statt als Klotz */}
      <g fill="none" stroke="rgba(243,230,214,0.06)" strokeWidth="2">
        <path d="M94 330c-4 90-4 200 2 300" />
        <path d="M306 330c4 90 4 200-2 300" />
      </g>
    </svg>
  );
}
