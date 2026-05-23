import type { BlockDefinition } from "@/lib/block-types";
import GalleryLayout from "./layout";
import { GalleryPanelControls } from "./panel";

const gallery: BlockDefinition = {
  name: "gallery",
  label: "Gallery",
  icon: "gallery",
  category: "media",
  defaultData: {
    // ── Images ──────────────────────────────────────────────────────
    images: [
      { id: "g1", src: "", alt: "Gallery image 1", title: "", caption: "", link: "", linkTarget: "_self" },
      { id: "g2", src: "", alt: "Gallery image 2", title: "", caption: "", link: "", linkTarget: "_self" },
      { id: "g3", src: "", alt: "Gallery image 3", title: "", caption: "", link: "", linkTarget: "_self" },
      { id: "g4", src: "", alt: "Gallery image 4", title: "", caption: "", link: "", linkTarget: "_self" },
      { id: "g5", src: "", alt: "Gallery image 5", title: "", caption: "", link: "", linkTarget: "_self" },
      { id: "g6", src: "", alt: "Gallery image 6", title: "", caption: "", link: "", linkTarget: "_self" },
    ],

    // ── Layout ──────────────────────────────────────────────────────
    layout:        "grid",   // "grid" | "masonry"
    columns:       3,
    columnsMedium: 2,
    columnsSmall:  1,
    columnSpacing: "8",      // px

    // ── Display ─────────────────────────────────────────────────────
    aspectRatio: "1/1",      // "auto" | "1/1" | "4/3" | "16/9" | "3/2" | "2/3"
    pictureSize: "auto",     // "auto" | "fixed" (crop to uniform size)

    // ── Interaction ─────────────────────────────────────────────────
    hoverType:  "zoom",      // "none" | "zoom" | "liftup"
    lightbox:   true,

    // ── Captions ────────────────────────────────────────────────────
    captionStyle:        "hover",           // "off" | "hover" | "always"
    captionOverlayColor: "rgba(0,0,0,0.6)",
    captionTitleColor:   "#ffffff",
    captionTextColor:    "#ffffff",

    // ── Load more ───────────────────────────────────────────────────
    loadMore:        "none", // "none" | "button"
    loadMoreText:    "Load More",
    loadMoreInitial: 6,

    // ── Border ──────────────────────────────────────────────────────
    borderSize:   "",
    borderColor:  "",
    borderRadius: "",

    // ── Button colours ──────────────────────────────────────────────
    loadMoreBtnColor:   "",
    loadMoreBtnBgColor: "",
  },
  Layout:        GalleryLayout,
  PanelControls: GalleryPanelControls,
};

export default gallery;
