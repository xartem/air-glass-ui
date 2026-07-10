import { ComponentDemo, ShowcasePage } from "@/components/component-demo";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

/*
 * Ribbons showcase (W5): corner and edge ribbons plus a floating tag, built
 * from absolutely-positioned token elements layered over a Card. Static demo.
 */
export function RibbonsPage() {
  useLocale();

  const cardBody = (
    <>
      <CardHeader>
        <CardTitle>{t("showcase.base.ribbons.cardTitle")}</CardTitle>
        <CardDescription>{t("showcase.base.ribbons.cardDesc")}</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        {t("showcase.base.ribbons.cardDesc")}
      </CardContent>
    </>
  );

  return (
    <ShowcasePage
      title={t("showcase.base.ribbons.title")}
      description={t("showcase.base.ribbons.desc")}
      breadcrumb={{ group: t("nav.components.base") }}
    >
      <ComponentDemo
        title={t("showcase.base.ribbons.corner")}
        notes={t("showcase.base.ribbons.note")}
        previewClassName="block"
        code={`<Card className="relative">
  <span className="absolute -end-12 top-5 w-40 rotate-45 bg-primary py-1 text-center text-xs font-semibold text-primary-foreground">
    New
  </span>
  {/* card content */}
</Card>`}
      >
        <Card className="relative w-full max-w-xs">
          <span className="absolute -end-12 top-5 w-40 rotate-45 bg-primary py-1 text-center text-xs font-semibold text-primary-foreground">
            {t("showcase.base.ribbons.new")}
          </span>
          {cardBody}
        </Card>
      </ComponentDemo>

      <ComponentDemo
        title={t("showcase.base.ribbons.edge")}
        previewClassName="block"
        code={`<div className="relative">
  <span className="absolute -start-2 top-4 rounded-e-full bg-[var(--status-error-bg)] px-3 py-1 text-xs font-semibold text-[var(--status-error-fg)] shadow">
    Sale
  </span>
  <Card>{/* card content */}</Card>
</div>`}
      >
        <div className="relative w-full max-w-xs">
          <span className="absolute -start-2 top-4 z-10 rounded-e-full bg-[var(--status-error-bg)] px-3 py-1 text-xs font-semibold text-[var(--status-error-fg)] shadow">
            {t("showcase.base.ribbons.sale")}
          </span>
          <Card>{cardBody}</Card>
        </div>
      </ComponentDemo>

      <ComponentDemo
        title={t("showcase.base.ribbons.tag")}
        previewClassName="block"
        code={`<Card className="relative">
  <span className="absolute end-3 top-3 rounded-full bg-[var(--status-success-bg)] px-2 py-0.5 text-xs font-medium text-[var(--status-success-fg)]">
    Featured
  </span>
  {/* card content */}
</Card>`}
      >
        <Card className="relative w-full max-w-xs">
          <span className="absolute end-3 top-3 z-10 rounded-full bg-[var(--status-success-bg)] px-2 py-0.5 text-xs font-medium text-[var(--status-success-fg)]">
            {t("showcase.base.ribbons.featured")}
          </span>
          {cardBody}
        </Card>
      </ComponentDemo>
    </ShowcasePage>
  );
}
