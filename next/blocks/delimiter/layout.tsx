import "./styles.css";
import type { BlockLayoutProps } from "@/lib/block-types";

export default function DelimiterLayout({ data: _ }: BlockLayoutProps) {
  return <hr className="block-delimiter my-8 border-zinc-200" />;
}
