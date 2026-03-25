import type { BlockLayoutProps } from "@/lib/block-types";
import { closeUnclosedTags } from "@/lib/close-unclosed-tags";

export default function HtmlLayout({ data, blockId }: BlockLayoutProps & { blockId: string }) {
  // closeUnclosedTags appends missing </tag> closers so the serialised HTML
  // has balanced block-level elements. Without this, a user's unclosed <div>
  // would consume subsequent React-rendered sibling elements in the browser's
  // HTML parser, causing a structural hydration mismatch.
  const content = closeUnclosedTags((data.content as string) ?? "");
  return (
    <div data-block-id={blockId} className={`block-html block-${blockId}`}>
      <div suppressHydrationWarning dangerouslySetInnerHTML={{ __html: content }} />
    </div>
  );
}
