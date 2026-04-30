import { TabPanel } from "@wordpress/components";
import { useEffect, useState } from "@wordpress/element";

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

  // XXX
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
            <textarea
              className="code-editor"
              value={htmlText}
              onChange={(e) => {
                handleChange(e.currentTarget.value);
              }}
            />
          ) : (
            <FocusCardPreview htmlText={htmlText} />
          )
        }
      </TabPanel>
    </div>
  );
};
