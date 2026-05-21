
import Prism from "prismjs";

// Define a minimal grammar for shortcodes, not based on markup


Prism.languages.shortcode = {
  // HTML tags (e.g. <div>, </div>, <br/>)
  "html-tag": {
    pattern: /<\/?[a-zA-Z0-9-]+(?:\s+[^<>]*)?>/g,
    inside: {
      "tag": {
        pattern: /^<\/?[a-zA-Z0-9-]+|\/>$|>$/g,
        alias: "keyword"
      },
      "attr-name": {
        pattern: /[a-zA-Z0-9:-]+(?==)/g,
        alias: "attr-name"
      },
      "attr-value": {
        pattern: /=\s*("[^"]*"|'[^']*'|[^\s>]+)/g,
        alias: "attr-value"
      }
    }
  },
  // [shortcode ...] and [/shortcode]
  "shortcode-tag": {
    pattern: /\[\/?[a-zA-Z0-9_-]+/g,
    inside: {
      "bracket": { pattern: /\[/, alias: "shortcode-bracket" },
      "slash": { pattern: /\//, alias: "shortcode-bracket" },
      "name": { pattern: /[a-zA-Z0-9_-]+/, alias: "keyword" }
    }
  },
  // variable names before =
  "shortcode-variable": {
    pattern: /\b[a-zA-Z0-9_-]+(?==)/g,
    alias: "variable"
  },
  // attribute values ("foo" or 'foo')
  "shortcode-attr-value": {
    pattern: /"[^"]*"|'[^']*'/g,
    alias: "attr-value"
  },
  // closing bracket
  "shortcode-bracket": {
    pattern: /\]/g,
    alias: "shortcode-bracket"
  },
  // equals sign
  "equals": {
    pattern: /=/g,
    alias: "operator"
  }
};

export default Prism;
