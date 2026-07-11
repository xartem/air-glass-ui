import { describe, expect, it } from "vitest";

import {
  buildMegaBar,
  MEGA_LEAF_CHUNK,
  MEGA_ROW_CAP,
  type MegaBarItem,
} from "@/app/mega-nav";
import type { NavGroup, NavIcon, NavItem, NavParent } from "@/app/nav";

const Icon: NavIcon = () => null;

function leaf(to: string): NavItem {
  return { to, label: to, icon: Icon };
}

function leaves(prefix: string, count: number): NavItem[] {
  return Array.from({ length: count }, (_, i) => leaf(`/${prefix}/${i + 1}`));
}

function parent(key: string, children: NavParent["children"]): NavParent {
  return { key, label: key, icon: Icon, children };
}

function group(key: string, items: NavGroup["items"]): NavGroup {
  return { key, label: key.toUpperCase(), items };
}

function allLinks(item: MegaBarItem): string[] {
  return item.columns.flatMap((column) =>
    column.sections.flatMap((section) =>
      section.items.map((entry) => entry.to),
    ),
  );
}

describe("buildMegaBar", () => {
  it("promotes the menu group's parents and keeps other groups as one bar item each", () => {
    const bar = buildMegaBar([
      group("menu", [
        parent("menu.dashboards", leaves("dash", 3)),
        parent("menu.apps", [parent("menu.apps.crm", leaves("crm", 2))]),
      ]),
      group("pages", [parent("pages.utility", leaves("utility", 2))]),
      group("admin", [parent("admin.system", leaves("system", 2))]),
    ]);
    expect(bar.map((item) => item.key)).toEqual([
      "menu.dashboards",
      "menu.apps",
      "pages",
      "admin",
    ]);
    expect(bar[2].label).toBe("PAGES");
  });

  it("chunks a leaf-only bar item into balanced headerless columns", () => {
    const bar = buildMegaBar([
      group("menu", [
        parent("menu.dashboards", leaves("dash", MEGA_LEAF_CHUNK + 3)),
      ]),
    ]);
    const [item] = bar;
    expect(item.columns).toHaveLength(2);
    expect(item.columns[0].sections[0].items).toHaveLength(MEGA_LEAF_CHUNK);
    expect(item.columns[1].sections[0].items).toHaveLength(3);
    for (const column of item.columns)
      for (const section of column.sections)
        expect(section.label).toBeUndefined();
  });

  it("renders one titled section per sub-parent, preserving nav order", () => {
    const bar = buildMegaBar([
      group("menu", [
        parent("menu.apps", [
          parent("menu.apps.ecommerce", leaves("shop", 3)),
          parent("menu.apps.crm", leaves("crm", 2)),
        ]),
      ]),
    ]);
    const sections = bar[0].columns.flatMap((column) => column.sections);
    expect(sections.map((section) => section.label)).toEqual([
      "menu.apps.ecommerce",
      "menu.apps.crm",
    ]);
    expect(sections[0].items).toHaveLength(3);
  });

  it("flattens depth-3 parents into their own titled sections, never submenus", () => {
    const bar = buildMegaBar([
      group("menu", [
        parent("menu.apps", [
          parent("menu.apps.email", [
            ...leaves("email", 2),
            parent("menu.apps.email.templates", leaves("templates", 2)),
          ]),
        ]),
      ]),
    ]);
    const sections = bar[0].columns.flatMap((column) => column.sections);
    expect(sections.map((section) => section.label)).toEqual([
      "menu.apps.email",
      "menu.apps.email.templates",
    ]);
    expect(allLinks(bar[0])).toEqual([
      "/email/1",
      "/email/2",
      "/templates/1",
      "/templates/2",
    ]);
  });

  it("packs many sections into row-capped columns without losing links", () => {
    const subParents = Array.from({ length: 6 }, (_, i) =>
      parent(`components.sub${i + 1}`, leaves(`sub${i + 1}`, MEGA_ROW_CAP - 4)),
    );
    const bar = buildMegaBar([group("components", subParents)]);
    const [item] = bar;
    expect(item.columns.length).toBeGreaterThan(1);
    for (const column of item.columns) {
      const rows = column.sections.reduce(
        (sum, section) => sum + (section.label ? 1 : 0) + section.items.length,
        0,
      );
      expect(rows).toBeLessThanOrEqual(MEGA_ROW_CAP);
    }
    expect(allLinks(item)).toHaveLength(6 * (MEGA_ROW_CAP - 4));
  });

  it("splits a single oversized section across columns, header only on the first chunk", () => {
    const bar = buildMegaBar([
      group("pages", [
        parent("pages.big", leaves("big", MEGA_ROW_CAP * 2)),
        parent("pages.small", leaves("small", 2)),
      ]),
    ]);
    const sections = bar[0].columns.flatMap((column) => column.sections);
    const titled = sections.filter((section) => section.label === "pages.big");
    expect(titled).toHaveLength(1);
    expect(allLinks(bar[0])).toHaveLength(MEGA_ROW_CAP * 2 + 2);
  });

  it("collects loose menu-group leaves into a single bar item under the group label", () => {
    const bar = buildMegaBar([
      group("menu", [
        parent("menu.dashboards", leaves("dash", 2)),
        leaf("/loose"),
      ]),
    ]);
    expect(bar.map((item) => item.key)).toEqual(["menu.dashboards", "menu"]);
    expect(allLinks(bar[1])).toEqual(["/loose"]);
  });

  it("drops empty parents, groups and never emits empty sections or columns", () => {
    const bar = buildMegaBar([
      group("menu", [parent("menu.empty", [])]),
      group("pages", [
        parent("pages.empty", [parent("pages.empty.nested", [])]),
      ]),
      group("admin", [parent("admin.system", leaves("system", 1))]),
    ]);
    expect(bar.map((item) => item.key)).toEqual(["admin"]);
    for (const item of bar)
      for (const column of item.columns) {
        expect(column.sections.length).toBeGreaterThan(0);
        for (const section of column.sections)
          expect(section.items.length).toBeGreaterThan(0);
      }
  });
});
