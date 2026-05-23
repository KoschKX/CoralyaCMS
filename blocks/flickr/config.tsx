import type { BlockDefinition } from "@/lib/block-types";
import FlickrLayout from "./layout";
import { FlickrPanelControls } from "./panel";

const flickr: BlockDefinition = {
  name: "flickr",
  label: "Flickr",
  icon: "flickr",
  category: "interactive",
  defaultData: {
    // ── Source ──────────────────────────────────────────────────────
    flickrId:  "",            // User NSID, e.g. "32452368@N05"
    type:      "photostream", // "photostream" | "album"
    albumId:   "",

    // ── Layout ──────────────────────────────────────────────────────
    layout:          "grid",  // "grid" | "masonry"
    limit:           12,
    columns:         4,
    columnsMedium:   3,
    columnsSmall:    2,
    columnSpacing:   "6",     // px

    // ── Image ───────────────────────────────────────────────────────
    aspectRatio: "square",    // "square" | "original"

    // ── Interaction ─────────────────────────────────────────────────
    hoverType:  "zoom",       // "none" | "zoom" | "liftup"
    linkType:   "lightbox",   // "lightbox" | "page" | "none"
    linkTarget: "_blank",     // "_self" | "_blank"

    // ── Loading ─────────────────────────────────────────────────────
    loadMore:     "none",     // "none" | "button"
    loadMoreText: "Load More",

    // ── View on Flickr button ────────────────────────────────────────
    viewButton:     false,
    viewButtonText: "View on Flickr",

    // ── Border ──────────────────────────────────────────────────────
    borderSize:   "",
    borderColor:  "",
    borderRadius: "",

    // ── Button colours ──────────────────────────────────────────────
    loadMoreBtnColor:   "",
    loadMoreBtnBgColor: "",
    viewBtnColor:       "",
    viewBtnBgColor:     "",
  },
  Layout:        FlickrLayout,
  PanelControls: FlickrPanelControls,
};

export default flickr;
