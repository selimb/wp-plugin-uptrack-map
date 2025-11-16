import type L from "leaflet";

import type { MarkerCoords, RouteType } from "../settings";

// SYNC [RouteInfo]
export type RouteInfo = {
  id: string;
  kmlUrl: string;
  type: RouteType;
  marker: MarkerCoords | null;
  postUrl: string;
  postTitle: string;
  distance: string;
  elevation: string;
  duration: string;
};

export type RouteId = RouteInfo["id"];

export type LineCoords = L.LatLng[];
