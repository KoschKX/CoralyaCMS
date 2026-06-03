import type { BlockDefinition } from "@/lib/block-types";
import ChartLayout from "./layout";
import { ChartPanelControls } from "./panel";

const chart: BlockDefinition = {
  name: "chart",
  label: "Chart",
  icon: "chart",
  category: "interactive",
  defaultData: {
    title: "",

    // ── Data ────────────────────────────────────────────────────────
    chartType: "bar",       // "bar" | "horizontalBar" | "line" | "pie" | "doughnut" | "polarArea" | "radar"
    datasets: [
      {
        id: "1",
        label: "Sales",
        values: "30,50,40,60,70",
        backgroundColor: "rgba(99,102,241,0.7)",
        borderColor: "rgba(99,102,241,1)",
      },
      {
        id: "2",
        label: "Expenses",
        values: "20,35,25,45,55",
        backgroundColor: "rgba(236,72,153,0.7)",
        borderColor: "rgba(236,72,153,1)",
      },
    ],

    // ── Labels ──────────────────────────────────────────────────────
    xAxisLabels: "Jan,Feb,Mar,Apr,May",  // comma-separated category labels
    xAxisLabel:  "",                      // x-axis title
    yAxisLabel:  "",                      // y-axis title

    // ── Legend ──────────────────────────────────────────────────────
    legendPosition: "top",   // "off" | "top" | "bottom" | "left" | "right"

    // ── Interaction ─────────────────────────────────────────────────
    showTooltips: true,

    // ── Line-specific ────────────────────────────────────────────────
    borderSize:        "2",       // line/bar border width
    borderType:        "smooth",  // "smooth" | "straight" | "stepped"
    chartFill:         "false",   // "false" | "start" | "end" | "origin"
    pointStyle:        "circle",
    pointSize:         "",
    pointBgColor:      "",
    pointBorderColor:  "",

    // ── Appearance ──────────────────────────────────────────────────    showAxisTicks:  false,    chartBgColor:   "",
    axisTextColor:  "",
    gridlineColor:  "",
  },
  Layout:        ChartLayout,
  PanelControls: ChartPanelControls,
};

export default chart;
