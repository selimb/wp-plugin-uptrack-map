import * as codemirrorHtml from "@codemirror/lang-html";
import * as prettierPluginHtml from "prettier/plugins/html";
import { format as prettierFormat } from "prettier/standalone";

import { DEFAULT_FOCUS_CARD_HTML } from "../../default-assets/index";
import { CodeEditor, type CodeEditorLinter } from "../CodeEditor";
import type { FocusCardFormProps } from "./FocusCardForm";

export type FocusCardHtmlEditorProps = Pick<
  FocusCardFormProps,
  "focusCardHtml" | "onChange"
>;

export const FocusCardHtmlEditor: React.FC<FocusCardHtmlEditorProps> = ({
  focusCardHtml,
  onChange,
}) => {
  const handleFormat = async (): Promise<void> => {
    const result = await format(focusCardHtml);
    if (result.success) {
      onChange(result.formatted);
    }
  };

  return (
    <div className="w-full">
      <CodeEditor
        value={focusCardHtml}
        extensions={[codemirrorHtml.html()]}
        lint={linter}
        onChange={onChange}
        onFormat={handleFormat}
        onReset={() => DEFAULT_FOCUS_CARD_HTML}
      />
    </div>
  );
};

async function format(
  html: string,
): Promise<
  { success: true; formatted: string } | { success: false; error: string }
> {
  try {
    const formatted = await prettierFormat(html, {
      parser: "html",
      plugins: [prettierPluginHtml],
    });
    return { success: true, formatted };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Invalid HTML",
    };
  }
}

const linter: CodeEditorLinter = async (view) => {
  const text = view.state.doc.toString();

  const result = await format(text);
  if (result.success) {
    return [];
  }
  return [
    {
      from: 0,
      to: Math.min(1, text.length),
      severity: "error",
      message: result.error,
    },
  ];
};
