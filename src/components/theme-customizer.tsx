import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeftRight,
  Copy,
  Droplet,
  Moon,
  Palette,
  RotateCcw,
  Sparkles,
  Square,
  Sun,
} from "lucide-react";
import { toast } from "sonner";

import {
  api,
  type AppearanceContentWidth,
  type AppearanceDensity,
  type AppearanceDir,
  type AppearanceSettings,
  type AppearanceStyle,
} from "@/api";
import { APPEARANCE_DEFAULTS } from "@/api/mock/appearance";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";
import { STYLE_BASELINES, applyAppearance } from "@/lib/appearance";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/*
 * Theme Customizer (W0.5): a right-side floating drawer to live-tweak the site-wide
 * admin look from anywhere. It reuses the appearance store (api.appearance +
 * applyAppearance) rather than a parallel state layer, driving a draft-based live
 * preview and restoring the saved config when closed unsaved. Dark mode lives outside
 * AppearanceSettings, so it is SHARED in from the shell (dark / onToggleDark), never
 * forked here.
 */

// Accent presets — the whole accent family derives from --primary via color-mix (index.css),
// so only the hex is stored; the native color input covers a fully custom value.
const ACCENT_PRESETS = [
  "#176dbd",
  "#7c3aed",
  "#0f766e",
  "#c2410c",
  "#be123c",
  "#4338ca",
];

const STYLE_ICON: Record<AppearanceStyle, typeof Droplet> = {
  glass: Droplet,
  liquid: Sparkles,
  flat: Square,
};

const STYLES: AppearanceStyle[] = ["glass", "liquid", "flat"];
const CONTENT_WIDTHS: AppearanceContentWidth[] = ["fluid", "boxed"];
const DENSITIES: AppearanceDensity[] = ["comfortable", "compact"];
const DIRS: AppearanceDir[] = ["ltr", "rtl"];

/** Compact segmented control — the drawer's shared control shape (aria-pressed per option). */
function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string; icon?: ReactNode }[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="space-y-2">
      <span className="text-sm font-medium">{label}</span>
      <div
        role="group"
        aria-label={label}
        className="grid auto-cols-fr grid-flow-col gap-1 rounded-xl bg-muted/50 p-1"
      >
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            aria-pressed={value === opt.value}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-sm transition-colors",
              value === opt.value
                ? "bg-card font-medium text-foreground shadow-sm ring-1 ring-[var(--glass-border)]"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {opt.icon}
            <span className="truncate">{opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function ThemeCustomizer({
  trigger,
  dark,
  onToggleDark,
  onClearStyleOverride,
}: {
  /** Element wrapped by SheetTrigger (the shell's floating button); keeps shell wiring minimal. */
  trigger: ReactNode;
  /** Shared dark-mode state from the shell — the single source of truth. */
  dark: boolean;
  onToggleDark: () => void;
  /** Clears the transient topbar style override so the drawer's style choice is authoritative. */
  onClearStyleOverride?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["appearance"],
    queryFn: api.appearance.get,
    staleTime: 60_000,
  });

  const [draft, setDraft] = useState<AppearanceSettings | null>(null);
  // Latest saved config — used to revert the live preview when the drawer closes unsaved.
  const savedRef = useRef<AppearanceSettings | null>(null);
  savedRef.current = query.data ?? savedRef.current;

  useEffect(() => {
    if (query.data && draft === null) setDraft(query.data);
  }, [query.data, draft]);

  // Live preview: reflect the draft onto <html> while the drawer is open.
  useEffect(() => {
    if (open && draft) applyAppearance(draft);
  }, [open, draft]);

  // Closing without saving drops the preview back to the saved config. A global drawer
  // (unlike the settings page) never unmounts on navigation, so we restore on close.
  useEffect(() => {
    if (!open && savedRef.current) {
      applyAppearance(savedRef.current);
      setDraft(savedRef.current);
    }
  }, [open]);

  // Safety net for a hard unmount (e.g. logout) — never strand an unsaved preview.
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
      toast.success(t("customizer.saved"));
      await queryClient.invalidateQueries({ queryKey: ["appearance"] });
    },
  });

  const patch = (next: Partial<AppearanceSettings>) =>
    setDraft((d) => (d ? { ...d, ...next } : d));
  const setAccent = (accent: string) =>
    setDraft((d) => (d ? { ...d, tokens: { ...d.tokens, accent } } : d));
  // Switching style adopts that style's token baseline (keeps the accent), same as the settings page.
  const selectStyle = (style: AppearanceStyle) => {
    onClearStyleOverride?.();
    setDraft((d) =>
      d
        ? {
            ...d,
            style,
            tokens: { ...STYLE_BASELINES[style], accent: d.tokens.accent },
          }
        : d,
    );
  };
  const reset = () => {
    onClearStyleOverride?.();
    setDraft({ ...APPEARANCE_DEFAULTS });
  };

  async function copyConfig() {
    if (!draft) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(draft, null, 2));
      toast.success(t("customizer.copied"));
    } catch (error) {
      // Clipboard can be blocked (permissions / insecure context) — surface it, don't crash.
      console.error("[customizer] clipboard write failed", error);
      toast.error(t("customizer.copy_failed"));
    }
  }

  const accent = draft?.tokens.accent.toLowerCase() ?? "";

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent
        side="right"
        className="gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-sm"
      >
        <div className="flex items-center gap-2 border-b border-[var(--glass-border)] p-4 pe-14">
          <Palette className="size-4 text-primary" />
          <SheetTitle>{t("customizer.title")}</SheetTitle>
        </div>

        {draft ? (
          <div className="scrollbar-hover flex-1 space-y-5 overflow-y-auto p-4">
            {/* Accent colour */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {t("customizer.accent")}
                </span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {draft.tokens.accent}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {ACCENT_PRESETS.map((hex) => (
                  <button
                    key={hex}
                    type="button"
                    onClick={() => setAccent(hex)}
                    aria-label={hex}
                    aria-pressed={accent === hex.toLowerCase()}
                    className={cn(
                      "size-7 rounded-full border transition-transform hover:scale-110",
                      accent === hex.toLowerCase()
                        ? "ring-2 ring-ring ring-offset-2 ring-offset-background"
                        : "border-[var(--glass-border)]",
                    )}
                    style={{ background: hex }}
                  />
                ))}
                {/* Custom value via the native picker; the rainbow chip signals "any colour". */}
                <label
                  className="relative size-7 cursor-pointer overflow-hidden rounded-full border border-[var(--glass-border)]"
                  title={t("customizer.accent")}
                  style={{
                    background:
                      "conic-gradient(from 90deg, #ef4444, #f59e0b, #22c55e, #06b6d4, #6366f1, #ec4899, #ef4444)",
                  }}
                >
                  <input
                    type="color"
                    value={draft.tokens.accent}
                    onChange={(e) => setAccent(e.target.value)}
                    aria-label={t("customizer.accent")}
                    className="absolute inset-0 cursor-pointer opacity-0"
                  />
                </label>
              </div>
            </div>

            {/* Design style */}
            <Segmented
              label={t("customizer.style")}
              value={draft.style}
              onChange={selectStyle}
              options={STYLES.map((key) => {
                const Icon = STYLE_ICON[key];
                return {
                  value: key,
                  label: t(`customizer.style.${key}`),
                  icon: <Icon className="size-4" />,
                };
              })}
            />

            {/* Light / dark mode — drives the shared source of truth from the shell. */}
            <Segmented
              label={t("customizer.theme")}
              value={dark ? "dark" : "light"}
              onChange={(value) => {
                if ((value === "dark") !== dark) onToggleDark();
              }}
              options={[
                {
                  value: "light",
                  label: t("customizer.theme.light"),
                  icon: <Sun className="size-4" />,
                },
                {
                  value: "dark",
                  label: t("customizer.theme.dark"),
                  icon: <Moon className="size-4" />,
                },
              ]}
            />

            {/* Content width */}
            <Segmented
              label={t("customizer.width")}
              value={draft.contentWidth}
              onChange={(value) => patch({ contentWidth: value })}
              options={CONTENT_WIDTHS.map((key) => ({
                value: key,
                label: t(`customizer.width.${key}`),
              }))}
            />

            {/* Reading direction (RTL) */}
            <Segmented
              label={t("customizer.direction")}
              value={draft.dir}
              onChange={(value) => patch({ dir: value })}
              options={DIRS.map((key) => ({
                value: key,
                label: t(`customizer.dir.${key}`),
                icon: (
                  <ArrowLeftRight
                    className={cn("size-4", key === "rtl" && "-scale-x-100")}
                  />
                ),
              }))}
            />

            {/* Density */}
            <Segmented
              label={t("customizer.density")}
              value={draft.density}
              onChange={(value) => patch({ density: value })}
              options={DENSITIES.map((key) => ({
                value: key,
                label: t(`customizer.density.${key}`),
              }))}
            />
          </div>
        ) : (
          <div className="flex-1 p-4">
            <div className="h-40 animate-pulse rounded-lg bg-muted" />
          </div>
        )}

        {/* Actions: reset / copy config / save. */}
        <div className="grid grid-cols-2 gap-2 border-t border-[var(--glass-border)] p-4">
          <Button variant="outline" size="sm" onClick={reset}>
            <RotateCcw />
            {t("customizer.reset")}
          </Button>
          <Button variant="outline" size="sm" onClick={copyConfig}>
            <Copy />
            {t("customizer.copy")}
          </Button>
          <Button
            className="col-span-2"
            size="sm"
            onClick={() => draft && saveMutation.mutate(draft)}
            disabled={!dirty || saveMutation.isPending}
          >
            {saveMutation.isPending ? <Spinner /> : null}
            {t("customizer.save")}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
