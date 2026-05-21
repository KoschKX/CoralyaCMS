"use client";

import { useRef, useCallback, useEffect } from "react";

/**
 * A contentEditable <code> element that mirrors <pre><code> from the live site
 * exactly, so the block height in the editor matches the front end.
 * Uses textContent (not innerHTML) to preserve raw newlines without escaping.
 */
export function InlineCodeEditor({
  code,
  onSave,
}: {
  code: string;
  onSave: (val: string) => void;
}) {
  const ref = useRef<HTMLElement>(null);

  const refCallback = useCallback(
    (el: HTMLElement | null) => {
      ref.current = el;
      if (el) el.textContent = code;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => {
    const el = ref.current;
    if (el && el.textContent !== code) el.textContent = code;
  }, [code]);

  return (
    <code
      ref={refCallback}
      contentEditable
      suppressContentEditableWarning
      spellCheck={false}
      className="focus:outline-none"
      style={{ display: "block", whiteSpace: "pre" }}
      onBlur={(e) => onSave(e.currentTarget.textContent ?? "")}
    />
  );
}
