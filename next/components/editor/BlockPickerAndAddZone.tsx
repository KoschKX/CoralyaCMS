"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { blockRegistry } from "@/blocks/index";
import { BlockIcon } from "@/components/BlockIcon";

export function BlockPicker({
  onSelect,
  onClose,
}: {
  onSelect: (type: string) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute z-40 mt-1 w-52 rounded-lg border border-zinc-200 bg-white shadow-lg"
    >
      <div className="p-1">
        {blockRegistry.map((def) => (
          <button
            key={def.name}
            onClick={() => onSelect(def.name)}
            className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm transition hover:bg-zinc-50"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-zinc-200 font-mono text-[11px] text-zinc-500">
              <BlockIcon name={def.name} label={def.label} size={20} />
            </span>
            <span className="text-zinc-800">{def.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function AddZone({
  onAdd,
  variant = "inline",
  isSelected = false,
  onOpenChange,
}: {
  onAdd: (type: string) => void;
  variant?: "inline" | "footer" | "col-empty" | "col-last";
  isSelected?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => { onOpenChange?.(open); }, [open, onOpenChange]);

  const close = useCallback(() => { setOpen(false); }, []);
  const select = useCallback((t: string) => { setOpen(false); onAdd(t); }, [onAdd]);
  const toggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen((o) => !o);
  }, []);

  if (variant === "col-empty") {
    return (
      <div className="group relative flex h-full min-h-[60px] items-center justify-center">
        <button
          onClick={toggle}
          className="flex h-6 w-6 items-center justify-center rounded-full border border-zinc-400 bg-white text-zinc-500 text-sm leading-none opacity-0 group-hover:opacity-100 hover:border-blue-500 hover:text-blue-500 transition-all"
          title="Add block"
        >
          +
        </button>
        {open && (
          <div className="absolute top-full left-1/2 -translate-x-1/2 z-30 mt-1">
            <BlockPicker onSelect={select} onClose={close} />
          </div>
        )}
      </div>
    );
  }

  if (variant === "footer") {
    return (
      <div className="relative">
        <button
          onClick={toggle}
          className="flex w-full items-center gap-2 px-1 py-2 text-sm text-zinc-400 hover:text-zinc-600 transition"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded border border-zinc-300 bg-white text-zinc-400 text-sm leading-none hover:border-zinc-500 hover:text-zinc-600">+</span>
          <span>Type / to choose a block</span>
        </button>
        {open && (
          <div className="absolute top-full left-0 z-30">
            <BlockPicker onSelect={select} onClose={close} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`insert-zone${variant === "col-last" ? " insert-zone--col-last" : ""}${isSelected ? " insert-zone--selected" : ""}`}>
      <div className="insert-zone__line" />
      <button
        onClick={toggle}
        className="insert-zone__btn"
        title="Add block"
      >
        +
      </button>
      {open && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30">
          <BlockPicker onSelect={select} onClose={close} />
        </div>
      )}
    </div>
  );
}
