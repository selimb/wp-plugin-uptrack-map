import * as codemirrorJson from "@codemirror/lang-json";
import CodeMirror from "@uiw/react-codemirror";
import { Button, Notice } from "@wordpress/components";
import { useEffect, useState } from "@wordpress/element";
import clsx from "clsx";

import { type UptrackSettings, zUptrackSettings } from "../settings";

export type SettingsJsonEditorProps = {
  settings: UptrackSettings;
  onChange: (settings: UptrackSettings) => void;
};

export const SettingsJsonEditor: React.FC<SettingsJsonEditorProps> = ({
  settings,
  onChange,
}) => {
  const [jsonText, setJsonText] = useState<string>(() =>
    JSON.stringify(settings, null, 2),
  );
  const [error, setError] = useState<string | null>(null);

  // Update the JSON display when settings prop changes
  useEffect(() => {
    setJsonText(JSON.stringify(settings, null, 2));
    setError(null);
  }, [settings]);

  const handleJsonChange = (newJsonText: string): void => {
    setJsonText(newJsonText);

    try {
      const parsed = JSON.parse(newJsonText) as unknown;
      const validated = zUptrackSettings.parse(parsed);
      setError(null);
      onChange(validated);
    } catch (error_) {
      const errorMessage =
        error_ instanceof Error ? error_.message : "Invalid JSON";
      setError(errorMessage);
    }
  };

  const handleFormatJson = (): void => {
    try {
      const parsed = JSON.parse(jsonText) as unknown;
      const validated = zUptrackSettings.parse(parsed);
      const formatted = JSON.stringify(validated, null, 4);
      setError(null);
      setJsonText(formatted);
      onChange(validated);
    } catch (error_) {
      const errorMessage =
        error_ instanceof Error ? error_.message : "Invalid JSON";
      setError(errorMessage);
    }
  };

  return (
    <div style={{ width: "100%" }}>
      {error && (
        <Notice status="error" isDismissible={false}>
          {error}
        </Notice>
      )}

      <div className="code-editor-container">
        <Button
          className="code-editor-action"
          variant="tertiary"
          icon={<span aria-hidden="true">✨</span>}
          label="Format"
          showTooltip={true}
          onClick={handleFormatJson}
        />

        <CodeMirror
          className={clsx("code-editor", error && "code-editor-error")}
          value={jsonText}
          extensions={[codemirrorJson.json()]}
          onChange={(newValue) => {
            handleJsonChange(newValue);
          }}
          basicSetup={true}
        />
      </div>
    </div>
  );
};
