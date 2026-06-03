"use client";

import type { EditableProps } from "@/lib/block-types";
import StarRatingLayout from "./layout";

export function StarRatingEditable({ data, blockId }: EditableProps) {
  return <StarRatingLayout data={data} blockId={blockId} />;
}
