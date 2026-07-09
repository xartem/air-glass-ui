import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { cn } from "@/lib/utils";

/*
 * Shared 6-cell one-time-code field. Wraps the input-otp primitive with the
 * project's slot sizing so every 2-step / verification surface reuses one block.
 */

export function OtpField({
  value,
  onChange,
  onComplete,
  length = 6,
  invalid,
  disabled,
  autoFocus,
  className,
  "aria-label": ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  length?: number;
  invalid?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  className?: string;
  "aria-label"?: string;
}) {
  return (
    <InputOTP
      maxLength={length}
      value={value}
      onChange={onChange}
      onComplete={onComplete}
      disabled={disabled}
      autoFocus={autoFocus}
      aria-label={ariaLabel}
      aria-invalid={invalid || undefined}
      containerClassName={cn("justify-center", className)}
    >
      <InputOTPGroup className="gap-2">
        {Array.from({ length }, (_, index) => (
          <InputOTPSlot
            key={index}
            index={index}
            aria-invalid={invalid || undefined}
            className="size-11 rounded-lg border-s text-base first:rounded-s-lg last:rounded-e-lg"
          />
        ))}
      </InputOTPGroup>
    </InputOTP>
  );
}
