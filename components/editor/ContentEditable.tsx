"use client";

import { useRef, useCallback, useEffect, type CSSProperties } from "react";

/**
 * ContentEditable helper.
 * React can't combine dangerouslySetInnerHTML + contentEditable, so we set
 * innerHTML via a ref. We only update the DOM when the external html prop
 * actually changes (e.g. panel pushed a style change), leaving the user's
 * in-progress edits untouched during normal typing.
 */
export function CE<T extends keyof React.JSX.IntrinsicElements = "div">({
  as,
  html,
  onSave,
  onKeyDown,
  className,
  style,
  placeholder,
}: {
  as?: T;
  html: string;
  onSave: (val: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLElement>) => void;
  className?: string;
  style?: CSSProperties;
  placeholder?: string;
}) {
  const Tag = (as ?? "div") as React.ElementType;
  const elRef = useRef<HTMLElement>(null);

  const refCallback = useCallback(
    (el: HTMLElement | null) => {
      elRef.current = el;
      if (el) el.innerHTML = html;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => {
    const el = elRef.current;
    if (el && el.innerHTML !== html) el.innerHTML = html;
  }, [html]);

  return (
    <Tag
      ref={refCallback}
      contentEditable
      suppressContentEditableWarning
      data-placeholder={placeholder}
      className={className}
      style={style}
      onKeyDown={onKeyDown}
      onBlur={(e: React.FocusEvent<HTMLElement>) => onSave(e.currentTarget.innerHTML)}
    />
  );
}
