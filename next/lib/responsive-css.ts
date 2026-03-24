import type { EditorBlock } from "@/lib/pages-db";

function rulesFor(overrides: Record<string, unknown>): string {
  const color    = (overrides.color    as string | undefined) || "";
  const align    = (overrides.align    as string | undefined) || "";
  const fontSize = (overrides.fontSize as string | undefined) || "";
  return [
    color    && `color: ${color} !important;`,
    align    && `text-align: ${align} !important;`,
    fontSize && `font-size: var(--font-size-${fontSize}) !important;`,
  ].filter(Boolean).join(" ");
}

/** Recursively build @media override CSS for blocks that have data.responsive set.
 *  The generated rules target [data-block-id="..."] which BlockRenderer places on every block wrapper. */
export function buildResponsiveCSS(
  blocks: EditorBlock[],
  tabletBp: string,
  mobileBp: string,
): string {
  let css = "";
  for (const block of blocks) {
    const data = block.data as Record<string, unknown>;
    const responsive = data?.responsive as Record<string, Record<string, unknown>> | undefined;

    if (responsive) {
      const sel = `[data-block-id="${block.id}"], [data-block-id="${block.id}"] *`;
      const tabletRules = responsive.tablet ? rulesFor(responsive.tablet) : "";
      const mobileRules = responsive.mobile ? rulesFor(responsive.mobile) : "";
      if (tabletRules) css += `@media (max-width: ${tabletBp}) { ${sel} { ${tabletRules} } }\n`;
      if (mobileRules) css += `@media (max-width: ${mobileBp}) { ${sel} { ${mobileRules} } }\n`;
    }

    // Recurse into columns
    if (block.type === "columns" && Array.isArray(data.cols)) {
      for (const col of data.cols as Array<{ blocks?: EditorBlock[] }>) {
        css += buildResponsiveCSS(col.blocks ?? [], tabletBp, mobileBp);
      }
    }
  }
  return css;
}
