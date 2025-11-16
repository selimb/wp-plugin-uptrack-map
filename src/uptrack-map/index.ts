import type geojson from "geojson";
import type L from "leaflet";

import { log } from "../logging";
import { UptrackMapManager } from "./manager";
import type { RouteInfo } from "./types";

// SYNC [UptrackMapShortcodeInput]
type UptrackMapShortcodeInput = RouteInfo[];

// Modules like it's 1999.
declare global {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- Need interface augmentation.
  interface Window {
    WPLeafletMapPlugin: {
      getCurrentMap(): L.Map | undefined;
      push(callback: () => void): void;
    };

    // Requires [wp-leaflet-toGeoJSON]
    toGeoJSON: {
      kml(xml: Document): geojson.GeoJSON;
    };
  }
}

function renderUptrackMap(input: UptrackMapShortcodeInput): void {
  // [require-wp-leaflet-map]
  const map = window.WPLeafletMapPlugin.getCurrentMap();

  if (!map) {
    log("error", "No Leaflet map instance found");
    return;
  }

  const mgr = new UptrackMapManager(map);
  void mgr.loadRoutes(input);
}

// SYNC [UptrackMapPlugin]
// @ts-expect-error -- Good enough.
window.UptrackMapPlugin = {
  render(input: UptrackMapShortcodeInput) {
    window.WPLeafletMapPlugin.push(() => {
      renderUptrackMap(input);
    });
  },
};
