import type { BlockDefinition } from "@/lib/block-types";
import CountdownLayout from "./layout";
import { CountdownPanelControls } from "./panel";

/**
 * Countdown block — a live client-side countdown timer.
 *
 * Mirrors the core features of Avada's fusion_countdown shortcode:
 * configurable target date, optional heading / subheading / CTA link,
 * optional weeks unit, label position, alignment, and per-block color
 * overrides for the digit boxes.
 *
 * @example data
 * {
 *   targetDate: "2027-01-01T00:00",
 *   heading: "Sale ends in",
 *   subheading: "Don't miss out",
 *   showWeeks: false,
 *   labelPosition: "below",
 *   alignment: "center",
 *   counterBgColor: "",
 *   counterTextColor: "",
 *   labelColor: "",
 *   borderRadius: "6px",
 *   linkText: "Shop now",
 *   linkUrl: "/sale",
 *   linkTarget: "_self",
 *   expiredText: "Event has ended",
 * }
 */
const countdown: BlockDefinition = {
  name: "countdown",
  label: "Countdown",
  icon: "countdown",
  category: "design",
  defaultData: {
    targetDate:       "2027-01-01T00:00",
    heading:          "",
    subheading:       "",
    showWeeks:        false,
    labelPosition:    "below",
    alignment:        "center",
    counterBgColor:   "",
    counterTextColor: "",
    labelColor:       "",
    borderRadius:     "6px",
    linkText:         "",
    linkUrl:          "",
    linkTarget:       "_self",
    expiredText:      "Event has ended",
  },
  Layout: CountdownLayout,
  PanelControls: CountdownPanelControls,
};

export default countdown;
