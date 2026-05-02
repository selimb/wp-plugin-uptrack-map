import { TabPanel } from "@wordpress/components";
import { useState } from "@wordpress/element";

import { FocusCard } from "../../uptrack-map/focus-card";
import { FocusCardData } from "./FocusCardData";
import { FocusCardHtmlEditor } from "./FocusCardHtmlEditor";
import { FocusCardPreview } from "./FocusCardPreview";
import { SAMPLE_ROUTE_INFO } from "./sample-route";

const Tab = {
  edit: "edit",
  data: "data",
  preview: "preview",
};

const TABS = [
  { name: Tab.edit, title: "Edit" },
  { name: Tab.data, title: "Data" },
  { name: Tab.preview, title: "Preview" },
];

export type FocusCardFormProps = {
  focusCardHtml: string;
  onChange: (focusCardHtml: string) => void;
  css: string;
  alpineJsUrl: string;
};

export const FocusCardForm: React.FC<FocusCardFormProps> = (props) => {
  const [alpineData, onChangeAlpineData] = useState(
    FocusCard.buildAlpineData(SAMPLE_ROUTE_INFO, { pretty: true }),
  );

  return (
    <div className="w-full">
      <TabPanel tabs={TABS}>
        {(tab) => {
          switch (tab.name) {
            case Tab.edit: {
              return <FocusCardHtmlEditor {...props} />;
            }
            case Tab.data: {
              return (
                <FocusCardData
                  alpineData={alpineData}
                  onChangeAlpineData={onChangeAlpineData}
                />
              );
            }
            case Tab.preview: {
              return <FocusCardPreview {...props} alpineData={alpineData} />;
            }
          }
        }}
      </TabPanel>
    </div>
  );
};
