import type { Metadata } from "next";
import { ClipHero } from "@/components/collage/ClipHero";
import { CollageSections } from "@/components/collage/CollageSections";
import { heroData, releaseData } from "@/components/collage/data";
import { TrackDump } from "@/components/collage/TrackDump";
import { Tracklist } from "@/components/collage/Tracklist";
import { getPublicContent } from "@/content";

const content = getPublicContent("en");

// Prototyp zum Vergleich mit dem Weltall: nicht in Suchmaschinen (und nicht in app/sitemap.ts).
export const metadata: Metadata = {
  title: content.meta.title,
  description: content.meta.description,
  robots: { index: false, follow: false },
};

/**
 * Deine Arbeit als Release (docs/konzept-collage.md, Runde 3):
 * Clip → Tracklist → je Projekt ein Track als Photo-Dump → ruhige Ebene zum Überfliegen.
 */
export default function Page() {
  const release = releaseData(content);
  return (
    <main>
      <ClipHero data={heroData(content)} />
      <Tracklist data={release} />
      {release.tracks.map((t) => (
        <TrackDump key={t.id} t={t} />
      ))}
      <CollageSections content={content} />
    </main>
  );
}
