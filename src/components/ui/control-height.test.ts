import { describe, expect, it } from "vitest";

import { buttonVariants } from "@/components/ui/button";
import { inputVariants } from "@/components/ui/input";

/*
 * Guards the control-height standard: a button placed next to a field must be
 * exactly as tall as the field. Both consume the SAME --control-h* token
 * (defined once in index.css), so the only thing that can silently break the
 * standard is one component drifting off the token. Assert they stay in lockstep.
 */
const TOKEN = {
  default: "h-[var(--control-h)]",
  sm: "h-[var(--control-h-sm)]",
  lg: "h-[var(--control-h-lg)]",
} as const;

describe("control height standard", () => {
  it("button default height uses the shared control-height token", () => {
    expect(buttonVariants({ size: "default" })).toContain(TOKEN.default);
  });

  it("input default height uses the shared control-height token", () => {
    expect(inputVariants({ inputSize: "default" })).toContain(TOKEN.default);
  });

  it("button and input agree on every size tier (default/sm/lg)", () => {
    expect(buttonVariants({ size: "sm" })).toContain(TOKEN.sm);
    expect(inputVariants({ inputSize: "sm" })).toContain(TOKEN.sm);

    expect(buttonVariants({ size: "lg" })).toContain(TOKEN.lg);
    expect(inputVariants({ inputSize: "lg" })).toContain(TOKEN.lg);
  });

  it("square icon buttons match the field height via the same token", () => {
    // size-[var(--control-h)] sets both width and height — the send/attach
    // icon buttons in the chat composer sit flush with the input this way.
    expect(buttonVariants({ size: "icon" })).toContain(
      "size-[var(--control-h)]",
    );
    expect(buttonVariants({ size: "icon-sm" })).toContain(
      "size-[var(--control-h-sm)]",
    );
    expect(buttonVariants({ size: "icon-lg" })).toContain(
      "size-[var(--control-h-lg)]",
    );
  });
});
