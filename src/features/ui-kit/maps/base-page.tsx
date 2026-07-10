import { Map as MapIcon } from "lucide-react";

import { ComponentDemo, ShowcasePage } from "@/components/component-demo";
import { LeafletMap } from "@/components/leaflet-map";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

/*
 * Maps — base map (W5): a plain Leaflet map on free OpenStreetMap tiles.
 * Leaflet (BSD-2-Clause) is resale-safe; no tile API key is required.
 */
export function MapsBasePage() {
  useLocale();
  return (
    <ShowcasePage
      title={t("showcase.maps.base.title")}
      description={t("showcase.maps.base.desc")}
      icon={MapIcon}
      breadcrumb={{ group: t("nav.components.maps") }}
    >
      <ComponentDemo
        title={t("showcase.maps.base.demo")}
        notes={t("showcase.maps.tileNote")}
        previewClassName="block p-5"
        code={`<LeafletMap center={[48.8566, 2.3522]} zoom={12} />`}
      >
        <LeafletMap center={[48.8566, 2.3522]} zoom={12} />
      </ComponentDemo>
    </ShowcasePage>
  );
}
