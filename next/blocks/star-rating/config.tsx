import type { BlockDefinition } from "@/lib/block-types";
import StarRatingLayout from "./layout";
import { StarRatingEditable } from "./editable";
import { StarRatingPanelControls } from "./panel";

/**
 * Star Rating block — mirrors Avada's fusion_star_rating element.
 *
 * Renders a row of SVG stars (full / partial / empty) with an optional
 * numeric text readout. Partial stars are rendered via an overflow-clip
 * technique so fractional values (e.g. 4.5/5) look correct.
 *
 * @example data
 * {
 *   rating: 4.5, maxRating: 5, hideEmpty: false,
 *   iconSize: "1.75rem", activeColor: "#f59e0b", inactiveColor: "#d4d4d8",
 *   gap: "0.25rem", showText: true, textSize: "", textColor: "",
 *   textGap: "0.5rem", alignment: "left", rounding: "auto",
 * }
 */
const starRating: BlockDefinition = {
  name: "star-rating",
  label: "Star Rating",
  icon: "star",
  category: "design",
  defaultData: {
    rating: 4.5,
    maxRating: 5,
    hideEmpty: false,
    iconSize: "1.75rem",
    activeColor: "#f59e0b",
    inactiveColor: "#d4d4d8",
    gap: "0.25rem",
    showText: true,
    textSize: "",
    textColor: "",
    textGap: "0.5rem",
    alignment: "left",
    rounding: "auto",
  },
  Layout: StarRatingLayout,
  Editable: StarRatingEditable,
  PanelControls: StarRatingPanelControls,
};

export default starRating;
