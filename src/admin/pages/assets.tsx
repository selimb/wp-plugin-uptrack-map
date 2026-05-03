import { BaseControl, TextControl } from "@wordpress/components";
import * as z from "zod/mini";

import { zUptrackSettingsSafe } from "../../settings";
import { CssEditor } from "../CssEditor";
import { FocusCardForm } from "../focus-card/FocusCardForm";
import { useUpdateSettings } from "../use-update-settings";
import { FormSubmitNotice, mountAdminPage, useAdminForm } from "./_shared";

// SYNC [AdminAssetsInput]
const zAdminAssetsInput = z.object({
  nonce: z.string(),
  settings: z.pick(zUptrackSettingsSafe, {
    uptrack_focus_card_html: true,
    uptrack_css: true,
    uptrack_alpinejs_url: true,
  }),
});
type AdminAssetsInput = z.infer<typeof zAdminAssetsInput>;
type AssetsSettings = AdminAssetsInput["settings"];

mountAdminPage({
  schema: zAdminAssetsInput,
  render: (input) => <AssetsPage settingsDefault={input.settings} />,
});

function AssetsPage({
  settingsDefault,
}: {
  settingsDefault: AssetsSettings;
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

        {/* uptrack_alpinejs_url */}
        <div className="form-field">
          <form.Field
            name="uptrack_alpinejs_url"
            children={(field) => (
              <TextControl
                label="AlpineJS URL"
                type="url"
                value={field.state.value}
                onChange={field.handleChange}
                __next40pxDefaultSize
                __nextHasNoMarginBottom
              />
            )}
          />
        </div>

        {/* uptrack_css */}
        <div className="form-field">
          <form.Field
            name="uptrack_css"
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

        {/* uptrack_focus_card_html */}
        <div className="form-field">
          <form.Subscribe
            selector={(state) => [
              state.values.uptrack_focus_card_html,
              state.values.uptrack_css,
              state.values.uptrack_alpinejs_url,
            ]}
            children={([focusCardHtml, css, alpineJsUrl]) => (
              <BaseControl label="Focus Card HTML">
                <FocusCardForm
                  focusCardHtml={focusCardHtml}
                  onChange={(value) => {
                    form.setFieldValue("uptrack_focus_card_html", value);
                  }}
                  css={css}
                  alpineJsUrl={alpineJsUrl}
                />
              </BaseControl>
            )}
          />
        </div>

        <form.SubmitButton />
      </form>
    </form.AppForm>
  );
}
