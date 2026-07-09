import {
  lazy,
  Suspense,
  useEffect,
  useMemo,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  api,
  ValidationError,
  type SettingSchemaEntry,
  type SettingValue,
} from "@/api";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { FormField } from "@/components/form-field";
import { MediaPicker, type MediaPage } from "@/components/media-picker";
import { Panel } from "@/components/panel";
import { SaveBar } from "@/components/save-bar";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/empty-state";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/*
 * SettingsGroupForm (D:settings §6, UI:settings §2): THE settings form.
 * Screens embed <SettingsGroupForm group="…"> and never hand-build fields —
 * widgets come from the schema via the E2 §7 type→widget table. Labels and
 * help are translation keys by convention: settings.field.{key} / settings.help.{key}.
 * Saving PUTs only the changed keys; sensitive '***' means "keep current".
 */

export interface SettingsGroupFormProps {
  group: string;
  /** Dirty-guard integration for tab/route switches (UI:settings §3). */
  onDirtyChange?: (dirty: boolean) => void;
  /** Return dialog copy to confirm a specific change (e.g. maintenance mode), or null. */
  confirmChange?: (
    key: string,
    value: SettingValue,
  ) => { title: string; description: string } | null;
  /** Called with the changed batch before saving; resolve false to abort (code diff dialog). */
  beforeSave?: (changed: Record<string, SettingValue>) => Promise<boolean>;
  /** Monospace textareas (code group). */
  monospace?: boolean;
  /** Icons for section panels, keyed by section name (default 'main'). */
  sectionIcons?: Record<string, ComponentType<{ className?: string }>>;
  /**
   * Conditional fields (UI:ai §4: base_url only for openai-compatible): entries
   * failing the predicate over current values are not rendered; the form stays
   * schema-driven — screens filter, they never hand-build fields.
   */
  visibleWhen?: (key: string, values: Record<string, SettingValue>) => boolean;
  /**
   * Companion sections (e.g. the image-presets table on /settings/media) join the
   * form's SaveBar: their changed keys ride in the same PUT batch (UI:media §2).
   */
  extraChanged?: Record<string, SettingValue>;
  /** Called after a successful save / explicit reset so companions clear their edits. */
  onSettled?: () => void;
  /** Side panel next to a single-section group (e.g. the media regen status) — 2-col on lg+. */
  aside?: ReactNode;
  /** Aside layout (E6 §2 width rule): 'fixed' = form + fixed sidebar; 'half' = 50/50 peers. */
  asideWidth?: "fixed" | "half";
}

// Lazy so CodeMirror (E2 §2) is split out of the main bundle — only the code tab pulls it.
const CodeEditor = lazy(() =>
  import("@/components/code-editor").then((module) => ({
    default: module.CodeEditor,
  })),
);

function slugifyKey(key: string): string {
  return key.replaceAll(".", "_");
}

/** Short types default to half a column; long types span the full row (E6 §2). */
function fieldSpan(entry: SettingSchemaEntry): "half" | "full" {
  if (entry.span) return entry.span;
  return entry.type === "select" ||
    entry.type === "number" ||
    entry.type === "boolean" ||
    entry.type === "media"
    ? "half"
    : "full";
}

/** t() falls back to the key itself — treat that as "no translation registered". */
function optionalT(key: string): string | undefined {
  const translated = t(key);
  return translated === key ? undefined : translated;
}

async function loadMedia(query: string, page: number): Promise<MediaPage> {
  const result = await api.media.list(query, page);
  return {
    items: result.rows.map((row) => ({
      path: row.path,
      name: row.name,
      previewUrl: row.preview_url,
    })),
    pagination: {
      page: result.page,
      perPage: result.per_page,
      total: result.total,
      pages: Math.max(1, Math.ceil(result.total / result.per_page)),
    },
  };
}

export function SettingsGroupForm({
  group,
  onDirtyChange,
  confirmChange,
  beforeSave,
  monospace = false,
  sectionIcons,
  visibleWhen,
  extraChanged,
  onSettled,
  aside,
  asideWidth = "fixed",
}: SettingsGroupFormProps) {
  const queryClient = useQueryClient();
  const settingsQuery = useQuery({
    queryKey: ["settings"],
    queryFn: api.settings.all,
    staleTime: 30_000,
  });
  const groupData = settingsQuery.data?.groups.find(
    (candidate) => candidate.group === group,
  );

  const initial = useMemo(() => groupData?.values ?? {}, [groupData]);
  // Edits are stored as overrides on top of `initial`: a background refetch of
  // the settings query can never wipe what the operator is typing.
  const [edits, setEdits] = useState<Record<string, SettingValue>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pendingConfirm, setPendingConfirm] = useState<{
    key: string;
    value: SettingValue;
    title: string;
    description: string;
  } | null>(null);

  const changed = useMemo(() => {
    const diff: Record<string, SettingValue> = {};
    for (const [key, value] of Object.entries(edits)) {
      if (value !== initial[key]) diff[key] = value;
    }
    for (const [key, value] of Object.entries(extraChanged ?? {})) {
      diff[key] = value;
    }
    return diff;
  }, [edits, initial, extraChanged]);
  const dirty = Object.keys(changed).length > 0;

  useEffect(() => {
    onDirtyChange?.(dirty);
    return () => onDirtyChange?.(false);
  }, [dirty, onDirtyChange]);

  const saveMutation = useMutation({
    mutationFn: (batch: Record<string, SettingValue>) =>
      api.settings.save(group, batch),
    onSuccess: async () => {
      setErrors({});
      setEdits({});
      onSettled?.();
      await queryClient.invalidateQueries({ queryKey: ["settings"] });
      await queryClient.invalidateQueries({ queryKey: ["me"] }); // maintenance banner reacts immediately
      toast.success(t("settings.saved"));
    },
    onError: (cause) => {
      if (cause instanceof ValidationError) {
        setErrors(
          Object.fromEntries(
            Object.entries(cause.fields).map(([key, code]) => [
              key,
              t(`settings.error.${code}`),
            ]),
          ),
        );
      } else {
        toast.error(t("common.request_failed"));
      }
    },
  });

  async function save() {
    if (!dirty || saveMutation.isPending) return;
    if (beforeSave && !(await beforeSave(changed))) return;
    saveMutation.mutate(changed);
  }

  function setValue(key: string, value: SettingValue) {
    const confirmCopy = confirmChange?.(key, value);
    if (confirmCopy && value !== initial[key]) {
      setPendingConfirm({ key, value, ...confirmCopy });
      return;
    }
    setEdits((current) => ({ ...current, [key]: value }));
  }

  if (settingsQuery.isPending) {
    return (
      <div className="max-w-2xl space-y-6">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-9 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (settingsQuery.isError || !groupData) {
    return (
      <EmptyState
        title={t("common.request_failed")}
        action={{
          label: t("common.retry"),
          onClick: () => void settingsQuery.refetch(),
        }}
      />
    );
  }

  // Conditional visibility over CURRENT values (edits win over initial) so a
  // provider switch immediately swaps the dependent fields.
  const currentValues = { ...initial, ...edits };
  const visibleEntries = visibleWhen
    ? groupData.entries.filter((entry) => visibleWhen(entry.key, currentValues))
    : groupData.entries;

  // Sub-sections from schema (UI:settings §2): each renders as its own Panel;
  // more than one section flows into a 2-column grid on xl+.
  const sections: { name: string; entries: typeof groupData.entries }[] = [];
  for (const entry of visibleEntries) {
    const name = entry.section ?? "main";
    const bucket = sections.find((section) => section.name === name);
    if (bucket) bucket.entries.push(entry);
    else sections.push({ name, entries: [entry] });
  }
  const single = sections.length === 1;

  const sectionPanels = sections.map((section) => (
    <Panel
      key={section.name}
      icon={sectionIcons?.[section.name]}
      title={t(`settings.section.${group}.${section.name}`)}
      description={optionalT(`settings.section.${group}.${section.name}_hint`)}
    >
      <div className="grid gap-4 md:grid-cols-2">
        {section.entries.map((entry) => (
          <div
            key={entry.key}
            className={cn(fieldSpan(entry) === "full" && "md:col-span-2")}
          >
            <SettingField
              entry={entry}
              value={
                (entry.key in edits ? edits[entry.key] : initial[entry.key]) ??
                null
              }
              initialValue={initial[entry.key] ?? null}
              error={errors[entry.key]}
              monospace={monospace}
              onChange={(value) => setValue(entry.key, value)}
            />
          </div>
        ))}
      </div>
    </Panel>
  ));

  // Width is intentional by content (E6 §2): wide content (code editors, tables)
  // fills the row; a lone short-field form gets a readable cap so inputs don't stretch.
  const wide = sections.some((section) =>
    section.entries.some((entry) => entry.type === "code"),
  );

  return (
    <>
      {single ? (
        aside ? (
          // Single section + companion → 2-col: 50/50 peers ('half') or form + fixed sidebar.
          <div
            className={cn(
              "grid items-start gap-4",
              asideWidth === "half"
                ? "lg:grid-cols-2"
                : "lg:grid-cols-[minmax(0,1fr)_20rem]",
            )}
          >
            <div className="min-w-0">{sectionPanels}</div>
            <div className="min-w-0 space-y-4">{aside}</div>
          </div>
        ) : (
          <div className={wide ? undefined : "max-w-3xl"}>{sectionPanels}</div>
        )
      ) : (
        // Masonry (E6): multi-section groups pack by content height — a short section
        // is never held down by a taller neighbor's row (no dead space under it).
        <div className="gap-4 [column-fill:balance] xl:columns-2 [&>*]:mb-4 [&>*]:break-inside-avoid">
          {sectionPanels}
        </div>
      )}
      <SaveBar
        dirty={dirty}
        saving={saveMutation.isPending}
        onSave={() => void save()}
        onReset={() => {
          setEdits({});
          setErrors({});
          onSettled?.();
        }}
      />
      <ConfirmDialog
        open={pendingConfirm !== null}
        onOpenChange={(open) => !open && setPendingConfirm(null)}
        title={pendingConfirm?.title ?? ""}
        description={pendingConfirm?.description ?? ""}
        onConfirm={() => {
          if (pendingConfirm) {
            const { key, value } = pendingConfirm;
            setEdits((current) => ({ ...current, [key]: value }));
          }
          setPendingConfirm(null);
        }}
      />
    </>
  );
}

function SettingField({
  entry,
  value,
  initialValue,
  error,
  monospace,
  onChange,
}: {
  entry: SettingSchemaEntry;
  value: SettingValue;
  initialValue: SettingValue;
  error?: string;
  monospace: boolean;
  onChange: (value: SettingValue) => void;
}) {
  const id = slugifyKey(entry.key);
  const label = t(`settings.field.${entry.key}`);
  // Sensitive keys show the set/unset state ALONGSIDE their regular help text
  // (UI:settings §1–2: sentry_dsn carries both the hint and "set / not set").
  const help =
    [
      entry.has_help ? t(`settings.help.${entry.key}`) : undefined,
      entry.sensitive
        ? t(
            initialValue === "***"
              ? "settings.sensitive.set"
              : "settings.sensitive.unset",
          )
        : undefined,
    ]
      .filter(Boolean)
      .join(" · ") || undefined;

  if (entry.type === "boolean") {
    return (
      <FormField name={id} label={label} help={help} error={error}>
        <Switch
          id={id}
          checked={value === true}
          onCheckedChange={(checked) => onChange(checked === true)}
        />
      </FormField>
    );
  }

  if (entry.type === "select") {
    return (
      <FormField name={id} label={label} help={help} error={error}>
        <Select
          value={String(value ?? "")}
          onValueChange={(next) => onChange(next)}
        >
          <SelectTrigger id={id} className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(entry.options ?? []).map((option) => (
              <SelectItem key={option} value={option}>
                {t(`settings.option.${entry.key}.${option}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>
    );
  }

  if (entry.type === "media") {
    return (
      <FormField name={id} label={label} help={help} error={error}>
        <MediaPicker
          value={value ? [String(value)] : []}
          onChange={(paths) => onChange(paths[0] ?? null)}
          loadMedia={loadMedia}
        />
      </FormField>
    );
  }

  if (entry.type === "code") {
    // code_* snippets (C7 §5, NOT sanitized) — CodeMirror with HTML/JS highlight,
    // taller than a textarea. Lazy-loaded (E2 §2 bundle budget).
    return (
      <FormField name={id} label={label} help={help} error={error}>
        <Suspense fallback={<Skeleton className="h-44 w-full rounded-lg" />}>
          <CodeEditor
            value={String(value ?? "")}
            onChange={(next) => onChange(next)}
            minHeight={200}
            ariaLabel={label}
          />
        </Suspense>
      </FormField>
    );
  }

  if (entry.type === "textarea") {
    return (
      <FormField name={id} label={label} help={help} error={error}>
        <Textarea
          id={id}
          rows={6}
          value={String(value ?? "")}
          onChange={(event) => onChange(event.target.value)}
          className={cn(monospace && "font-mono text-xs")}
          spellCheck={false}
        />
      </FormField>
    );
  }

  if (entry.type === "json") {
    // json settings (D:settings §2) edit as raw JSON in v1; the server rejects
    // invalid payloads with 422 invalid_json.
    return (
      <FormField name={id} label={label} help={help} error={error}>
        <Textarea
          id={id}
          rows={5}
          value={String(value ?? "")}
          onChange={(event) => onChange(event.target.value)}
          className="font-mono text-xs"
          spellCheck={false}
        />
      </FormField>
    );
  }

  if (entry.sensitive) {
    // Password input, no eye toggle: the server never returns the real value.
    // Focus on the '***' sentinel clears it for a fresh entry; leaving it empty
    // without typing restores the sentinel (= keep current, D:settings §6).
    return (
      <FormField name={id} label={label} help={help} error={error}>
        <Input
          id={id}
          type="password"
          value={String(value ?? "")}
          autoComplete="off"
          onFocus={(event) => {
            if (event.target.value === "***") onChange("");
          }}
          onBlur={(event) => {
            if (event.target.value === "" && initialValue === "***")
              onChange("***");
          }}
          onChange={(event) => onChange(event.target.value)}
        />
      </FormField>
    );
  }

  return (
    <FormField name={id} label={label} help={help} error={error}>
      <Input
        id={id}
        type={
          entry.type === "number"
            ? "number"
            : entry.type === "url"
              ? "url"
              : "text"
        }
        inputMode={entry.type === "number" ? "numeric" : undefined}
        value={String(value ?? "")}
        onChange={(event) =>
          onChange(
            entry.type === "number"
              ? Number(event.target.value)
              : event.target.value,
          )
        }
      />
    </FormField>
  );
}
