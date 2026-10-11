import type { Metadata } from "next";
import { Home } from "@/components/Home";
import { metadataFor } from "@/lib/site";

export const metadata: Metadata = metadataFor("de");

export default function Page() {
  return <Home locale="de" />;
}
