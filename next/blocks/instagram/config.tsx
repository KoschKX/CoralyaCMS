import type { BlockDefinition } from "@/lib/block-types";
import InstagramLayout from "./layout";
import { InstagramPanelControls } from "./panel";

const instagram: BlockDefinition = {
  name: "instagram",
  label: "Instagram",
  icon: "instagram",
  category: "interactive",
  defaultData: {
    // ── Source ──────────────────────────────────────────────────────
    username: "",

    // ── Layout ──────────────────────────────────────────────────────
    layout:          "grid",      // "grid" | "masonry"
    limit:           9,
    columns:         3,
    columnsMedium:   2,
    columnsSmall:    2,
    columnSpacing:   "8",         // px

    // ── Image ───────────────────────────────────────────────────────
    aspectRatio: "square",        // "square" | "original"

    // ── Interaction ─────────────────────────────────────────────────
    hoverType:   "zoom",          // "none" | "zoom" | "liftup"
    linkType:    "lightbox",      // "lightbox" | "post" | "none"
    linkTarget:  "_blank",        // "_self" | "_blank"

    // ── Loading ─────────────────────────────────────────────────────
    loadMore:           "none",   // "none" | "button" | "infinite"
    loadMoreText:       "Load More",
    followButton:       false,
    followButtonText:   "Follow Us On Instagram",

    // ── Border ──────────────────────────────────────────────────────
    borderSize:    "",
    borderColor:   "",
    borderRadius:  "",

    // ── Button colours ──────────────────────────────────────────────
    loadMoreBtnColor:      "",
    loadMoreBtnBgColor:    "",
    followBtnColor:        "",
    followBtnBgColor:      "",
  },
  Layout:        InstagramLayout,
  PanelControls: InstagramPanelControls,
};

export default instagram;
