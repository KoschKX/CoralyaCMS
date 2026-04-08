import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./col-editor-overrides.css";
import { getSettings, buildPageDescription } from "@/lib/settings-db";

// No force-dynamic — layout is served from cache and revalidated when settings change.

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = getSettings();
  const title = settings.title || "Site Title";
  const description = buildPageDescription(settings);
  const images = settings.logoUrl ? { images: [settings.logoUrl] } : {};
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: settings.siteUrl || undefined,
      ...images,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...images,
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = getSettings();
  const { typography, layout } = settings;
  const { fontSizes, headings } = typography;

  const cssVars = `
    :root {
      --font-size-sm: ${fontSizes.sm};
      --font-size-base: ${fontSizes.base};
      --font-size-lg: ${fontSizes.lg};
      --font-size-xl: ${fontSizes.xl};
      --h1-size: ${headings.h1.size}; --h1-weight: ${headings.h1.weight}; --h1-line-height: ${headings.h1.lineHeight};
      --h2-size: ${headings.h2.size}; --h2-weight: ${headings.h2.weight}; --h2-line-height: ${headings.h2.lineHeight};
      --h3-size: ${headings.h3.size}; --h3-weight: ${headings.h3.weight}; --h3-line-height: ${headings.h3.lineHeight};
      --h4-size: ${headings.h4.size}; --h4-weight: ${headings.h4.weight}; --h4-line-height: ${headings.h4.lineHeight};
      --content-max-width: ${layout.contentMaxWidth};
      --content-padding-x: ${layout.contentPaddingX};
      --block-spacing: ${layout.blockSpacing};
      --breakpoint-mobile: ${layout.breakpoints.mobile};
      --breakpoint-tablet: ${layout.breakpoints.tablet};
      --breakpoint-desktop: ${layout.breakpoints.desktop};
    }
    @media (max-width: ${layout.breakpoints.tablet}) {
      :root {
        --content-max-width: 100%;
      }
    }
    @media (max-width: ${layout.breakpoints.mobile}) {
      :root {
        --content-max-width: 100%;
        --content-padding-x: 1rem;
        --block-spacing: 1rem;
      }
    }
  `.trim();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/* Typography CSS variables from theme settings */}
        <style dangerouslySetInnerHTML={{ __html: cssVars }} />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
