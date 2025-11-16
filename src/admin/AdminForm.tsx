import { useForm } from "@tanstack/react-form";
import apiFetch from "@wordpress/api-fetch";
import {
  BaseControl,
  Button,
  Notice,
  TextControl,
} from "@wordpress/components";
import { useState } from "@wordpress/element";

import type {
  KmlFilename,
  UptrackRoutesSetting,
  UptrackSettings,
} from "../settings";
import type { AdminInput } from "./admin";
import { RoutesTable } from "./RoutesTable";

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
      const data: UptrackSettings = {
        uptrack_kml_directory: value.uptrack_kml_directory,
        uptrack_routes: value.uptrack_routes,
      };

      try {
        await apiFetch({
          path: "/wp/v2/settings",
          method: "POST",
          data,
        });
      } catch (error) {
        setSubmitResult({
          ok: false,
          error: error instanceof Error ? error.message : String(error),
        });
        return;
      }

      if (
        value.uptrack_kml_directory === settingsDefault.uptrack_kml_directory
      ) {
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
      {submitResult && (
        <Notice
          status={submitResult.ok ? "success" : "error"}
          isDismissible={true}
          onRemove={() => {
            setSubmitResult(null);
          }}
        >
          {submitResult.ok
            ? "Settings saved successfully."
            : `Error saving settings: ${submitResult.error}`}
        </Notice>
      )}
      <div className="form-field">
        <form.Field
          name="uptrack_kml_directory"
          validators={{
            onChange: ({ value }) => (value.trim() ? undefined : "Required"),
          }}
          children={(field) => {
            const kmlDirectoryStillInvalid =
              field.state.value === settingsDefault.uptrack_kml_directory &&
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

      <form.Field
        name="uptrack_routes"
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
