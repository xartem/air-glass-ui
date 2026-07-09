import { useEffect, useState } from "react";
import { ImageIcon, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Modal } from "@/components/modal";
import { EmptyState } from "@/components/empty-state";
import {
  PaginationBar,
  type PaginationMeta,
} from "@/components/pagination-bar";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/*
 * MediaPicker (E6 §3, E2 §7: `media`/`gallery`/`file` → this widget → path).
 * Values are PATH-ONLY (C2) — never absolute URLs. The full-screen media library
 * (D:media) reuses this same picking surface inside a Modal.
 * `loadMedia` is injected by the screen hook (api client + TanStack Query) and
 * is PAGED: (query, page) → items + paginator meta (B7).
 */

export type MediaItem = {
  path: string;
  name: string;
  /** Preview URL resolved by the media provider (media_url on the server side). */
  previewUrl?: string;
};

export type MediaPage = { items: MediaItem[]; pagination: PaginationMeta };

export function MediaTile({
  item,
  selected,
  onClick,
}: {
  item: MediaItem;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative flex aspect-square flex-col overflow-hidden rounded-lg border text-start transition-all",
        selected
          ? "border-primary ring-3 ring-ring/40"
          : "hover:border-ring/60",
      )}
    >
      {item.previewUrl ? (
        <img
          src={item.previewUrl}
          alt={item.name}
          className="size-full object-cover"
        />
      ) : (
        <span className="flex flex-1 items-center justify-center bg-muted text-muted-foreground">
          <ImageIcon className="size-6" />
        </span>
      )}
      {/* Rounded on its own: backdrop-filter children escape the parent's overflow clipping in Chrome */}
      <span className="absolute inset-x-0 bottom-0 truncate rounded-b-[calc(var(--radius-lg)-1px)] bg-background/80 px-1.5 py-0.5 text-[11px] backdrop-blur-sm">
        {item.name}
      </span>
    </button>
  );
}

export function MediaPicker({
  value,
  onChange,
  multiple = false,
  loadMedia,
  resolveUrl,
  className,
}: {
  /** Selected media path(s) — path-only (C2). */
  value: string[];
  onChange: (paths: string[]) => void;
  multiple?: boolean;
  /** Injected paged media source: (query, page) → items + paginator meta (B7). */
  loadMedia: (query: string, page: number) => Promise<MediaPage>;
  /** Resolves a stored path to a preview URL (media provider / media_url). */
  resolveUrl?: (path: string) => string | undefined;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<MediaItem[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [picked, setPicked] = useState<string[]>(value);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    const timer = setTimeout(() => {
      loadMedia(query, page)
        .then((result) => {
          if (cancelled) return;
          setItems(result.items);
          setPagination(result.pagination);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [open, query, page, loadMedia]);

  const togglePick = (path: string) => {
    if (multiple) {
      setPicked((prev) =>
        prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path],
      );
    } else {
      setPicked([path]);
    }
  };

  return (
    <div data-slot="media-picker" className={cn("space-y-2", className)}>
      {/* Selected media render as image thumbnails, not path chips; path lives in the tooltip */}
      <div className="flex flex-wrap gap-2">
        {value.map((path) => {
          const url = resolveUrl?.(path);
          return (
            <div
              key={path}
              title={path}
              className="group relative size-20 overflow-hidden rounded-lg border shadow-xs"
            >
              {url ? (
                <img src={url} alt={path} className="size-full object-cover" />
              ) : (
                <span className="flex size-full items-center justify-center bg-muted text-muted-foreground">
                  <ImageIcon className="size-5" />
                </span>
              )}
              <button
                type="button"
                aria-label={t("media.remove")}
                onClick={() => onChange(value.filter((p) => p !== path))}
                className="absolute top-1 end-1 flex size-5 items-center justify-center rounded-full bg-background/85 opacity-0 backdrop-blur-sm transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 hover:bg-background"
              >
                <X className="size-3" />
              </button>
            </div>
          );
        })}
      </div>

      <Modal
        trigger={
          <Button variant="outline" size="sm">
            <ImageIcon />
            {t("media.choose")}
          </Button>
        }
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (next) setPicked(value);
        }}
        title={t("media.title")}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={() => {
                onChange(picked);
                setOpen(false);
              }}
            >
              {t("common.confirm")}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            placeholder={t("common.search")}
          />
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner className="size-5" />
            </div>
          ) : items.length === 0 ? (
            <EmptyState icon={ImageIcon} title={t("table.empty.title")} />
          ) : (
            <>
              {/* p-1 keeps the selection ring (drawn outside tiles) from being clipped by the scroll container */}
              <div className="grid max-h-96 grid-cols-3 gap-2 overflow-y-auto p-1 sm:grid-cols-4 md:grid-cols-5">
                {items.map((item) => (
                  <MediaTile
                    key={item.path}
                    item={item}
                    selected={picked.includes(item.path)}
                    onClick={() => togglePick(item.path)}
                  />
                ))}
              </div>
              {pagination ? (
                <PaginationBar
                  pagination={pagination}
                  shown={items.length}
                  onPage={setPage}
                  className="border-t pt-2"
                />
              ) : null}
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
