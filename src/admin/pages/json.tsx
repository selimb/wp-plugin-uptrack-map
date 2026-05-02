import { useForm } from "@tanstack/react-form";
import { Button, PanelBody, PanelRow } from "@wordpress/components";
import * as z from "zod/mini";

import { zUptrackSettingsSafe } from "../../settings";
import { SettingsJsonEditor } from "../SettingsJsonEditor";
import { useUpdateSettings } from "../use-update-settings";
import { FormSubmitNotice, mountAdminPage } from "./shared";

// SYNC [AdminJsonInput]
const zAdminJsonInput = z.object({
  nonce: z.string(),
  settings: zUptrackSettingsSafe,
});
type AdminJsonInput = z.infer<typeof zAdminJsonInput>;
type JsonSettings = AdminJsonInput["settings"];

mountAdminPage({
  schema: zAdminJsonInput,
  render: (input) => <JsonPage settingsDefault={input.settings} />,
});

function JsonPage({
  settingsDefault,
}: {
  settingsDefault: JsonSettings;
}): React.JSX.Element {
  const { result, update } = useUpdateSettings();

  const form = useForm({
    defaultValues: settingsDefault,
    onSubmit: async ({ value }) => {
      await update(value);
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

      <div style={{ marginTop: "1em" }}>
        <PanelBody title="JSON" initialOpen={true}>
          <PanelRow>
            <SettingsJsonEditor
              initial={settingsDefault}
              onChange={(settings) => {
                for (const [key, value] of Object.entries(settings)) {
                  form.setFieldValue(key as never, value as never);
                }
              }}
            />
          </PanelRow>
        </PanelBody>
      </div>

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
