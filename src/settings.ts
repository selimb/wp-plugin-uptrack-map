import * as z from "zod/mini";

import {
  DEFAULT_FOCUS_CARD_HTML,
  DEFAULT_UPTRACK_MAP_CSS,
} from "./default-assets";
import { zMapStyles } from "./uptrack-map/map-styles";
import { zCatchObject } from "./utils";

export const zKmlFilename = z.string();
export type KmlFilename = z.infer<typeof zKmlFilename>;

export const zRouteType = z.enum(["ski_touring", "mountaineering", "hiking"]);
export type RouteType = z.infer<typeof zRouteType>;

export const zMarkerCoords = z.tuple([z.number(), z.number()]);
export type MarkerCoords = z.infer<typeof zMarkerCoords>;

// SYNC [UptrackRoutesSettingItem]
export const zUptrackRoutesSettingItem = z.object({
  kmlFilename: z.catch(zKmlFilename, ""),
  postId: z.catch(z.nullable(z.string()), null),
  title: z.catch(z.string(), ""),
  type: z.catch(zRouteType, "ski_touring"),
  marker: z.catch(z.nullable(zMarkerCoords), null),
  distance: z.catch(z.string(), ""),
  elevation: z.catch(z.string(), ""),
  duration: z.catch(z.string(), ""),
});
export type UptrackRoutesSettingItem = z.infer<
  typeof zUptrackRoutesSettingItem
>;

export const zUptrackRoutesSetting = z.array(zUptrackRoutesSettingItem);
export type UptrackRoutesSetting = z.infer<typeof zUptrackRoutesSetting>;

const zTrimString = z.string().check(z.trim());

// SYNC [uptrack-settings]
// [uptrack-settings-fallback] All properties should have fallbacks.
export const zUptrackSettings = zCatchObject({
  kml_directory: z.catch(zTrimString, "kml-paths"),
  routes: z.catch(zUptrackRoutesSetting, []),
  focus_card_html: z.catch(z.string(), DEFAULT_FOCUS_CARD_HTML),
  css: z.catch(z.string(), DEFAULT_UPTRACK_MAP_CSS),
  alpinejs_url: z.catch(
    zTrimString,
    "https://cdn.jsdelivr.net/npm/alpinejs@3.15.11/dist/cdn.min.js",
  ),
  mapStyles: zMapStyles,
});
export type UptrackSettings = z.infer<typeof zUptrackSettings>;

// SYNC [UptrackSettingsContainer]
export type UptrackSettingsContainer = {
  uptrack_settings: UptrackSettings;
};
