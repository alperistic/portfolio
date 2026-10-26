import type { CollageProject } from "@/content/collage";
import type { Media, PublicContent } from "@/content";

/*
 * Schlanke Daten für die Client Components der Collage — alles aus content/en.ts
 * abgeleitet, damit nicht der ganze Content ins Browser-Bundle wandert.
 */

type Href = { text: string; href: string };

export type HeroData = {
  name: string;
  subline: string;
  role: string;
  strength: string;
  /** Die kleine Projektzeile unter der Rolle. */
  projects: { title: string; href: string }[];
  x?: Href;
};

/** Ein Stück in der Arbeits-Collage. */
export type WorkPiece = {
  id: CollageProject;
  title: string;
  lead: string;
  status: string;
  statusColor?: string;
  link?: Href;
  media?: Media;
};

export type WorkData = {
  pieces: WorkPiece[];
  late: { title: string; tag: string; lead: string; link?: { label: string; href: string } };
};

export const PROJECT_ORDER: CollageProject[] = ["offerre", "insertcoin", "pipeline"];

const firstHref = (links?: { text: string; href?: string }[]): Href | undefined => {
  const l = links?.find((k) => k.href);
  return l?.href ? { text: l.text, href: l.href } : undefined;
};

/** Kontakt-Link zu X aus dem Content (eine Quelle für alle Stellen). */
export function xLink(c: PublicContent): Href | undefined {
  const l = c.objects.kontakt?.links?.find((k) => k.label === "X" && k.href);
  return l?.href ? { text: l.text, href: l.href } : undefined;
}

export function workData(c: PublicContent): WorkData {
  const late = c.objects.late;
  const lateLink = late?.links?.find((l) => l.href);
  return {
    pieces: PROJECT_ORDER.flatMap((id) => {
      const o = c.objects[id];
      if (!o) return [];
      return [
        {
          id,
          title: o.title,
          lead: o.lead,
          status: o.tags[0]?.text ?? o.meta,
          statusColor: o.tags[0]?.color,
          link: firstHref(o.links),
          media: o.media,
        },
      ];
    }),
    late: {
      title: late?.title ?? "Late",
      tag: late?.tags[0]?.text ?? "",
      lead: late?.lead ?? "",
      link: lateLink?.href ? { label: lateLink.label, href: lateLink.href } : undefined,
    },
  };
}

export function heroData(c: PublicContent): HeroData {
  const alper = c.objects.alper;
  return {
    name: c.brand.name,
    subline: c.brand.subline,
    role: alper?.tags[0]?.text ?? "",
    strength: alper?.body?.[0] ?? "",
    projects: workData(c).pieces.flatMap((p) => (p.link ? [{ title: p.title, href: p.link.href }] : [])),
    x: xLink(c),
  };
}
