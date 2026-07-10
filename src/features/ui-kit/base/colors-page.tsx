import { ComponentDemo, ShowcasePage } from "@/components/component-demo";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

/*
 * Colors showcase (W5): the design-token palette rendered straight from CSS
 * custom properties — core surface tokens, the status scale, and the chart
 * palette. Every swatch reads its color from a var(), never a hard-coded hex.
 */

/** A single token swatch: color chip + its CSS variable name. */
function Swatch({ token }: { token: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div
        className="h-14 w-full rounded-lg ring-1 ring-foreground/10"
        style={{ backgroundColor: `var(${token})` }}
      />
      <code className="text-[11px] text-muted-foreground">{token}</code>
    </div>
  );
}

/** A status token pair rendered as its own bg/fg combination. */
function StatusSwatch({
  name,
  bg,
  fg,
}: {
  name: string;
  bg: string;
  fg: string;
}) {
  return (
    <div
      className="flex h-14 items-center justify-center rounded-lg text-xs font-medium ring-1 ring-foreground/10"
      style={{ backgroundColor: `var(${bg})`, color: `var(${fg})` }}
    >
      {name}
    </div>
  );
}

const CORE_TOKENS = [
  "--primary",
  "--secondary",
  "--accent",
  "--destructive",
  "--muted",
  "--border",
];

const STATUS_TOKENS = [
  { name: "success", bg: "--status-success-bg", fg: "--status-success-fg" },
  { name: "pending", bg: "--status-pending-bg", fg: "--status-pending-fg" },
  { name: "error", bg: "--status-error-bg", fg: "--status-error-fg" },
  { name: "info", bg: "--status-info-bg", fg: "--status-info-fg" },
  { name: "neutral", bg: "--status-neutral-bg", fg: "--status-neutral-fg" },
];

const CHART_TOKENS = [
  "--chart-1",
  "--chart-2",
  "--chart-3",
  "--chart-4",
  "--chart-5",
];

export function ColorsPage() {
  useLocale();
  return (
    <ShowcasePage
      title={t("showcase.base.colors.title")}
      description={t("showcase.base.colors.desc")}
      breadcrumb={{ group: t("nav.components.base") }}
    >
      <ComponentDemo
        title={t("showcase.base.colors.core")}
        notes={t("showcase.base.colors.note")}
        previewClassName="block"
        code={`<div style={{ backgroundColor: "var(--primary)" }} />
<div style={{ backgroundColor: "var(--secondary)" }} />
<div style={{ backgroundColor: "var(--accent)" }} />
<div style={{ backgroundColor: "var(--destructive)" }} />
<div style={{ backgroundColor: "var(--muted)" }} />
<div style={{ backgroundColor: "var(--border)" }} />`}
      >
        <div className="grid w-full grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {CORE_TOKENS.map((token) => (
            <Swatch key={token} token={token} />
          ))}
        </div>
      </ComponentDemo>

      <ComponentDemo
        title={t("showcase.base.colors.status")}
        previewClassName="block"
        code={`<div
  style={{
    backgroundColor: "var(--status-success-bg)",
    color: "var(--status-success-fg)",
  }}
/>`}
      >
        <div className="grid w-full grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {STATUS_TOKENS.map((status) => (
            <StatusSwatch
              key={status.name}
              name={status.name}
              bg={status.bg}
              fg={status.fg}
            />
          ))}
        </div>
      </ComponentDemo>

      <ComponentDemo
        title={t("showcase.base.colors.charts")}
        previewClassName="block"
        code={`<div style={{ backgroundColor: "var(--chart-1)" }} />
<div style={{ backgroundColor: "var(--chart-2)" }} />
<div style={{ backgroundColor: "var(--chart-3)" }} />
<div style={{ backgroundColor: "var(--chart-4)" }} />
<div style={{ backgroundColor: "var(--chart-5)" }} />`}
      >
        <div className="grid w-full grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {CHART_TOKENS.map((token) => (
            <Swatch key={token} token={token} />
          ))}
        </div>
      </ComponentDemo>
    </ShowcasePage>
  );
}
