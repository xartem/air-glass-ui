import { ComponentDemo, ShowcasePage } from "@/components/component-demo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

/*
 * Cards showcase (W5): the Card primitive across its variants, sizes, a fully
 * composed header/content/footer layout, and applied examples. Static demos.
 */
export function CardsPage() {
  useLocale();
  return (
    <ShowcasePage
      title={t("showcase.base.cards.title")}
      description={t("showcase.base.cards.desc")}
      breadcrumb={{ group: t("nav.components.base") }}
    >
      <ComponentDemo
        title={t("showcase.s.variants")}
        notes={t("showcase.base.cards.variants_note")}
        previewClassName="block"
        code={`<Card variant="default">…</Card>
<Card variant="elevated">…</Card>
<Card variant="outline">…</Card>
<Card variant="interactive">…</Card>`}
      >
        <div className="grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {(["default", "elevated", "outline", "interactive"] as const).map(
            (variant) => (
              <Card key={variant} variant={variant}>
                <CardHeader>
                  <CardTitle>{variant}</CardTitle>
                  <CardDescription>Card variant</CardDescription>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  Surface, ring and shadow follow the token scale.
                </CardContent>
              </Card>
            ),
          )}
        </div>
      </ComponentDemo>

      <ComponentDemo
        title={t("showcase.s.default")}
        previewClassName="block"
        code={`<Card>
  <CardHeader>
    <CardTitle>Monthly report</CardTitle>
    <CardDescription>March 2026</CardDescription>
    <CardAction>
      <Badge variant="success">Ready</Badge>
    </CardAction>
  </CardHeader>
  <CardContent>Revenue is up 12% versus last month.</CardContent>
  <CardFooter>
    <Button size="sm">Download</Button>
    <Button size="sm" variant="ghost">Share</Button>
  </CardFooter>
</Card>`}
      >
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Monthly report</CardTitle>
            <CardDescription>March 2026</CardDescription>
            <CardAction>
              <Badge variant="success">Ready</Badge>
            </CardAction>
          </CardHeader>
          <CardContent className="text-muted-foreground">
            Revenue is up 12% versus last month across all regions.
          </CardContent>
          <CardFooter className="gap-2">
            <Button size="sm">Download</Button>
            <Button size="sm" variant="ghost">
              Share
            </Button>
          </CardFooter>
        </Card>
      </ComponentDemo>

      <ComponentDemo
        title={t("showcase.s.sizes")}
        previewClassName="block"
        code={`<Card size="sm">…</Card>
<Card size="default">…</Card>
<Card size="lg">…</Card>`}
      >
        <div className="grid w-full gap-4 sm:grid-cols-3">
          {(["sm", "default", "lg"] as const).map((size) => (
            <Card key={size} size={size}>
              <CardHeader>
                <CardTitle>{size}</CardTitle>
                <CardDescription>Spacing scale</CardDescription>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                Padding tracks the size token.
              </CardContent>
            </Card>
          ))}
        </div>
      </ComponentDemo>

      <ComponentDemo
        title={t("showcase.s.examples")}
        previewClassName="block"
        code={`<Card variant="interactive">
  <CardHeader>
    <CardTitle>Storage</CardTitle>
    <CardAction><Badge variant="warning">92%</Badge></CardAction>
  </CardHeader>
  <CardContent>18.4 GB of 20 GB used</CardContent>
</Card>`}
      >
        <div className="grid w-full gap-4 sm:grid-cols-2">
          <Card variant="interactive">
            <CardHeader>
              <CardTitle>Storage</CardTitle>
              <CardDescription>Team plan</CardDescription>
              <CardAction>
                <Badge variant="warning">92%</Badge>
              </CardAction>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              18.4 GB of 20 GB used
            </CardContent>
          </Card>
          <Card variant="elevated">
            <CardHeader>
              <CardTitle>Active users</CardTitle>
              <CardDescription>Last 30 days</CardDescription>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">12,480</CardContent>
            <CardFooter>
              <span className="text-xs text-muted-foreground">
                +8.2% vs previous period
              </span>
            </CardFooter>
          </Card>
        </div>
      </ComponentDemo>
    </ShowcasePage>
  );
}
