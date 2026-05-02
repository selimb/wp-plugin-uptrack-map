import { expect, test } from "bun:test";

import { zUptrackSettings } from "./settings";

/** Tests [uptrack-settings-fallback]. */
test("zUptrackSettings fallback", () => {
  const result = zUptrackSettings.parse("oopsies");
  // NOTE: `css` and `focus_card_html` should resolve to the contents of the files in practice, but bun
  //   doesn't use the same bundling logic as `build.ts`.
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
            "opacity": 0.3,
            "weight": 3,
          },
          "focus": {
            "opacity": 0.2,
            "weight": 12,
          },
          "normal": {
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
