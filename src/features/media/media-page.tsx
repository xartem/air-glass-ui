import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronRight,
  FileText,
  FolderOpen,
  Image as ImageIcon,
  LayoutGrid,
  List as ListIcon,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

import { api, type MediaListItem } from "@/api";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { SearchInput } from "@/components/toolbar";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useSiteDateTime } from "@/lib/datetime";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { NavIcon } from "@/app/nav";

/*
 * /media (build-demo-screen-catalog): the demo file manager. A folder rail
 * (virtual folders derived from file type) + breadcrumb, a grid/list view
 * toggle, image thumbnails / type icons, single selection with a details
 * preview panel, and a mock upload affordance. Consumes the existing
 * api.media.list fixture. Reachable with media.view.
 */

type FolderKey = "all" | "images" | "documents";
type ViewMode = "grid" | "list";

const IMAGE_RE = /\.(jpe?g|png|svg|webp|gif|avif)$/i;

const FOLDERS: {
  key: FolderKey;
  icon: NavIcon;
  match: (name: string) => boolean;
}[] = [
  { key: "all", icon: FolderOpen, match: () => true },
  { key: "images", icon: ImageIcon, match: (name) => IMAGE_RE.test(name) },
  { key: "documents", icon: FileText, match: (name) => !IMAGE_RE.test(name) },
];

function isImage(name: string): boolean {
  return IMAGE_RE.test(name);
}

function extension(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot >= 0 ? name.slice(dot + 1).toUpperCase() : t("media.fm.file");
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(value < 10 ? 1 : 0)} ${units[unit]}`;
}

export function MediaPage() {
  const [folder, setFolder] = useState<FolderKey>("all");
  const [view, setView] = useState<ViewMode>("grid");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ["media", "fm", search],
    queryFn: () => api.media.list(search, 1),
    placeholderData: (previous) => previous,
  });

  const matcher = FOLDERS.find((entry) => entry.key === folder)!.match;
  const files = useMemo(
    () => (query.data?.rows ?? []).filter((file) => matcher(file.name)),
    [query.data, matcher],
  );

  const selectedFile = files.find((file) => file.path === selected) ?? null;

  const browse = (nextFolder: FolderKey) => {
    console.debug("[MediaPage] browse", { folder: nextFolder, view });
    setFolder(nextFolder);
    setSelected(null);
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title={t("media.fm.title")}
        icon={FolderOpen}
        primaryAction={{
          label: t("media.fm.upload"),
          icon: <Upload />,
          permission: "media.manage",
          onClick: () => {
            console.debug("[MediaPage] upload");
            toast.info(t("media.fm.upload_demo"));
          },
        }}
      />

      <div className="grid gap-4 lg:grid-cols-[12rem_1fr_16rem]">
        {/* folder rail */}
        <aside className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
          {FOLDERS.map(({ key, icon: Icon, match }) => {
            const count = (query.data?.rows ?? []).filter((file) =>
              match(file.name),
            ).length;
            return (
              <button
                key={key}
                type="button"
                onClick={() => browse(key)}
                className={cn(
                  "flex shrink-0 items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm transition-colors lg:w-full",
                  folder === key
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-accent/40",
                )}
                aria-current={folder === key ? "true" : undefined}
              >
                <span className="flex items-center gap-2">
                  <Icon className="size-4" />
                  {t(`media.fm.folder.${key}`)}
                </span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {count}
                </span>
              </button>
            );
          })}
        </aside>

        {/* file grid / list */}
        <Panel contentClassName="p-3">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <nav
              aria-label={t("media.fm.breadcrumb")}
              className="flex items-center gap-1 text-sm text-muted-foreground"
            >
              <span>{t("media.fm.title")}</span>
              <ChevronRight className="size-3.5 rtl:rotate-180" />
              <span className="font-medium text-foreground">
                {t(`media.fm.folder.${folder}`)}
              </span>
            </nav>
            <div className="flex items-center gap-2">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder={t("media.fm.search_placeholder")}
                className="w-44"
              />
              <ToggleGroup
                type="single"
                value={view}
                onValueChange={(value) => value && setView(value as ViewMode)}
                variant="outline"
                size="sm"
                aria-label={t("media.fm.view")}
              >
                <ToggleGroupItem
                  value="grid"
                  aria-label={t("media.fm.view_grid")}
                >
                  <LayoutGrid className="size-4" />
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="list"
                  aria-label={t("media.fm.view_list")}
                >
                  <ListIcon className="size-4" />
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>

          {query.isPending ? (
            <div
              className={cn(
                view === "grid"
                  ? "grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4"
                  : "space-y-1",
              )}
            >
              {Array.from({ length: 8 }, (_, index) => (
                <Skeleton
                  key={index}
                  className={
                    view === "grid"
                      ? "aspect-square rounded-xl"
                      : "h-12 rounded-lg"
                  }
                />
              ))}
            </div>
          ) : query.isError ? (
            <EmptyState
              icon={FolderOpen}
              title={t("table.error.title")}
              description={t("table.error.description")}
              action={{
                label: t("common.retry"),
                onClick: () => void query.refetch(),
              }}
            />
          ) : files.length === 0 ? (
            <EmptyState
              icon={FolderOpen}
              title={t("media.fm.empty")}
              description={t("media.fm.empty_hint")}
            />
          ) : view === "grid" ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {files.map((file) => (
                <FileTile
                  key={file.path}
                  file={file}
                  active={file.path === selected}
                  onSelect={() => setSelected(file.path)}
                />
              ))}
            </div>
          ) : (
            <ul className="divide-y divide-border/40">
              {files.map((file) => (
                <FileRow
                  key={file.path}
                  file={file}
                  active={file.path === selected}
                  onSelect={() => setSelected(file.path)}
                />
              ))}
            </ul>
          )}
        </Panel>

        {/* details / preview */}
        <aside className="hidden lg:block">
          {selectedFile ? (
            <DetailsPanel file={selectedFile} />
          ) : (
            <div className="glass-card flex h-full items-center justify-center rounded-2xl p-6">
              <p className="text-center text-sm text-muted-foreground">
                {t("media.fm.no_selection")}
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function FileThumb({
  file,
  className,
}: {
  file: MediaListItem;
  className?: string;
}) {
  if (isImage(file.name) && file.preview_url) {
    return (
      <img
        src={file.preview_url}
        alt=""
        className={cn("object-cover", className)}
        loading="lazy"
      />
    );
  }
  return (
    <div className={cn("flex items-center justify-center bg-muted", className)}>
      <FileText className="size-8 text-muted-foreground" />
    </div>
  );
}

function FileTile({
  file,
  active,
  onSelect,
}: {
  file: MediaListItem;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "group flex flex-col overflow-hidden rounded-xl border text-start transition-colors",
        active
          ? "border-primary ring-2 ring-primary/40"
          : "border-border/50 hover:border-primary/40",
      )}
      aria-pressed={active}
    >
      <FileThumb file={file} className="aspect-square w-full" />
      <span className="truncate px-2 py-1.5 text-xs font-medium">
        {file.name}
      </span>
    </button>
  );
}

function FileRow({
  file,
  active,
  onSelect,
}: {
  file: MediaListItem;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          "flex w-full items-center gap-3 rounded-lg px-2 py-2 text-start text-sm transition-colors",
          active ? "bg-primary/5" : "hover:bg-accent/40",
        )}
        aria-pressed={active}
      >
        <FileThumb file={file} className="size-9 shrink-0 rounded-md" />
        <span className="min-w-0 flex-1 truncate font-medium">{file.name}</span>
        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
          {file.size !== undefined ? formatBytes(file.size) : ""}
        </span>
      </button>
    </li>
  );
}

function DetailsPanel({ file }: { file: MediaListItem }) {
  const dt = useSiteDateTime();
  return (
    <div className="glass-card flex flex-col gap-3 rounded-2xl p-4">
      <FileThumb file={file} className="aspect-video w-full rounded-xl" />
      <div>
        <p className="truncate text-sm font-semibold" title={file.name}>
          {file.name}
        </p>
        <p className="truncate text-xs text-muted-foreground">{file.path}</p>
      </div>
      <dl className="space-y-1.5 text-sm">
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">
            {t("media.fm.details.type")}
          </dt>
          <dd className="font-medium">{extension(file.name)}</dd>
        </div>
        {file.size !== undefined ? (
          <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">
              {t("media.fm.details.size")}
            </dt>
            <dd className="font-medium tabular-nums">
              {formatBytes(file.size)}
            </dd>
          </div>
        ) : null}
        {file.modified_at ? (
          <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">
              {t("media.fm.details.modified")}
            </dt>
            <dd className="font-medium tabular-nums">
              {dt.format(file.modified_at)}
            </dd>
          </div>
        ) : null}
      </dl>
    </div>
  );
}
