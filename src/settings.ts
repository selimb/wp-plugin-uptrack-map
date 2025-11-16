import * as z from "zod/mini";

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
  type: z.catch(zRouteType, "ski_touring"),
  marker: z.catch(z.nullable(zMarkerCoords), null),
  distance: z.catch(z.string(), ""),
  elevation: z.catch(z.string(), ""),
  duration: z.catch(z.string(), ""),
});
export type UptrackRoutesSettingItem = z.infer<
  typeof zUptrackRoutesSettingItem
>;

// SYNC [UptrackRoutesSetting]
export const zUptrackRoutesSetting = z.array(zUptrackRoutesSettingItem);
export type UptrackRoutesSetting = z.infer<typeof zUptrackRoutesSetting>;

// SYNC [uptrack-settings].
export const zUptrackSettings = z.object({
  uptrack_kml_directory: z.string(),
  uptrack_routes: z.catch(zUptrackRoutesSetting, []),
});
export type UptrackSettings = z.infer<typeof zUptrackSettings>;
