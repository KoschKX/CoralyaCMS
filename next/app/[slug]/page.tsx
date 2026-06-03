import { notFound } from "next/navigation";
import { listPages, getPublishedPageBySlug } from "@/lib/pages-db";
import { getSettings, buildPageDescription } from "@/lib/settings-db";
import { ResponsiveStyleInjector } from "@/components/ResponsiveStyleInjector";
import { buildResponsiveCSS } from "@/lib/responsive-css";
import { tokenise, buildBlocks } from "@/lib/shortcodes";
import BlockRenderer from "@/components/BlockRenderer";
import HTMLRenderer from "@/components/HTMLRenderer";
import { PluginPageInjections } from "@/components/PluginPageInjections";
import type { Metadata } from "next";

// Pre-render all published pages at build time; revalidate every 60 s and on-demand.
export const revalidate = 60;

export async function generateStaticParams() {
  return listPages()
    .filter((p) => p.status === "published" && p.slug)
    .map((p) => ({ slug: p.slug }));
}

interface Props {
  params: Promise<{ slug: string }>;
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

export default async function SlugPage({ params }: Props) {
  const { slug } = await params;
  const page = getPublishedPageBySlug(slug);

  if (!page) notFound();
  const { disabledBlocks, layout } = getSettings();
  const { tablet: tabletBp, mobile: mobileBp } = layout.breakpoints;


  // When page.html (shortcode) is used, HTMLRenderer re-parses it and assigns its own
  // sequential IDs (sc-0, sc-1, …). We must use those same IDs when generating the
  // responsive CSS, otherwise the [data-block-id="…"] selectors won't match the DOM.
  const blocksForCSS = page.html
    ? buildBlocks(tokenise(page.html), 0).blocks
    : page.blocks;

  // SSR fallback: inject initial responsive CSS for SEO/first paint
  const responsiveCSS = buildResponsiveCSS(blocksForCSS, tabletBp, mobileBp);
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
      {responsiveCSS && <style id="editor-responsive-css" dangerouslySetInnerHTML={{ __html: responsiveCSS }} />}
      <ResponsiveStyleInjector blocks={blocksForCSS} tabletBp={tabletBp} mobileBp={mobileBp} />
      <h1 className="mb-10 text-4xl font-bold text-zinc-900">{page.title}</h1>
      {page.html
        ? <HTMLRenderer html={page.html} disabledBlocks={disabledBlocks} />
        : <BlockRenderer blocks={page.blocks} disabledBlocks={disabledBlocks} />
      }
      <PluginPageInjections slug={slug} />
    </main>
  );
}

