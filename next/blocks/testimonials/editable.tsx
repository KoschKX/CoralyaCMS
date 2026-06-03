"use client";

import type { EditableProps } from "@/lib/block-types";
import TestimonialsLayout from "./layout";

export function TestimonialsEditable({ data, blockId }: EditableProps) {
  return <TestimonialsLayout data={data} blockId={blockId} />;
}
