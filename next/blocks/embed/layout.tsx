import "./styles.css";
import type { BlockLayoutProps } from "@/lib/block-types";

export default function EmbedLayout({ data, blockId }: BlockLayoutProps & { blockId: string }) {
  return (
    <div data-block-id={blockId} className={`block-embed aspect-video w-full overflow-hidden rounded-lg block-${blockId}`}>
      <iframe
        src={data.embed as string}
        className="h-full w-full"
        allowFullScreen
      />
    </div>
  );
}
