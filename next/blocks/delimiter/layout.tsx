import "./styles.css";
import type { BlockLayoutProps } from "@/lib/block-types";

export default function DelimiterLayout({ data: _, blockId }: BlockLayoutProps & { blockId: string }) {
  return <hr data-block-id={blockId} className={`block-delimiter my-8 border-zinc-200 block-${blockId}`} />;
}
