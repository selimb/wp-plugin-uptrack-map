import apiFetch from "@wordpress/api-fetch";
import { PanelBody, PanelRow } from "@wordpress/components";
import { createRoot } from "@wordpress/element";
import React from "react";
import * as z from "zod/mini";

import { zKmlFilename, zUptrackSettings } from "../settings";
import {
  AdminForm,
  type AdminFormProps,
  buildDefaultRoutes,
  buildPostMap,
} from "./AdminForm";

// SYNC [AdminInput]
const zAdminInput = z.strictObject({
  nonce: z.string(),
  posts: z.array(
    z.strictObject({
      ID: z.string(),
      post_title: z.string(),
      post_status: z.string(),
    }),
  ),
  settings: zUptrackSettings,
  kmlFilenames: z.array(zKmlFilename),
  kmlDirectoryValid: z.boolean(),
});
export type AdminInput = z.infer<typeof zAdminInput>;

declare global {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- Need interface augmentation.
  interface Window {
    uptrackAdminInput: unknown;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("uptrack-map-settings-root");
  if (container) {
    const root = createRoot(container);
    const inputRaw = window.uptrackAdminInput;
    const inputResult = zAdminInput.safeParse(inputRaw);

    if (!inputResult.success) {
      const error = inputResult.error;
      root.render(<AppError error={error} inputRaw={inputRaw} />);
      return;
    }

    const { nonce, posts, settings, kmlDirectoryValid, kmlFilenames } =
      inputResult.data;
    apiFetch.use(apiFetch.createNonceMiddleware(nonce));

    const postMap = buildPostMap(posts);
    settings.uptrack_routes = buildDefaultRoutes(
      settings.uptrack_routes,
      new Set(kmlFilenames),
    );

    root.render(
      <App
        inputRaw={inputRaw}
        formProps={{
          settingsDefault: settings,
          postMap,
          kmlDirectoryValid,
        }}
      />,
    );
  }
});

type AppProps = {
  inputRaw: unknown;
  formProps: AdminFormProps;
};

const App: React.FC<AppProps> = ({ inputRaw, formProps }) => {
  return (
    <>
      <AdminForm {...formProps} />

      <div style={{ marginTop: "16px" }}>
        <PanelBody title="Debug" initialOpen={false}>
          <PanelRow>
            <Pre>{JSON.stringify(inputRaw, null, 2)}</Pre>
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
