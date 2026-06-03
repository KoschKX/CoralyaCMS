"use client";

import type { EditableProps } from "@/lib/block-types";
import CarouselLayout from "./layout";

export function CarouselEditable({ data, blockId }: EditableProps) {
  return <CarouselLayout data={data} blockId={blockId} />;
}
