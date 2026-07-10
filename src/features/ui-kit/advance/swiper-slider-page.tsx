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
 * Swiper / Slider showcase (W5): carousels built on the shadcn Carousel (Embla)
 * primitive this template ships instead of Swiper. Basic looped slider plus a
 * multi-per-view variant. Static demos.
 */

const SLIDES = [1, 2, 3, 4, 5];

export function SwiperSliderPage() {
  useLocale();
  return (
    <ShowcasePage
      title={t("showcase.advance.swiperSlider.title")}
      description={t("showcase.advance.swiperSlider.desc")}
      breadcrumb={{ group: t("nav.components.advance") }}
    >
      <ComponentDemo
        title={t("showcase.s.default")}
        notes={t("showcase.advance.swiperSlider.note")}
        previewClassName="justify-center"
        code={`<Carousel opts={{ loop: true }} className="w-full max-w-sm">
  <CarouselContent>
    {slides.map((slide) => (
      <CarouselItem key={slide}>Slide {slide}</CarouselItem>
    ))}
  </CarouselContent>
  <CarouselPrevious />
  <CarouselNext />
</Carousel>`}
      >
        <Carousel opts={{ loop: true }} className="w-full max-w-sm">
          <CarouselContent>
            {SLIDES.map((slide) => (
              <CarouselItem key={slide}>
                <div className="flex aspect-video items-center justify-center rounded-xl bg-primary/10 text-2xl font-semibold text-primary ring-1 ring-primary/20">
                  {t("showcase.advance.swiperSlider.slide", {
                    n: String(slide),
                  })}
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </ComponentDemo>

      <ComponentDemo
        title={t("showcase.advance.swiperSlider.multiView")}
        previewClassName="justify-center"
        code={`<Carousel opts={{ align: "start", loop: true }} className="w-full max-w-md">
  <CarouselContent>
    {slides.map((slide) => (
      <CarouselItem key={slide} className="basis-1/2 md:basis-1/3">
        Slide {slide}
      </CarouselItem>
    ))}
  </CarouselContent>
  <CarouselPrevious />
  <CarouselNext />
</Carousel>`}
      >
        <Carousel
          opts={{ align: "start", loop: true }}
          className="w-full max-w-md"
        >
          <CarouselContent>
            {SLIDES.map((slide) => (
              <CarouselItem key={slide} className="basis-1/2 md:basis-1/3">
                <div className="flex aspect-square items-center justify-center rounded-xl bg-background/40 text-lg font-semibold ring-1 ring-[var(--glass-border)]">
                  {slide}
                </div>
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
