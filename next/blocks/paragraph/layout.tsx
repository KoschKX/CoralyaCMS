import "./styles.css";
import type { CSSProperties } from "react";
import type { BlockLayoutProps } from "@/lib/block-types";

export default function ParagraphLayout({ data }: BlockLayoutProps) {
  const fontSize = (data.fontSize as string) || "base";
  return (
    <p
      className="block-paragraph leading-relaxed"
      style={{
        fontSize: `var(--font-size-${fontSize})`,
        textAlign: ((data.align as string) || "left") as CSSProperties["textAlign"],
        color: (data.color as string) || undefined,
      }}
      dangerouslySetInnerHTML={{ __html: (data.text as string) ?? "" }}
    />
  );
}
