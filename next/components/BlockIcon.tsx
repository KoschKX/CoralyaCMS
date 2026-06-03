
import * as React from "react";
import { ICON_COMPONENTS } from "./icons";
import { getPluginIcon } from "@/lib/plugin-registry";

/** Fallback when no icon is registered for a block type. */
function FallbackIcon({ size }: { size: number }) {
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

export function BlockIcon({ name, label, size = 20, color = "#64748b" }: { name: string; label: string; size?: number; color?: string }) {
  // Look up component from a stable registry map — not defining a new component.
  // Using React.createElement avoids the JSX-variable-as-component lint rule
  // which cannot statically verify the looked-up reference is stable.
  const Icon = ICON_COMPONENTS[name] ?? getPluginIcon(name);
  if (!Icon) {
    return <FallbackIcon size={size} />;
  }
  return (
    <span
      style={{ display: "inline-block", width: size, height: size, verticalAlign: "middle" }}
      aria-label={label}
      title={label}
    >
      {React.createElement(Icon, { width: size, height: size, fill: color, "aria-hidden": "true" })}
    </span>
  );
}
