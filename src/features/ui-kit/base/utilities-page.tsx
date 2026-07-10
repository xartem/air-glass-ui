import { ComponentDemo, ShowcasePage } from "@/components/component-demo";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

/*
 * Utilities showcase (W5): design-token swatches for border radius, shadow,
 * spacing and border width. Every value maps to a Tailwind token. Static demo.
 */
export function UtilitiesPage() {
  useLocale();

  const radii = [
    { label: "rounded-sm", cls: "rounded-sm" },
    { label: "rounded-md", cls: "rounded-md" },
    { label: "rounded-lg", cls: "rounded-lg" },
    { label: "rounded-xl", cls: "rounded-xl" },
    { label: "rounded-2xl", cls: "rounded-2xl" },
    { label: "rounded-full", cls: "rounded-full" },
  ];

  const shadows = [
    { label: "shadow-sm", cls: "shadow-sm" },
    { label: "shadow-md", cls: "shadow-md" },
    { label: "shadow-lg", cls: "shadow-lg" },
    { label: "shadow-xl", cls: "shadow-xl" },
  ];

  const gaps = [
    { label: "gap-1", cls: "gap-1" },
    { label: "gap-2", cls: "gap-2" },
    { label: "gap-4", cls: "gap-4" },
    { label: "gap-6", cls: "gap-6" },
  ];

  const borders = [
    { label: "border", cls: "border" },
    { label: "border-2", cls: "border-2" },
    { label: "border-4", cls: "border-4" },
  ];

  return (
    <ShowcasePage
      title={t("showcase.base.utilities.title")}
      description={t("showcase.base.utilities.desc")}
      breadcrumb={{ group: t("nav.components.base") }}
    >
      <ComponentDemo
        title={t("showcase.base.utilities.radius")}
        notes={t("showcase.base.utilities.note")}
        code={`<div className="rounded-sm" />
<div className="rounded-lg" />
<div className="rounded-2xl" />
<div className="rounded-full" />`}
      >
        {radii.map(({ label, cls }) => (
          <div key={label} className="flex flex-col items-center gap-2">
            <div className={`size-16 bg-primary/15 ring-1 ring-primary/30 ${cls}`} />
            <span className="font-mono text-xs text-muted-foreground">
              {label}
            </span>
          </div>
        ))}
      </ComponentDemo>

      <ComponentDemo
        title={t("showcase.base.utilities.shadow")}
        code={`<div className="shadow-sm" />
<div className="shadow-md" />
<div className="shadow-lg" />
<div className="shadow-xl" />`}
      >
        {shadows.map(({ label, cls }) => (
          <div key={label} className="flex flex-col items-center gap-2">
            <div className={`size-16 rounded-xl bg-card ${cls}`} />
            <span className="font-mono text-xs text-muted-foreground">
              {label}
            </span>
          </div>
        ))}
      </ComponentDemo>

      <ComponentDemo
        title={t("showcase.base.utilities.spacing")}
        previewClassName="block"
        code={`<div className="flex gap-1">…</div>
<div className="flex gap-2">…</div>
<div className="flex gap-4">…</div>
<div className="flex gap-6">…</div>`}
      >
        <div className="space-y-3">
          {gaps.map(({ label, cls }) => (
            <div key={label} className="flex items-center gap-3">
              <span className="w-16 shrink-0 font-mono text-xs text-muted-foreground">
                {label}
              </span>
              <div className={`flex ${cls}`}>
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="size-6 rounded bg-primary/25" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </ComponentDemo>

      <ComponentDemo
        title={t("showcase.base.utilities.borders")}
        code={`<div className="border" />
<div className="border-2" />
<div className="border-4" />`}
      >
        {borders.map(({ label, cls }) => (
          <div key={label} className="flex flex-col items-center gap-2">
            <div className={`size-16 rounded-xl border-border bg-transparent ${cls}`} />
            <span className="font-mono text-xs text-muted-foreground">
              {label}
            </span>
          </div>
        ))}
      </ComponentDemo>
    </ShowcasePage>
  );
}
