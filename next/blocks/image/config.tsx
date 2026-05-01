import type { BlockDefinition } from "@/lib/block-types";
import ImageLayout from "./layout";
import { ImageEditable } from "./editable";
import { ImagePanelControls } from "./panel";

/**
 * Image block — a simple responsive image with optional alt text and caption.
 *
 * @example data
 * { src: "https://example.com/photo.jpg", alt: "A photo", caption: "", align: "left" }
 */
const image: BlockDefinition = {
  name: "image",
  label: "Image",
  icon: "image",
  category: "media",
  supportsBreakpoints: true,
  defaultData: { src: "", alt: "", caption: "", align: "left" },
  Layout: ImageLayout,
  Editable: ImageEditable,
  PanelControls: ImagePanelControls,
};

export default image;
