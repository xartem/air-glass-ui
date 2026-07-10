import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { CircleMarker, MapContainer, Marker, Popup, TileLayer } from "react-leaflet";

import { devDebug } from "@/lib/debug";
import { cn } from "@/lib/utils";

/*
 * LeafletMap (W5 gap primitive): a thin, token-styled wrapper around
 * react-leaflet. Leaflet (BSD-2-Clause) is the only new dependency in the
 * showcase wave — resale-safe. Uses the free OpenStreetMap tile source
 * (attribution rendered by the TileLayer). Markers render as a token-styled
 * div-icon so no external marker image assets are bundled.
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
  return (
    <div
      className={cn(
        "w-full overflow-hidden rounded-2xl border border-[var(--glass-border)]",
        className,
      )}
      style={{ height }}
    >
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
        whenReady={() => devDebug("[leaflet] ready")}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {blobs.map((blob, index) => (
          <CircleMarker
            key={`blob-${index}`}
            center={[blob.lat, blob.lng]}
            radius={8 + blob.value * 22}
            pathOptions={{
              color: "var(--chart-1)",
              weight: 1,
              fillColor: "var(--chart-1)",
              fillOpacity: 0.2 + blob.value * 0.5,
            }}
          >
            {blob.label ? <Popup>{blob.label}</Popup> : null}
          </CircleMarker>
        ))}
        {markers.map((marker, index) => (
          <Marker
            key={`marker-${index}`}
            position={[marker.lat, marker.lng]}
            icon={pinIcon}
          >
            {marker.label ? <Popup>{marker.label}</Popup> : null}
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
