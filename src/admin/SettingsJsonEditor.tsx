import * as codemirrorJson from "@codemirror/lang-json";

import { type UptrackSettings, zUptrackSettings } from "../settings";
import { CodeEditor, type CodeEditorLinter } from "./CodeEditor";

export type SettingsJsonEditorProps = {
  text: string;
  onChange: (textNew: string) => void;
};

export const SettingsJsonEditor: React.FC<SettingsJsonEditorProps> = ({
  text,
  onChange,
}) => {
  const handleFormat = (): void => {
    const { validated } = parseSettingsJson(text);
    if (!validated) {
      return;
    }

    const formatted = JSON.stringify(validated, null, 4);
    onChange(formatted);
  };

  return (
    <div className="w-full">
      <CodeEditor
        value={text}
        extensions={[codemirrorJson.json()]}
        lint={linter}
        onChange={onChange}
        onFormat={handleFormat}
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
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Invalid JSON";
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
