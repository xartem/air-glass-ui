import { describe, expect, it } from "vitest";

import { tabsListVariants } from "@/components/ui/tabs";

/*
 * A tab strip scrolls horizontally when it is wider than its container. With
 * `justify-content: center` the overflow spills past both edges and the start
 * half is unreachable by scrolling, so the first tab gets clipped on phones.
 * `safe center` keeps a short strip centred and starts a long one at the edge.
 */
describe("tabs list alignment", () => {
  it.each(["line", "default"] as const)(
    "%s variant centres safely so an overflowing strip starts at the edge",
    (variant) => {
      const classes = tabsListVariants({ variant }).split(/\s+/);
      expect(classes).toContain("justify-center-safe");
      expect(classes).not.toContain("justify-center");
    },
  );
});
