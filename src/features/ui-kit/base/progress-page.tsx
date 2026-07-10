import { ComponentDemo, ShowcasePage } from "@/components/component-demo";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

/*
 * Progress showcase (W5): determinate Progress bars at several values and
 * heights plus Spinner sizes. Static docs demo — no data flow.
 */
export function ProgressPage() {
  useLocale();

  const values = [25, 50, 75, 100];

  return (
    <ShowcasePage
      title={t("showcase.base.progress.title")}
      description={t("showcase.base.progress.desc")}
      breadcrumb={{ group: t("nav.components.base") }}
    >
      <ComponentDemo
        title={t("showcase.base.progress.values")}
        notes={t("showcase.base.progress.note")}
        previewClassName="block"
        code={`<Progress value={25} />
<Progress value={50} />
<Progress value={75} />
<Progress value={100} />`}
      >
        <div className="w-full max-w-sm space-y-4">
          {values.map((value) => (
            <div key={value} className="flex items-center gap-3">
              <Progress value={value} aria-label={`${value}%`} />
              <span className="w-10 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                {value}%
              </span>
            </div>
          ))}
        </div>
      </ComponentDemo>

      <ComponentDemo
        title={t("showcase.s.sizes")}
        previewClassName="block"
        code={`<Progress value={60} className="h-1" />
<Progress value={60} className="h-2" />
<Progress value={60} className="h-3" />`}
      >
        <div className="w-full max-w-sm space-y-4">
          <Progress value={60} className="h-1" aria-label="60%" />
          <Progress value={60} className="h-2" aria-label="60%" />
          <Progress value={60} className="h-3" aria-label="60%" />
        </div>
      </ComponentDemo>

      <ComponentDemo
        title={t("showcase.s.loading")}
        code={`<Spinner className="size-4" />
<Spinner className="size-6" />
<Spinner className="size-8" />`}
      >
        <Spinner className="size-4" />
        <Spinner className="size-6" />
        <Spinner className="size-8" />
      </ComponentDemo>
    </ShowcasePage>
  );
}
