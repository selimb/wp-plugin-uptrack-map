import * as z from "zod/mini";

import {
  DEFAULT_FOCUS_CARD_HTML,
  DEFAULT_UPTRACK_MAP_CSS,
} from "./default-assets";
import {
  MAP_STYLES_DEFAULTS,
  zMapStyles,
  zMapStylesSafe,
} from "./uptrack-map/map-styles";
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
export const zUptrackSettings = z.object({
  uptrack_kml_directory: zTrimString,
  uptrack_routes: zUptrackRoutesSetting,
  uptrack_focus_card_html: z.string(),
  uptrack_css: z.string(),
  uptrack_alpinejs_url: zTrimString,
  uptrack_map_styles: zMapStyles,
});
export type UptrackSettings = z.infer<typeof zUptrackSettings>;

export const UPTRACK_SETTINGS_DEFAULTS: UptrackSettings = {
  uptrack_kml_directory: "kml-paths",
  uptrack_routes: [],
  uptrack_focus_card_html: DEFAULT_FOCUS_CARD_HTML,
  uptrack_css: DEFAULT_UPTRACK_MAP_CSS,
  uptrack_alpinejs_url:
    "https://cdn.jsdelivr.net/npm/alpinejs@3.15.11/dist/cdn.min.js",
  uptrack_map_styles: MAP_STYLES_DEFAULTS,
};

// [uptrack-settings-fallback] All settings should have fallback values.
// Use `z.object` + `z.catch` (instead of `zFallback`) to enable easy `.pick`-ing.
// This could be implemented generically, but then we need fancy type-fu to preserve the types, which is not worth it for now.
export const zUptrackSettingsSafe = z.object({
  uptrack_kml_directory: z.catch(
    zUptrackSettings.shape.uptrack_kml_directory,
    UPTRACK_SETTINGS_DEFAULTS.uptrack_kml_directory,
  ),
  uptrack_routes: z.catch(
    zUptrackSettings.shape.uptrack_routes,
    UPTRACK_SETTINGS_DEFAULTS.uptrack_routes,
  ),
  uptrack_focus_card_html: z.catch(
    zUptrackSettings.shape.uptrack_focus_card_html,
    UPTRACK_SETTINGS_DEFAULTS.uptrack_focus_card_html,
  ),
  uptrack_css: z.catch(
    zUptrackSettings.shape.uptrack_css,
    UPTRACK_SETTINGS_DEFAULTS.uptrack_css,
  ),
  uptrack_alpinejs_url: z.catch(
    zUptrackSettings.shape.uptrack_alpinejs_url,
    UPTRACK_SETTINGS_DEFAULTS.uptrack_alpinejs_url,
  ),
  uptrack_map_styles: zMapStylesSafe,
} satisfies Record<keyof UptrackSettings, unknown>);
