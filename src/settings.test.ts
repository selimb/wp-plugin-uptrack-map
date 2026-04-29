import { expect, test } from "bun:test";

import { zUptrackSettingsSafe } from "./settings";

/** Tests [uptrack-settings-fallback]. */
test("zUptrackSettingsSafe", () => {
  const result = zUptrackSettingsSafe.parse("oopsies");
  expect(result).toMatchInlineSnapshot(`
    {
      "kml_directory": "kml-paths",
      "routes": [],
    }
  `);
});
