import { expect, test } from "bun:test";

import { zUptrackSettingsSafe } from "./settings";

/** Tests [uptrack-settings-fallback]. */
test("zUptrackSettingsSafe", () => {
  const result = zUptrackSettingsSafe.parse("oopsies");
  expect(result).toMatchInlineSnapshot(`
    {
      "alpinejs_url": "https://cdn.jsdelivr.net/npm/alpinejs@3.15.11/dist/cdn.min.js",
      "css": "/home/selimb/dev/personal/wp-plugin-uptrack-map/src/default-assets/uptrack-map.css",
      "focus_card_html": HTMLBundle {},
      "kml_directory": "kml-paths",
      "mapStyles": {
        "canvasTolerance": 14,
        "markerColor": "black",
        "markerEndFillColor": "orangered",
        "markerFillOpacity": 1,
        "markerRadiusPx": 6,
        "markerRoundtripFillColor": "black",
        "markerStartFillColor": "limegreen",
        "markerWeightPx": 2,
        "roundtripEpsilon": 50,
        "routeStyles": {
          "fade": {
            "interactive": true,
            "opacity": 0.3,
            "weight": 3,
          },
          "focus": {
            "interactive": false,
            "opacity": 0.2,
            "weight": 12,
          },
          "normal": {
            "interactive": true,
            "opacity": 1,
            "weight": 3,
          },
        },
        "routeTypeProps": {
          "hiking": {
            "color": "green",
          },
          "mountaineering": {
            "color": "red",
          },
          "ski_touring": {
            "color": "blue",
          },
        },
      },
      "routes": [],
    }
  `);
});
