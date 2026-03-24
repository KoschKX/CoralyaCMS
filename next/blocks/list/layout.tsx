import "./styles.css";
import type { BlockLayoutProps } from "@/lib/block-types";

export default function ListLayout({ data }: BlockLayoutProps) {
  const items = (data.items as string[]) ?? [];
  const ordered = data.style === "ordered";
  const Tag = ordered ? "ol" : "ul";
  return (
    <Tag
      className={`block-list ${
        ordered ? "list-decimal pl-6 space-y-1" : "list-disc pl-6 space-y-1"
      }`}
    >
      {items.map((item, i) => (
        <li key={i} dangerouslySetInnerHTML={{ __html: item }} />
      ))}
    </Tag>
  );
}
