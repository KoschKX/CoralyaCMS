import "./styles.css";
import type { CSSProperties } from "react";
import type { BlockLayoutProps } from "@/lib/block-types";

export default function QuoteLayout({ data }: BlockLayoutProps) {
  return (
    <blockquote
      className="block-quote border-l-4 border-zinc-300 pl-5 italic text-zinc-600"
      style={{
        textAlign: ((data.align as string) || "left") as CSSProperties["textAlign"],
      }}
    >
      <p dangerouslySetInnerHTML={{ __html: (data.text as string) ?? "" }} />
      {!!data.caption && (
        <cite className="mt-1 block text-sm not-italic text-zinc-400">
          — {data.caption as string}
        </cite>
      )}
    </blockquote>
  );
}
