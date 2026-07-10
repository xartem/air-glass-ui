import { useState } from "react";

import { ComponentDemo, ShowcasePage } from "@/components/component-demo";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

/*
 * Range slider showcase (W5): the Radix-backed Slider — single-thumb and
 * two-thumb range variants, stepped values and the disabled state. Controlled
 * through useState (arrays of numbers).
 */
export function RangeSliderPage() {
  useLocale();
  const [volume, setVolume] = useState<number[]>([40]);
  const [price, setPrice] = useState<number[]>([200, 800]);
  const [rating, setRating] = useState<number[]>([3]);

  return (
    <ShowcasePage
      title={t("showcase.forms.rangeSlider.title")}
      description={t("showcase.forms.rangeSlider.desc")}
      breadcrumb={{ group: t("nav.components.forms") }}
    >
      <ComponentDemo
        title={t("showcase.forms.s.single")}
        previewClassName="block"
        code={`const [volume, setVolume] = useState<number[]>([40]);

<Slider value={volume} onValueChange={setVolume} min={0} max={100} />`}
      >
        <div className="w-full max-w-md space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="slider-volume">
              {t("showcase.forms.rangeSlider.volume")}
            </Label>
            <span className="text-sm text-muted-foreground tabular-nums">
              {volume[0]}
            </span>
          </div>
          <Slider
            id="slider-volume"
            value={volume}
            onValueChange={setVolume}
            min={0}
            max={100}
          />
        </div>
      </ComponentDemo>

      <ComponentDemo
        title={t("showcase.forms.s.range")}
        previewClassName="block"
        notes={t("showcase.forms.rangeSlider.rangeNote")}
        code={`const [price, setPrice] = useState<number[]>([200, 800]);

<Slider value={price} onValueChange={setPrice} min={0} max={1000} step={50} />`}
      >
        <div className="w-full max-w-md space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="slider-price">
              {t("showcase.forms.rangeSlider.price")}
            </Label>
            <span className="text-sm text-muted-foreground tabular-nums">
              ${price[0]} – ${price[1]}
            </span>
          </div>
          <Slider
            id="slider-price"
            value={price}
            onValueChange={setPrice}
            min={0}
            max={1000}
            step={50}
          />
        </div>
      </ComponentDemo>

      <ComponentDemo
        title={t("showcase.forms.s.steps")}
        previewClassName="block"
        notes={t("showcase.forms.rangeSlider.stepsNote")}
        code={`<Slider value={rating} onValueChange={setRating} min={1} max={5} step={1} />`}
      >
        <div className="w-full max-w-md space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="slider-rating">
              {t("showcase.forms.rangeSlider.rating")}
            </Label>
            <span className="text-sm text-muted-foreground tabular-nums">
              {rating[0]} / 5
            </span>
          </div>
          <Slider
            id="slider-rating"
            value={rating}
            onValueChange={setRating}
            min={1}
            max={5}
            step={1}
          />
          <div className="flex justify-between px-0.5 text-[11px] text-muted-foreground">
            {[1, 2, 3, 4, 5].map((mark) => (
              <span key={mark}>{mark}</span>
            ))}
          </div>
        </div>
      </ComponentDemo>

      <ComponentDemo
        title={t("showcase.s.disabled")}
        previewClassName="block"
        code={`<Slider defaultValue={[60]} disabled />`}
      >
        <div className="w-full max-w-md">
          <Slider defaultValue={[60]} min={0} max={100} disabled />
        </div>
      </ComponentDemo>
    </ShowcasePage>
  );
}
