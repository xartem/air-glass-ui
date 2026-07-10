import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { devDebug } from "@/lib/debug";
import { Images } from "lucide-react";

import { api } from "@/api";
import type { GalleryPhoto } from "@/api/types";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

/*
 * /gallery: a filterable masonry image gallery with a lightbox. Images are
 * generated gradient placeholders (no external assets) rendered as lazy <img>;
 * the gradient colors come from the mock-API data layer, not from the UI.
 */

const CATEGORIES = ["all", "nature", "city", "abstract", "people"] as const;

function gradientUri(photo: GalleryPhoto, width = 480): string {
  const height = Math.round(width / photo.ratio);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${photo.from}"/><stop offset="1" stop-color="${photo.to}"/></linearGradient></defs><rect width="${width}" height="${height}" fill="url(#g)"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export function GalleryPage() {
  useLocale();
  const [category, setCategory] = useState<string>("all");
  const [active, setActive] = useState<GalleryPhoto | null>(null);

  const galleryQuery = useQuery({
    queryKey: ["pages", "gallery"],
    queryFn: api.pages.gallery,
  });

  const photos = useMemo(
    () =>
      (galleryQuery.data ?? []).filter(
        (photo) => category === "all" || photo.category === category,
      ),
    [galleryQuery.data, category],
  );

  return (
    <div className="space-y-5">
      <PageHeader
        title={t("gallery.title")}
        icon={Images}
        breadcrumbs={[{ label: t("gallery.title") }]}
      />
      <Panel
        actions={
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((key) => (
              <Button
                key={key}
                size="sm"
                variant={category === key ? "default" : "outline"}
                onClick={() => {
                  devDebug("[GalleryPage] filter", { category: key });
                  setCategory(key);
                }}
              >
                {t(`gallery.category.${key}`)}
              </Button>
            ))}
          </div>
        }
      >
        {galleryQuery.isPending ? (
          <div className="columns-2 gap-3 md:columns-3 lg:columns-4 [&>*]:mb-3">
            {Array.from({ length: 8 }, (_, index) => (
              <Skeleton key={index} className="h-40 w-full rounded-xl" />
            ))}
          </div>
        ) : galleryQuery.isError ? (
          <EmptyState
            title={t("table.error.title")}
            description={t("table.error.description")}
          />
        ) : photos.length === 0 ? (
          <EmptyState
            icon={Images}
            title={t("gallery.empty.title")}
            description={t("gallery.empty.description")}
          />
        ) : (
          <div className="columns-2 gap-3 md:columns-3 lg:columns-4 [&>*]:mb-3">
            {photos.map((photo) => (
              <button
                key={photo.id}
                type="button"
                onClick={() => {
                  devDebug("[GalleryPage] lightbox open", {
                    id: photo.id,
                  });
                  setActive(photo);
                }}
                className="block w-full overflow-hidden rounded-xl border border-[var(--glass-border)] transition-transform hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                <img
                  src={gradientUri(photo)}
                  alt={t(`gallery.category.${photo.category}`)}
                  loading="lazy"
                  className={cn("w-full")}
                  style={{ aspectRatio: String(photo.ratio) }}
                />
              </button>
            ))}
          </div>
        )}
      </Panel>

      <Dialog
        open={active !== null}
        onOpenChange={(open) => !open && setActive(null)}
      >
        <DialogContent className="max-w-3xl overflow-hidden p-0">
          {active ? (
            <>
              <DialogTitle className="sr-only">
                {t(`gallery.category.${active.category}`)}
              </DialogTitle>
              <img
                src={gradientUri(active, 1024)}
                alt={t(`gallery.category.${active.category}`)}
                className="w-full"
                style={{ aspectRatio: String(active.ratio) }}
              />
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
