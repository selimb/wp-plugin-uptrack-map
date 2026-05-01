import { linter } from "@codemirror/lint";
import type { Extension } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import CodeMirror from "@uiw/react-codemirror";
import { Button } from "@wordpress/components";
import { useMemo } from "@wordpress/element";

export type CodeEditorLintDiagnostic = {
  from: number;
  to: number;
  severity: "hint" | "info" | "warning" | "error";
  source?: string;
  message: string;
};

export type CodeEditorLinter = (
  view: EditorView,
) =>
  | readonly CodeEditorLintDiagnostic[]
  | Promise<readonly CodeEditorLintDiagnostic[]>;

export type CodeEditorProps = {
  value: string;
  onChange: (value: string) => void;
  extensions: Extension[];
  onFormat: () => void | Promise<void>;
  lint?: CodeEditorLinter;
};

export const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  onChange,
  extensions,
  onFormat,
  lint,
}) => {
  const allExtensions = useMemo(() => {
    if (!lint) {
      return extensions;
    }

    return [
      ...extensions,
      linter(
        async (view) => {
          return await lint(view);
        },
        { autoPanel: true },
      ),
    ];
  }, [extensions, lint]);

  return (
    <div className="code-editor-container">
      <Button
        className="code-editor-action"
        variant="tertiary"
        icon={<span aria-hidden="true">✨</span>}
        label="Format"
        showTooltip={true}
        onClick={() => {
          void onFormat();
        }}
      />

      <CodeMirror
        className="code-editor"
        value={value}
        extensions={allExtensions}
        onChange={onChange}
        basicSetup={true}
      />
    </div>
  );
};
