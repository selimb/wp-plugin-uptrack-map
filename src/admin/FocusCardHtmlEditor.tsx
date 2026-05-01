import * as codemirrorHtml from "@codemirror/lang-html";
import { TabPanel } from "@wordpress/components";
import * as prettierPluginHtml from "prettier/plugins/html";
import { format as prettierFormat } from "prettier/standalone";

import { DEFAULT_FOCUS_CARD_HTML } from "../default-assets/index";
import {
  CodeEditor,
  type CodeEditorButton,
  type CodeEditorLinter,
} from "./CodeEditor";
import { FocusCardPreview } from "./FocusCardPreview";

export type FocusCardHtmlEditorProps = {
  value: string;
  onChange: (value: string) => void;
};

export const FocusCardHtmlEditor: React.FC<FocusCardHtmlEditorProps> = ({
  value,
  onChange,
}) => {
  const handleFormatHtml = async (): Promise<void> => {
    try {
      const formatted = await prettierFormat(value, {
        parser: "html",
        plugins: [prettierPluginHtml],
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
        onChange(DEFAULT_FOCUS_CARD_HTML);
      },
    },
  ];

  return (
    <div className="w-full">
      <TabPanel
        tabs={[
          { name: "edit", title: "Edit" },
          { name: "preview", title: "Preview" },
        ]}
      >
        {(tab) =>
          tab.name === "edit" ? (
            <CodeEditor
              value={value}
              extensions={[codemirrorHtml.html()]}
              lint={linter}
              onChange={onChange}
              onFormat={handleFormatHtml}
              buttons={editorButtons}
            />
          ) : (
            <FocusCardPreview htmlText={value} />
          )
        }
      </TabPanel>
    </div>
  );
};

const linter: CodeEditorLinter = async (view) => {
  const text = view.state.doc.toString();

  try {
    await prettierFormat(text, {
      parser: "html",
      plugins: [prettierPluginHtml],
    });
    return [];
  } catch (error_) {
    const errorMessage =
      error_ instanceof Error ? error_.message : "Invalid HTML";
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
