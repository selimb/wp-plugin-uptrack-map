import * as codeMirrorJs from "@codemirror/lang-javascript";

import { FocusCard } from "../../uptrack-map/focus-card";
import { CodeEditor } from "../CodeEditor";
import { SAMPLE_ROUTE_INFO } from "./FocusCardPreview";

const SAMPLE_ALPINE_DATA = FocusCard.buildAlpineData(SAMPLE_ROUTE_INFO, {
  pretty: true,
});

export const FocusCardData: React.FC = () => {
  return (
    <div className="w-full">
      <CodeEditor
        value={SAMPLE_ALPINE_DATA}
        extensions={[codeMirrorJs.javascript()]}
      />
    </div>
  );
};
