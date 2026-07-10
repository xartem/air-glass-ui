import { useMemo, useState, type ComponentType } from "react";
import {
  Activity,
  AlarmClock,
  Archive,
  ArrowRight,
  Award,
  Bell,
  Bookmark,
  Box,
  Briefcase,
  Calendar,
  Camera,
  ChartBar,
  Check,
  ChevronRight,
  Clock,
  Cloud,
  Code,
  Cog,
  Compass,
  CreditCard,
  Database,
  Download,
  Eye,
  File,
  FileText,
  Filter,
  Flag,
  Folder,
  Gift,
  Globe,
  Heart,
  Home,
  Image,
  Inbox,
  Info,
  Key,
  Layers,
  Layout,
  LifeBuoy,
  Link,
  Lock,
  Mail,
  Map,
  MapPin,
  Menu,
  MessageSquare,
  Mic,
  Moon,
  Music,
  Package,
  Paperclip,
  Pencil,
  Phone,
  PieChart,
  Pin,
  Play,
  Plus,
  Power,
  Printer,
  Search,
  Send,
  Settings,
  Share2,
  Shield,
  ShoppingBag,
  ShoppingCart,
  Smile,
  Star,
  Sun,
  Tag,
  Target,
  Trash2,
  TrendingUp,
  Trophy,
  Truck,
  Upload,
  User,
  Users,
  Video,
  Wallet,
  Wifi,
  Zap,
} from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/empty-state";
import { toast } from "@/components/toast";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

/*
 * Icons showcase (W5): a single searchable grid of the lucide icon set (the
 * template's only icon library). Click any tile to copy its component name.
 * We deliberately do NOT ship Velzon's icon fonts (Remix / Boxicons / Material /
 * Feather / Line Awesome / Crypto SVG) — the page states that substitution.
 */

const ICONS: { name: string; Icon: ComponentType<{ className?: string }> }[] = [
  { name: "Activity", Icon: Activity },
  { name: "AlarmClock", Icon: AlarmClock },
  { name: "Archive", Icon: Archive },
  { name: "ArrowRight", Icon: ArrowRight },
  { name: "Award", Icon: Award },
  { name: "Bell", Icon: Bell },
  { name: "Bookmark", Icon: Bookmark },
  { name: "Box", Icon: Box },
  { name: "Briefcase", Icon: Briefcase },
  { name: "Calendar", Icon: Calendar },
  { name: "Camera", Icon: Camera },
  { name: "ChartBar", Icon: ChartBar },
  { name: "Check", Icon: Check },
  { name: "ChevronRight", Icon: ChevronRight },
  { name: "Clock", Icon: Clock },
  { name: "Cloud", Icon: Cloud },
  { name: "Code", Icon: Code },
  { name: "Cog", Icon: Cog },
  { name: "Compass", Icon: Compass },
  { name: "CreditCard", Icon: CreditCard },
  { name: "Database", Icon: Database },
  { name: "Download", Icon: Download },
  { name: "Eye", Icon: Eye },
  { name: "File", Icon: File },
  { name: "FileText", Icon: FileText },
  { name: "Filter", Icon: Filter },
  { name: "Flag", Icon: Flag },
  { name: "Folder", Icon: Folder },
  { name: "Gift", Icon: Gift },
  { name: "Globe", Icon: Globe },
  { name: "Heart", Icon: Heart },
  { name: "Home", Icon: Home },
  { name: "Image", Icon: Image },
  { name: "Inbox", Icon: Inbox },
  { name: "Info", Icon: Info },
  { name: "Key", Icon: Key },
  { name: "Layers", Icon: Layers },
  { name: "Layout", Icon: Layout },
  { name: "LifeBuoy", Icon: LifeBuoy },
  { name: "Link", Icon: Link },
  { name: "Lock", Icon: Lock },
  { name: "Mail", Icon: Mail },
  { name: "Map", Icon: Map },
  { name: "MapPin", Icon: MapPin },
  { name: "Menu", Icon: Menu },
  { name: "MessageSquare", Icon: MessageSquare },
  { name: "Mic", Icon: Mic },
  { name: "Moon", Icon: Moon },
  { name: "Music", Icon: Music },
  { name: "Package", Icon: Package },
  { name: "Paperclip", Icon: Paperclip },
  { name: "Pencil", Icon: Pencil },
  { name: "Phone", Icon: Phone },
  { name: "PieChart", Icon: PieChart },
  { name: "Pin", Icon: Pin },
  { name: "Play", Icon: Play },
  { name: "Plus", Icon: Plus },
  { name: "Power", Icon: Power },
  { name: "Printer", Icon: Printer },
  { name: "Search", Icon: Search },
  { name: "Send", Icon: Send },
  { name: "Settings", Icon: Settings },
  { name: "Share2", Icon: Share2 },
  { name: "Shield", Icon: Shield },
  { name: "ShoppingBag", Icon: ShoppingBag },
  { name: "ShoppingCart", Icon: ShoppingCart },
  { name: "Star", Icon: Star },
  { name: "Sun", Icon: Sun },
  { name: "Tag", Icon: Tag },
  { name: "Target", Icon: Target },
  { name: "Trash2", Icon: Trash2 },
  { name: "TrendingUp", Icon: TrendingUp },
  { name: "Trophy", Icon: Trophy },
  { name: "Truck", Icon: Truck },
  { name: "Upload", Icon: Upload },
  { name: "User", Icon: User },
  { name: "Users", Icon: Users },
  { name: "Video", Icon: Video },
  { name: "Wallet", Icon: Wallet },
  { name: "Wifi", Icon: Wifi },
  { name: "Zap", Icon: Zap },
];

export function IconsPage() {
  useLocale();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return needle
      ? ICONS.filter((icon) => icon.name.toLowerCase().includes(needle))
      : ICONS;
  }, [query]);

  const copy = async (name: string) => {
    try {
      await navigator.clipboard.writeText(name);
      toast.success(t("showcase.icons.copied", { name }));
    } catch {
      toast.error(t("showcase.demo.copyFailed"));
    }
  };

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 pb-16">
      <PageHeader
        title={t("showcase.icons.title")}
        icon={Smile}
        breadcrumbs={[
          { label: t("nav.group.components"), href: "/ui-kit" },
          { label: t("showcase.icons.title") },
        ]}
      />
      <p className="-mt-2 max-w-2xl text-sm text-muted-foreground">
        {t("showcase.icons.desc")}
      </p>

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("showcase.icons.search")}
          className="pl-9"
          aria-label={t("showcase.icons.search")}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Search} title={t("showcase.hub.empty")} />
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
          {filtered.map(({ name, Icon }) => (
            <button
              key={name}
              type="button"
              onClick={() => copy(name)}
              title={name}
              className="flex flex-col items-center gap-2 rounded-xl border border-[var(--glass-border)] bg-background/40 px-2 py-4 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <Icon className="size-5" />
              <span className="w-full truncate text-center text-[11px]">
                {name}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
