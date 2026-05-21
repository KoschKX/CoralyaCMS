"use client";
import React from "react";
import "./styles.css";
import type { CSSProperties } from "react";
import type { BlockLayoutProps } from "@/lib/block-types";


export const HEADING_MARGIN_CLASSES: Record<number, string> = {
  1: "block-heading block-heading--1 mt-8 mb-2",
  2: "block-heading block-heading--2 mt-7 mb-2",
  3: "block-heading block-heading--3 mt-6 mb-1",
  4: "block-heading block-heading--4 mt-5 mb-1",
};

export default function HeaderLayout({ data, blockId }: BlockLayoutProps & { blockId: string }) {
  let level = Number(data.level) || 2;
  if (level < 1 || level > 6) level = 2;
  const Tag = `h${level}`;
  return (
    <div data-block-id={blockId}>
      {React.createElement(Tag, {
        className: `${HEADING_MARGIN_CLASSES[level] ?? "mt-5 mb-1"} block-${blockId}`,
        style: {
          fontSize: `var(--h${level}-size)`,
          fontWeight: `var(--h${level}-weight)` as CSSProperties["fontWeight"],
          lineHeight: `var(--h${level}-line-height)`,
          textAlign: ((data.align as string) || "left") as CSSProperties["textAlign"],
          color: (data.color as string) || undefined,
        },
        dangerouslySetInnerHTML: { __html: (data.text as string) ?? "" },
      })}
    </div>
  );
}
