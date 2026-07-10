import { Map as MapIcon } from "lucide-react";

import { ComponentDemo, ShowcasePage } from "@/components/component-demo";
import { LeafletMap } from "@/components/leaflet-map";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

/*
 * Maps — markers & choropleth (W5): token-styled markers with popups, plus
 * graduated circles standing in for a choropleth data layer.
 */

const MARKERS = [
  { lat: 40.7128, lng: -74.006, label: "New York" },
  { lat: 34.0522, lng: -118.2437, label: "Los Angeles" },
  { lat: 41.8781, lng: -87.6298, label: "Chicago" },
  { lat: 29.7604, lng: -95.3698, label: "Houston" },
];

const BLOBS = [
  { lat: 40.7128, lng: -74.006, value: 0.9, label: "8.3M" },
  { lat: 34.0522, lng: -118.2437, value: 0.7, label: "3.9M" },
  { lat: 41.8781, lng: -87.6298, value: 0.45, label: "2.7M" },
  { lat: 29.7604, lng: -95.3698, value: 0.35, label: "2.3M" },
];

export function MapsMarkersPage() {
  useLocale();
  return (
    <ShowcasePage
      title={t("showcase.maps.markers.title")}
      description={t("showcase.maps.markers.desc")}
      icon={MapIcon}
      breadcrumb={{ group: t("nav.components.maps") }}
    >
      <ComponentDemo
        title={t("showcase.maps.markers.demoMarkers")}
        previewClassName="block p-5"
        code={`<LeafletMap center={[39.5, -98.35]} zoom={4} markers={markers} />`}
      >
        <LeafletMap center={[39.5, -98.35]} zoom={4} markers={MARKERS} />
      </ComponentDemo>

      <ComponentDemo
        title={t("showcase.maps.markers.demoChoropleth")}
        notes={t("showcase.maps.markers.choroplethNote")}
        previewClassName="block p-5"
        code={`<LeafletMap center={[39.5, -98.35]} zoom={4} blobs={blobs} />`}
      >
        <LeafletMap center={[39.5, -98.35]} zoom={4} blobs={BLOBS} />
      </ComponentDemo>
    </ShowcasePage>
  );
}
