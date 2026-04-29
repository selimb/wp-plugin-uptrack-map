import { Notice } from "@wordpress/components";
import { useEffect, useState } from "@wordpress/element";

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

  return (
    <div style={{ width: "100%" }}>
      {error && (
        <Notice status="error" isDismissible={false}>
          {error}
        </Notice>
      )}

      <textarea
        value={jsonText}
        onChange={(e) => {
          handleJsonChange(e.currentTarget.value);
        }}
        style={{
          width: "100%",
          minHeight: "300px",
          fontFamily: "monospace",
          fontSize: "12px",
          padding: "8px",
          border: error ? "2px solid #dc3232" : "1px solid #ddd",
          lineHeight: 1.5,
        }}
      />
    </div>
  );
};
