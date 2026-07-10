import { Command } from "lucide-react";

import { ComponentDemo, ShowcasePage } from "@/components/component-demo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

/*
 * General showcase (W5): a gallery of small utility primitives — separators,
 * keyboard keys, tooltips and avatars. Static docs demo.
 */
export function GeneralPage() {
  useLocale();

  return (
    <ShowcasePage
      title={t("showcase.base.general.title")}
      description={t("showcase.base.general.desc")}
      breadcrumb={{ group: t("nav.components.base") }}
    >
      <ComponentDemo
        title={t("showcase.base.general.separators")}
        notes={t("showcase.base.general.note")}
        previewClassName="block"
        code={`<Separator />
<div className="flex h-5 items-center gap-3">
  <span>Item</span>
  <Separator orientation="vertical" />
  <span>Item</span>
</div>`}
      >
        <div className="w-full max-w-sm space-y-4">
          <Separator />
          <div className="flex h-5 items-center gap-3 text-sm text-muted-foreground">
            <span>{t("showcase.base.lists.row1")}</span>
            <Separator orientation="vertical" />
            <span>{t("showcase.base.lists.row2")}</span>
            <Separator orientation="vertical" />
            <span>{t("showcase.base.lists.row3")}</span>
          </div>
        </div>
      </ComponentDemo>

      <ComponentDemo
        title={t("showcase.base.general.kbd")}
        code={`<Kbd>Esc</Kbd>
<KbdGroup>
  <Kbd><Command /></Kbd>
  <Kbd>K</Kbd>
</KbdGroup>`}
      >
        <Kbd>Esc</Kbd>
        <Kbd>Enter</Kbd>
        <KbdGroup>
          <Kbd>
            <Command />
          </Kbd>
          <Kbd>K</Kbd>
        </KbdGroup>
        <KbdGroup>
          <Kbd>Shift</Kbd>
          <Kbd>?</Kbd>
        </KbdGroup>
      </ComponentDemo>

      <ComponentDemo
        title={t("showcase.base.general.tooltips")}
        code={`<Tooltip>
  <TooltipTrigger asChild>
    <Button variant="outline">Hover me</Button>
  </TooltipTrigger>
  <TooltipContent>More information</TooltipContent>
</Tooltip>`}
      >
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline">
                {t("showcase.base.general.hover")}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {t("showcase.base.general.tooltipText")}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </ComponentDemo>

      <ComponentDemo
        title={t("showcase.base.general.avatars")}
        code={`<Avatar size="sm"><AvatarFallback>AT</AvatarFallback></Avatar>
<Avatar><AvatarFallback>LC</AvatarFallback></Avatar>
<Avatar size="lg"><AvatarFallback>NB</AvatarFallback></Avatar>`}
      >
        <Avatar size="sm">
          <AvatarFallback>AT</AvatarFallback>
        </Avatar>
        <Avatar>
          <AvatarFallback>LC</AvatarFallback>
        </Avatar>
        <Avatar size="lg">
          <AvatarFallback>NB</AvatarFallback>
        </Avatar>
      </ComponentDemo>
    </ShowcasePage>
  );
}
