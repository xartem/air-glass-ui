import { PlayCircle } from "lucide-react";

import { ComponentDemo, ShowcasePage } from "@/components/component-demo";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

/*
 * Video showcase (W5): responsive embeds that preserve their ratio via
 * AspectRatio. A token placeholder stands in for the media — no network.
 */
export function VideoPage() {
  useLocale();

  const placeholder = (
    <div className="flex size-full flex-col items-center justify-center gap-2 rounded-xl bg-muted text-muted-foreground">
      <PlayCircle className="size-10" />
      <span className="text-xs">{t("showcase.base.video.placeholder")}</span>
    </div>
  );

  return (
    <ShowcasePage
      title={t("showcase.base.video.title")}
      description={t("showcase.base.video.desc")}
      breadcrumb={{ group: t("nav.components.base") }}
    >
      <ComponentDemo
        title={t("showcase.base.video.wide")}
        notes={t("showcase.base.video.note")}
        previewClassName="block"
        code={`<AspectRatio ratio={16 / 9}>
  <iframe title="Preview" className="size-full rounded-xl" />
</AspectRatio>`}
      >
        <div className="w-full max-w-md">
          <AspectRatio ratio={16 / 9}>{placeholder}</AspectRatio>
        </div>
      </ComponentDemo>

      <ComponentDemo
        title={t("showcase.base.video.standard")}
        previewClassName="block"
        code={`<AspectRatio ratio={4 / 3}>
  <iframe title="Preview" className="size-full rounded-xl" />
</AspectRatio>`}
      >
        <div className="w-full max-w-md">
          <AspectRatio ratio={4 / 3}>{placeholder}</AspectRatio>
        </div>
      </ComponentDemo>

      <ComponentDemo
        title={t("showcase.base.video.square")}
        previewClassName="block"
        code={`<AspectRatio ratio={1}>
  <iframe title="Preview" className="size-full rounded-xl" />
</AspectRatio>`}
      >
        <div className="w-full max-w-xs">
          <AspectRatio ratio={1}>{placeholder}</AspectRatio>
        </div>
      </ComponentDemo>
    </ShowcasePage>
  );
}
