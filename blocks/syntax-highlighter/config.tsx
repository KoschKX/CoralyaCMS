import type { BlockDefinition } from "@/lib/block-types";
import SyntaxHighlighterLayout from "./layout";
import { SyntaxHighlighterEditable } from "./editable";
import { SyntaxHighlighterPanelControls } from "./panel";

/**
 * Syntax Highlighter block — mirrors Avada's fusion_syntax_highlighter element.
 *
 * Uses Prism.js (already a project dependency) for client-side highlighting.
 * Supports 4 themes (2 light, 2 dark), line numbers, line wrap, and a
 * copy-to-clipboard button.
 *
 * @example data
 * {
 *   code: 'console.log("Hello!");',
 *   language: "javascript",
 *   theme: "default",
 *   lineNumbers: true,
 *   lineWrap: false,
 *   copyButton: true,
 *   copyText: "Copy",
 *   fontSize: "",
 *   bgColor: "",
 *   borderStyle: "none",
 *   borderSize: "",
 *   borderColor: "",
 * }
 */
const syntaxHighlighter: BlockDefinition = {
  name: "syntax-highlighter",
  label: "Syntax Highlighter",
  icon: "syntax-highlighter",
  category: "design",
  defaultData: {
    code: 'function greet(name) {\n  console.log(`Hello, ${name}!`);\n}\n\ngreet("World");',
    language: "javascript",
    theme: "default",
    lineNumbers: true,
    lineWrap: false,
    copyButton: true,
    copyText: "Copy",
    fontSize: "",
    bgColor: "",
    borderStyle: "none",
    borderSize: "",
    borderColor: "",
  },
  Layout: SyntaxHighlighterLayout,
  Editable: SyntaxHighlighterEditable,
  PanelControls: SyntaxHighlighterPanelControls,
};

export default syntaxHighlighter;
