import { notFound } from "next/navigation";
import { listPages } from "@/lib/pages-db";
import { getSettings, buildPageDescription } from "@/lib/settings-db";
import { ResponsiveStyleInjector } from "@/components/ResponsiveStyleInjector";
import { buildResponsiveCSS } from "@/lib/responsive-css";
import BlockRenderer from "@/components/BlockRenderer";
import HTMLRenderer from "@/components/HTMLRenderer";
import type { Metadata } from "next";

// ISR: cache the rendered page, revalidated every 60 s and on-demand when a page is saved.
export const revalidate = 60;
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
  const page = listPages().find((p) => p.slug === slug && p.status === "published");

  if (!page) notFound();
  const { disabledBlocks, layout } = getSettings();
  const { tablet: tabletBp, mobile: mobileBp } = layout.breakpoints;


  // SSR fallback: inject initial responsive CSS for SEO/first paint
  const responsiveCSS = buildResponsiveCSS(page.blocks, tabletBp, mobileBp);
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
        background: page.pageBgColor || "#fff",
      }}
    >
      {responsiveCSS && <style id="editor-responsive-css" dangerouslySetInnerHTML={{ __html: responsiveCSS }} />}
      <ResponsiveStyleInjector blocks={page.blocks} tabletBp={tabletBp} mobileBp={mobileBp} />
      <h1 className="mb-10 text-4xl font-bold text-zinc-900">{page.title}</h1>
      {page.html
        ? <HTMLRenderer html={page.html} disabledBlocks={disabledBlocks} />
        : <BlockRenderer blocks={page.blocks} disabledBlocks={disabledBlocks} />
      }
    </main>
  );
}

