/**
 * closeUnclosedTags
 *
 * Appends missing closing tags for any block-level elements that are opened
 * but never closed in the given HTML string.
 *
 * Why: if user HTML like `<div>hello` is embedded with dangerouslySetInnerHTML,
 * the unclosed <div> will consume subsequent React-rendered sibling elements in
 * the browser's HTML parser, causing a structural mismatch / hydration error.
 *
 * This runs server-side so the serialised HTML string has balanced tags BEFORE
 * the browser ever parses it. The result matches what the browser would produce,
 * so React's hydration tree matches the live DOM.
 */

/** Block-level elements that must be explicitly closed. */
const BLOCK = new Set([
  "address", "article", "aside", "blockquote", "caption",
  "details", "dialog", "dd", "div", "dl", "dt",
  "fieldset", "figcaption", "figure", "footer", "form",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "header", "hgroup", "li", "main", "nav",
  "ol", "p", "pre", "section", "summary",
  "table", "tbody", "td", "tfoot", "th", "thead", "tr", "ul",
]);

/** Elements that can never have children (self-closing in HTML5). */
const VOID = new Set([
  "area", "base", "br", "col", "embed", "hr", "img", "input",
  "link", "meta", "param", "source", "track", "wbr",
]);

export function closeUnclosedTags(html: string): string {
  const stack: string[] = [];
  // Matches opening and closing tags. Capture group 1 = "/" if closing,
  // group 2 = tag name, group 3 = "/" if self-closing (`<br />`).
  const re = /<(\/?)\s*([a-zA-Z][a-zA-Z0-9-]*)(?:[^>]*?)(\/?)>/g;
  let m: RegExpExecArray | null;

  while ((m = re.exec(html)) !== null) {
    const isClose = m[1] === "/";
    const tag = m[2].toLowerCase();
    const isSelfClose = m[3] === "/";

    if (VOID.has(tag) || isSelfClose || !BLOCK.has(tag)) continue;

    if (isClose) {
      // Find the matching open tag from the top of the stack and pop up to it.
      // Elements opened after the matched tag are implicitly closed by the browser.
      const idx = stack.lastIndexOf(tag);
      if (idx !== -1) {
        stack.splice(idx); // removes idx and everything above it
      }
    } else {
      stack.push(tag);
    }
  }

  if (stack.length === 0) return html;

  // Append closing tags from innermost to outermost.
  return html + [...stack].reverse().map((t) => `</${t}>`).join("");
}
