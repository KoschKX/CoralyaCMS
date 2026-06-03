import type { BlockDefinition } from "@/lib/block-types";
import CarouselLayout from "./layout";
import { CarouselEditable } from "./editable";
import { CarouselPanelControls } from "./panel";

/**
 * Image Carousel block — a responsive multi-slide image carousel with two
 * transition modes (slide / fade), optional multi-view, arrows, dot nav,
 * per-slide captions and links, autoplay and loop support.
 *
 * Mirrors Avada's fusion_images / fusion_image pattern.
 *
 * @example data
 * {
 *   items: [
 *     { id: "s1", src: "https://…/img.jpg", alt: "Alt text",
 *       caption: "", link: "", linkTarget: "_self" },
 *   ],
 *   effect: "slide",
 *   perView: 1,
 *   gap: 0,
 *   aspectRatio: "16/9",
 *   borderRadius: 0,
 *   autoplay: false,
 *   autoplayDelay: 3000,
 *   loop: true,
 *   showArrows: true,
 *   showDots: true,
 * }
 */
const carousel: BlockDefinition = {
  name: "carousel",
  label: "Image Carousel",
  icon: "carousel",
  category: "media",
  defaultData: {
    items: [
      { id: "s1", src: "", alt: "Slide 1", caption: "", link: "", linkTarget: "_self" },
      { id: "s2", src: "", alt: "Slide 2", caption: "", link: "", linkTarget: "_self" },
      { id: "s3", src: "", alt: "Slide 3", caption: "", link: "", linkTarget: "_self" },
    ],
    effect: "slide",
    perView: 1,
    gap: 0,
    aspectRatio: "16/9",
    borderRadius: 0,
    autoplay: false,
    autoplayDelay: 3000,
    loop: true,
    showArrows: true,
    showDots: true,
  },
  Layout: CarouselLayout,
  Editable: CarouselEditable,
  PanelControls: CarouselPanelControls,
};

export default carousel;
