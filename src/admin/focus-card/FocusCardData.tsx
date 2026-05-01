import * as codeMirrorJs from "@codemirror/lang-javascript";

import { CodeEditor } from "../CodeEditor";

export type FocusCardDataProps = {
  alpineData: string;
  onChangeAlpineData: (alpineData: string) => void;
};

export const FocusCardData: React.FC<FocusCardDataProps> = ({
  alpineData,
  onChangeAlpineData,
}) => {
  console.info("onChangeAlpineData", onChangeAlpineData);
  return (
    <div className="w-full">
      <CodeEditor
        value={alpineData}
        onChange={onChangeAlpineData}
        extensions={[codeMirrorJs.javascript()]}
      />
    </div>
  );
};
