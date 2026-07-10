import { ComponentDemo, ShowcasePage } from "@/components/component-demo";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

/*
 * Accordion showcase (W5): the Accordion primitive — single (collapsible) mode,
 * multiple mode, and a FAQ-style example with a default-open item. Static demos.
 */
export function AccordionPage() {
  useLocale();
  return (
    <ShowcasePage
      title={t("showcase.base.accordion.title")}
      description={t("showcase.base.accordion.desc")}
      breadcrumb={{ group: t("nav.components.base") }}
    >
      <ComponentDemo
        title={t("showcase.base.accordion.single")}
        notes={t("showcase.base.accordion.single_note")}
        previewClassName="block"
        code={`<Accordion type="single" collapsible>
  <AccordionItem value="a">
    <AccordionTrigger>What is included?</AccordionTrigger>
    <AccordionContent>Everything in the Team plan.</AccordionContent>
  </AccordionItem>
</Accordion>`}
      >
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="a">
            <AccordionTrigger>What is included in the plan?</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              Unlimited projects, 20 GB storage, and priority support.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="b">
            <AccordionTrigger>Can I change plans later?</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              Yes — upgrade or downgrade at any time from billing settings.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="c">
            <AccordionTrigger>Do you offer refunds?</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              Refunds are available within 14 days of purchase.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </ComponentDemo>

      <ComponentDemo
        title={t("showcase.base.accordion.multiple")}
        previewClassName="block"
        code={`<Accordion type="multiple">
  <AccordionItem value="a">…</AccordionItem>
  <AccordionItem value="b">…</AccordionItem>
</Accordion>`}
      >
        <Accordion
          type="multiple"
          defaultValue={["shipping"]}
          className="w-full"
        >
          <AccordionItem value="shipping">
            <AccordionTrigger>Shipping</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              Orders ship within two business days.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="returns">
            <AccordionTrigger>Returns</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              Return any item within 30 days for a full refund.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="warranty">
            <AccordionTrigger>Warranty</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              All products include a two-year limited warranty.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </ComponentDemo>

      <ComponentDemo
        title={t("showcase.s.examples")}
        previewClassName="block"
        code={`<Accordion type="single" collapsible defaultValue="a">
  <AccordionItem value="a">
    <AccordionTrigger>Account security</AccordionTrigger>
    <AccordionContent>…</AccordionContent>
  </AccordionItem>
</Accordion>`}
      >
        <Accordion
          type="single"
          collapsible
          defaultValue="a"
          className="w-full"
        >
          <AccordionItem value="a">
            <AccordionTrigger>Account security</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              Enable two-factor authentication and review active sessions.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="b">
            <AccordionTrigger>Notifications</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              Choose which events send you email or in-app alerts.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </ComponentDemo>
    </ShowcasePage>
  );
}
