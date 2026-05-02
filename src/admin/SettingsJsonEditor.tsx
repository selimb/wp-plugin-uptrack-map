import * as codemirrorJson from "@codemirror/lang-json";
import { useState } from "@wordpress/element";

import { type UptrackSettings, zUptrackSettings } from "../settings";
import { CodeEditor, type CodeEditorLinter } from "./CodeEditor";

export type SettingsJsonEditorProps = {
  initial: UptrackSettings;
  onChange: (settings: UptrackSettings) => void;
};

export const SettingsJsonEditor: React.FC<SettingsJsonEditorProps> = ({
  initial,
  onChange,
}) => {
  const [jsonText, setJsonText] = useState<string>(() =>
    JSON.stringify(initial, null, 2),
  );

  const handleJsonChange = (newJsonText: string): void => {
    setJsonText(newJsonText);

    const { validated } = parseSettingsJson(newJsonText);
    if (validated) {
      onChange(validated);
    }
  };

  const handleFormatJson = (): void => {
    const { validated } = parseSettingsJson(jsonText);
    if (!validated) {
      return;
    }

    const formatted = JSON.stringify(validated, null, 4);
    setJsonText(formatted);
    onChange(validated);
  };

  return (
    <div style={{ width: "100%" }}>
      <CodeEditor
        value={jsonText}
        extensions={[codemirrorJson.json()]}
        lint={linter}
        onChange={handleJsonChange}
        onFormat={handleFormatJson}
      />
    </div>
  );
};

const parseSettingsJson = (
  text: string,
): { validated: UptrackSettings | null; error: string | null } => {
  try {
    const parsed = JSON.parse(text) as unknown;
    const validated = zUptrackSettings.parse(parsed);
    return { validated, error: null };
  } catch (error_) {
    const errorMessage =
      error_ instanceof Error ? error_.message : "Invalid JSON";
    return { validated: null, error: errorMessage };
  }
};

const linter: CodeEditorLinter = (view) => {
  const text = view.state.doc.toString();
  const { error } = parseSettingsJson(text);
  if (!error) {
    return [];
  }

  return [
    {
      from: 0,
      to: Math.min(1, text.length),
      severity: "error",
      source: "JSON",
      message: error,
    },
  ];
};
