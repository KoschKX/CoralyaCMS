"use client";
import React from "react";
import "./styles.css";
import type { BlockLayoutProps } from "@/lib/block-types";


export default function ListLayout({ data, blockId }: BlockLayoutProps & { blockId: string }) {
  const items = (data.items as string[]) ?? [];
  const ordered = data.style === "ordered";
  const Tag = ordered ? "ol" : "ul";
  return (
    <Tag
      data-block-id={blockId}
      className={`block-list ${ordered ? "list-decimal pl-6 space-y-1" : "list-disc pl-6 space-y-1"} block-${blockId}`}
      style={{ textAlign: ((data.align as string) || "left") as React.CSSProperties["textAlign"] }}
    >
      {items.map((item, i) => (
        <li key={i} dangerouslySetInnerHTML={{ __html: item }} />
      ))}
    </Tag>
  );
}
