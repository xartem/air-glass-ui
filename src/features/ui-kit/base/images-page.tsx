import { ComponentDemo, ShowcasePage } from "@/components/component-demo";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

/*
 * Images showcase (W5): responsive image treatments — AspectRatio boxes, the
 * object-fit cover behaviour, and rounded/shape variants. Sources are token
 * gradient placeholders or an inline SVG data-URI (no external URLs, no hex).
 */

// Inline SVG data-URI placeholder (named colors only — no hard-coded hex).
const PLACEHOLDER =
  "data:image/svg+xml," +
  encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' width='480' height='320'>" +
      "<defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>" +
      "<stop offset='0' stop-color='slateblue'/>" +
      "<stop offset='1' stop-color='teal'/></linearGradient></defs>" +
      "<rect width='480' height='320' fill='url(#g)'/></svg>",
  );

/** A token-gradient placeholder surface used to fill aspect-ratio boxes. */
function GradientFill({ className }: { className?: string }) {
  return (
    <div
      className={cn("size-full", className)}
      style={{
        backgroundImage:
          "linear-gradient(135deg, var(--chart-1), var(--chart-3))",
      }}
    />
  );
}

export function ImagesPage() {
  useLocale();
  return (
    <ShowcasePage
      title={t("showcase.base.images.title")}
      description={t("showcase.base.images.desc")}
      breadcrumb={{ group: t("nav.components.base") }}
    >
      <ComponentDemo
        title={t("showcase.base.images.ratios")}
        previewClassName="block"
        code={`<AspectRatio ratio={16 / 9}>
  <img src={src} className="size-full rounded-lg object-cover" />
</AspectRatio>`}
      >
        <div className="grid w-full gap-4 sm:grid-cols-3">
          {(
            [
              { label: "16 / 9", ratio: 16 / 9 },
              { label: "4 / 3", ratio: 4 / 3 },
              { label: "1 / 1", ratio: 1 },
            ] as const
          ).map((item) => (
            <div key={item.label} className="space-y-1.5">
              <AspectRatio
                ratio={item.ratio}
                className="overflow-hidden rounded-lg ring-1 ring-foreground/10"
              >
                <GradientFill />
              </AspectRatio>
              <code className="text-[11px] text-muted-foreground">
                {item.label}
              </code>
            </div>
          ))}
        </div>
      </ComponentDemo>

      <ComponentDemo
        title={t("showcase.base.images.fit")}
        notes={t("showcase.base.images.note")}
        previewClassName="block"
        code={`<img src={src} className="size-full object-cover" />
<img src={src} className="size-full object-contain" />
<img src={src} className="size-full object-fill" />`}
      >
        <div className="grid w-full gap-4 sm:grid-cols-3">
          {(["cover", "contain", "fill"] as const).map((fit) => (
            <div key={fit} className="space-y-1.5">
              <AspectRatio
                ratio={1}
                className="overflow-hidden rounded-lg bg-muted ring-1 ring-foreground/10"
              >
                <img
                  src={PLACEHOLDER}
                  alt=""
                  className={cn(
                    "size-full",
                    fit === "cover" && "object-cover",
                    fit === "contain" && "object-contain",
                    fit === "fill" && "object-fill",
                  )}
                />
              </AspectRatio>
              <code className="text-[11px] text-muted-foreground">
                object-{fit}
              </code>
            </div>
          ))}
        </div>
      </ComponentDemo>

      <ComponentDemo
        title={t("showcase.base.images.rounded")}
        previewClassName="block"
        code={`<img className="rounded-lg" />
<img className="rounded-2xl" />
<img className="rounded-full aspect-square" />`}
      >
        <div className="grid w-full items-end gap-4 sm:grid-cols-4">
          {(
            [
              { label: "rounded-md", className: "rounded-md" },
              { label: "rounded-lg", className: "rounded-lg" },
              { label: "rounded-2xl", className: "rounded-2xl" },
              { label: "rounded-full", className: "rounded-full" },
            ] as const
          ).map((shape) => (
            <div key={shape.label} className="space-y-1.5">
              <div
                className={cn(
                  "aspect-square overflow-hidden ring-1 ring-foreground/10",
                  shape.className,
                )}
              >
                <GradientFill />
              </div>
              <code className="text-[11px] text-muted-foreground">
                {shape.label}
              </code>
            </div>
          ))}
        </div>
      </ComponentDemo>
    </ShowcasePage>
  );
}
