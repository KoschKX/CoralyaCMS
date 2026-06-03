import type { BlockDefinition } from "@/lib/block-types";
import NewsTickerLayout from "./layout";
import { NewsTickerPanelControls } from "./panel";

const newsTicker: BlockDefinition = {
  name: "news-ticker",
  label: "News Ticker",
  icon: "news-ticker",
  category: "interactive",
  defaultData: {
    // ── Items ──────────────────────────────────────────────────────
    items: [
      { id: "1", text: "Breaking: First headline goes here", url: "" },
      { id: "2", text: "Second headline with a link",        url: "" },
      { id: "3", text: "Third ticker item example",          url: "" },
    ],
    // ── Ticker ──────────────────────────────────────────────────────
    tickerType:          "marquee",  // "marquee" | "carousel"
    tickerTitle:         "Latest",
    titleShape:          "none",     // "none" | "rounded" | "triangle"
    separator:           "•",
    linkTarget:          "_self",
    // ── Marquee ─────────────────────────────────────────────────────
    tickerSpeed:         75,         // px/s — higher = faster
    // ── Carousel ────────────────────────────────────────────────────
    carouselDisplayTime: 5,          // seconds per item
    carouselArrows:      true,
    // ── Typography ──────────────────────────────────────────────────
    fontSize:            "",
    lineHeight:          "",
    letterSpacing:       "",
    textTransform:       "",
    // ── Colors ──────────────────────────────────────────────────────
    titleFontColor:      "",
    titleBgColor:        "",
    tickerFontColor:     "",
    tickerBgColor:       "",
    tickerHoverColor:    "",
    // ── Dimensions ──────────────────────────────────────────────────
    tickerHeight:        "",
    borderRadius:        "",
  },
  Layout:        NewsTickerLayout,
  PanelControls: NewsTickerPanelControls,
};

export default newsTicker;
