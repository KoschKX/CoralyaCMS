import { listPages } from "@/lib/pages-db";
import { getSettings, buildPageDescription } from "@/lib/settings-db";
import { ResponsiveStyleInjector } from "@/components/ResponsiveStyleInjector";
import { buildResponsiveCSS } from "@/lib/responsive-css";
import BlockRenderer from "@/components/BlockRenderer";
import HTMLRenderer from "@/components/HTMLRenderer";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const settings = getSettings();
  let title = settings.title || "Site Title";
  if (settings.tagline) {
    title += ` — ${settings.tagline}`;
  }
  return {
    title,
    description: buildPageDescription(settings),
  };
}

export default function Home() {
  const settings = getSettings();
  const { disabledBlocks, layout } = settings;
  const { tablet: tabletBp, mobile: mobileBp } = layout.breakpoints;

  // Serve the page with slug "" or "home" as the front page, if published
  const homePage = listPages().find(
    (p) => (p.slug === "" || p.slug === "home") && p.status === "published",
  );

  const mainStyle = {
    width: "100%",
    maxWidth: "var(--content-max-width)",
    marginLeft: "auto",
    marginRight: "auto",
    paddingLeft: "var(--content-padding-x)",
    paddingRight: "var(--content-padding-x)",
    background: homePage?.pageBgColor || "#fff",
  };

  if (homePage) {
    const responsiveCSS = buildResponsiveCSS(homePage.blocks, tabletBp, mobileBp);
    return (
      <main className="py-16" style={mainStyle}>
        {responsiveCSS && (
          <style id="editor-responsive-css" dangerouslySetInnerHTML={{ __html: responsiveCSS }} />
        )}
        <ResponsiveStyleInjector blocks={homePage.blocks} tabletBp={tabletBp} mobileBp={mobileBp} />
        <h1 className="mb-10 text-4xl font-bold text-zinc-900">{homePage.title}</h1>
        {homePage.html
          ? <HTMLRenderer html={homePage.html} disabledBlocks={disabledBlocks} />
          : <BlockRenderer blocks={homePage.blocks} disabledBlocks={disabledBlocks} />
        }
      </main>
    );
  }

  // Fallback when no home page is published in the CMS
  return (
    <main className="min-h-screen py-16" style={mainStyle}>
      <h1 className="text-3xl font-bold mb-2">{settings.title || "My Site"}</h1>
      <p className="text-zinc-500">{settings.tagline || "Powered by Next.js"}</p>
    </main>
  );
}

