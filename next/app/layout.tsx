import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { getSettings } from "@/lib/settings-db";

export const dynamic = "force-dynamic";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const settings = getSettings();


export async function generateMetadata(): Promise<Metadata> {
  const { getSettings } = await import("@/lib/settings-db");
  const settings = getSettings();
  return {
    title: settings.title || "Site Title",
    description: settings.description || settings.tagline || "Website description",
    openGraph: {
      title: settings.title || "Site Title",
      description: settings.description || settings.tagline || "Website description",
      url: settings.siteUrl || undefined,
      ...(settings.logoUrl ? { images: [settings.logoUrl] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: settings.title || "Site Title",
      description: settings.description || settings.tagline || "Website description",
      ...(settings.logoUrl ? { images: [settings.logoUrl] } : {}),
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
