import { TabPanel } from "@wordpress/components";

import { FocusCardData } from "./FocusCardData";
import { FocusCardHtmlEditor } from "./FocusCardHtmlEditor";
import { FocusCardPreview } from "./FocusCardPreview";

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
  return (
    <div className="w-full">
      <TabPanel tabs={TABS}>
        {(tab) => {
          switch (tab.name) {
            case Tab.edit: {
              return <FocusCardHtmlEditor {...props} />;
            }
            case Tab.data: {
              return <FocusCardData />;
            }
            case Tab.preview: {
              return <FocusCardPreview {...props} />;
            }
          }
        }}
      </TabPanel>
    </div>
  );
};
