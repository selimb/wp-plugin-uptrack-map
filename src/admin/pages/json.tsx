import * as z from "zod/mini";

import { zUptrackSettings } from "../../settings";
import { SettingsJsonEditor } from "../SettingsJsonEditor";
import { useUpdateSettings } from "../use-update-settings";
import { FormSubmitNotice, mountAdminPage, useAdminForm } from "./_shared";

// SYNC [AdminJsonInput]
const zAdminJsonInput = z.object({
  nonce: z.string(),
  settings: zUptrackSettings,
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

  const form = useAdminForm({
    defaultValues: settingsDefault,
    onSubmit: async ({ value }) => {
      await update(value);
    },
  });

  return (
    <form.AppForm>
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
          <SettingsJsonEditor
            initial={settingsDefault}
            onChange={(settings) => {
              for (const [key, value] of Object.entries(settings)) {
                form.setFieldValue(key as never, value as never);
              }
            }}
          />
        </div>

        <form.SubmitButton />
      </form>
    </form.AppForm>
  );
}
