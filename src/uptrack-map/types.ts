import type L from "leaflet";

// XXX sync anchors
// SYNC [sync-RouteType]
export type RouteType = "ski_touring" | "mountaineering" | "hiking";

// SYNC [sync-RouteInfo]
export type RouteInfo = {
  id: string;
  kml_url: string;
  type: RouteType;
  marker_distance_percent: number;
  post_url: string;
  post_title: string;
  distance_km: number;
  elevation_m: number;
  duration_d: number;
};

export type RouteId = RouteInfo["id"];

export type LineCoords = L.LatLng[];
