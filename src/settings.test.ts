import { expect, test } from "bun:test";

import { zUptrackSettingsSafe } from "./settings";

/** Tests [uptrack-settings-fallback]. */
test("zUptrackSettings fallback", () => {
  const result = zUptrackSettingsSafe.parse({});
  result.uptrack_css = result.uptrack_css.split("/").slice(-3).join("/");
  // NOTE: `uptrack_css` and `uptrack_focus_card_html` should resolve to the contents of the files in
  //   practice, but bun doesn't use the same bundling logic as `build.ts`.
  expect(result).toMatchInlineSnapshot(`
    {
      "uptrack_alpinejs_url": "https://cdn.jsdelivr.net/npm/alpinejs@3.15.11/dist/cdn.min.js",
      "uptrack_css": "src/default-assets/uptrack-map.css",
      "uptrack_focus_card_html": HTMLBundle {},
      "uptrack_kml_directory": "kml-paths",
      "uptrack_map_styles": {
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
      "uptrack_routes": [],
    }
  `);
});
