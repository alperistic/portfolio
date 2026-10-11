import type { Viewport } from "next";
import { Document, viewport as base } from "../document";

export const viewport: Viewport = base;

export default function Layout({ children }: { children: React.ReactNode }) {
  return <Document lang="de">{children}</Document>;
}
