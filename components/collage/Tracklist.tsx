import { CLIP_SCENES, COLLAGE_UI, PERSON } from "@/content/collage";
import { Arrow } from "./Arrow";
import { trackAnchor, type ReleaseData } from "./data";

/** Hintergrund der Rückseite: eine Clip-Szene, stark abgedunkelt und unscharf. */
const BACK = CLIP_SCENES.find((s) => s.id === "altbau") ?? CLIP_SCENES[0];
/** Das „Cover“ daneben: erste Szene mit der Figur, im selben Camcorder-Look wie der Clip. */
const COVER = CLIP_SCENES[0];

/**
 * Die Rückseite des Albums: drei Projekte als Tracks, Late als Label. Jeder Eintrag
 * springt zu seinem Track. Server Component — reines HTML.
 */
export function Tracklist({ data }: { data: ReleaseData }) {
  return (
    <section id="tracklist" className="tl" aria-labelledby="tl-h">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="tl-back" src={BACK.src} alt="" loading="lazy" decoding="async" />
      <div className="tl-inner">
        <figure className="tl-cover" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="tl-cover-scene" src={COVER.src} alt="" loading="lazy" decoding="async" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="tl-cover-person" src={PERSON.src} alt="" loading="lazy" decoding="async" />
        </figure>
        <div className="tl-side">
        <h2 id="tl-h" className="tl-h">
          {COLLAGE_UI.tracklist}
        </h2>
        <ol className="tl-list">
          {data.tracks.map((t) => (
            <li key={t.id}>
              <a href={`#${trackAnchor(t.id)}`}>
                <span className="tl-no">{t.no}</span>
                <span className="tl-title">{t.title}</span>
                <span className="tl-dots" aria-hidden="true" />
                <span className="tl-status">
                  <i style={{ background: t.statusColor }} aria-hidden="true" />
                  {t.status}
                </span>
              </a>
            </li>
          ))}
        </ol>
        <p className="tl-label">
          <span className="tl-k">{COLLAGE_UI.label}</span>
          <strong>{data.label.title}</strong>
          <span className="tl-label-lead">{data.label.lead}</span>
          {data.label.link && (
            <a href={data.label.link.href} target="_blank" rel="noopener">
              {data.label.link.label}
              <Arrow />
            </a>
          )}
        </p>
        </div>
      </div>
    </section>
  );
}
