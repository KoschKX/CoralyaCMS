export interface PaletteColor {
  label: string;
  value: string;
}

/** The swatches shown in the editor colour picker and theme settings. */
export const COLOR_PALETTE: PaletteColor[] = [
  { label: "Default", value: ""        },
  { label: "White",   value: "#ffffff" },
  { label: "Black",   value: "#09090b" },
  { label: "Gray",    value: "#71717a" },
  { label: "Red",     value: "#dc2626" },
  { label: "Orange",  value: "#ea580c" },
  { label: "Yellow",  value: "#ca8a04" },
  { label: "Green",   value: "#16a34a" },
  { label: "Blue",    value: "#2563eb" },
  { label: "Purple",  value: "#9333ea" },
];
