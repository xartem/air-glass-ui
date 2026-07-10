import { useMemo, useState, type ReactNode } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  CircleAlert,
  Copy,
  CreditCard,
  FileText,
  Globe,
  Image,
  Boxes,
  Inbox,
  Languages,
  LayoutTemplate,
  Lock,
  Mail,
  Package,
  Pencil,
  Plus,
  Search,
  Settings2,
  Shapes,
  Trash2,
  Truck,
  Type,
  Video,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { SwitchRow } from "@/components/switch-row";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { NumberField } from "@/components/ui/number-field";
import { Rating } from "@/components/ui/rating";
import {
  Stepper,
  StepperDescription,
  StepperIndicator,
  StepperItem,
  StepperSeparator,
  StepperTitle,
} from "@/components/ui/stepper";
import {
  Timeline,
  TimelineConnector,
  TimelineContent,
  TimelineDescription,
  TimelineIndicator,
  TimelineItem,
  TimelineTime,
  TimelineTitle,
} from "@/components/ui/timeline";

import type { Permission, RoleDetail } from "@/api";
import { ChangePasswordDialog } from "@/components/change-password-dialog";
import { ColorPicker } from "@/components/color-picker";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { RoleMatrix, type RolePermissionMap } from "@/components/role-matrix";
import {
  type DataTableState,
  type PaginationMeta,
  type RowAction,
} from "@/components/data-table";
import { DatePicker } from "@/components/date-picker";
import { EditorLayout } from "@/components/editor-layout";
import { EmptyState } from "@/components/empty-state";
import { ErrorPage } from "@/components/error-page";
import { FormField } from "@/components/form-field";
import { LanguageTabs } from "@/components/language-tabs";
import { ListLayout } from "@/components/list-layout";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { SaveBar } from "@/components/save-bar";
import {
  MediaPicker,
  MediaTile,
  type MediaItem,
  type MediaPage,
} from "@/components/media-picker";
import { PaginationBar } from "@/components/pagination-bar";
import { Modal } from "@/components/modal";
import { MultiSelect } from "@/components/multi-select";
import { PageHeader } from "@/components/page-header";
import {
  DateRangePicker,
  type DateRangeValue,
} from "@/components/date-range-picker";
import {
  ReferencePicker,
  type ReferenceItem,
} from "@/components/reference-picker";
import { RepeaterField } from "@/components/repeater-field";
import { RichTextEditor } from "@/components/rich-text-editor";
import { SettingsLayout } from "@/components/settings-layout";
import { StatusBadge, type StatusKind } from "@/components/status-badge";
import { toast } from "@/components/toast";
import { Toolbar } from "@/components/toolbar";
import { TranslationDots } from "@/components/translation-dots";
import { TreeList, type TreeNode } from "@/components/tree-list";
import { WidgetGrid, WIDGET_SPAN } from "@/components/widget-grid";
import {
  ChartCard,
  ListCard,
  StatCard,
  StatusCard,
  WidgetCardFrame,
} from "@/components/widget-cards";
import { WidgetSkeleton } from "@/features/dashboard/dashboard-widget-card";
import { WizardDialog } from "@/components/wizard-dialog";
import { ComponentsIndex } from "@/features/ui-kit/components-index";
import { t } from "@/lib/i18n";
import { progressDone, progressStart } from "@/lib/progress";
import { useLocale } from "@/lib/use-locale";

/*
 * /ui-kit — the living reference (E6 §6): every archetype and shared component
 * in one place. New screens are COPIED from here, not invented from scratch.
 * Sample row data below is demo content, not UI copy — UI copy always goes via t().
 */

type DemoRow = {
  id: number;
  title: string;
  status: StatusKind;
  updatedAt: string;
  locales: { code: string; state: "translated" | "missing" | "stale" }[];
};

const DEMO_ROWS: DemoRow[] = [
  {
    id: 1,
    title: "Home",
    status: "published",
    updatedAt: "2026-07-01",
    locales: [
      { code: "ru", state: "translated" },
      { code: "en", state: "translated" },
      { code: "pl", state: "stale" },
    ],
  },
  {
    id: 2,
    title: "About",
    status: "draft",
    updatedAt: "2026-06-28",
    locales: [
      { code: "ru", state: "translated" },
      { code: "en", state: "missing" },
      { code: "pl", state: "missing" },
    ],
  },
  {
    id: 3,
    title: "Contacts",
    status: "published",
    updatedAt: "2026-06-25",
    locales: [
      { code: "ru", state: "translated" },
      { code: "en", state: "translated" },
      { code: "pl", state: "translated" },
    ],
  },
];

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="space-y-3">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      <Card>
        <CardContent className="space-y-4">{children}</CardContent>
      </Card>
    </section>
  );
}

function PaletteSection() {
  const swatches: { name: string; variable: string }[] = [
    { name: "primary", variable: "--primary" },
    { name: "foreground", variable: "--foreground" },
    { name: "muted-foreground", variable: "--muted-foreground" },
    { name: "destructive", variable: "--destructive" },
    { name: "border", variable: "--border" },
    { name: "accent", variable: "--accent" },
  ];
  const statuses: StatusKind[] = [
    "published",
    "draft",
    "pending",
    "error",
    "info",
    "archived",
  ];
  return (
    <Section id="palette" title={t("uikit.section.palette")}>
      <div className="flex flex-wrap gap-3">
        {swatches.map((swatch) => (
          <div
            key={swatch.name}
            className="flex items-center gap-2 rounded-lg border px-3 py-2"
          >
            <span
              className="size-6 rounded-md border"
              style={{ backgroundColor: `var(${swatch.variable})` }}
            />
            <code className="text-xs text-muted-foreground">
              {swatch.variable}
            </code>
          </div>
        ))}
      </div>
      <Separator />
      <div className="flex flex-wrap items-center gap-2">
        {statuses.map((status) => (
          <StatusBadge key={status} status={status} />
        ))}
      </div>
    </Section>
  );
}

function ButtonsSection() {
  return (
    <Section id="buttons" title={t("uikit.section.buttons")}>
      <div className="flex flex-wrap items-center gap-2">
        <Button>
          <Plus />
          {t("common.add")}
        </Button>
        <Button variant="secondary">{t("common.save")}</Button>
        <Button variant="outline">{t("common.cancel")}</Button>
        <Button variant="ghost">{t("common.close")}</Button>
        <Button variant="success">success</Button>
        <Button variant="warning">warning</Button>
        <Button variant="destructive">{t("common.delete")}</Button>
        <Button variant="destructive-filled">
          <Trash2 />
          {t("common.delete")}
        </Button>
        <Button variant="link">{t("common.edit")}</Button>
        <Button disabled>
          <Spinner />
          {t("common.save")}
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button size="lg">lg / 38px</Button>
        <Button size="sm" variant="outline">
          sm
        </Button>
        <Button size="xs" variant="outline">
          xs
        </Button>
        <Button size="icon" variant="outline" aria-label="icon">
          <Plus />
        </Button>
      </div>
    </Section>
  );
}

function FormsSection() {
  const [withError, setWithError] = useState(true);
  return (
    <Section id="forms" title={t("uikit.section.forms")}>
      {/* Field grid per E6: short types up to 3 columns on xl+ (2 on md+),
          long types (text/url/textarea/richtext) span the full width. */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <FormField
          name="demo-title"
          label={t("uikit.field.title")}
          required
          help={t("uikit.field.title.help")}
          className="md:col-span-2 xl:col-span-3"
        >
          <Input id="demo-title" placeholder={t("uikit.field.title")} />
        </FormField>
        <FormField
          name="demo-slug"
          label={t("uikit.field.slug")}
          required
          error={withError ? t("uikit.field.error.required") : undefined}
        >
          <Input id="demo-slug" aria-invalid={withError} />
        </FormField>
        <FormField name="demo-category" label={t("uikit.field.category")}>
          <Select>
            <SelectTrigger id="demo-category" className="w-full">
              <SelectValue placeholder="—" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="services">Services</SelectItem>
              <SelectItem value="projects">Projects</SelectItem>
              <SelectItem value="team">Team</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
        <FormField
          name="demo-description"
          label={t("uikit.field.description")}
          className="md:col-span-2 xl:col-span-3"
        >
          <Textarea id="demo-description" rows={3} />
        </FormField>
        <div className="flex items-center gap-6 md:col-span-2 xl:col-span-3">
          <div className="flex items-center gap-2">
            <Switch id="demo-active" defaultChecked />
            <Label htmlFor="demo-active">{t("uikit.field.active")}</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="demo-error-toggle"
              checked={withError}
              onCheckedChange={(v) => setWithError(v === true)}
            />
            <Label htmlFor="demo-error-toggle">{t("uikit.toggleError")}</Label>
          </div>
        </div>
        {/* Size scale (32 / 38 / 42 px) shared across Input, Textarea and Select. */}
        <div className="space-y-2 md:col-span-2 xl:col-span-3">
          <p className="text-sm font-medium">sm / default / lg</p>
          <div className="grid gap-2 sm:grid-cols-3">
            <Input inputSize="sm" placeholder="sm / 32px" />
            <Input inputSize="default" placeholder="default / 38px" />
            <Input inputSize="lg" placeholder="lg / 42px" />
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <Textarea inputSize="sm" placeholder="sm" rows={2} />
            <Textarea inputSize="default" placeholder="default" rows={2} />
            <Textarea inputSize="lg" placeholder="lg" rows={2} />
          </div>
          <Select>
            <SelectTrigger size="lg" className="w-full">
              <SelectValue placeholder="Select · lg / 42px" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="services">Services</SelectItem>
              <SelectItem value="projects">Projects</SelectItem>
              <SelectItem value="team">Team</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {/* SwitchRow (E6): labelled toggle blocks — whole row clickable, stacked with dividers. */}
        <div className="md:col-span-2 xl:col-span-3">
          <p className="mb-2 text-sm font-medium">
            {t("uikit.switchrow.title")}
          </p>
          <div className="space-y-2">
            <SwitchRowDemo />
          </div>
        </div>
      </div>
    </Section>
  );
}

function SwitchRowDemo() {
  const [state, setState] = useState({ a: true, b: false, c: true });
  return (
    <>
      <SwitchRow
        label={t("uikit.switchrow.a_label")}
        hint={t("uikit.switchrow.a_hint")}
        checked={state.a}
        onCheckedChange={(v) => setState((s) => ({ ...s, a: v }))}
      />
      <SwitchRow
        label={t("uikit.switchrow.b_label")}
        hint={t("uikit.switchrow.b_hint")}
        checked={state.b}
        onCheckedChange={(v) => setState((s) => ({ ...s, b: v }))}
      />
      <SwitchRow
        label={t("uikit.switchrow.c_label")}
        checked={state.c}
        disabled
        onCheckedChange={(v) => setState((s) => ({ ...s, c: v }))}
      />
    </>
  );
}

function LanguageSection() {
  const [editorLocale, setEditorLocale] = useState("ru");
  return (
    <Section id="language" title={t("uikit.section.language")}>
      <div className="space-y-6">
        {/* Global editor switcher (E2 §7) — the content-editor standard. */}
        <div className="space-y-2">
          <LocaleSwitcher
            locales={[
              {
                code: "ru",
                label: "Русский",
                is_default: true,
                state: "translated",
              },
              {
                code: "en",
                label: "English",
                is_default: false,
                state: "stale",
              },
              {
                code: "uk",
                label: "Українська",
                is_default: false,
                state: "missing",
              },
            ]}
            value={editorLocale}
            onChange={setEditorLocale}
          />
          <FormField
            name={`title-global-${editorLocale}`}
            label={`${t("uikit.field.title")} (${editorLocale})`}
            required
          >
            <Input id={`title-global-${editorLocale}`} key={editorLocale} />
          </FormField>
        </div>
        {/* Per-field tabs — only for lone translatable fields OUTSIDE content editors. */}
        <LanguageTabs
          locales={[
            { code: "ru", state: "translated" },
            { code: "en", state: "stale" },
            { code: "uk", state: "missing" },
          ]}
        >
          {(locale) => (
            <FormField
              name={`title-${locale}`}
              label={`${t("uikit.field.title")} (${locale})`}
              required
            >
              <Input id={`title-${locale}`} />
            </FormField>
          )}
        </LanguageTabs>
      </div>
    </Section>
  );
}

function SaveBarSection() {
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const dirty = value.length > 0;
  return (
    <Section id="savebar" title={t("uikit.section.savebar")}>
      <div className="max-w-2xl space-y-3">
        <FormField
          name="savebar-demo"
          label={t("uikit.field.title")}
          help={t("uikit.savebar.hint")}
        >
          <Input
            id="savebar-demo"
            value={value}
            onChange={(event) => setValue(event.target.value)}
          />
        </FormField>
        <SaveBar
          dirty={dirty}
          saving={saving}
          onSave={() => {
            setSaving(true);
            setTimeout(() => {
              setSaving(false);
              setValue("");
            }, 700);
          }}
          onReset={() => setValue("")}
        />
      </div>
    </Section>
  );
}

function RichTextSection() {
  const [html, setHtml] = useState(
    '<h2>Heading</h2><p>Text with <strong>bold</strong> and a <a href="https://example.com">link</a>.</p>',
  );
  return (
    <Section id="richtext" title={t("uikit.section.richtext")}>
      <RichTextEditor value={html} onChange={setHtml} />
    </Section>
  );
}

const DEMO_REFERENCES: ReferenceItem[] = [
  { id: 1, label: "Home", hint: "/" },
  { id: 2, label: "About", hint: "/about" },
  { id: 3, label: "Inbox", hint: "/inbox" },
  { id: 4, label: "Services", hint: "/services" },
];

/** Deterministic gradient placeholder standing in for a real thumbnail (media_url later). */
function demoPreviewUrl(path: string): string {
  const seed = [...path].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const h1 = (seed * 7) % 360;
  const h2 = (h1 + 45) % 360;
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'>` +
    `<defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>` +
    `<stop offset='0' stop-color='hsl(${h1},72%,78%)'/>` +
    `<stop offset='1' stop-color='hsl(${h2},62%,58%)'/>` +
    `</linearGradient></defs><rect width='300' height='300' fill='url(%23g)'/></svg>`;
  return `data:image/svg+xml,${svg.replaceAll("#", "%23").replaceAll("'", "%27")}`;
}

const DEMO_MEDIA: MediaItem[] = Array.from({ length: 23 }, (_, i) => {
  const path = `uploads/2026/07/photo-${i + 1}.jpg`;
  return { path, name: `photo-${i + 1}.jpg`, previewUrl: demoPreviewUrl(path) };
});

const MEDIA_PER_PAGE = 10;

/** Demo paged media source — mirrors the Admin API paginator contract (B7). */
function loadDemoMedia(query: string, page: number): Promise<MediaPage> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const filtered = DEMO_MEDIA.filter((item) => item.name.includes(query));
      const pages = Math.max(1, Math.ceil(filtered.length / MEDIA_PER_PAGE));
      const safePage = Math.min(page, pages);
      resolve({
        items: filtered.slice(
          (safePage - 1) * MEDIA_PER_PAGE,
          safePage * MEDIA_PER_PAGE,
        ),
        pagination: {
          page: safePage,
          pages,
          total: filtered.length,
          perPage: MEDIA_PER_PAGE,
        },
      });
    }, 300);
  });
}

function PickersSection() {
  const [date, setDate] = useState<string | undefined>("2026-07-02");
  const [range, setRange] = useState<DateRangeValue>({
    from: "2026-06-01",
    to: "2026-06-30",
  });
  const [color, setColor] = useState("#1d8df2");
  const [tags, setTags] = useState<string[]>(["services"]);
  const [reference, setReference] = useState<ReferenceItem | null>(null);
  const [media, setMedia] = useState<string[]>(["uploads/2026/07/photo-1.jpg"]);

  const searchReferences = (query: string) =>
    new Promise<ReferenceItem[]>((resolve) => {
      setTimeout(
        () =>
          resolve(
            DEMO_REFERENCES.filter((item) =>
              item.label.toLowerCase().includes(query.toLowerCase()),
            ),
          ),
        300,
      );
    });

  return (
    <Section id="pickers" title={t("uikit.section.pickers")}>
      {/* Short pickers up to 3 columns on xl+; the media grid spans full width (E6). */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <FormField name="picker-date" label={t("uikit.field.title")}>
          <DatePicker id="picker-date" value={date} onChange={setDate} />
        </FormField>
        <FormField name="picker-color" label={t("uikit.field.color")}>
          <ColorPicker id="picker-color" value={color} onChange={setColor} />
        </FormField>
        <FormField name="picker-tags" label={t("uikit.field.category")}>
          <MultiSelect
            id="picker-tags"
            options={[
              { value: "services", label: "Services" },
              { value: "projects", label: "Projects" },
              { value: "team", label: "Team" },
              { value: "news", label: "News" },
            ]}
            value={tags}
            onChange={setTags}
          />
        </FormField>
        <FormField name="picker-range" label={t("uikit.field.dateRange")}>
          <DateRangePicker
            value={range}
            onChange={setRange}
            className="w-full"
          />
        </FormField>
        <FormField
          name="picker-reference"
          label={t("uikit.field.reference")}
          className="md:col-span-2 xl:col-span-3"
        >
          <ReferencePicker
            id="picker-reference"
            value={reference}
            onChange={setReference}
            search={searchReferences}
          />
        </FormField>
        <FormField
          name="picker-media"
          label={t("uikit.field.media")}
          className="md:col-span-2 xl:col-span-3"
        >
          <MediaPicker
            value={media}
            onChange={setMedia}
            multiple
            loadMedia={loadDemoMedia}
            resolveUrl={demoPreviewUrl}
          />
        </FormField>
      </div>
    </Section>
  );
}

const INITIAL_TREE: TreeNode[] = [
  {
    id: "home",
    label: "Home",
    children: [],
  },
  {
    id: "catalog",
    label: "Catalog",
    children: [
      { id: "catalog-doors", label: "Doors" },
      { id: "catalog-windows", label: "Windows" },
    ],
  },
  { id: "about", label: "About" },
  { id: "contacts", label: "Contacts" },
];

function TreeSection() {
  const [tree, setTree] = useState<TreeNode[]>(INITIAL_TREE);
  return (
    <Section id="tree" title={t("uikit.section.tree")}>
      <TreeList items={tree} onChange={setTree} />
    </Section>
  );
}

type DemoRepeaterItem = { label: string; url: string; icon: string };

function RepeaterSection() {
  const [items, setItems] = useState<DemoRepeaterItem[]>([
    { label: "Phone", url: "tel:+48000000000", icon: "phone" },
    { label: "E-mail", url: "mailto:hello@example.com", icon: "mail" },
  ]);
  return (
    <Section id="repeater" title={t("uikit.section.repeater")}>
      <RepeaterField
        value={items}
        onChange={setItems}
        newItem={() => ({ label: "", url: "", icon: "" })}
        renderItem={(item, index, update) => (
          <div className="grid gap-2 sm:grid-cols-3">
            <FormField
              name={`repeater-label-${index}`}
              label={t("uikit.field.title")}
            >
              <Input
                id={`repeater-label-${index}`}
                value={item.label}
                onChange={(event) =>
                  update({ ...item, label: event.target.value })
                }
              />
            </FormField>
            <FormField
              name={`repeater-url-${index}`}
              label={t("uikit.field.url")}
            >
              <Input
                id={`repeater-url-${index}`}
                value={item.url}
                onChange={(event) =>
                  update({ ...item, url: event.target.value })
                }
              />
            </FormField>
            <FormField
              name={`repeater-icon-${index}`}
              label={t("uikit.field.icon")}
            >
              <Input
                id={`repeater-icon-${index}`}
                value={item.icon}
                onChange={(event) =>
                  update({ ...item, icon: event.target.value })
                }
              />
            </FormField>
          </div>
        )}
      />
    </Section>
  );
}

function BadgesSection() {
  return (
    <Section id="badges" title={t("uikit.section.badges")}>
      <div className="flex flex-wrap items-center gap-6">
        <StatusBadge status="published" />
        <StatusBadge status="draft" />
        <TranslationDots
          locales={[
            { code: "ru", state: "translated" },
            { code: "en", state: "stale" },
            { code: "pl", state: "missing" },
          ]}
        />
      </div>
      <Separator />
      {/* Generic Badge variants (distinct from the status-dot StatusBadge above) */}
      <div className="flex flex-wrap items-center gap-2">
        <Badge>default</Badge>
        <Badge variant="secondary">secondary</Badge>
        <Badge variant="success">success</Badge>
        <Badge variant="warning">warning</Badge>
        <Badge variant="info">info</Badge>
        <Badge variant="destructive">destructive</Badge>
        <Badge variant="outline">outline</Badge>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge size="sm">sm</Badge>
        <Badge size="default">default</Badge>
        <Badge size="lg">lg</Badge>
      </div>
    </Section>
  );
}

function NewComponentsSection() {
  const [step, setStep] = useState(1);
  const [rating, setRating] = useState(3);
  const [quantity, setQuantity] = useState<number | null>(2);
  // Demo content uses literal technical labels like the other sections;
  // only the section title is translated (uikit.section.components).
  const checkoutSteps = ["Cart", "Shipping", "Payment"];
  return (
    <Section id="components" title={t("uikit.section.components")}>
      {/* Timeline — vertical activity feed / order history */}
      <div className="max-w-md">
        <Timeline>
          <TimelineItem>
            <TimelineIndicator variant="success">
              <Package />
            </TimelineIndicator>
            <TimelineConnector />
            <TimelineContent>
              <TimelineTitle>Order placed</TimelineTitle>
              <TimelineDescription>Order #1042 was created</TimelineDescription>
              <TimelineTime>09:24</TimelineTime>
            </TimelineContent>
          </TimelineItem>
          <TimelineItem>
            <TimelineIndicator variant="info">
              <CreditCard />
            </TimelineIndicator>
            <TimelineConnector />
            <TimelineContent>
              <TimelineTitle>Payment confirmed</TimelineTitle>
              <TimelineDescription>
                Charged $128.00 to Visa •••• 4242
              </TimelineDescription>
              <TimelineTime>09:31</TimelineTime>
            </TimelineContent>
          </TimelineItem>
          <TimelineItem>
            <TimelineIndicator>
              <Truck />
            </TimelineIndicator>
            <TimelineContent>
              <TimelineTitle>Awaiting shipment</TimelineTitle>
              <TimelineDescription>Preparing the package</TimelineDescription>
              <TimelineTime>—</TimelineTime>
            </TimelineContent>
          </TimelineItem>
        </Timeline>
      </div>
      <Separator />
      {/* Stepper — standalone multi-step progress (horizontal, interactive) */}
      <div className="space-y-4">
        <Stepper activeStep={step}>
          {checkoutSteps.map((title, i) => (
            <StepperItem key={title} index={i}>
              <StepperIndicator>{i + 1}</StepperIndicator>
              <div className="hidden sm:block">
                <StepperTitle>{title}</StepperTitle>
                <StepperDescription>Step {i + 1}</StepperDescription>
              </div>
              <StepperSeparator />
            </StepperItem>
          ))}
        </Stepper>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={step === 0}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
          >
            {t("common.back")}
          </Button>
          <Button
            size="sm"
            disabled={step >= checkoutSteps.length - 1}
            onClick={() =>
              setStep((s) => Math.min(checkoutSteps.length - 1, s + 1))
            }
          >
            {t("wizard.next")}
          </Button>
        </div>
      </div>
      <Separator />
      {/* Rating — readonly display + interactive input + size axis */}
      <div className="flex flex-wrap items-center gap-8">
        <div className="flex flex-col gap-2">
          <span className="text-xs text-muted-foreground">readonly</span>
          <Rating value={4} readOnly />
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-xs text-muted-foreground">interactive</span>
          <Rating value={rating} onValueChange={setRating} />
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-xs text-muted-foreground">sm / lg</span>
          <div className="flex items-center gap-3">
            <Rating value={3} readOnly size="sm" />
            <Rating value={3} readOnly size="lg" />
          </div>
        </div>
      </div>
      <Separator />
      {/* NumberField — steppers, bounds, size axis */}
      <div className="flex flex-wrap items-end gap-6">
        <div className="flex w-32 flex-col gap-2">
          <Label>quantity</Label>
          <NumberField
            value={quantity}
            onValueChange={setQuantity}
            min={0}
            max={99}
            step={1}
          />
        </div>
        <div className="flex w-32 flex-col gap-2">
          <span className="text-xs text-muted-foreground">sm</span>
          <NumberField defaultValue={1} min={0} max={10} inputSize="sm" />
        </div>
        <div className="flex w-32 flex-col gap-2">
          <span className="text-xs text-muted-foreground">lg</span>
          <NumberField defaultValue={1} min={0} max={10} inputSize="lg" />
        </div>
        <div className="flex w-32 flex-col gap-2">
          <span className="text-xs text-muted-foreground">disabled</span>
          <NumberField defaultValue={5} disabled />
        </div>
      </div>
    </Section>
  );
}

function CardsSection() {
  const variants = ["default", "elevated", "outline", "interactive"] as const;
  return (
    <Section id="cards" title="Cards">
      {/* Card variant axis — literal technical labels (demo-only, no i18n keys). */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {variants.map((variant) => (
          <Card key={variant} variant={variant}>
            <CardHeader>
              <CardTitle>{variant}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              variant="{variant}"
            </CardContent>
          </Card>
        ))}
      </div>
    </Section>
  );
}

function ListArchetypeSection() {
  const [search, setSearch] = useState("");
  const [state, setState] = useState<DataTableState>("ready");
  const [page, setPage] = useState(1);

  const rows = useMemo(
    () =>
      DEMO_ROWS.filter((row) =>
        row.title.toLowerCase().includes(search.toLowerCase()),
      ),
    [search],
  );

  const columns: ColumnDef<DemoRow, unknown>[] = useMemo(
    () => [
      { accessorKey: "title", id: "title", header: t("uikit.field.title") },
      {
        id: "status",
        header: t("common.status"),
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: "locales",
        header: t("common.translations"),
        cell: ({ row }) => <TranslationDots locales={row.original.locales} />,
      },
      {
        accessorKey: "updatedAt",
        id: "updatedAt",
        header: t("common.updated"),
      },
    ],
    [],
  );

  const rowActions: RowAction<DemoRow>[] = [
    {
      key: "edit",
      label: t("common.edit"),
      icon: <Pencil />,
      onSelect: (row) => toast(`${t("common.edit")}: ${row.title}`),
    },
    {
      key: "duplicate",
      label: t("common.duplicate"),
      icon: <Copy />,
      onSelect: (row) => toast(`${t("common.duplicate")}: ${row.title}`),
    },
    {
      key: "delete",
      label: t("common.delete"),
      icon: <Trash2 />,
      destructive: true,
      onSelect: (row) => toast.error(`${t("common.delete")}: ${row.title}`),
    },
  ];

  const pagination: PaginationMeta = { page, pages: 3, total: 24, perPage: 10 };

  return (
    <Section id="list" title={t("uikit.section.list")}>
      {/* Archetype A (E6 §1A) is ONE component now: <ListLayout> wires PageHeader +
          Panel whose header carries the search+filters cluster (+bulk panel on
          selection) + DataTable + pagination. In real screens pair it with
          useListParams (lib) so search/filters/page/sort live in the URL. */}
      <ListLayout<DemoRow>
        title={t("nav.pages")}
        icon={FileText}
        primaryAction={{
          label: t("common.add"),
          icon: <Plus />,
          onClick: () => toast(t("common.add")),
        }}
        search={{ value: search, onChange: setSearch }}
        filters={
          <Select
            value={state}
            onValueChange={(value) => setState(value as DataTableState)}
          >
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ready">{t("uikit.state.ready")}</SelectItem>
              <SelectItem value="loading">
                {t("uikit.state.loading")}
              </SelectItem>
              <SelectItem value="empty">{t("uikit.state.empty")}</SelectItem>
              <SelectItem value="error">{t("uikit.state.error")}</SelectItem>
            </SelectContent>
          </Select>
        }
        bulkActions={(selectedRows, clear) => [
          {
            label: t("common.delete"),
            destructive: true,
            icon: <Trash2 />,
            onClick: () => {
              toast.error(`${t("common.delete")}: ${selectedRows.length}`);
              clear();
            },
          },
        ]}
        columns={columns}
        data={state === "empty" ? [] : rows}
        state={state}
        rowActions={rowActions}
        pagination={pagination}
        onPage={setPage}
        onRetry={() => setState("ready")}
        getRowId={(row) => String(row.id)}
      />
    </Section>
  );
}

function ChangePasswordSection() {
  const [open, setOpen] = useState(false);
  return (
    <Section id="change-password" title={t("users.password.action")}>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Lock className="size-4" />
        {t("users.password.action")}
      </Button>
      <ChangePasswordDialog
        open={open}
        onOpenChange={setOpen}
        userName="Olga Petrova"
        onConfirm={() => setOpen(false)}
      />
    </Section>
  );
}

function OverlaysSection() {
  const [modalOpen, setModalOpen] = useState(false);
  return (
    <Section id="overlays" title={t("uikit.section.overlays")}>
      <div className="flex flex-wrap items-center gap-2">
        <Modal
          trigger={<Button variant="outline">{t("uikit.openModal")}</Button>}
          open={modalOpen}
          onOpenChange={setModalOpen}
          title={t("uikit.openModal")}
          description={t("uikit.subtitle")}
          footer={
            <>
              <Button variant="outline" onClick={() => setModalOpen(false)}>
                {t("common.cancel")}
              </Button>
              <Button onClick={() => setModalOpen(false)}>
                {t("common.save")}
              </Button>
            </>
          }
        >
          <FormField name="modal-title" label={t("uikit.field.title")}>
            <Input id="modal-title" />
          </FormField>
        </Modal>

        <ConfirmDialog
          trigger={<Button variant="destructive">{t("common.delete")}</Button>}
          title={t("confirm.delete.title")}
          description={t("confirm.delete.description")}
          confirmLabel={t("common.delete")}
          destructive
          onConfirm={() => toast.error(t("common.delete"))}
        />

        <Button
          variant="outline"
          onClick={() => toast.success(t("uikit.toastSaved"))}
        >
          {t("uikit.showToast")}
        </Button>

        <Button
          variant="outline"
          onClick={() => {
            progressStart();
            setTimeout(progressDone, 2500);
          }}
        >
          {t("uikit.showProgress")}
        </Button>
      </div>
    </Section>
  );
}

function EmptySection() {
  return (
    <Section id="empty" title={t("uikit.section.empty")}>
      <EmptyState
        icon={Inbox}
        title={t("table.empty.title")}
        description={t("table.empty.description")}
        action={{
          label: t("common.add"),
          onClick: () => toast(t("common.add")),
        }}
      />
      <Separator />
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-10 w-64" />
        <Spinner className="size-5" />
      </div>
    </Section>
  );
}

/* Static demo series for the widget archetypes (mock stays the single fixture source for screens). */
const WIDGET_DEMO_X = [
  "21.06",
  "22.06",
  "23.06",
  "24.06",
  "25.06",
  "26.06",
  "27.06",
  "28.06",
  "29.06",
  "30.06",
  "01.07",
  "02.07",
  "03.07",
  "04.07",
];
const WIDGET_DEMO_CHART = {
  kind: "bar" as const,
  series: [
    {
      label_key: "uikit.widget.orders_chart",
      points: [6, 9, 7, 12, 10, 14, 11, 16, 13, 18, 15, 20, 17, 22].map(
        (y, index) => ({ x: WIDGET_DEMO_X[index]!, y }),
      ),
    },
    {
      // Second series demos the xl-only legend (D:dashboard §4 fullest tier).
      label_key: "uikit.widget.leads",
      points: [3, 5, 4, 7, 6, 8, 5, 9, 7, 10, 8, 11, 9, 12].map((y, index) => ({
        x: WIDGET_DEMO_X[index]!,
        y,
      })),
    },
  ],
};
const WIDGET_DEMO_STAT = {
  value: 148,
  delta: 12,
  series: [90, 110, 104, 126, 131, 139, 143, 148],
};
const WIDGET_DEMO_LIST = {
  items: [
    {
      title: '#432 — "Need a pump for the cottage"',
      hint: "12:40",
      badge: "new",
    },
    {
      title: '#431 — "Call me back about roofing"',
      hint: "11:05",
      badge: "new",
    },
    { title: '#430 — "How much is installation?"', hint: "09:32" },
    { title: '#429 — "Is the GNOM-40 in stock?"', hint: "yesterday" },
    { title: '#428 — "Need an invoice for a company"', hint: "yesterday" },
    { title: '#427 — "Do you deliver to Denver?"', hint: "2 days ago" },
  ],
};
const WIDGET_DEMO_STATUS = {
  rows: [
    { label_key: "scheduler.widget.pending", value: "3", state: "ok" as const },
    {
      label_key: "scheduler.widget.failed",
      value: "2",
      state: "warn" as const,
    },
    {
      label_key: "scheduler.widget.last_tick",
      value: "2h ago",
      state: "error" as const,
    },
  ],
};

function WidgetsSection() {
  return (
    <Section id="widgets" title={t("uikit.section.widgets")}>
      {/* Archetype D (E6 §1D): the four widget archetypes (D:dashboard §4) on one 12-col grid */}
      <WidgetGrid>
        <StatCard
          title={t("uikit.widget.pages")}
          icon="file-text"
          size="sm"
          data={{ value: 12 }}
          className={WIDGET_SPAN.sm}
        />
        <ChartCard
          title={t("uikit.widget.orders_chart")}
          icon="chart-column"
          size="sm"
          data={WIDGET_DEMO_CHART}
          className={WIDGET_SPAN.sm}
        />
        <ListCard
          title={t("uikit.widget.leads")}
          icon="inbox"
          size="sm"
          data={WIDGET_DEMO_LIST}
          className={WIDGET_SPAN.sm}
        />
        <StatusCard
          title={t("uikit.widget.queue")}
          icon="timer"
          size="sm"
          data={WIDGET_DEMO_STATUS}
          className={WIDGET_SPAN.sm}
        />
      </WidgetGrid>
      <Separator />
      {/* Size = content tier (D:dashboard §4): one widget, a DIFFERENT result per size */}
      <p className="text-xs text-muted-foreground">{t("uikit.widget.sizes")}</p>
      <WidgetGrid>
        <StatCard
          title={t("uikit.widget.products")}
          icon="shopping-cart"
          size="sm"
          data={WIDGET_DEMO_STAT}
          className={WIDGET_SPAN.sm}
        />
        <StatCard
          title={t("uikit.widget.products")}
          icon="shopping-cart"
          size="md"
          data={WIDGET_DEMO_STAT}
          className={WIDGET_SPAN.md}
        />
        <StatCard
          title={t("uikit.widget.products")}
          icon="shopping-cart"
          size="lg"
          data={WIDGET_DEMO_STAT}
          className={WIDGET_SPAN.lg}
        />
        <StatCard
          title={t("uikit.widget.products")}
          icon="shopping-cart"
          size="xl"
          data={WIDGET_DEMO_STAT}
          className={WIDGET_SPAN.xl}
        />
      </WidgetGrid>
      <WidgetGrid>
        <ChartCard
          title={t("uikit.widget.orders_chart")}
          icon="chart-column"
          size="md"
          data={WIDGET_DEMO_CHART}
          className={WIDGET_SPAN.md}
        />
        <ChartCard
          title={t("uikit.widget.orders_chart")}
          icon="chart-column"
          size="lg"
          data={WIDGET_DEMO_CHART}
          className={WIDGET_SPAN.lg}
        />
        <ChartCard
          title={t("uikit.widget.orders_chart")}
          icon="chart-column"
          size="xl"
          data={WIDGET_DEMO_CHART}
          className={WIDGET_SPAN.xl}
        />
      </WidgetGrid>
      <WidgetGrid>
        <ListCard
          title={t("uikit.widget.leads")}
          icon="inbox"
          size="sm"
          data={WIDGET_DEMO_LIST}
          className={WIDGET_SPAN.sm}
        />
        <ListCard
          title={t("uikit.widget.leads")}
          icon="inbox"
          size="md"
          data={WIDGET_DEMO_LIST}
          className={WIDGET_SPAN.md}
        />
        <ListCard
          title={t("uikit.widget.leads")}
          icon="inbox"
          size="lg"
          data={WIDGET_DEMO_LIST}
          className={WIDGET_SPAN.lg}
        />
        <StatusCard
          title={t("uikit.widget.queue")}
          icon="timer"
          size="md"
          data={WIDGET_DEMO_STATUS}
          className={WIDGET_SPAN.md}
        />
      </WidgetGrid>
      <Separator />
      {/* Loading / error / empty contract of a widget card (E4 §4, UI:dashboard §2) */}
      <p className="text-xs text-muted-foreground">
        {t("uikit.widget.states")}
      </p>
      <WidgetGrid>
        <WidgetCardFrame
          title={t("uikit.widget.pages")}
          icon="file-text"
          className={WIDGET_SPAN.sm}
        >
          <WidgetSkeleton type="stat" size="sm" />
        </WidgetCardFrame>
        <WidgetCardFrame
          title={t("uikit.widget.orders_chart")}
          icon="chart-column"
          className={WIDGET_SPAN.sm}
        >
          <WidgetSkeleton type="chart" size="sm" />
        </WidgetCardFrame>
        <WidgetCardFrame
          title={t("uikit.widget.leads")}
          icon="inbox"
          className={WIDGET_SPAN.sm}
        >
          <div className="flex flex-col items-start gap-2">
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <CircleAlert className="size-4 shrink-0 text-destructive" />
              {t("dashboard.widget_error")}
            </p>
            <Button variant="outline" size="sm">
              {t("common.retry")}
            </Button>
          </div>
        </WidgetCardFrame>
        <ListCard
          title={t("uikit.widget.leads")}
          icon="inbox"
          size="sm"
          data={{ items: [] }}
          className={WIDGET_SPAN.sm}
        />
      </WidgetGrid>
    </Section>
  );
}

function EditorArchetypeSection() {
  const [dirty, setDirty] = useState(false);
  return (
    <section id="editor" className="space-y-3">
      <h2 className="text-lg font-semibold tracking-tight">
        {t("uikit.section.editor")}
      </h2>
      <Card className="overflow-visible">
        <CardContent>
          {/* Archetype B (E6 §1B) rendered in a demo frame — real editors take the full page,
              so the sticky bottom bar is neutralized here to stay inside the frame */}
          <EditorLayout
            className="[&>div.sticky]:static!"
            back={{ href: "/ui-kit" }}
            title="Home"
            status="draft"
            dirty={dirty}
            primaryAction={{
              label: t("common.save"),
              onClick: () => {
                setDirty(false);
                toast.success(t("uikit.toastSaved"));
              },
            }}
            dangerZone={
              <ConfirmDialog
                trigger={
                  <Button variant="destructive" size="sm">
                    <Trash2 />
                    {t("common.delete")}
                  </Button>
                }
                title={t("confirm.delete.title")}
                description={t("confirm.delete.description")}
                confirmLabel={t("common.delete")}
                destructive
                onConfirm={() => toast.error(t("common.delete"))}
              />
            }
            tabs={[
              {
                key: "content",
                label: t("editor.tab.content"),
                icon: FileText,
                content: (
                  <div className="grid max-w-2xl gap-4">
                    <FormField
                      name="editor-title"
                      label={t("uikit.field.title")}
                      required
                    >
                      <Input
                        id="editor-title"
                        defaultValue="Home"
                        onChange={() => setDirty(true)}
                      />
                    </FormField>
                    <FormField name="editor-slug" label={t("uikit.field.slug")}>
                      <Input
                        id="editor-slug"
                        defaultValue="/"
                        onChange={() => setDirty(true)}
                      />
                    </FormField>
                  </div>
                ),
              },
              {
                key: "seo",
                label: t("editor.tab.seo"),
                icon: Search,
                content: (
                  <FormField
                    name="editor-seo-title"
                    label={t("uikit.field.title")}
                  >
                    <Input
                      id="editor-seo-title"
                      onChange={() => setDirty(true)}
                    />
                  </FormField>
                ),
              },
              {
                key: "languages",
                label: t("editor.tab.languages"),
                icon: Languages,
                content: (
                  <LanguageTabs
                    locales={[
                      { code: "ru", state: "translated" },
                      { code: "en", state: "missing" },
                    ]}
                  >
                    {(locale) => (
                      <FormField
                        name={`editor-title-${locale}`}
                        label={`${t("uikit.field.title")} (${locale})`}
                      >
                        <Input
                          id={`editor-title-${locale}`}
                          onChange={() => setDirty(true)}
                        />
                      </FormField>
                    )}
                  </LanguageTabs>
                ),
              },
            ]}
            sidebar={
              <Card size="sm">
                <CardHeader>
                  <CardTitle>{t("editor.tab.content")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <span>{t("common.status")}</span>
                    <StatusBadge status="draft" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>{t("common.updated")}</span>
                    <span>2026-07-01</span>
                  </div>
                </CardContent>
              </Card>
            }
          />
        </CardContent>
      </Card>
    </section>
  );
}

function SettingsArchetypeSection() {
  const [active, setActive] = useState("general");
  const [dirty, setDirty] = useState(false);
  const sections = [
    { key: "general", label: t("uikit.settings.general"), icon: Settings2 },
    { key: "mail", label: t("uikit.settings.mail"), icon: Mail },
    { key: "locales", label: t("editor.tab.languages"), icon: Globe },
  ];
  return (
    <section id="settings-archetype" className="space-y-3">
      <h2 className="text-lg font-semibold tracking-tight">
        {t("uikit.section.settings")}
      </h2>
      <Card className="overflow-visible">
        <CardContent>
          {/* Archetype C (E6 §1C) in a demo frame — sticky save neutralized like the editor demo */}
          <SettingsLayout
            className="[&>div.sticky]:static!"
            sections={sections}
            active={active}
            onSectionChange={setActive}
            dirty={dirty}
            onSave={{
              onClick: () => {
                setDirty(false);
                toast.success(t("uikit.toastSaved"));
              },
            }}
          >
            <div className="grid max-w-xl gap-4">
              {active === "general" ? (
                <>
                  <FormField
                    name="settings-site-name"
                    label={t("uikit.field.title")}
                    required
                  >
                    <Input
                      id="settings-site-name"
                      defaultValue="Universal CMS"
                      onChange={() => setDirty(true)}
                    />
                  </FormField>
                  <FormField
                    name="settings-site-url"
                    label={t("uikit.field.url")}
                  >
                    <Input
                      id="settings-site-url"
                      defaultValue="https://example.com"
                      onChange={() => setDirty(true)}
                    />
                  </FormField>
                </>
              ) : active === "mail" ? (
                <FormField
                  name="settings-mail-from"
                  label={t("uikit.field.email")}
                >
                  <Input
                    id="settings-mail-from"
                    defaultValue="noreply@example.com"
                    onChange={() => setDirty(true)}
                  />
                </FormField>
              ) : (
                <FormField
                  name="settings-locale"
                  label={t("editor.tab.languages")}
                >
                  <Select defaultValue="ru">
                    <SelectTrigger id="settings-locale" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ru">Русский</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>
              )}
            </div>
          </SettingsLayout>
        </CardContent>
      </Card>
    </section>
  );
}

function WizardSection() {
  return (
    <Section id="wizard" title={t("uikit.section.wizard")}>
      {/* Archetype E (E6 §1E): step-by-step creation in the single dialog shell */}
      <WizardDialog
        trigger={
          <Button>
            <Plus />
            {t("uikit.openWizard")}
          </Button>
        }
        title={t("uikit.openWizard")}
        onFinish={() => toast.success(t("uikit.toastSaved"))}
        steps={[
          {
            key: "basics",
            label: t("uikit.field.title"),
            content: (
              <div className="grid gap-4">
                <FormField
                  name="wizard-name"
                  label={t("uikit.field.title")}
                  required
                >
                  <Input id="wizard-name" placeholder="Projects" />
                </FormField>
                <FormField name="wizard-slug" label={t("uikit.field.slug")}>
                  <Input id="wizard-slug" placeholder="projects" />
                </FormField>
              </div>
            ),
          },
          {
            key: "fields",
            label: t("uikit.section.forms"),
            content: (
              <div className="grid gap-3">
                <div className="flex items-center gap-2">
                  <Switch id="wizard-listing" defaultChecked />
                  <Label htmlFor="wizard-listing">has_listing</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch id="wizard-detail" defaultChecked />
                  <Label htmlFor="wizard-detail">has_detail</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch id="wizard-categories" />
                  <Label htmlFor="wizard-categories">has_categories</Label>
                </div>
              </div>
            ),
          },
          {
            key: "confirm",
            label: t("common.confirm"),
            content: (
              <p className="text-sm text-muted-foreground">
                {t("uikit.subtitle")}
              </p>
            ),
          },
        ]}
      />
    </Section>
  );
}

type DemoBlock = { type: "text" | "image" | "video"; label: string };

const BLOCK_ICON: Record<DemoBlock["type"], typeof Type> = {
  text: Type,
  image: Image,
  video: Video,
};

function CompositionSection() {
  const [regions, setRegions] = useState<Record<string, DemoBlock[]>>({
    header: [{ type: "text", label: "Hero heading" }],
    main: [
      { type: "text", label: "Text block" },
      { type: "image", label: "Gallery" },
      { type: "video", label: "Promo video" },
    ],
    footer: [],
  });
  const [configuring, setConfiguring] = useState<DemoBlock | null>(null);

  const regionTitles: Record<string, string> = {
    header: "Header",
    main: "Content",
    footer: "Footer",
  };

  return (
    <section id="composition" className="space-y-3">
      <h2 className="text-lg font-semibold tracking-tight">
        {t("uikit.section.composition")}
      </h2>
      <Card>
        <CardContent className="space-y-4">
          {/* Page composition (E2 §10): layout regions as vertical zones, dnd-sortable blocks */}
          {Object.entries(regions).map(([regionKey, blocks]) => (
            <div
              key={regionKey}
              className="rounded-xl border border-dashed p-3"
            >
              <p className="pb-2 text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
                {regionTitles[regionKey]}
              </p>
              <RepeaterField<DemoBlock>
                value={blocks}
                onChange={(next) =>
                  setRegions({ ...regions, [regionKey]: next })
                }
                newItem={() => ({ type: "text" as const, label: "Text block" })}
                addLabel={t("composition.addBlock")}
                renderItem={(block) => {
                  const BlockIcon = BLOCK_ICON[block.type];
                  return (
                    <div className="flex items-center gap-2.5">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                        <BlockIcon className="size-4" />
                      </span>
                      <span className="flex-1 truncate text-sm">
                        {block.label}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setConfiguring(block)}
                      >
                        {t("composition.configure")}
                      </Button>
                    </div>
                  );
                }}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Modal
        open={configuring !== null}
        onOpenChange={(next) => {
          if (!next) setConfiguring(null);
        }}
        title={configuring?.label ?? ""}
        footer={
          <>
            <Button variant="outline" onClick={() => setConfiguring(null)}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={() => {
                setConfiguring(null);
                toast.success(t("uikit.toastSaved"));
              }}
            >
              {t("common.save")}
            </Button>
          </>
        }
      >
        {/* Block fields are schema-generated in the real editor (E2 §7) */}
        <FormField name="block-demo-text" label={t("uikit.field.title")}>
          <Input id="block-demo-text" defaultValue={configuring?.label} />
        </FormField>
      </Modal>
    </section>
  );
}

function MenuBuilderSection() {
  const [menu, setMenu] = useState<TreeNode[]>([
    { id: "m-home", label: "Home" },
    {
      id: "m-catalog",
      label: "Catalog",
      children: [{ id: "m-doors", label: "Doors" }],
    },
    { id: "m-contacts", label: "Contacts" },
  ]);
  const [reference, setReference] = useState<ReferenceItem | null>(null);

  const searchReferences = (query: string) =>
    new Promise<ReferenceItem[]>((resolve) => {
      setTimeout(
        () =>
          resolve(
            DEMO_REFERENCES.filter((item) =>
              item.label.toLowerCase().includes(query.toLowerCase()),
            ),
          ),
        250,
      );
    });

  return (
    <section id="menu-builder" className="space-y-3">
      <h2 className="text-lg font-semibold tracking-tight">
        {t("uikit.section.menuBuilder")}
      </h2>
      <Card>
        <CardContent>
          {/* Menu builder (E2 §10): dnd tree + link-by-reference, never raw URLs */}
          <div className="flex flex-col gap-4 lg:flex-row">
            <div className="min-w-0 flex-1">
              <TreeList items={menu} onChange={setMenu} />
            </div>
            <aside className="w-full shrink-0 space-y-3 rounded-xl border p-3 lg:w-72">
              <FormField
                name="menu-reference"
                label={t("reference.placeholder")}
              >
                <ReferencePicker
                  id="menu-reference"
                  value={reference}
                  onChange={setReference}
                  search={searchReferences}
                />
              </FormField>
              <Button
                className="w-full"
                disabled={!reference}
                onClick={() => {
                  if (!reference) return;
                  setMenu([
                    ...menu,
                    {
                      id: `m-${reference.id}-${menu.length}`,
                      label: reference.label,
                    },
                  ]);
                  setReference(null);
                }}
              >
                <Plus />
                {t("common.add")}
              </Button>
            </aside>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

function MediaGridSection() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [page, setPage] = useState(1);

  const filtered = DEMO_MEDIA.filter((item) => item.name.includes(search));
  const pages = Math.max(1, Math.ceil(filtered.length / MEDIA_PER_PAGE));
  const safePage = Math.min(page, pages);
  const items = filtered.slice(
    (safePage - 1) * MEDIA_PER_PAGE,
    safePage * MEDIA_PER_PAGE,
  );

  return (
    <section id="media-grid" className="space-y-3">
      <h2 className="text-lg font-semibold tracking-tight">
        {t("uikit.section.mediaGrid")}
      </h2>
      <Card>
        <CardContent className="space-y-3">
          {/* Media library (E2 §10): same picking surface as MediaPicker, full-page */}
          <Toolbar
            search={{
              value: search,
              onChange: (value) => {
                setSearch(value);
                setPage(1);
              },
            }}
            bulkActions={[
              {
                label: t("common.delete"),
                destructive: true,
                icon: <Trash2 />,
                onClick: () => {
                  toast.error(t("common.delete"));
                  setSelected([]);
                },
              },
            ]}
            selectedCount={selected.length}
          />
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-8">
            {items.map((item) => (
              <MediaTile
                key={item.path}
                item={item}
                selected={selected.includes(item.path)}
                onClick={() =>
                  setSelected((prev) =>
                    prev.includes(item.path)
                      ? prev.filter((p) => p !== item.path)
                      : [...prev, item.path],
                  )
                }
              />
            ))}
          </div>
          <PaginationBar
            pagination={{
              page: safePage,
              pages,
              total: filtered.length,
              perPage: MEDIA_PER_PAGE,
            }}
            shown={items.length}
            onPage={setPage}
            className="border-t pt-2"
          />
        </CardContent>
      </Card>
    </section>
  );
}

const MATRIX_DEMO_ROLES: RoleDetail[] = [
  {
    id: 1,
    key: "admin",
    label: "Administrator",
    is_system: true,
    users_count: 2,
    permissions: [],
  },
  {
    id: 2,
    key: "editor",
    label: "Editor",
    is_system: false,
    users_count: 5,
    permissions: ["pages.view", "pages.manage", "media.view"],
  },
  {
    id: 3,
    key: "viewer",
    label: "Viewer",
    is_system: false,
    users_count: 1,
    permissions: [],
  },
];

const MATRIX_DEMO_PERMISSIONS: Permission[] = [
  { key: "pages.view", group: "pages" },
  { key: "pages.manage", group: "pages" },
  { key: "media.view", group: "media" },
  { key: "media.manage", group: "media" },
  { key: "users.view", group: "users" },
  { key: "users.manage", group: "users" },
];

function PermissionsMatrixSection() {
  const [value, setValue] = useState<RolePermissionMap>(() =>
    Object.fromEntries(
      MATRIX_DEMO_ROLES.map((role) => [role.id, role.permissions]),
    ),
  );

  return (
    <section id="permissions" className="space-y-3">
      <h2 className="text-lg font-semibold tracking-tight">
        {t("uikit.section.permissions")}
      </h2>
      <Card>
        <CardContent>
          {/* Roles × permissions matrix (RoleMatrix) — a form grid, not a record list */}
          <RoleMatrix
            roles={MATRIX_DEMO_ROLES}
            permissions={MATRIX_DEMO_PERMISSIONS}
            value={value}
            onChange={(roleId, keys) =>
              setValue((current) => ({ ...current, [roleId]: keys }))
            }
          />
        </CardContent>
      </Card>
    </section>
  );
}

function ErrorsSection() {
  return (
    <section id="errors" className="space-y-3">
      <h2 className="text-lg font-semibold tracking-tight">
        {t("uikit.section.errors")}
      </h2>
      {/* Archetype F (E6 §1F): the single full-page error view — framed compact here */}
      <div className="grid gap-3 lg:grid-cols-3">
        <Card>
          <CardContent>
            <ErrorPage code="404" className="min-h-0 px-2 py-6" />
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <ErrorPage
              code="500"
              onRetry={() => toast.success(t("uikit.toastSaved"))}
              className="min-h-0 px-2 py-6"
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <ErrorPage code="403" className="min-h-0 px-2 py-6" />
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function LoginSection() {
  return (
    <section id="login" className="space-y-3">
      <h2 className="text-lg font-semibold tracking-tight">
        {t("uikit.section.login")}
      </h2>
      {/* Login screen (E2 §5): a single glass card centered over the mesh */}
      <div className="flex justify-center rounded-xl border border-dashed py-10">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <div className="flex flex-col items-center gap-3 pt-2 text-center">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-primary text-xl font-bold text-primary-foreground">
                U
              </span>
              <CardTitle className="text-lg">{t("login.title")}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField name="login-email" label={t("login.email")} required>
              <Input
                id="login-email"
                type="email"
                placeholder="admin@example.com"
              />
            </FormField>
            <FormField
              name="login-password"
              label={t("login.password")}
              required
            >
              <Input id="login-password" type="password" />
            </FormField>
            <Button
              className="w-full"
              onClick={() => toast.success(t("uikit.toastSaved"))}
            >
              <Lock className="size-4" />
              {t("login.submit")}
            </Button>
            <p className="text-center">
              <Button variant="link" size="sm">
                {t("login.forgot")}
              </Button>
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

export function UiKitPage() {
  // Re-render the whole showcase when the admin UI locale changes.
  useLocale();

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 pb-16">
      <PageHeader title={t("uikit.title")} icon={Image} />
      <p className="-mt-4 text-sm text-muted-foreground">
        {t("uikit.subtitle")}
      </p>

      <Tabs defaultValue="index">
        <TabsList>
          <TabsTrigger value="index">
            <Boxes className="size-4" />
            {t("uikit.tab.index")}
          </TabsTrigger>
          <TabsTrigger value="components">
            <Shapes className="size-4" />
            {t("uikit.tab.components")}
          </TabsTrigger>
          <TabsTrigger value="archetypes">
            <LayoutTemplate className="size-4" />
            {t("uikit.tab.archetypes")}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="index">
          <ComponentsIndex />
        </TabsContent>
        <TabsContent value="components" className="space-y-8 pt-4">
          <PaletteSection />
          <ButtonsSection />
          <FormsSection />
          <RichTextSection />
          <PickersSection />
          <LanguageSection />
          <SaveBarSection />
          <BadgesSection />
          <NewComponentsSection />
          <CardsSection />
          <TreeSection />
          <RepeaterSection />
          <OverlaysSection />
          <ChangePasswordSection />
          <EmptySection />
        </TabsContent>
        <TabsContent value="archetypes" className="space-y-8 pt-4">
          <ListArchetypeSection />
          <EditorArchetypeSection />
          <SettingsArchetypeSection />
          <WidgetsSection />
          <WizardSection />
          <Separator />
          <CompositionSection />
          <MenuBuilderSection />
          <MediaGridSection />
          <PermissionsMatrixSection />
          <ErrorsSection />
          <LoginSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}
