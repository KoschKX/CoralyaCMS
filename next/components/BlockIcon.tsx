
import * as React from "react";
import { ICON_COMPONENTS } from "./icons";

export function BlockIcon({ name, label, size = 20, color = "#64748b" }: { name: string; label: string; size?: number; color?: string }) {
  const Icon = ICON_COMPONENTS[name];
  if (!Icon) {
    // Fallback: blank SVG for unknown icon
    return (
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ display: 'inline-block', verticalAlign: 'middle' }}
        aria-hidden="true"
      />
    );
  }
  return (
    <span
      style={{ display: "inline-block", width: size, height: size, verticalAlign: "middle" }}
      aria-label={label}
      title={label}
    >
      <Icon width={size} height={size} fill={color} aria-hidden="true" />
    </span>
  );
}
