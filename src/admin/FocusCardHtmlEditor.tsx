import { html } from "@codemirror/lang-html";
import { TabPanel } from "@wordpress/components";
import { useEffect, useState } from "@wordpress/element";
import * as prettierPluginHtml from "prettier/plugins/html";
import { format as prettierFormat } from "prettier/standalone";

import { FocusCard } from "../uptrack-map/focus-card";
import type { RouteInfo } from "../uptrack-map/types";
import { CodeEditor, type CodeEditorLinter } from "./CodeEditor";

const PREVIEW_ROUTE_INFO: RouteInfo = {
  id: "preview",
  kmlUrl: "",
  type: "ski_touring",
  marker: null,
  postUrl: "#",
  postTitle: "Example Route",
  distance: "12.5",
  elevation: "800",
  duration: "2",
};

const FocusCardPreview: React.FC<{ htmlText: string }> = ({ htmlText }) => {
  useEffect(() => {
    const card = new FocusCard(htmlText);
    card.show(PREVIEW_ROUTE_INFO);
    return () => {
      card.hide();
    };
  }, [htmlText]);

  return (
    <p style={{ color: "#666", fontStyle: "italic" }}>
      Focus card is rendered at the bottom of the screen.
    </p>
  );
};

export type FocusCardHtmlEditorProps = {
  value: string;
  onChange: (value: string) => void;
};

export const FocusCardHtmlEditor: React.FC<FocusCardHtmlEditorProps> = ({
  value,
  onChange,
}) => {
  const [htmlText, setHtmlText] = useState(value);

  useEffect(() => {
    setHtmlText(value);
  }, [value]);

  const handleChange = (newText: string): void => {
    setHtmlText(newText);
    onChange(newText);
  };

  const handleFormatHtml = async (): Promise<void> => {
    try {
      const formatted = await prettierFormat(htmlText, {
        parser: "html",
        plugins: [prettierPluginHtml],
      });
      handleChange(formatted);
    } catch {
      // Lint diagnostics surface formatting/parse errors.
    }
  };

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
              value={htmlText}
              extensions={[html()]}
              lint={linter}
              onChange={handleChange}
              onFormat={handleFormatHtml}
            />
          ) : (
            <FocusCardPreview htmlText={htmlText} />
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
