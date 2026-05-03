import { linter } from "@codemirror/lint";
import type { Extension } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import CodeMirror from "@uiw/react-codemirror";
import { Button, type IconType } from "@wordpress/components";
import { useMemo } from "@wordpress/element";
import React from "react";

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

export type CodeEditorButton = {
  icon: IconType;
  label: string;
  onClick: () => void | Promise<void>;
};

export type CodeEditorProps = {
  value: string;
  onChange?: (value: string) => void;
  extensions: Extension[];
  onFormat?: () => void | Promise<void>;
  onReset?: () => string;
  buttons?: CodeEditorButton[];
  lint?: CodeEditorLinter;
};

export const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  onChange,
  extensions,
  onFormat,
  onReset,
  buttons = [],
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

  const allButtons: CodeEditorButton[] = [];
  if (onFormat) {
    allButtons.push({
      icon: <span aria-hidden="true">✨</span>,
      label: "Format",
      onClick: onFormat,
    });
  }
  if (onReset) {
    allButtons.push({
      icon: "undo",
      label: "Reset to Default",
      onClick: () => {
        onChange?.(onReset());
      },
    });
  }
  allButtons.push(...buttons);

  return (
    <div className="code-editor-container">
      <div className="code-editor-action-container">
        {allButtons.map((btn, idx) => (
          <Button
            key={idx}
            className="code-editor-action"
            variant="tertiary"
            icon={btn.icon}
            label={btn.label}
            showTooltip={true}
            onClick={() => {
              void btn.onClick();
            }}
          />
        ))}
      </div>
      <CodeMirror
        className="code-editor"
        value={value}
        extensions={allExtensions}
        onChange={onChange}
        readOnly={onChange == null}
        basicSetup={true}
      />
    </div>
  );
};
