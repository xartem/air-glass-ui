import { useState } from "react";

import { ComponentDemo, ShowcasePage } from "@/components/component-demo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

/*
 * Animation showcase (W5): tw-animate-css utility classes applied to a token
 * box. Entrance animations replay on click (via a re-mount key); the looping
 * attention animations toggle on and off. Purely visual — no data flow.
 */

const ENTRANCES = [
  { key: "fade", label: "animate-in fade-in", cls: "animate-in fade-in" },
  {
    key: "slide",
    label: "animate-in slide-in-from-bottom",
    cls: "animate-in slide-in-from-bottom-4",
  },
  {
    key: "zoom",
    label: "animate-in zoom-in",
    cls: "animate-in zoom-in-50",
  },
  {
    key: "spin-in",
    label: "animate-in spin-in",
    cls: "animate-in spin-in-90",
  },
] as const;

const LOOPS = [
  { key: "bounce", label: "animate-bounce", cls: "animate-bounce" },
  { key: "pulse", label: "animate-pulse", cls: "animate-pulse" },
  { key: "spin", label: "animate-spin", cls: "animate-spin" },
  { key: "ping", label: "animate-ping", cls: "animate-ping" },
] as const;

const BOX =
  "flex size-20 items-center justify-center rounded-xl bg-primary/15 text-xs font-medium text-primary ring-1 ring-primary/25";

function EntranceDemo() {
  const [entrance, setEntrance] = useState<(typeof ENTRANCES)[number]>(
    ENTRANCES[0],
  );
  const [replay, setReplay] = useState(0);

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {ENTRANCES.map((item) => (
          <Button
            key={item.key}
            variant={entrance.key === item.key ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setEntrance(item);
              setReplay((value) => value + 1);
            }}
          >
            {item.label}
          </Button>
        ))}
      </div>
      <div className="flex h-28 items-center justify-center rounded-lg border border-[var(--glass-border)] bg-background/40">
        <div key={`${entrance.key}-${replay}`} className={cn(BOX, entrance.cls)}>
          {t("showcase.advance.animation.boxLabel")}
        </div>
      </div>
    </div>
  );
}

function LoopDemo() {
  const [loop, setLoop] = useState<(typeof LOOPS)[number] | null>(null);

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {LOOPS.map((item) => (
          <Button
            key={item.key}
            variant={loop?.key === item.key ? "default" : "outline"}
            size="sm"
            onClick={() =>
              setLoop((current) => (current?.key === item.key ? null : item))
            }
          >
            {item.label}
          </Button>
        ))}
      </div>
      <div className="flex h-28 items-center justify-center rounded-lg border border-[var(--glass-border)] bg-background/40">
        <div className={cn(BOX, loop?.cls)}>
          {t("showcase.advance.animation.boxLabel")}
        </div>
      </div>
    </div>
  );
}

export function AnimationPage() {
  useLocale();
  return (
    <ShowcasePage
      title={t("showcase.advance.animation.title")}
      description={t("showcase.advance.animation.desc")}
      breadcrumb={{ group: t("nav.components.advance") }}
    >
      <ComponentDemo
        title={t("showcase.advance.animation.entrances")}
        previewClassName="flex-col items-stretch"
        code={`<div key={replay} className="animate-in fade-in">Box</div>`}
      >
        <EntranceDemo />
      </ComponentDemo>

      <ComponentDemo
        title={t("showcase.advance.animation.attention")}
        notes={t("showcase.advance.animation.note")}
        previewClassName="flex-col items-stretch"
        code={`<div className="animate-bounce">Box</div>
<div className="animate-pulse">Box</div>
<div className="animate-spin">Box</div>
<div className="animate-ping">Box</div>`}
      >
        <LoopDemo />
      </ComponentDemo>
    </ShowcasePage>
  );
}
