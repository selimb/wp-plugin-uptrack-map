import * as z from "zod/mini";

import { zUptrackSettings } from "../../settings";
import { SettingsJsonEditor } from "../SettingsJsonEditor";
import { useUpdateSettings } from "../use-update-settings";
import { FormSubmitNotice, mountAdminPage, useAdminForm } from "./_shared";

// SYNC [AdminJsonInput]
const zAdminJsonInput = z.object({
  nonce: z.string(),
  settings: z.unknown(),
});

mountAdminPage({
  schema: zAdminJsonInput,
  render: (input) => (
    <JsonPage
      settingsDefault={{ text: JSON.stringify(input.settings, null, 4) }}
    />
  ),
});

const formSchema = z.pipe(
  z.pipe(
    z.string(),
    z.transform((text, ctx): unknown => {
      try {
        return JSON.parse(text);
      } catch (error) {
        ctx.issues.push({
          code: "custom",
          input: text,
          message: (error as Error).message,
        });
        return z.NEVER;
      }
    }),
  ),
  zUptrackSettings,
);

function JsonPage({
  settingsDefault,
}: {
  settingsDefault: { text: string };
}): React.JSX.Element {
  const { result, update } = useUpdateSettings();

  const form = useAdminForm({
    defaultValues: settingsDefault,
    onSubmit: async ({ value }) => {
      const json: unknown = JSON.parse(value.text);
      const data = formSchema.parse(json);
      await update(data);
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
          <form.Field
            name="text"
            children={(field) => (
              <SettingsJsonEditor
                text={field.state.value}
                onChange={(text) => {
                  field.setValue(text);
                }}
              />
            )}
          />
        </div>

        <form.SubmitButton />
      </form>
    </form.AppForm>
  );
}
