import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeftRight,
  Droplet,
  Image as ImageIcon,
  Palette,
  Sparkles,
  SlidersHorizontal,
  Square,
} from "lucide-react";
import { toast } from "sonner";

import {
  api,
  type AppearanceBg,
  type AppearanceDir,
  type AppearanceSettings,
  type AppearanceStyle,
} from "@/api";
import { MediaPicker, type MediaPage } from "@/components/media-picker";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { SaveBar } from "@/components/save-bar";
import { Slider } from "@/components/ui/slider";
import { STYLE_BASELINES, applyAppearance } from "@/lib/appearance";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const STYLE_META: { key: AppearanceStyle; icon: typeof Droplet }[] = [
  { key: "glass", icon: Droplet },
  { key: "liquid", icon: Sparkles },
  { key: "flat", icon: Square },
];

const BG_KEYS: AppearanceBg[] = ["air", "aurora", "calm", "plain", "custom"];

const DIR_KEYS: AppearanceDir[] = ["ltr", "rtl"];

/** Simplified swatch gradients mirroring the .app-mesh presets (index.css) for the picker tiles. */
const BG_SWATCH: Record<"light" | "dark", Record<AppearanceBg, string>> = {
  light: {
    air: "linear-gradient(135deg, #bfdbfe, #a7f3d0 60%, #fde68a)",
    aurora: "linear-gradient(135deg, #81bbfd, #6ee7b7 55%, #f4a0d2)",
    calm: "linear-gradient(135deg, #dbeafe, #eef2ff)",
    plain: "linear-gradient(135deg, #f7fafe, #f4f7fc)",
    custom: "",
  },
  dark: {
    air: "linear-gradient(135deg, #1e3a5f, #14532d 60%, #3b2a1a)",
    aurora: "linear-gradient(135deg, #2563a8, #2d8c70 55%, #a04a78)",
    calm: "linear-gradient(135deg, #14294a, #0e1524)",
    plain: "linear-gradient(135deg, #0b1220, #0d1424)",
    custom: "",
  },
};

/** Paged media source for the custom-background picker (maps the Admin API paginator). */
function loadMedia(query: string, page: number): Promise<MediaPage> {
  return api.media.list(query, page).then((res) => ({
    items: res.rows.map((m) => ({
      path: m.path,
      name: m.name,
      previewUrl: m.preview_url,
    })),
    pagination: {
      page: res.page,
      pages: Math.max(1, Math.ceil(res.total / res.per_page)),
      total: res.total,
      perPage: res.per_page,
    },
  }));
}

export function AppearancePage() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["appearance"],
    queryFn: api.appearance.get,
    staleTime: 60_000,
  });

  const [draft, setDraft] = useState<AppearanceSettings | null>(null);
  // Latest saved config — used to revert the live preview when leaving unsaved.
  const savedRef = useRef<AppearanceSettings | null>(null);
  savedRef.current = query.data ?? savedRef.current;

  useEffect(() => {
    if (query.data && draft === null) setDraft(query.data);
  }, [query.data, draft]);

  // Live preview: reflect the draft onto <html> as the user edits.
  useEffect(() => {
    if (draft) applyAppearance(draft);
  }, [draft]);
  // On leave, restore the saved config so an unsaved preview never sticks.
  useEffect(
    () => () => {
      if (savedRef.current) applyAppearance(savedRef.current);
    },
    [],
  );

  const dirty = useMemo(
    () =>
      Boolean(
        draft &&
        query.data &&
        JSON.stringify(draft) !== JSON.stringify(query.data),
      ),
    [draft, query.data],
  );

  const saveMutation = useMutation({
    mutationFn: (payload: AppearanceSettings) => api.appearance.save(payload),
    onSuccess: async () => {
      toast.success(t("settings.appearance.saved"));
      await queryClient.invalidateQueries({ queryKey: ["appearance"] });
    },
  });

  if (!draft) {
    return (
      <div className="space-y-4">
        <PageHeader title={t("settings.appearance.title")} icon={Palette} />
        <Panel>
          <div className="h-40 animate-pulse rounded-lg bg-muted" />
        </Panel>
      </div>
    );
  }

  const patch = (next: Partial<AppearanceSettings>) =>
    setDraft((d) => (d ? { ...d, ...next } : d));
  const setToken = (
    key: keyof AppearanceSettings["tokens"],
    value: number | string,
  ) =>
    setDraft((d) => (d ? { ...d, tokens: { ...d.tokens, [key]: value } } : d));
  // Switching style adopts that style's token baseline (keeps the accent).
  const selectStyle = (style: AppearanceStyle) =>
    setDraft((d) =>
      d
        ? {
            ...d,
            style,
            tokens: { ...STYLE_BASELINES[style], accent: d.tokens.accent },
          }
        : d,
    );

  return (
    <div className="space-y-4 pb-24">
      <PageHeader title={t("settings.appearance.title")} icon={Palette} />

      {/* Style */}
      <Panel
        icon={Palette}
        title={t("settings.appearance.style")}
        description={t("settings.appearance.style_desc")}
      >
        <div className="grid gap-3 sm:grid-cols-3">
          {STYLE_META.map(({ key, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => selectStyle(key)}
              aria-pressed={draft.style === key}
              className={cn(
                "flex flex-col items-start gap-2 rounded-xl border p-4 text-start transition-all",
                draft.style === key
                  ? "border-primary ring-3 ring-ring/40"
                  : "hover:border-ring/60",
              )}
            >
              <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="size-5" />
              </span>
              <span className="text-sm font-medium">
                {t(`settings.appearance.style.${key}`)}
              </span>
              <span className="text-xs text-muted-foreground">
                {t(`settings.appearance.style.${key}_desc`)}
              </span>
            </button>
          ))}
        </div>
      </Panel>

      {/* Direction */}
      <Panel
        icon={ArrowLeftRight}
        title={t("settings.appearance.direction")}
        description={t("settings.appearance.direction_desc")}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {DIR_KEYS.map((dir) => (
            <button
              key={dir}
              type="button"
              onClick={() => patch({ dir })}
              aria-pressed={draft.dir === dir}
              className={cn(
                "flex items-center gap-3 rounded-xl border p-4 text-start transition-all",
                draft.dir === dir
                  ? "border-primary ring-3 ring-ring/40"
                  : "hover:border-ring/60",
              )}
            >
              <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <ArrowLeftRight
                  className={cn("size-5", dir === "rtl" && "-scale-x-100")}
                />
              </span>
              <span className="text-sm font-medium">
                {t(`settings.appearance.dir.${dir}`)}
              </span>
            </button>
          ))}
        </div>
      </Panel>

      {/* Backgrounds */}
      <Panel
        icon={ImageIcon}
        title={t("settings.appearance.bg")}
        description={t("settings.appearance.bg_desc")}
      >
        <div className="space-y-6">
          {(["light", "dark"] as const).map((theme) => {
            const active = theme === "light" ? draft.bgLight : draft.bgDark;
            const customValue =
              theme === "light" ? draft.customLight : draft.customDark;
            const setBg = (bg: AppearanceBg) =>
              patch(theme === "light" ? { bgLight: bg } : { bgDark: bg });
            const setCustom = (path: string | null) =>
              patch(
                theme === "light"
                  ? { customLight: path }
                  : { customDark: path },
              );
            return (
              <div key={theme} className="space-y-3">
                <p className="text-sm font-medium">
                  {t(`settings.appearance.bg_${theme}`)}
                </p>
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
                  {BG_KEYS.map((bg) => (
                    <button
                      key={bg}
                      type="button"
                      onClick={() => setBg(bg)}
                      aria-pressed={active === bg}
                      className={cn(
                        "flex flex-col items-center gap-1.5 rounded-lg border p-2 transition-all",
                        active === bg
                          ? "border-primary ring-3 ring-ring/40"
                          : "hover:border-ring/60",
                      )}
                    >
                      <span
                        className="flex h-10 w-full items-center justify-center rounded-md border border-[var(--glass-border)] bg-cover bg-center text-muted-foreground"
                        style={
                          bg === "custom"
                            ? undefined
                            : { backgroundImage: BG_SWATCH[theme][bg] }
                        }
                      >
                        {bg === "custom" ? (
                          <ImageIcon className="size-4" />
                        ) : null}
                      </span>
                      <span className="text-xs">
                        {t(`settings.appearance.bg.${bg}`)}
                      </span>
                    </button>
                  ))}
                </div>
                {active === "custom" ? (
                  <MediaPicker
                    value={customValue ? [customValue] : []}
                    onChange={(paths) => setCustom(paths[0] ?? null)}
                    loadMedia={loadMedia}
                  />
                ) : null}
              </div>
            );
          })}
        </div>
      </Panel>

      {/* Fine-tune tokens */}
      <Panel
        icon={SlidersHorizontal}
        title={t("settings.appearance.tokens")}
        description={t("settings.appearance.tokens_desc")}
      >
        <div className="grid gap-6 sm:grid-cols-2">
          <TokenSlider
            label={t("settings.appearance.blur")}
            value={draft.tokens.blur}
            min={0}
            max={48}
            step={1}
            suffix="px"
            onChange={(v) => setToken("blur", v)}
          />
          <TokenSlider
            label={t("settings.appearance.radius")}
            value={draft.tokens.radius}
            min={6}
            max={24}
            step={1}
            suffix="px"
            onChange={(v) => setToken("radius", v)}
          />
          <TokenSlider
            label={t("settings.appearance.saturate")}
            value={draft.tokens.saturate}
            min={100}
            max={220}
            step={5}
            suffix="%"
            onChange={(v) => setToken("saturate", v)}
          />
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {t("settings.appearance.accent")}
              </span>
              <span className="text-xs text-muted-foreground tabular-nums">
                {draft.tokens.accent}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={draft.tokens.accent}
                onChange={(e) => setToken("accent", e.target.value)}
                aria-label={t("settings.appearance.accent")}
                className="size-10 cursor-pointer rounded-lg border border-input bg-transparent p-1"
              />
              <span
                className="h-8 flex-1 rounded-lg border border-[var(--glass-border)]"
                style={{ background: draft.tokens.accent }}
              />
            </div>
          </div>
        </div>
      </Panel>

      <SaveBar
        dirty={dirty}
        saving={saveMutation.isPending}
        onSave={() => draft && saveMutation.mutate(draft)}
        onReset={() => query.data && setDraft(query.data)}
      />
    </div>
  );
}

function TokenSlider({
  label,
  value,
  min,
  max,
  step,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix: string;
  onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-xs text-muted-foreground tabular-nums">
          {value}
          {suffix}
        </span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={([v]) => onChange(v)}
      />
    </div>
  );
}
