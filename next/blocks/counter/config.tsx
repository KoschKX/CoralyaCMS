import type { BlockDefinition } from "@/lib/block-types";
import CounterLayout from "./layout";
import { CounterEditable } from "./editable";
import { CounterPanelControls } from "./panel";

/**
 * Counter block — animated stat counters in two visual modes.
 *
 * **Box** mode (default): a responsive grid of numbered stat cards with an
 *   optional icon and label beneath each number. Mirrors Avada's
 *   fusion_counters_box / fusion_counter_box pattern.
 *
 * **Circle** mode: a row of SVG progress rings that animate on first render,
 *   each showing a 0–100 percentage value with a centered label.
 *   Mirrors Avada's fusion_counters_circle / fusion_counter_circle.
 *
 * @example data
 * {
 *   style: "box",
 *   columns: 4,
 *   color: "",
 *   borderColor: "",
 *   filledColor: "",
 *   unfilledColor: "",
 *   items: [
 *     { id: "1", value: "150", unit: "+", unitPos: "suffix",
 *       label: "Projects completed", icon: "", filledColor: "", unfilledColor: "", size: 200 },
 *   ]
 * }
 */
const counter: BlockDefinition = {
  name: "counter",
  label: "Counters",
  icon: "counter",
  category: "design",
  defaultData: {
    style: "box",
    columns: 4,
    color: "",
    borderColor: "",
    filledColor: "",
    unfilledColor: "",
    items: [
      { id: "d1", value: "150", unit: "+",  unitPos: "suffix", label: "Projects completed",   icon: "", filledColor: "", unfilledColor: "", size: 200 },
      { id: "d2", value: "98",  unit: "%",  unitPos: "suffix", label: "Client satisfaction",  icon: "", filledColor: "", unfilledColor: "", size: 200 },
      { id: "d3", value: "12",  unit: "",   unitPos: "suffix", label: "Years of experience",  icon: "", filledColor: "", unfilledColor: "", size: 200 },
      { id: "d4", value: "50",  unit: "K",  unitPos: "suffix", label: "Users served",         icon: "", filledColor: "", unfilledColor: "", size: 200 },
    ],
  },
  Layout: CounterLayout,
  Editable: CounterEditable,
  PanelControls: CounterPanelControls,
};

export default counter;
