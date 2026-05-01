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
      "routes": [],
    }
  `);
});
