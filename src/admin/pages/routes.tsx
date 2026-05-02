import { useForm } from "@tanstack/react-form";
import { BaseControl, Button, TextControl } from "@wordpress/components";
import * as z from "zod/mini";

import {
  type KmlFilename,
  type UptrackRoutesSetting,
  zKmlFilename,
  zUptrackSettings,
} from "../../settings";
import { RoutesTable } from "../RoutesTable";
import { useUpdateSettings } from "../use-update-settings";
import { FormSubmitNotice, mountAdminPage } from "./shared";

// SYNC [AdminRoutesInput]
const zAdminRoutesInput = z.object({
  nonce: z.string(),
  posts: z.array(
    z.object({
      ID: z.string(),
      post_title: z.string(),
      post_status: z.string(),
    }),
  ),
  settings: z.pick(zUptrackSettings, {
    uptrack_kml_directory: true,
    uptrack_routes: true,
  }),
  kmlFilenames: z.array(zKmlFilename),
  kmlDirectoryValid: z.boolean(),
});
type AdminRoutesInput = z.infer<typeof zAdminRoutesInput>;

export type Post = AdminRoutesInput["posts"][number];
export type PostId = Post["ID"];
export type PostMap = Map<PostId, Post>;

function buildPostMap(posts: Post[]): PostMap {
  const map: PostMap = new Map();
  for (const post of posts) {
    map.set(post.ID, post);
  }
  return map;
}

function buildDefaultRoutes(
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

mountAdminPage({
  schema: zAdminRoutesInput,
  render: (input) => {
    const postMap = buildPostMap(input.posts);
    const settingsDefault: RoutesPageProps["settingsDefault"] = {
      uptrack_kml_directory: input.settings.uptrack_kml_directory,
      uptrack_routes: buildDefaultRoutes(
        input.settings.uptrack_routes,
        new Set(input.kmlFilenames),
      ),
    };

    return (
      <RoutesPage
        settingsDefault={settingsDefault}
        postMap={postMap}
        kmlDirectoryValid={input.kmlDirectoryValid}
      />
    );
  },
});

type RoutesPageProps = {
  settingsDefault: AdminRoutesInput["settings"];
  postMap: PostMap;
  kmlDirectoryValid: boolean;
};

function RoutesPage({
  settingsDefault,
  postMap,
  kmlDirectoryValid,
}: RoutesPageProps): React.JSX.Element {
  const { result, update } = useUpdateSettings();

  const form = useForm({
    defaultValues: settingsDefault,
    onSubmit: async ({ value }) => {
      const updateResult = await update(value);
      if (
        updateResult.ok &&
        value.uptrack_kml_directory !== settingsDefault.uptrack_kml_directory
      ) {
        window.location.reload();
      }
    },
  });

  return (
    <form
      className="form-wrap"
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void form.handleSubmit();
      }}
    >
      <FormSubmitNotice result={result} />

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
}
