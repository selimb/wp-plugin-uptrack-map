import * as codemirrorJson from "@codemirror/lang-json";
import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import apiFetch from "@wordpress/api-fetch";
import { Button, Notice, PanelBody, PanelRow } from "@wordpress/components";
import { createRoot } from "@wordpress/element";
import type React from "react";
import * as z from "zod/mini";

import { CodeEditor } from "../CodeEditor";
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

const { fieldContext, formContext, useFormContext } = createFormHookContexts();

export const { useAppForm: useAdminForm } = createFormHook({
  fieldComponents: {},
  fieldContext,
  formComponents: {
    SubmitButton: (props: { valid?: boolean }): React.JSX.Element => {
      const form = useFormContext();

      const { valid = true } = props;

      return (
        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
          children={([canSubmit, isSubmitting]) => (
            <Button
              variant="primary"
              type="submit"
              disabled={!canSubmit || isSubmitting || !valid}
              isBusy={isSubmitting}
              __next40pxDefaultSize
            >
              Save
            </Button>
          )}
        />
      );
    },
  },
  formContext,
});

export const FormSubmitNotice: React.FC<{
  result: UpdateSettingsResult | null;
  onDismiss: () => void;
}> = ({ result, onDismiss }) => {
  if (!result) {
    return null;
  }

  return (
    <Notice
      status={result.ok ? "success" : "error"}
      isDismissible={true}
      onRemove={onDismiss}
    >
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
    const inputRaw = window.uptrackAdminInput;
    const inputResult = opts.schema.safeParse(inputRaw);

    if (!inputResult.success) {
      const error = inputResult.error;
      root.render(<AppError error={error} inputRaw={inputRaw} />);
      return;
    }

    const input = inputResult.data;
    apiFetch.use(apiFetch.createNonceMiddleware(input.nonce));

    const page = opts.render(input);
    root.render(<App inputRaw={inputRaw} page={page} />);
  });
}

type AppProps = {
  inputRaw: unknown;
  page: React.JSX.Element;
};

const App: React.FC<AppProps> = ({ inputRaw, page }) => {
  return (
    <>
      {page}

      <div style={{ marginTop: "1em" }}>
        <PanelBody title="Debug" initialOpen={false}>
          <PanelRow>
            <div className="w-full">
              <CodeEditor
                value={JSON.stringify(inputRaw, null, 2)}
                extensions={[codemirrorJson.json()]}
              />
            </div>
          </PanelRow>
        </PanelBody>
      </div>
    </>
  );
};

const AppError: React.FC<{ error: z.core.$ZodError; inputRaw: unknown }> = ({
  error,
  inputRaw,
}) => {
  return (
    <>
      <h2>ERROR</h2>
      <Pre>{error.message}</Pre>
      <h2>RAW INPUT</h2>
      <Pre>{JSON.stringify(inputRaw, null, 4)}</Pre>
    </>
  );
};

const Pre: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <pre
      style={{
        fontFamily: "monospace",
        border: "solid 1px black",
        padding: "2px",
      }}
    >
      {children}
    </pre>
  );
};
