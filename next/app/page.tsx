import { getSettings, buildPageDescription } from "@/lib/settings-db";
import type { Metadata } from "next";

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
  return (
    <main
      className="min-h-screen py-16"
      style={{
        width: "100%",
        maxWidth: "var(--content-max-width)",
        marginLeft: "auto",
        marginRight: "auto",
        paddingLeft: "var(--content-padding-x)",
        paddingRight: "var(--content-padding-x)",
      }}
    >
      <h1 className="text-3xl font-bold mb-2">My Site</h1>
      <p className="text-zinc-500">Powered by Next.js</p>
    </main>
  );
}
