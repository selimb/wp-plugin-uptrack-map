import { html } from "@codemirror/lang-html";
import CodeMirror from "@uiw/react-codemirror";
import { Button, Notice, TabPanel } from "@wordpress/components";
import { useEffect, useState } from "@wordpress/element";
import * as prettierPluginHtml from "prettier/plugins/html";
import { format as prettierFormat } from "prettier/standalone";

import { FocusCard } from "../uptrack-map/focus-card";
import type { RouteInfo } from "../uptrack-map/types";

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
  const [formatError, setFormatError] = useState<string | null>(null);

  useEffect(() => {
    setHtmlText(value);
  }, [value]);

  const handleChange = (newText: string): void => {
    setFormatError(null);
    setHtmlText(newText);
    onChange(newText);
  };

  const handleFormatHtml = async (): Promise<void> => {
    try {
      const formatted = await prettierFormat(htmlText, {
        parser: "html",
        plugins: [prettierPluginHtml],
      });
      setFormatError(null);
      handleChange(formatted);
    } catch (error_) {
      const errorMessage =
        error_ instanceof Error ? error_.message : "Invalid HTML";
      setFormatError(errorMessage);
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
            <div>
              {formatError && (
                <Notice status="error" isDismissible={false}>
                  {formatError}
                </Notice>
              )}

              <div className="code-editor-container">
                <Button
                  className="code-editor-action"
                  variant="tertiary"
                  icon={<span aria-hidden="true">✨</span>}
                  label="Format"
                  showTooltip={true}
                  onClick={() => {
                    void handleFormatHtml();
                  }}
                />

                <CodeMirror
                  className="code-editor"
                  value={htmlText}
                  extensions={[html()]}
                  onChange={(newValue) => {
                    handleChange(newValue);
                  }}
                  basicSetup={true}
                />
              </div>
            </div>
          ) : (
            <FocusCardPreview htmlText={htmlText} />
          )
        }
      </TabPanel>
    </div>
  );
};
