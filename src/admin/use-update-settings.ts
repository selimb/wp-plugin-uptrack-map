import apiFetch from "@wordpress/api-fetch";
import { useState } from "@wordpress/element";
import type z from "zod/mini";

import type { zUptrackSettings } from "../settings";

export type UpdateSettingsResult = { ok: true } | { ok: false; error: string };
export type UpdateSettings = {
  result: UpdateSettingsResult | null;
  update: (
    settingsNew: Partial<z.input<typeof zUptrackSettings>>,
  ) => Promise<UpdateSettingsResult>;
};

export function useUpdateSettings(): UpdateSettings {
  const [result, setResult] = useState<UpdateSettingsResult | null>(null);

  return {
    result,
    update: async (settingsNew) => {
      let result: UpdateSettingsResult;
      try {
        await apiFetch({
          path: "/wp/v2/settings",
          method: "POST",
          data: settingsNew,
        });
        result = { ok: true };
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : JSON.stringify(error, null, 2);

        result = { ok: false, error: errorMessage };
      }
      setResult(result);
      return result;
    },
  };
}
