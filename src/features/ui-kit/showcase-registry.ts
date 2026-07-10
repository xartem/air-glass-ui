import type { ComponentType } from "react";
import {
  ChartLine,
  ListTree,
  LayoutGrid,
  Map,
  Shapes,
  Smile,
  Table,
  TextCursorInput,
  Wand2,
} from "lucide-react";

/*
 * Showcase registry (W5): the single list of every component-showcase page,
 * grouped by the nine COMPONENTS sections. Consumed by the /ui-kit hub index
 * grid (searchable) so the hub, the sidebar and the ⌘K palette stay in sync.
 * Page links are appended by each group task as pages land — a group with an
 * empty `links` array renders nothing in the index.
 */

export interface ShowcaseLink {
  to: string;
  /** i18n key for the page title (chrome, translated). */
  labelKey: string;
}

export interface ShowcaseGroup {
  key: string;
  labelKey: string;
  icon: ComponentType<{ className?: string }>;
  links: ShowcaseLink[];
}

export const SHOWCASE_GROUPS: ShowcaseGroup[] = [
  {
    key: "base",
    labelKey: "nav.components.base",
    icon: Shapes,
    links: [
      {
        to: "/components/base/buttons",
        labelKey: "showcase.base.buttons.title",
      },
    ],
  },
  {
    key: "advance",
    labelKey: "nav.components.advance",
    icon: Wand2,
    links: [],
  },
  {
    key: "widgets",
    labelKey: "nav.components.widgets",
    icon: LayoutGrid,
    links: [],
  },
  {
    key: "forms",
    labelKey: "nav.components.forms",
    icon: TextCursorInput,
    links: [],
  },
  {
    key: "tables",
    labelKey: "nav.components.tables",
    icon: Table,
    links: [],
  },
  {
    key: "charts",
    labelKey: "nav.components.charts",
    icon: ChartLine,
    links: [],
  },
  {
    key: "icons",
    labelKey: "nav.components.icons",
    icon: Smile,
    links: [],
  },
  {
    key: "maps",
    labelKey: "nav.components.maps",
    icon: Map,
    links: [],
  },
  {
    key: "multiLevel",
    labelKey: "nav.components.multiLevel",
    icon: ListTree,
    links: [],
  },
];
