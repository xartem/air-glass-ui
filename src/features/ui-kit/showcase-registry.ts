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
      { to: "/components/base/alerts", labelKey: "showcase.base.alerts.title" },
      { to: "/components/base/badges", labelKey: "showcase.base.badges.title" },
      { to: "/components/base/colors", labelKey: "showcase.base.colors.title" },
      { to: "/components/base/cards", labelKey: "showcase.base.cards.title" },
      {
        to: "/components/base/carousel",
        labelKey: "showcase.base.carousel.title",
      },
      {
        to: "/components/base/dropdowns",
        labelKey: "showcase.base.dropdowns.title",
      },
      { to: "/components/base/grid", labelKey: "showcase.base.grid.title" },
      { to: "/components/base/images", labelKey: "showcase.base.images.title" },
      { to: "/components/base/tabs", labelKey: "showcase.base.tabs.title" },
      {
        to: "/components/base/accordion",
        labelKey: "showcase.base.accordion.title",
      },
      { to: "/components/base/modals", labelKey: "showcase.base.modals.title" },
      {
        to: "/components/base/offcanvas",
        labelKey: "showcase.base.offcanvas.title",
      },
      {
        to: "/components/base/placeholders",
        labelKey: "showcase.base.placeholders.title",
      },
      {
        to: "/components/base/progress",
        labelKey: "showcase.base.progress.title",
      },
      {
        to: "/components/base/notifications",
        labelKey: "showcase.base.notifications.title",
      },
      { to: "/components/base/media", labelKey: "showcase.base.media.title" },
      { to: "/components/base/video", labelKey: "showcase.base.video.title" },
      {
        to: "/components/base/typography",
        labelKey: "showcase.base.typography.title",
      },
      { to: "/components/base/lists", labelKey: "showcase.base.lists.title" },
      { to: "/components/base/links", labelKey: "showcase.base.links.title" },
      {
        to: "/components/base/general",
        labelKey: "showcase.base.general.title",
      },
      {
        to: "/components/base/ribbons",
        labelKey: "showcase.base.ribbons.title",
      },
      {
        to: "/components/base/utilities",
        labelKey: "showcase.base.utilities.title",
      },
    ],
  },
  {
    key: "advance",
    labelKey: "nav.components.advance",
    icon: Wand2,
    links: [
      {
        to: "/components/advance/sweet-alerts",
        labelKey: "showcase.advance.sweetAlerts.title",
      },
      {
        to: "/components/advance/nestable-list",
        labelKey: "showcase.advance.nestableList.title",
      },
      {
        to: "/components/advance/scrollbar",
        labelKey: "showcase.advance.scrollbar.title",
      },
      {
        to: "/components/advance/animation",
        labelKey: "showcase.advance.animation.title",
      },
      {
        to: "/components/advance/tour",
        labelKey: "showcase.advance.tour.title",
      },
      {
        to: "/components/advance/swiper-slider",
        labelKey: "showcase.advance.swiperSlider.title",
      },
      {
        to: "/components/advance/ratings",
        labelKey: "showcase.advance.ratings.title",
      },
      {
        to: "/components/advance/highlight",
        labelKey: "showcase.advance.highlight.title",
      },
      {
        to: "/components/advance/scrollspy",
        labelKey: "showcase.advance.scrollspy.title",
      },
    ],
  },
  {
    key: "widgets",
    labelKey: "nav.components.widgets",
    icon: LayoutGrid,
    links: [{ to: "/components/widgets", labelKey: "showcase.widgets.title" }],
  },
  {
    key: "forms",
    labelKey: "nav.components.forms",
    icon: TextCursorInput,
    links: [
      {
        to: "/components/forms/basic-elements",
        labelKey: "showcase.forms.basicElements.title",
      },
      {
        to: "/components/forms/form-select",
        labelKey: "showcase.forms.formSelect.title",
      },
      {
        to: "/components/forms/checks-radios",
        labelKey: "showcase.forms.checksRadios.title",
      },
      {
        to: "/components/forms/pickers",
        labelKey: "showcase.forms.pickers.title",
      },
      {
        to: "/components/forms/input-masks",
        labelKey: "showcase.forms.inputMasks.title",
      },
      {
        to: "/components/forms/advanced",
        labelKey: "showcase.forms.advanced.title",
      },
      {
        to: "/components/forms/range-slider",
        labelKey: "showcase.forms.rangeSlider.title",
      },
      {
        to: "/components/forms/validation",
        labelKey: "showcase.forms.validation.title",
      },
      {
        to: "/components/forms/wizard",
        labelKey: "showcase.forms.wizard.title",
      },
      {
        to: "/components/forms/editors",
        labelKey: "showcase.forms.editors.title",
      },
      {
        to: "/components/forms/file-uploads",
        labelKey: "showcase.forms.fileUploads.title",
      },
      {
        to: "/components/forms/form-layouts",
        labelKey: "showcase.forms.formLayouts.title",
      },
      {
        to: "/components/forms/select2",
        labelKey: "showcase.forms.select2.title",
      },
    ],
  },
  {
    key: "tables",
    labelKey: "nav.components.tables",
    icon: Table,
    links: [
      {
        to: "/components/tables/basic",
        labelKey: "showcase.tables.basic.title",
      },
      {
        to: "/components/tables/gridjs",
        labelKey: "showcase.tables.gridjs.title",
      },
      {
        to: "/components/tables/listjs",
        labelKey: "showcase.tables.listjs.title",
      },
      {
        to: "/components/tables/datatables",
        labelKey: "showcase.tables.datatables.title",
      },
    ],
  },
  {
    key: "charts",
    labelKey: "nav.components.charts",
    icon: ChartLine,
    links: [
      { to: "/components/charts/line", labelKey: "showcase.charts.line.title" },
      { to: "/components/charts/area", labelKey: "showcase.charts.area.title" },
      {
        to: "/components/charts/column",
        labelKey: "showcase.charts.column.title",
      },
      { to: "/components/charts/bar", labelKey: "showcase.charts.bar.title" },
      {
        to: "/components/charts/mixed",
        labelKey: "showcase.charts.mixed.title",
      },
      {
        to: "/components/charts/timeline",
        labelKey: "showcase.charts.timeline.title",
      },
      {
        to: "/components/charts/range-area",
        labelKey: "showcase.charts.rangeArea.title",
      },
      {
        to: "/components/charts/funnel",
        labelKey: "showcase.charts.funnel.title",
      },
      {
        to: "/components/charts/candlestick",
        labelKey: "showcase.charts.candlestick.title",
      },
      {
        to: "/components/charts/boxplot",
        labelKey: "showcase.charts.boxplot.title",
      },
      {
        to: "/components/charts/bubble",
        labelKey: "showcase.charts.bubble.title",
      },
      {
        to: "/components/charts/scatter",
        labelKey: "showcase.charts.scatter.title",
      },
      {
        to: "/components/charts/heatmap",
        labelKey: "showcase.charts.heatmap.title",
      },
      {
        to: "/components/charts/treemap",
        labelKey: "showcase.charts.treemap.title",
      },
      { to: "/components/charts/pie", labelKey: "showcase.charts.pie.title" },
      {
        to: "/components/charts/radialbar",
        labelKey: "showcase.charts.radialbar.title",
      },
      {
        to: "/components/charts/radar",
        labelKey: "showcase.charts.radar.title",
      },
      {
        to: "/components/charts/polar-area",
        labelKey: "showcase.charts.polarArea.title",
      },
      {
        to: "/components/charts/slope",
        labelKey: "showcase.charts.slope.title",
      },
      {
        to: "/components/charts/chartjs",
        labelKey: "showcase.charts.chartjs.title",
      },
      {
        to: "/components/charts/echarts",
        labelKey: "showcase.charts.echarts.title",
      },
    ],
  },
  {
    key: "icons",
    labelKey: "nav.components.icons",
    icon: Smile,
    links: [{ to: "/components/icons", labelKey: "showcase.icons.title" }],
  },
  {
    key: "maps",
    labelKey: "nav.components.maps",
    icon: Map,
    links: [
      { to: "/components/maps/base", labelKey: "showcase.maps.base.title" },
      {
        to: "/components/maps/markers",
        labelKey: "showcase.maps.markers.title",
      },
      {
        to: "/components/maps/substitution",
        labelKey: "showcase.maps.substitution.title",
      },
    ],
  },
  {
    key: "multiLevel",
    labelKey: "nav.components.multiLevel",
    icon: ListTree,
    links: [
      {
        to: "/components/multi-level/page-1",
        labelKey: "showcase.multiLevel.one.title",
      },
      {
        to: "/components/multi-level/page-2",
        labelKey: "showcase.multiLevel.two.title",
      },
    ],
  },
];
