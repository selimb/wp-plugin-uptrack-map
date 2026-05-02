import * as codemirrorCss from "@codemirror/lang-css";
import * as prettierPluginPostcss from "prettier/plugins/postcss";
import { format as prettierFormat } from "prettier/standalone";

import { DEFAULT_UPTRACK_MAP_CSS } from "../default-assets";
import {
  CodeEditor,
  type CodeEditorButton,
  type CodeEditorLinter,
} from "./CodeEditor";

export type CssEditorProps = {
  value: string;
  onChange: (value: string) => void;
};

export const CssEditor: React.FC<CssEditorProps> = ({ value, onChange }) => {
  const handleFormatCss = async (): Promise<void> => {
    try {
      const formatted = await prettierFormat(value, {
        parser: "css",
        plugins: [prettierPluginPostcss],
      });
      onChange(formatted);
    } catch {
      // Lint diagnostics surface formatting/parse errors.
    }
  };

  const editorButtons: CodeEditorButton[] = [
    {
      icon: "undo",
      label: "Reset to Default",
      onClick: () => {
        onChange(DEFAULT_UPTRACK_MAP_CSS);
      },
    },
  ];

  return (
    <div style={{ width: "100%" }}>
      <CodeEditor
        value={value}
        extensions={[codemirrorCss.css()]}
        lint={linter}
        onChange={onChange}
        onFormat={handleFormatCss}
        buttons={editorButtons}
      />
    </div>
  );
};

const linter: CodeEditorLinter = async (view) => {
  const text = view.state.doc.toString();

  try {
    await prettierFormat(text, {
      parser: "css",
      plugins: [prettierPluginPostcss],
    });
    return [];
  } catch (error_) {
    const errorMessage =
      error_ instanceof Error ? error_.message : "Invalid CSS";
    return [
      {
        from: 0,
        to: Math.min(1, text.length),
        severity: "error",
        source: "Prettier",
        message: errorMessage,
      },
    ];
  }
};
