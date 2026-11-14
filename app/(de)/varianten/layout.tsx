import type { Metadata } from "next";

/** Entwürfe zum Vergleichen: nicht indexieren, nicht in Navigation oder Sitemap. */
export const metadata: Metadata = {
  title: "Varianten (Entwurf)",
  robots: { index: false, follow: false },
};

export default function VariantenLayout({ children }: { children: React.ReactNode }) {
  return children;
}
