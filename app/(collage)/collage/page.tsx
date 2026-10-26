import type { Metadata } from "next";
import { CollageHero } from "@/components/collage/CollageHero";
import { CollageSections } from "@/components/collage/CollageSections";
import { heroData, workData } from "@/components/collage/data";
import { WorkCollage } from "@/components/collage/WorkCollage";
import { getPublicContent } from "@/content";

const content = getPublicContent("en");

// Prototyp zum Vergleich mit dem Weltall: nicht in Suchmaschinen (und nicht in app/sitemap.ts).
export const metadata: Metadata = {
  title: content.meta.title,
  description: content.meta.description,
  robots: { index: false, follow: false },
};

/** Drei Kapitel: persönliche Collage → Arbeits-Collage → ruhige Ebene zum Überfliegen. */
export default function Page() {
  return (
    <main>
      <CollageHero data={heroData(content)} />
      <WorkCollage data={workData(content)} />
      <CollageSections content={content} />
    </main>
  );
}
