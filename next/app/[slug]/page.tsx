import { notFound } from "next/navigation";
import Link from "next/link";
import { listPages, getPublishedPageBySlug } from "@/lib/pages-db";
import { getSettings, buildPageDescription } from "@/lib/settings-db";
import { ResponsiveStyleInjector } from "@/components/ResponsiveStyleInjector";
import { buildResponsiveCSS } from "@/lib/responsive-css";
import { tokenise, buildBlocks } from "@/lib/shortcodes";
import BlockRenderer from "@/components/BlockRenderer";
import HTMLRenderer from "@/components/HTMLRenderer";
import { PluginPageInjections } from "@/components/PluginPageInjections";
import type { Metadata } from "next";

// Locale code → flag file name (without .svg)
const LOCALE_FLAG: Record<string, string> = {
  en: "gb", nl: "nl", fr: "fr", de: "de", es: "es", it: "it",
  pt: "pt", pl: "pl", ru: "ru", zh: "cn", ja: "jp", ko: "kr",
  ar: "sa", tr: "tr", sv: "se", da: "dk", fi: "fi", nb: "no",
};
function flagFor(locale: string) {
  return LOCALE_FLAG[locale] ?? locale.slice(0, 2).toLowerCase();
}

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  return listPages()
    .filter((p) => p.status === "published" && p.slug)
    .map((p) => ({ slug: p.slug }));
}

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const settings = getSettings();
  const { slug } = await params;
  const page = listPages().find((p) => p.slug === slug && p.status === "published");
  let title = settings.title || "Site Title";
  if (page?.title) {
    title += ` — ${page.title}`;
  }
  if (settings.tagline) {
    title += ` — ${settings.tagline}`;
  }
  return {
    title,
    description: buildPageDescription(settings),
  };
}

export default async function SlugPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const page = getPublishedPageBySlug(slug);

  if (!page) notFound();
  const { disabledBlocks, layout, languages } = getSettings();
  const { tablet: tabletBp, mobile: mobileBp } = layout.breakpoints;

  // Determine active locale
  const rawLang = typeof sp.lang === "string" ? sp.lang : undefined;
  const activeLang = rawLang && page.translations?.[rawLang] ? rawLang : null;

  // Pick blocks/html for the active locale
  const translation = activeLang ? page.translations![activeLang] : null;
  const displayBlocks = translation?.blocks ?? page.blocks;
  const displayHtml   = translation?.html   ?? page.html;

  // Build responsive CSS with the correct block set
  const blocksForCSS = displayHtml
    ? buildBlocks(tokenise(displayHtml), 0).blocks
    : displayBlocks;

  const responsiveCSS = buildResponsiveCSS(blocksForCSS, tabletBp, mobileBp);

  // Only show the language bar when there are multiple languages configured
  const showLangBar = languages.length > 1;

  return (
    <main
      className="py-16"
      style={{
        width: "100%",
        maxWidth: "var(--content-max-width)",
        marginLeft: "auto",
        marginRight: "auto",
        paddingLeft: "var(--content-padding-x)",
        paddingRight: "var(--content-padding-x)",
        boxSizing: "border-box",
        background: page.pageBgColor || "#fff",
      }}
    >
      {/* Language bar — floating right */}
      {showLangBar && (
        <nav
          aria-label="Language switcher"
          className="fixed right-4 top-1/2 z-50 flex -translate-y-1/2 flex-col items-center gap-2"
        >
          {languages.map((lang) => {
            const isCurrent = activeLang ? lang === activeLang : lang === languages[0];
            return (
              <Link
                key={lang}
                href={lang === languages[0] ? `/${slug}` : `/${slug}?lang=${lang}`}
                scroll={false}
                aria-current={isCurrent ? "true" : undefined}
                title={lang.toUpperCase()}
                className={`flex h-9 w-9 items-center justify-center overflow-hidden rounded-full shadow-md transition ${
                  isCurrent
                    ? "opacity-100"
                    : "opacity-50 hover:opacity-100"
                }`}
              >
                <img
                  src={`/flags/${flagFor(lang)}.svg`}
                  alt={lang.toUpperCase()}
                  className="h-full w-full object-cover"
                />
              </Link>
            );
          })}
        </nav>
      )}

      {responsiveCSS && <style id="editor-responsive-css" dangerouslySetInnerHTML={{ __html: responsiveCSS }} />}
      <ResponsiveStyleInjector blocks={blocksForCSS} tabletBp={tabletBp} mobileBp={mobileBp} />
      <h1 className="mb-10 text-4xl font-bold text-zinc-900">{page.title}</h1>
      {displayHtml
        ? <HTMLRenderer html={displayHtml} disabledBlocks={disabledBlocks} />
        : <BlockRenderer blocks={displayBlocks} disabledBlocks={disabledBlocks} />
      }
      <PluginPageInjections slug={slug} />
    </main>
  );
}

