import { forwardRef, type ComponentProps } from "react";

import { Input } from "@/components/ui/input";
import {
  applyMask,
  maskInputMode,
  type MaskKind,
} from "@/lib/input-mask";

/*
 * MaskedInput (W5): a controlled Input that formats keystrokes through an input
 * mask (card / expiry / phone / amount). Shared by checkout, crypto amounts and
 * the Forms showcase. Emits the already-formatted display string via onChange;
 * use unmask() at submit time for the raw value.
 */
export const MaskedInput = forwardRef<
  HTMLInputElement,
  Omit<ComponentProps<typeof Input>, "onChange" | "value"> & {
    mask: MaskKind;
    value: string;
    onChange: (formatted: string) => void;
  }
>(function MaskedInput({ mask, value, onChange, ...props }, ref) {
  return (
    <Input
      ref={ref}
      value={value}
      inputMode={maskInputMode(mask)}
      onChange={(event) => onChange(applyMask(mask, event.target.value))}
      {...props}
    />
  );
});
