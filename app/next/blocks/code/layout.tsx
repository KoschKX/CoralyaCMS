import "./styles.css";
import { BlockLayoutProps } from "@/lib/block-types";

export default function CodeLayout({ data, blockId }: BlockLayoutProps & { blockId: string }) {
  return (
    <pre
      data-block-id={blockId}
      className={`block-code overflow-x-auto rounded-lg bg-zinc-900 px-5 py-4 text-sm text-zinc-100 block-${blockId}`}
    >
      <code>{(data.code as string) ?? ""}</code>
    </pre>
  );
}
