import type L from "leaflet";
import * as z from "zod/mini";

import { zMarkerCoords, zRouteType } from "../settings";
import { zMapStylesSafe } from "./map-styles";

z.config(z.locales.en());

// SYNC [RouteInfo]
export const zRouteInfo = z.object({
  id: z.string(),
  kmlUrl: z.string(),
  type: zRouteType,
  marker: z.nullable(zMarkerCoords),
  /** Post URL */
  url: z.string(),
  /** Post title */
  title: z.string(),
  distance: z.string(),
  elevation: z.string(),
  duration: z.string(),
});
export type RouteInfo = z.infer<typeof zRouteInfo>;

export type RouteId = RouteInfo["id"];

export type LineCoords = L.LatLng[];

// SYNC [UptrackMapShortcodeInput]
// Use `strictObject` so we can catch divergences.
export const zUptrackMapShortcodeInput = z.strictObject({
  routes: z.array(zRouteInfo),
  focus_card_html: z.string(),
  mapStyles: zMapStylesSafe,
});
export type UptrackMapShortcodeInput = z.infer<
  typeof zUptrackMapShortcodeInput
>;
