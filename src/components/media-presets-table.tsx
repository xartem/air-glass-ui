import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Image, RefreshCw } from "lucide-react";

import {
  api,
  type MediaPreset,
  type MediaPresetOverride,
  type MediaPresetMode,
} from "@/api";
import { EmptyState } from "@/components/empty-state";
import { Panel } from "@/components/panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCan } from "@/lib/permissions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { t } from "@/lib/i18n";

/*
 * Image presets under SettingsGroupForm(media) (UI:media §2, D:media §3):
 * declarations come from module code / the active theme (read-only name+format),
 * operator overrides ride the tab's shared SaveBar as `media.preset_sizes`.
 * This is an editable grid, not a list — DataTable does not apply (cf. role-matrix).
 */

const MODES: MediaPresetMode[] = ["cover", "contain", "crop"];
const FIELDS = ["mode", "width", "height", "quality", "retina"] as const;

function effective(
  preset: MediaPreset,
  override: MediaPresetOverride,
): MediaPreset {
  return { ...preset, ...override };
}

export function MediaPresetsTable({
  globalQuality,
  onOverridesChange,
  resetKey,
  onRegenerateGroup,
}: {
  /** Current media.quality value — the placeholder for inherited quality. */
  globalQuality: number;
  /** null → no local edits (not dirty); string → JSON for media.preset_sizes. */
  onOverridesChange: (json: string | null) => void;
  /** Bump after save/reset to drop local edits. */
  resetKey: number;
  /** Regenerate this owner group's variants (count = presets in the group). */
  onRegenerateGroup?: (group: string, count: number) => void;
}) {
  const canManage = useCan("media.manage");
  const presetsQuery = useQuery({
    queryKey: ["media-presets"],
    queryFn: api.media.presets,
  });
  const [edits, setEdits] = useState<Record<string, MediaPresetOverride>>({});

  useEffect(() => {
    setEdits({});
  }, [resetKey]);

  const saved = useMemo(
    () => presetsQuery.data?.overrides ?? {},
    [presetsQuery.data],
  );
  const presets = presetsQuery.data?.presets ?? [];

  // Recompute the full overrides map: saved overrides + local edits, minus
  // values that equal the code-declared default (no need to store them).
  useEffect(() => {
    if (Object.keys(edits).length === 0) {
      onOverridesChange(null);
      return;
    }
    const next: Record<string, MediaPresetOverride> = {};
    for (const preset of presets) {
      const merged: MediaPresetOverride = {
        ...saved[preset.key],
        ...edits[preset.key],
      };
      const compact: MediaPresetOverride = {};
      for (const field of FIELDS) {
        const value = merged[field];
        if (value !== undefined && value !== preset[field]) {
          // @ts-expect-error narrow per-field assignment over a union of field types
          compact[field] = value;
        }
      }
      if (Object.keys(compact).length > 0) next[preset.key] = compact;
    }
    onOverridesChange(JSON.stringify(next));
  }, [edits, saved, presets, onOverridesChange]);

  function patch(key: string, override: MediaPresetOverride) {
    setEdits((current) => ({
      ...current,
      [key]: { ...current[key], ...override },
    }));
  }

  if (presetsQuery.isPending) {
    return (
      <Panel
        icon={Image}
        title={t("media.presets.title")}
        description={t("media.presets.hint")}
      >
        <Skeleton className="h-40 w-full" />
      </Panel>
    );
  }

  if (presetsQuery.isError) {
    return (
      <Panel icon={Image} title={t("media.presets.title")}>
        <EmptyState
          title={t("common.request_failed")}
          action={{
            label: t("common.retry"),
            onClick: () => void presetsQuery.refetch(),
          }}
        />
      </Panel>
    );
  }

  // Grouped by owner (module rows first, theme rows carry a badge — C2 §8)
  const owners: { owner: string; is_theme: boolean; rows: MediaPreset[] }[] =
    [];
  for (const preset of presets) {
    const bucket = owners.find((candidate) => candidate.owner === preset.owner);
    if (bucket) bucket.rows.push(preset);
    else
      owners.push({
        owner: preset.owner,
        is_theme: preset.is_theme,
        rows: [preset],
      });
  }

  return (
    <Panel
      icon={Image}
      title={t("media.presets.title")}
      description={t("media.presets.hint")}
      contentClassName="overflow-x-auto p-2 sm:p-3"
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("media.presets.col.preset")}</TableHead>
            <TableHead>{t("media.presets.col.format")}</TableHead>
            <TableHead>{t("media.presets.col.mode")}</TableHead>
            <TableHead>{t("media.presets.col.size")}</TableHead>
            <TableHead>{t("media.presets.col.quality")}</TableHead>
            <TableHead>{t("media.presets.col.retina")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {owners.map((group) => [
            <TableRow
              key={`owner-${group.owner}`}
              className="bg-muted/40 hover:bg-muted/40"
            >
              <TableCell colSpan={6} className="py-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-wide uppercase">
                    {group.owner}
                    {group.is_theme ? (
                      <Badge variant="secondary">
                        {t("media.presets.theme_badge")}
                      </Badge>
                    ) : null}
                  </span>
                  {/* Regenerate just this group's variants (UI:media §2) — media.manage. */}
                  {canManage && onRegenerateGroup ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7"
                      onClick={() =>
                        onRegenerateGroup(group.owner, group.rows.length)
                      }
                    >
                      <RefreshCw className="size-3.5" />
                      {t("media.regen.group_button")}
                    </Button>
                  ) : null}
                </div>
              </TableCell>
            </TableRow>,
            ...group.rows.map((preset) => {
              const row = effective(preset, {
                ...saved[preset.key],
                ...edits[preset.key],
              });
              return (
                <TableRow key={preset.key}>
                  <TableCell className="font-mono text-xs">
                    {preset.key}
                  </TableCell>
                  <TableCell className="text-muted-foreground uppercase">
                    {preset.format}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={row.mode}
                      onValueChange={(mode) =>
                        patch(preset.key, { mode: mode as MediaPresetMode })
                      }
                    >
                      <SelectTrigger size="sm" className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MODES.map((mode) => (
                          <SelectItem key={mode} value={mode}>
                            {t(`media.presets.mode.${mode}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Input
                        type="number"
                        inputMode="numeric"
                        className="h-8 w-20"
                        value={row.width}
                        aria-label={t("media.presets.width")}
                        onChange={(event) =>
                          patch(preset.key, {
                            width: Number(event.target.value),
                          })
                        }
                      />
                      <span className="text-muted-foreground">×</span>
                      <Input
                        type="number"
                        inputMode="numeric"
                        className="h-8 w-20"
                        value={row.height}
                        aria-label={t("media.presets.height")}
                        onChange={(event) =>
                          patch(preset.key, {
                            height: Number(event.target.value),
                          })
                        }
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      inputMode="numeric"
                      className="h-8 w-24"
                      value={row.quality ?? ""}
                      placeholder={t("media.presets.quality_placeholder", {
                        value: globalQuality,
                      })}
                      onChange={(event) =>
                        patch(preset.key, {
                          quality:
                            event.target.value === ""
                              ? null
                              : Number(event.target.value),
                        })
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-flex">
                          <Switch
                            checked={row.retina}
                            onCheckedChange={(checked) =>
                              patch(preset.key, { retina: checked === true })
                            }
                            aria-label={t("media.presets.col.retina")}
                          />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        {t("media.presets.retina_hint")}
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              );
            }),
          ])}
        </TableBody>
      </Table>
    </Panel>
  );
}
