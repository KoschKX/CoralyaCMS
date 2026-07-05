import { getPublishedPageBySlug } from "@/lib/pages-db";
import { getSettings, buildPageDescription } from "@/lib/settings-db";
import { ResponsiveStyleInjector } from "@/components/ResponsiveStyleInjector";
import { PluginPageInjections } from "@/components/PluginPageInjections";
import { buildResponsiveCSS } from "@/lib/responsive-css";
import BlockRenderer from "@/components/BlockRenderer";
import HTMLRenderer from "@/components/HTMLRenderer";
import type { Metadata } from "next";

// ISR: cache the home page, revalidated after 60 s and on-demand when a page is saved.
export const revalidate = 60;

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
  const { disabledBlocks, layout, languages } = settings;
  const { tablet: tabletBp, mobile: mobileBp } = layout.breakpoints;
  const renderLocale = languages[0] ?? "en";

  // Serve the page with slug "" or "home" as the front page, if published
  const homePage = getPublishedPageBySlug("") ?? getPublishedPageBySlug("home");

  const mainStyle = {
    width: "100%",
    maxWidth: "var(--content-max-width)",
    marginLeft: "auto",
    marginRight: "auto",
    paddingLeft: "var(--content-padding-x)",
    paddingRight: "var(--content-padding-x)",
    boxSizing: "border-box" as const,
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
          ? <HTMLRenderer html={homePage.html} disabledBlocks={disabledBlocks} locale={renderLocale} />
          : <BlockRenderer blocks={homePage.blocks} disabledBlocks={disabledBlocks} locale={renderLocale} />
        }
        <PluginPageInjections slug={homePage.slug || ""} />
      </main>
    );
  }

  // Fallback when no home page is published in the CMS
  return (
    <main className="min-h-screen py-16" style={mainStyle}>
      <h1 className="text-3xl font-bold mb-2">{settings.title || "My Site"}</h1>
      <p className="text-zinc-500">{settings.tagline || "Powered by Next.js"}</p>
      <PluginPageInjections slug="" />
    </main>
  );
}

