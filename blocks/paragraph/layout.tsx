"use client";
import React, { useEffect, useRef, useState } from "react";
import "./styles.css";
import type { CSSProperties } from "react";
import { BlockLayoutProps } from "@/lib/block-types";

export default function ParagraphLayout({ data, blockId }: BlockLayoutProps & { blockId: string }) {
  const uniqueClass = `block-${blockId}`;
  const fontSize = (data.fontSize as string) || "base";
  return (
    <div data-block-id={blockId}>
      <p
        className={`block-paragraph leading-relaxed ${uniqueClass}`}
        style={{
          fontSize: `var(--font-size-${fontSize})`,
          textAlign: ((data.align as string) || "left") as CSSProperties["textAlign"],
          color: (data.color as string) || undefined,
        }}
        dangerouslySetInnerHTML={{ __html: (data.text as string) ?? "" }}
      />
    </div>
  );
}
