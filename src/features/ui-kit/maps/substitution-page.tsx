import { Info, Map as MapIcon } from "lucide-react";

import { ComponentDemo, ShowcasePage } from "@/components/component-demo";
import { LeafletMap } from "@/components/leaflet-map";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

/*
 * Maps — substitution note (W5): Velzon ships vector maps + Google Maps; this
 * template standardizes on Leaflet (BSD-2-Clause, resale-safe, no API key).
 * This page states the substitution and shows the Leaflet equivalent.
 */
export function MapsSubstitutionPage() {
  useLocale();
  return (
    <ShowcasePage
      title={t("showcase.maps.substitution.title")}
      description={t("showcase.maps.substitution.desc")}
      icon={MapIcon}
      breadcrumb={{ group: t("nav.components.maps") }}
    >
      <ComponentDemo
        title={t("showcase.maps.substitution.title")}
        notes={t("showcase.maps.substitution.note")}
        previewClassName="block p-5"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-2 rounded-xl border border-[var(--glass-border)] bg-primary/5 p-4 text-sm">
            <Info className="mt-0.5 size-4 shrink-0 text-primary" />
            <p className="text-muted-foreground">
              {t("showcase.maps.substitution.body")}
            </p>
          </div>
          <LeafletMap center={[35.6762, 139.6503]} zoom={11} height={300} />
        </div>
      </ComponentDemo>
    </ShowcasePage>
  );
}
