import { useState } from "react";
import { Compass, Layers, Settings2, Sparkles } from "lucide-react";

import { ComponentDemo, ShowcasePage } from "@/components/component-demo";
import { Tour, type TourStep } from "@/components/tour";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

/*
 * Tour showcase (W5): the Tour gap primitive — a coach-mark walkthrough over
 * real elements on this page. Steps point at CSS selectors; open state is
 * controlled here. The primitive logs its own step changes internally.
 */
export function TourPage() {
  useLocale();
  const [open, setOpen] = useState(false);

  const steps: TourStep[] = [
    {
      target: "#tour-overview",
      title: t("showcase.advance.tour.step1Title"),
      content: t("showcase.advance.tour.step1Text"),
    },
    {
      target: "#tour-layers",
      title: t("showcase.advance.tour.step2Title"),
      content: t("showcase.advance.tour.step2Text"),
    },
    {
      target: "#tour-settings",
      title: t("showcase.advance.tour.step3Title"),
      content: t("showcase.advance.tour.step3Text"),
    },
  ];

  return (
    <ShowcasePage
      title={t("showcase.advance.tour.title")}
      description={t("showcase.advance.tour.desc")}
      breadcrumb={{ group: t("nav.components.advance") }}
    >
      <ComponentDemo
        title={t("showcase.s.default")}
        notes={t("showcase.advance.tour.note")}
        previewClassName="flex-col items-stretch"
        code={`const [open, setOpen] = useState(false);

const steps = [
  { target: "#tour-overview", title: "Overview", content: "…" },
  { target: "#tour-layers", title: "Layers", content: "…" },
  { target: "#tour-settings", title: "Settings", content: "…" },
];

<Button onClick={() => setOpen(true)}>Start tour</Button>
<Tour steps={steps} open={open} onOpenChange={setOpen} />`}
      >
        <div className="flex w-full flex-col gap-4">
          <Button
            id="tour-overview"
            className="self-start"
            onClick={() => setOpen(true)}
          >
            <Compass />
            {t("showcase.advance.tour.start")}
          </Button>

          <div className="grid gap-3 sm:grid-cols-2">
            <div
              id="tour-layers"
              className="flex items-start gap-3 rounded-xl border border-[var(--glass-border)] bg-background/40 p-4"
            >
              <Layers className="size-5 text-primary" />
              <div>
                <p className="text-sm font-medium">
                  {t("showcase.advance.tour.card1Title")}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {t("showcase.advance.tour.card1Text")}
                </p>
              </div>
            </div>
            <div
              id="tour-settings"
              className="flex items-start gap-3 rounded-xl border border-[var(--glass-border)] bg-background/40 p-4"
            >
              <Settings2 className="size-5 text-primary" />
              <div>
                <p className="text-sm font-medium">
                  {t("showcase.advance.tour.card2Title")}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {t("showcase.advance.tour.card2Text")}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="size-4" />
            {t("showcase.advance.tour.hint")}
          </div>
        </div>

        <Tour steps={steps} open={open} onOpenChange={setOpen} />
      </ComponentDemo>
    </ShowcasePage>
  );
}
