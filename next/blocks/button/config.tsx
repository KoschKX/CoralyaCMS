import type { BlockDefinition } from "@/lib/block-types";
import ButtonLayout from "./layout";
import { ButtonEditable } from "./editable";
import { ButtonPanelControls } from "./panel";

/**
 * Button block — a styled call-to-action link.
 *
 * Supports five visual types (flat, outline, transparent, 3d, link),
 * four sizes, full-width stretch, alignment, custom colors with hover
 * overrides, border radius, and an optional icon class.
 *
 * @example data
 * {
 *   text: "Get started",
 *   url: "https://example.com",
 *   target: "_self",
 *   type: "flat",
 *   size: "medium",
 *   align: "left",
 *   stretch: false,
 *   bgColor: "",
 *   textColor: "",
 *   borderColor: "",
 *   hoverBgColor: "",
 *   hoverTextColor: "",
 *   hoverBorderColor: "",
 *   borderRadius: "",
 *   icon: "",
 *   iconPosition: "left",
 * }
 */
const button: BlockDefinition = {
  name: "button",
  label: "Button",
  icon: "button",
  category: "design",
  defaultData: {
    text: "Click here",
    url: "",
    target: "_self",
    type: "flat",
    size: "medium",
    align: "left",
    stretch: false,
    bgColor: "",
    textColor: "",
    borderColor: "",
    hoverBgColor: "",
    hoverTextColor: "",
    hoverBorderColor: "",
    borderRadius: "",
    icon: "",
    iconPosition: "left",
  },
  Layout: ButtonLayout,
  Editable: ButtonEditable,
  PanelControls: ButtonPanelControls,
};

export default button;
