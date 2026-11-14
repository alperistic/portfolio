import { getPublicContent, type CelestialContent } from "@/content";

/**
 * Gemeinsame Daten für die Varianten-Entwürfe. Alles kommt aus `content/` —
 * nichts wird hier ergänzt oder umformuliert.
 */
export function variantData() {
  const c = getPublicContent("de");
  const o = c.objects;
  const projects = (["offerre", "insertcoin", "pipeline"] as const)
    .map((id) => o[id])
    .filter((p): p is CelestialContent => !!p)
    .map((p) => ({
      id: p.id,
      title: p.title,
      lead: p.lead,
      status: p.tags[0]?.text ?? "",
      color: p.tags[0]?.color ?? "#e8c9a0",
      link: p.links?.find((l) => l.href),
    }));
  const contact = o.kontakt?.links ?? [];
  return {
    brand: c.brand,
    lead: o.alper?.lead ?? "",
    late: o.late ? { lead: o.late.lead, link: o.late.links?.find((l) => l.href) } : undefined,
    projects,
    stations: (o.werdegang?.stations ?? []).slice().reverse(),
    skills: o.skills?.skillGroups ?? [],
    contact,
    contactLead: o.kontakt?.lead ?? "",
  };
}
