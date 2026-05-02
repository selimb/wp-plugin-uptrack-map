import apiFetch from "@wordpress/api-fetch";
import { Notice } from "@wordpress/components";
import { createRoot } from "@wordpress/element";
import type React from "react";
import * as z from "zod/mini";

import type { UpdateSettingsResult } from "../use-update-settings";

// SYNC [uptrack-admin-root-element-id]
const ROOT_ELEMENT_ID = "uptrack-map-admin-root";

type InputWithNonce = {
  nonce: string;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- Need interface augmentation.
  interface Window {
    // SYNC [uptrack-admin-input-global]
    uptrackAdminInput: unknown;
  }
}

export const FormSubmitNotice: React.FC<{
  result: UpdateSettingsResult | null;
}> = ({ result }) => {
  if (!result) {
    return null;
  }

  return (
    <Notice status={result.ok ? "success" : "error"} isDismissible={true}>
      {result.ok ? (
        <div>Settings saved successfully</div>
      ) : (
        <>
          <div>Failed to save settings</div>
          <pre>{result.error}</pre>
        </>
      )}
    </Notice>
  );
};

export function mountAdminPage<TInput extends InputWithNonce>(opts: {
  schema: z.ZodMiniType<TInput>;
  render: (input: TInput) => React.JSX.Element;
}): void {
  document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById(ROOT_ELEMENT_ID);
    if (!container) {
      return;
    }

    const root = createRoot(container);
    const inputResult = opts.schema.safeParse(window.uptrackAdminInput);

    if (!inputResult.success) {
      root.render(<pre>{inputResult.error.message}</pre>);
      return;
    }

    const input = inputResult.data;
    apiFetch.use(apiFetch.createNonceMiddleware(input.nonce));
    root.render(opts.render(input));
  });
}
