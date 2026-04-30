import type geojson from "geojson";
import type L from "leaflet";

import { log } from "../logging";
import { UptrackMapManager } from "./manager";
import {
  type UptrackMapShortcodeInput,
  zUptrackMapShortcodeInput,
} from "./types";

// Modules like it's 1999.
declare global {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- Need interface augmentation.
  interface Window {
    // Relies on [require-wp-leaflet-map]
    // Defined in https://github.com/bozdoz/wp-plugin-leaflet-map/blob/v3.4.5/scripts/construct-leaflet-map.js#L3
    WPLeafletMapPlugin: {
      getCurrentMap(): L.Map | undefined;
      push(callback: () => void): void;
    };

    // Relies on [require-toGeoJSON]
    // Defined in https://github.com/mapbox/togeojson#api
    toGeoJSON: {
      kml(xml: Document): geojson.GeoJSON;
    };
  }
}

function renderUptrackMap(input: UptrackMapShortcodeInput): void {
  const map = window.WPLeafletMapPlugin.getCurrentMap();

  if (!map) {
    log("error", "No Leaflet map instance found");
    return;
  }

  const mgr = new UptrackMapManager(input, map);
  void mgr.loadRoutes();
}

// SYNC [UptrackMapPlugin]
// @ts-expect-error -- Good enough.
window.UptrackMapPlugin = {
  render(input: UptrackMapShortcodeInput) {
    input = zUptrackMapShortcodeInput.parse(input);

    window.WPLeafletMapPlugin.push(() => {
      renderUptrackMap(input);
    });
  },
};
