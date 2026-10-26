import type { CollageProject } from "@/content/collage";
import type { Fact, Media, PublicContent } from "@/content";

/*
 * Schlanke Daten für die Client Components der Collage — alles aus content/en.ts
 * abgeleitet, damit nicht der ganze Content ins Browser-Bundle wandert.
 */

type Href = { text: string; href: string };

export type HeroData = {
  name: string;
  /** „Founder of Late“ */
  role: string;
  /** Der Stärke-Satz aus dem Content. */
  strength: string;
  /** Ort für die Player-Leiste (z. B. „Karlsruhe“). */
  place: string;
  /** Kleine Projekt-Links in der Leiste. */
  projects: { title: string; href: string }[];
  x?: Href;
};

/** Ein Projekt als Track. */
export type Track = {
  id: CollageProject;
  /** 01, 02, 03 */
  no: string;
  title: string;
  lead: string;
  status: string;
  statusColor?: string;
  role?: string;
  link?: Href;
  media?: Media;
};

export type ReleaseData = {
  tracks: Track[];
  /** Late als „Label“ der Tracklist. */
  label: { title: string; lead: string; link?: { label: string; href: string } };
};

export const PROJECT_ORDER: CollageProject[] = ["offerre", "insertcoin", "pipeline"];

/** Anker eines Tracks (Tracklist springt dorthin). */
export const trackAnchor = (id: CollageProject) => `track-${id}`;

const firstHref = (links?: { text: string; href?: string }[]): Href | undefined => {
  const l = links?.find((k) => k.href);
  return l?.href ? { text: l.text, href: l.href } : undefined;
};

export const factValue = (facts: Fact[] | undefined, label: string) => {
  const v = facts?.find((f) => f.label === label)?.value;
  return Array.isArray(v) ? v.join(" · ") : v;
};

/** Kontakt-Link zu X aus dem Content (eine Quelle für alle Stellen). */
export function xLink(c: PublicContent): Href | undefined {
  const l = c.objects.kontakt?.links?.find((k) => k.label === "X" && k.href);
  return l?.href ? { text: l.text, href: l.href } : undefined;
}

export function releaseData(c: PublicContent): ReleaseData {
  const late = c.objects.late;
  const lateLink = late?.links?.find((l) => l.href);
  return {
    tracks: PROJECT_ORDER.flatMap((id, i) => {
      const o = c.objects[id];
      if (!o) return [];
      return [
        {
          id,
          no: String(i + 1).padStart(2, "0"),
          title: o.title,
          lead: o.lead,
          status: o.tags[0]?.text ?? o.meta,
          statusColor: o.tags[0]?.color,
          role: factValue(o.facts, "My role"),
          link: firstHref(o.links),
          media: o.media,
        },
      ];
    }),
    label: {
      title: late?.title ?? "Late",
      lead: late?.lead ?? "",
      link: lateLink?.href ? { label: lateLink.label, href: lateLink.href } : undefined,
    },
  };
}

export function heroData(c: PublicContent): HeroData {
  const alper = c.objects.alper;
  return {
    name: c.brand.name,
    role: alper?.tags[0]?.text ?? "",
    strength: alper?.body?.[0] ?? "",
    place: alper?.tags[1]?.text ?? "",
    projects: releaseData(c).tracks.flatMap((t) => (t.link ? [{ title: t.title, href: t.link.href }] : [])),
    x: xLink(c),
  };
}
