import { ComponentDemo, ShowcasePage } from "@/components/component-demo";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

/*
 * Carousel showcase (W5): the embla-backed Carousel primitive — a basic single
 * slide view, a multi-item layout via basis utilities, and a vertical variant.
 * Static demos — no data flow.
 */

const SLIDES = [1, 2, 3, 4, 5];

/** A token-styled slide face used across the demos. */
function Slide({ index }: { index: number }) {
  return (
    <div className="flex aspect-square items-center justify-center rounded-xl bg-muted text-3xl font-semibold text-muted-foreground ring-1 ring-foreground/10">
      {index}
    </div>
  );
}

export function CarouselPage() {
  useLocale();
  return (
    <ShowcasePage
      title={t("showcase.base.carousel.title")}
      description={t("showcase.base.carousel.desc")}
      breadcrumb={{ group: t("nav.components.base") }}
    >
      <ComponentDemo
        title={t("showcase.s.default")}
        notes={t("showcase.base.carousel.note")}
        previewClassName="block"
        code={`<Carousel className="w-full max-w-xs">
  <CarouselContent>
    {slides.map((n) => (
      <CarouselItem key={n}>
        <Slide index={n} />
      </CarouselItem>
    ))}
  </CarouselContent>
  <CarouselPrevious />
  <CarouselNext />
</Carousel>`}
      >
        <Carousel className="mx-auto w-full max-w-xs px-12">
          <CarouselContent>
            {SLIDES.map((index) => (
              <CarouselItem key={index}>
                <Slide index={index} />
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </ComponentDemo>

      <ComponentDemo
        title={t("showcase.base.carousel.multiple")}
        previewClassName="block"
        code={`<Carousel className="w-full max-w-md">
  <CarouselContent>
    {slides.map((n) => (
      <CarouselItem key={n} className="basis-1/2 md:basis-1/3">
        <Slide index={n} />
      </CarouselItem>
    ))}
  </CarouselContent>
  <CarouselPrevious />
  <CarouselNext />
</Carousel>`}
      >
        <Carousel className="mx-auto w-full max-w-md px-12">
          <CarouselContent>
            {SLIDES.map((index) => (
              <CarouselItem key={index} className="basis-1/2 md:basis-1/3">
                <Slide index={index} />
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </ComponentDemo>

      <ComponentDemo
        title={t("showcase.base.carousel.vertical")}
        previewClassName="block"
        code={`<Carousel orientation="vertical" className="w-full max-w-xs">
  <CarouselContent className="h-64">
    {slides.map((n) => (
      <CarouselItem key={n} className="basis-1/2">
        <Slide index={n} />
      </CarouselItem>
    ))}
  </CarouselContent>
  <CarouselPrevious />
  <CarouselNext />
</Carousel>`}
      >
        <Carousel
          orientation="vertical"
          className="mx-auto w-full max-w-[10rem] py-12"
        >
          <CarouselContent className="h-64">
            {SLIDES.map((index) => (
              <CarouselItem key={index} className="basis-1/2">
                <Slide index={index} />
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </ComponentDemo>
    </ShowcasePage>
  );
}
