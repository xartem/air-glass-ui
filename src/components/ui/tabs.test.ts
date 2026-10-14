import { createElement } from "react";
import { fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  Tabs,
  TabsList,
  TabsTrigger,
  tabsListVariants,
} from "@/components/ui/tabs";

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

/*
 * Arrow keys move focus along the strip; the browser scrolls only a fully
 * hidden element into view, so a half-hidden tab stayed cut off. A focused
 * trigger brings itself into view, and a caller's onFocus still runs.
 */
describe("tabs trigger focus", () => {
  const original = Element.prototype.scrollIntoView;
  afterEach(() => {
    Element.prototype.scrollIntoView = original;
  });

  it("scrolls the focused trigger into view and keeps the caller's onFocus", () => {
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    const onFocus = vi.fn();

    const { getByRole } = render(
      createElement(
        Tabs,
        { defaultValue: "a" },
        createElement(
          TabsList,
          null,
          createElement(TabsTrigger, { value: "a" }, "A"),
          createElement(TabsTrigger, { value: "b", onFocus }, "B"),
        ),
      ),
    );
    fireEvent.focus(getByRole("tab", { name: "B" }));

    expect(onFocus).toHaveBeenCalledTimes(1);
    expect(scrollIntoView).toHaveBeenCalledWith({
      block: "nearest",
      inline: "nearest",
    });
  });
});
