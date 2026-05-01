import { useForm } from "@tanstack/react-form";
import apiFetch from "@wordpress/api-fetch";
import {
  BaseControl,
  Button,
  Notice,
  PanelBody,
  PanelRow,
  TextControl,
} from "@wordpress/components";
import { useState } from "@wordpress/element";

import { log } from "../logging";
import type {
  KmlFilename,
  UptrackRoutesSetting,
  UptrackSettings,
  UptrackSettingsContainer,
} from "../settings";
import type { AdminInput } from "./admin";
import { CssEditor } from "./CssEditor";
import { FocusCardHtmlEditor } from "./FocusCardHtmlEditor";
import { RoutesTable } from "./RoutesTable";
import { SettingsJsonEditor } from "./SettingsJsonEditor";

export type Post = AdminInput["posts"][number];
export type PostId = Post["ID"];
export type PostMap = Map<PostId, Post>;

export type AdminFormProps = {
  settingsDefault: UptrackSettings;
  postMap: PostMap;
  kmlDirectoryValid: boolean;
};

export const AdminForm: React.FC<AdminFormProps> = ({
  settingsDefault,
  postMap,
  kmlDirectoryValid,
}) => {
  const [submitResult, setSubmitResult] = useState<
    null | { ok: true } | { ok: false; error: string }
  >(null);

  const form = useForm({
    defaultValues: settingsDefault,
    onSubmit: async ({ value }) => {
      const data: UptrackSettingsContainer = {
        uptrack_settings: value,
      };

      try {
        await apiFetch({
          path: "/wp/v2/settings",
          method: "POST",
          data,
        });
      } catch (error) {
        log("error", "Failed to submit settings", error);
        setSubmitResult({
          ok: false,
          error:
            error instanceof Error
              ? error.message
              : JSON.stringify(error, null, 2),
        });
        return;
      }

      if (value.kml_directory === settingsDefault.kml_directory) {
        setSubmitResult({ ok: true });
      } else {
        // Reload the page to reflect possible changes in KML files.
        window.location.reload();
      }
    },
  });

  return (
    <form
      className="form-wrap"
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void form.handleSubmit();
      }}
    >
      {/* Submit result */}
      {submitResult && (
        <Notice
          status={submitResult.ok ? "success" : "error"}
          isDismissible={true}
          onRemove={() => {
            setSubmitResult(null);
          }}
        >
          {submitResult.ok ? (
            <div>Settings saved successfully</div>
          ) : (
            <>
              <div>Failed to save settings</div>
              <pre>{submitResult.error}</pre>
            </>
          )}
        </Notice>
      )}

      {/* JSON editor */}
      <div style={{ marginTop: "1em" }}>
        <PanelBody title="JSON" initialOpen={false}>
          <PanelRow>
            <form.Subscribe
              selector={(state) => [state.values]}
              children={([values]) => (
                <SettingsJsonEditor
                  settings={values}
                  onChange={(settings) => {
                    for (const [k, v] of Object.entries(settings)) {
                      form.setFieldValue(k as never, v as never);
                    }
                  }}
                />
              )}
            />
          </PanelRow>
        </PanelBody>
      </div>

      {/* kml_directory */}
      <div className="form-field">
        <form.Field
          name="kml_directory"
          validators={{
            onChange: ({ value }) => (value.trim() ? undefined : "Required"),
          }}
          children={(field) => {
            const kmlDirectoryStillInvalid =
              field.state.value === settingsDefault.kml_directory &&
              !kmlDirectoryValid;
            const invalid =
              !field.state.meta.isValid || kmlDirectoryStillInvalid;
            return (
              <>
                <TextControl
                  label="KML Directory"
                  help="KML Directory, relative to wp-content"
                  value={field.state.value}
                  required
                  onChange={(value) => {
                    field.handleChange(value);
                  }}
                  className={invalid ? "control-invalid" : undefined}
                  __next40pxDefaultSize
                  __nextHasNoMarginBottom
                />
                {kmlDirectoryStillInvalid && (
                  <p style={{ color: "red" }}>Directory does not exist</p>
                )}
              </>
            );
          }}
        />
      </div>

      {/* routes */}
      <form.Field
        name="routes"
        children={(field) => (
          <BaseControl label="Routes">
            <RoutesTable
              postMap={postMap}
              routes={field.state.value}
              onChange={(index, patch) => {
                field.replaceValue(index, {
                  ...field.state.value[index],
                  ...patch,
                });
              }}
            />
          </BaseControl>
        )}
      />

      {/* alpinejs_url */}
      <div className="form-field">
        <form.Field
          name="alpinejs_url"
          children={(field) => (
            <TextControl
              label="AlpineJS URL"
              type="url"
              value={field.state.value}
              onChange={(value) => {
                field.handleChange(value);
              }}
              __next40pxDefaultSize
              __nextHasNoMarginBottom
            />
          )}
        />
      </div>

      {/* focus_card_html */}
      <div className="form-field">
        <form.Field
          name="focus_card_html"
          children={(field) => (
            <BaseControl label="Focus Card HTML">
              <FocusCardHtmlEditor
                value={field.state.value}
                onChange={(value) => {
                  field.handleChange(value);
                }}
              />
            </BaseControl>
          )}
        />
      </div>

      {/* css */}
      <div className="form-field">
        <form.Field
          name="css"
          children={(field) => (
            <BaseControl label="CSS">
              <CssEditor
                value={field.state.value}
                onChange={(value) => {
                  field.handleChange(value);
                }}
              />
            </BaseControl>
          )}
        />
      </div>

      {/* Save */}
      <form.Subscribe
        selector={(state) => [state.canSubmit, state.isSubmitting]}
        children={([canSubmit, isSubmitting]) => (
          <Button
            variant="primary"
            type="submit"
            disabled={!canSubmit || isSubmitting}
            isBusy={isSubmitting}
            __next40pxDefaultSize
          >
            Save
          </Button>
        )}
      />
    </form>
  );
};

export function buildPostMap(posts: Post[]): PostMap {
  const map: PostMap = new Map();
  for (const post of posts) {
    map.set(post.ID, post);
  }
  return map;
}

export function buildDefaultRoutes(
  routes: UptrackRoutesSetting,
  kmlFiles: Set<KmlFilename>,
): UptrackRoutesSetting {
  const kmlFilesRemaining = new Set(kmlFiles);
  const result: UptrackRoutesSetting = [];

  for (const route of routes) {
    if (kmlFilesRemaining.has(route.kmlFilename)) {
      kmlFilesRemaining.delete(route.kmlFilename);
      result.push(route);
    }
  }

  for (const kmlFilename of kmlFilesRemaining) {
    result.push({
      kmlFilename,
      postId: null,
      title: "",
      type: "ski_touring",
      marker: null,
      distance: "",
      elevation: "",
      duration: "",
    });
  }

  result.sort((a, b) => a.kmlFilename.localeCompare(b.kmlFilename));
  return result;
}
