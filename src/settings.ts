import * as z from "zod/mini";

import {
  DEFAULT_FOCUS_CARD_HTML,
  DEFAULT_UPTRACK_MAP_CSS,
} from "./default-assets";
import { zMapStylesSafe } from "./uptrack-map/map-styles";
import { zFallback } from "./utils/zod-fallback";

z.config(z.locales.en());

export const zKmlFilename = z.string();
export type KmlFilename = z.infer<typeof zKmlFilename>;

export const zRouteType = z.enum(["ski_touring", "mountaineering", "hiking"]);
export type RouteType = z.infer<typeof zRouteType>;

export const zMarkerCoords = z.tuple([z.number(), z.number()]);
export type MarkerCoords = z.infer<typeof zMarkerCoords>;

// SYNC [UptrackRoutesSettingItem]
const zUptrackRoutesSettingItem = z.object({
  kmlFilename: zKmlFilename,
  postId: z.nullable(z.string()),
  title: z.string(),
  type: zRouteType,
  marker: z.nullable(zMarkerCoords),
  distance: z.string(),
  elevation: z.string(),
  duration: z.string(),
});
export type UptrackRoutesSettingItem = z.infer<
  typeof zUptrackRoutesSettingItem
>;

export const UPTRACK_ROUTES_SETTING_ITEM_DEFAULTS: z.input<
  typeof zUptrackRoutesSettingItem
> = {
  kmlFilename: "",
  postId: null,
  title: "",
  type: "ski_touring",
  marker: null,
  distance: "",
  elevation: "",
  duration: "",
};

export const zUptrackRoutesSettingItemSafe = zFallback(
  zUptrackRoutesSettingItem,
  UPTRACK_ROUTES_SETTING_ITEM_DEFAULTS,
);

export const zUptrackRoutesSetting = z.array(zUptrackRoutesSettingItemSafe);
export type UptrackRoutesSetting = z.infer<typeof zUptrackRoutesSetting>;

const zTrimString = z.string().check(z.trim());

// SYNC [uptrack-settings]
const zUptrackSettingsBase = z.object({
  kml_directory: zTrimString,
  routes: zUptrackRoutesSetting,
  focus_card_html: z.string(),
  css: z.string(),
  alpinejs_url: zTrimString,
  mapStyles: zMapStylesSafe,
});

export const UPTRACK_SETTINGS_DEFAULTS: z.input<typeof zUptrackSettingsBase> = {
  kml_directory: "kml-paths",
  routes: [],
  focus_card_html: DEFAULT_FOCUS_CARD_HTML,
  css: DEFAULT_UPTRACK_MAP_CSS,
  alpinejs_url: "https://cdn.jsdelivr.net/npm/alpinejs@3.15.11/dist/cdn.min.js",
  mapStyles: zMapStylesSafe.parse({}),
};

export const zUptrackSettings = zFallback(
  zUptrackSettingsBase,
  UPTRACK_SETTINGS_DEFAULTS,
);
export type UptrackSettings = z.infer<typeof zUptrackSettings>;

export const zUptrackSettingsSafe = zUptrackSettings;

// SYNC [UptrackSettingsContainer]
export type UptrackSettingsContainer = {
  uptrack_settings: UptrackSettings;
};
