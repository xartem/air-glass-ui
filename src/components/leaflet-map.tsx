import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

import { devDebug } from "@/lib/debug";
import { cn } from "@/lib/utils";

/*
 * LeafletMap: a thin, token-styled wrapper around Leaflet
 * (BSD-2-Clause — resale-safe). Driven through Leaflet's own imperative API
 * rather than a React binding, so the bundle carries no additional licence
 * beyond Leaflet itself. Uses the free OpenStreetMap tile source (attribution
 * rendered by the tile layer). Markers render as a token-styled div-icon so no
 * external marker image assets are bundled.
 */

export interface MapMarker {
  lat: number;
  lng: number;
  label?: string;
}

export interface MapBlob {
  lat: number;
  lng: number;
  /** Normalized 0..1 intensity — drives the circle radius + fill token. */
  value: number;
  label?: string;
}

const pinIcon = L.divIcon({
  className: "",
  html:
    '<span style="display:block;width:14px;height:14px;border-radius:9999px;' +
    "background:var(--primary);border:2px solid var(--background);" +
    'box-shadow:0 0 0 4px color-mix(in oklab, var(--primary) 30%, transparent);"></span>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

export function LeafletMap({
  center = [51.505, -0.09],
  zoom = 12,
  markers = [],
  blobs = [],
  height = 360,
  className,
}: {
  center?: [number, number];
  zoom?: number;
  markers?: MapMarker[];
  /** Graduated circles standing in for a choropleth layer. */
  blobs?: MapBlob[];
  height?: number;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const overlaysRef = useRef<L.LayerGroup | null>(null);

  // Read the latest center/zoom without making them creation dependencies —
  // callers pass array literals, whose identity changes on every render.
  const [lat, lng] = center;

  // Create once. Tearing the instance down on cleanup is what keeps React 19
  // StrictMode's double-mount from hitting "Map container is already initialized".
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const map = L.map(container, {
      center: [lat, lng],
      zoom,
      scrollWheelZoom: false,
    });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    overlaysRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    map.whenReady(() => devDebug("[leaflet] ready"));

    return () => {
      map.remove();
      mapRef.current = null;
      overlaysRef.current = null;
    };
    // Creation is mount-only; view changes are handled by the effect below.
  }, []);

  // Recentre in place rather than rebuilding the map when the view props change.
  useEffect(() => {
    mapRef.current?.setView([lat, lng], zoom);
  }, [lat, lng, zoom]);

  // Overlays live in their own group so they can be swapped without touching
  // the base layer.
  useEffect(() => {
    const group = overlaysRef.current;
    if (!group) return;
    group.clearLayers();

    for (const blob of blobs) {
      const circle = L.circleMarker([blob.lat, blob.lng], {
        radius: 8 + blob.value * 22,
        color: "var(--chart-1)",
        weight: 1,
        fillColor: "var(--chart-1)",
        fillOpacity: 0.2 + blob.value * 0.5,
      });
      if (blob.label) circle.bindPopup(blob.label);
      circle.addTo(group);
    }

    for (const marker of markers) {
      const pin = L.marker([marker.lat, marker.lng], { icon: pinIcon });
      if (marker.label) pin.bindPopup(marker.label);
      pin.addTo(group);
    }
  }, [markers, blobs]);

  return (
    <div
      className={cn(
        "w-full overflow-hidden rounded-2xl border border-[var(--glass-border)]",
        className,
      )}
      style={{ height }}
    >
      <div ref={containerRef} style={{ height: "100%", width: "100%" }} />
    </div>
  );
}
