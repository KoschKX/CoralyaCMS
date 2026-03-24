import "./styles.css";
import type { BlockLayoutProps } from "@/lib/block-types";

export default function EmbedLayout({ data }: BlockLayoutProps) {
  return (
    <div className="block-embed aspect-video w-full overflow-hidden rounded-lg">
      <iframe
        src={data.embed as string}
        className="h-full w-full"
        allowFullScreen
      />
    </div>
  );
}
