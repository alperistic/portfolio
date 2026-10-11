import { getPublicContent, langLinks, type Locale } from "@/content";
import { ListView } from "./ListView";
import Universe from "./Universe";

/**
 * Startseite einer Sprache: der Himmel (Client, three.js) und dieselben Inhalte
 * als semantisches HTML (Listenansicht). Beides steht im statischen Export;
 * welches sichtbar ist, entscheidet `<html data-view>` per CSS.
 */
export function Home({ locale }: { locale: Locale }) {
  const content = getPublicContent(locale);
  const langs = langLinks();
  return (
    <>
      <Universe content={content} langs={langs} />
      <ListView content={content} langs={langs} />
    </>
  );
}
