import { useId } from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/*
 * ColorPicker (E2 §7: field type `color` → this widget → hex).
 * Native color input as the swatch + hex text field, one control height (42px).
 */

const HEX_RE = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

export function ColorPicker({
  id,
  value,
  onChange,
  className,
}: {
  id?: string;
  /** Hex color (#rrggbb) or undefined. */
  value?: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  const fallbackId = useId();
  const inputId = id ?? fallbackId;
  const hex = value && HEX_RE.test(value) ? value : "#1d8df2";

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <label
        className="relative flex size-[42px] shrink-0 cursor-pointer items-center justify-center rounded-md border"
        style={{ backgroundColor: hex }}
        aria-label={inputId}
      >
        <input
          type="color"
          value={hex}
          onChange={(event) => onChange(event.target.value)}
          className="absolute inset-0 size-full cursor-pointer opacity-0"
        />
      </label>
      <Input
        id={inputId}
        value={value ?? ""}
        placeholder="#1d8df2"
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={value ? !HEX_RE.test(value) : undefined}
        className="w-32 font-mono"
      />
    </div>
  );
}
