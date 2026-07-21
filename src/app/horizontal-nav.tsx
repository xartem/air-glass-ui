import { NavLink } from "react-router";

import { buildMegaBar, type MegaBarItem } from "@/app/mega-nav";
import { useActiveNav } from "@/app/use-active-nav";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuLink,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/*
 * Horizontal shell navigation: the menu lives inline in the single topbar (no
 * second bar), its buttons opening megamenu panels — wide multi-column link grids
 * built by mega-nav from the single nav map. Desktop only; below `lg` the shared
 * burger drawer takes over. `nav-underline` swaps the active marker to a bottom
 * underline; the viewport is nudged down so the panel clears the topbar.
 */

function containsActive(item: MegaBarItem, activeTo: string | null): boolean {
  if (activeTo === null) return false;
  return item.columns.some((column) =>
    column.sections.some((section) =>
      section.items.some((entry) => entry.to === activeTo),
    ),
  );
}

export function HorizontalNav() {
  const { groups, activeTo } = useActiveNav();
  const bar = buildMegaBar(groups);
  return (
    <nav
      aria-label={t("shell.nav_label")}
      className="nav-underline hidden min-w-0 flex-1 items-center lg:flex"
    >
      {/* viewport={false}: each panel anchors under its own trigger (not a shared,
          fixed-position viewport). !mt-3 drops it clear of the topbar. */}
      <NavigationMenu viewport={false} className="max-w-full flex-1 justify-start">
        <NavigationMenuList className="flex-nowrap justify-start gap-0.5">
          {bar.map((item) => (
            <NavigationMenuItem key={item.key}>
              <NavigationMenuTrigger
                className={cn(
                  "bg-transparent",
                  containsActive(item, activeTo)
                    ? "nav-item-active"
                    : "text-sidebar-foreground",
                )}
              >
                {item.label}
              </NavigationMenuTrigger>
              <NavigationMenuContent className="!mt-3">
                <div className="flex max-h-[70vh] max-w-[calc(100vw-6rem)] gap-x-6 overflow-auto rounded-lg p-3 backdrop-blur-[var(--glass-blur-card)] backdrop-saturate-[var(--glass-saturate)]">
                  {item.columns.map((column) => (
                    <div key={column.key} className="w-48 space-y-4">
                      {column.sections.map((section) => (
                        <div key={section.key} className="space-y-0.5">
                          {section.label ? (
                            <div className="px-2 pb-1 text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
                              {section.label}
                            </div>
                          ) : null}
                          {section.items.map((entry) => {
                            const active = entry.to === activeTo;
                            return (
                              <NavigationMenuLink
                                key={entry.to}
                                asChild
                                active={active}
                              >
                                <NavLink
                                  to={entry.to}
                                  end={entry.to === "/"}
                                  className={cn(
                                    "px-2 py-1.5",
                                    active
                                      ? "nav-item-active font-medium"
                                      : "text-sidebar-foreground hover:text-foreground",
                                  )}
                                >
                                  <entry.icon className="size-4 shrink-0" />
                                  <span className="truncate">
                                    {entry.label}
                                  </span>
                                </NavLink>
                              </NavigationMenuLink>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>
          ))}
        </NavigationMenuList>
      </NavigationMenu>
    </nav>
  );
}
