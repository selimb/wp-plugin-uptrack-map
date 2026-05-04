import * as codemirrorJson from "@codemirror/lang-json";
import { useState } from "@wordpress/element";
import * as z from "zod/mini";

import {
  UPTRACK_SETTINGS_DEFAULTS,
  type UptrackSettings,
  zUptrackSettings,
  zUptrackSettingsSafe,
} from "../../settings";
import { CodeEditor, type CodeEditorLinter } from "../CodeEditor";
import { useUpdateSettings } from "../use-update-settings";
import { FormSubmitNotice, mountAdminPage, useAdminForm } from "./_shared";

// SYNC [AdminJsonInput]
const zAdminJsonInput = z.object({
  nonce: z.string(),
  settings: zUptrackSettingsSafe,
});

mountAdminPage({
  schema: zAdminJsonInput,
  render: (input) => (
    <JsonPage
      settingsDefault={input.settings}
      textDefault={JSON.stringify(input.settings, null, 4)}
    />
  ),
});

type SettingsResult =
  | { ok: true; value: UptrackSettings }
  | { ok: false; error: string };

function JsonPage({
  settingsDefault,
  textDefault,
}: {
  settingsDefault: UptrackSettings;
  textDefault: string;
}): React.JSX.Element {
  const { result, clear, update } = useUpdateSettings();
  const [settings, setSettings] = useState<SettingsResult>(() => ({
    ok: true,
    value: settingsDefault,
  }));

  const form = useAdminForm({
    defaultValues: { text: textDefault },
    onSubmit: async () => {
      if (settings.ok) {
        await update(settings.value);
      }
    },
  });

  const handleFormat = (): void => {
    if (settings.ok) {
      const formatted = JSON.stringify(settings.value, null, 4);
      form.setFieldValue("text", formatted);
    }
  };

  const linter: CodeEditorLinter = (view) => {
    if (settings.ok) {
      return [];
    }
    const text = view.state.doc.toString();

    return [
      {
        from: 0,
        to: Math.min(1, text.length),
        severity: "error",
        source: "JSON",
        message: settings.error,
      },
    ];
  };

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
        <FormSubmitNotice result={result} onDismiss={clear} />

        <div className="form-field">
          <div className="w-full">
            <form.Field
              name="text"
              children={(field) => (
                <CodeEditor
                  value={field.state.value}
                  extensions={[codemirrorJson.json()]}
                  lint={linter}
                  onChange={(text) => {
                    field.setValue(text);
                    setSettings(parseSettingsJson(text));
                  }}
                  onFormat={handleFormat}
                  onReset={() =>
                    JSON.stringify(UPTRACK_SETTINGS_DEFAULTS, null, 4)
                  }
                />
              )}
            />
          </div>
        </div>

        <form.SubmitButton valid={settings.ok} />
      </form>
    </form.AppForm>
  );
}

function parseSettingsJson(text: string): SettingsResult {
  try {
    const parsed = JSON.parse(text) as unknown;
    const validated = zUptrackSettings.parse(parsed);
    return { ok: true, value: validated };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Invalid JSON";
    return { ok: false, error: errorMessage };
  }
}
