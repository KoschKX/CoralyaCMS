import "./styles.css";
import type { BlockLayoutProps } from "@/lib/block-types";

export default function CodeLayout({ data }: BlockLayoutProps) {
  return (
    <pre className="block-code overflow-x-auto rounded-lg bg-zinc-900 px-5 py-4 text-sm text-zinc-100">
      <code>{(data.code as string) ?? ""}</code>
    </pre>
  );
}
