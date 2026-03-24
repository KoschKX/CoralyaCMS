import "./styles.css";
import type { CSSProperties } from "react";
import type { BlockLayoutProps } from "@/lib/block-types";

const marginClass: Record<number, string> = {
  1: "block-heading block-heading--1 mt-8 mb-2",
  2: "block-heading block-heading--2 mt-7 mb-2",
  3: "block-heading block-heading--3 mt-6 mb-1",
  4: "block-heading block-heading--4 mt-5 mb-1",
};

export default function HeaderLayout({ data }: BlockLayoutProps) {
  const level = (data.level as number) ?? 2;
  const Tag = `h${level}` as "h1" | "h2" | "h3" | "h4";
  return (
    <Tag
      className={marginClass[level] ?? "mt-5 mb-1"}
      style={{
        fontSize: `var(--h${level}-size)`,
        fontWeight: `var(--h${level}-weight)`,
        lineHeight: `var(--h${level}-line-height)`,
        textAlign: ((data.align as string) || "left") as CSSProperties["textAlign"],
        color: (data.color as string) || undefined,
      }}
      dangerouslySetInnerHTML={{ __html: (data.text as string) ?? "" }}
    />
  );
}
