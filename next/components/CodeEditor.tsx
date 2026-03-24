"use client";
import React from "react";
import Editor from "react-simple-code-editor";
import Prism from "prismjs";
import "prismjs/themes/prism-tomorrow.css";
import "./prism-shortcode.css";
import "./prism-shortcode";

interface CodeEditorProps {
  value: string;
  onValueChange: (code: string) => void;
  minHeight?: string | number;
}

export default function CodeEditor({ value, onValueChange, minHeight = 300 }: CodeEditorProps) {
  return (
    <Editor
      value={value}
      onValueChange={onValueChange}
      highlight={code => Prism.highlight(code, Prism.languages.shortcode, "shortcode")}
      padding={16}
      style={{
        fontFamily: 'Menlo, Monaco, "Fira Mono", monospace',
        fontSize: 13,
        background: "#1e1e1e",
        color: "#d4d4d4",
        borderRadius: 8,
        minHeight,
        outline: "none",
        overflowX: "auto",
        whiteSpace: "pre"
      }}
      textareaId="code-editor"
      textareaClassName="focus:outline-none"
      preClassName="language-shortcode"
      spellCheck={false}
    />
  );
}
