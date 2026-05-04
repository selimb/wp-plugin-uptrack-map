import type L from "leaflet";
import * as z from "zod/mini";

import {
  zDurationUnit,
  zMarkerCoords,
  zRouteDifficulty,
  zRouteType,
  zUptrackSettings,
} from "../settings";

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
  durationValue: z.string(),
  durationUnit: zDurationUnit,
  elevationGain: z.string(),
  elevationRangeStart: z.string(),
  elevationRangeEnd: z.string(),
  distanceKm: z.string(),
  difficulty: zRouteDifficulty,
});
export type RouteInfo = z.infer<typeof zRouteInfo>;

export type RouteId = RouteInfo["id"];

export type LineCoords = L.LatLng[];

// SYNC [UptrackMapShortcodeInput]
export const zUptrackMapShortcodeInput = z.extend(
  z.pick(zUptrackSettings, {
    uptrack_focus_card_html: true,
    uptrack_map_styles: true,
  }),
  { routes: z.array(zRouteInfo) },
);
export type UptrackMapShortcodeInput = z.infer<
  typeof zUptrackMapShortcodeInput
>;
