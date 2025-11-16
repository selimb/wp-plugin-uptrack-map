import { TextControl } from "@wordpress/components";
import { useState } from "@wordpress/element";
import clsx from "clsx";

import type { MarkerCoords } from "../settings";

type State = {
  type: "valid" | "invalid" | "empty";
  text: string;
};

export type CoordinateInputProps = {
  value: MarkerCoords | null;
  onChange: (value: MarkerCoords | null) => void;
};

export const CoordinateInput: React.FC<CoordinateInputProps> = ({
  value,
  onChange,
}) => {
  const [state, setState] = useState<State>(() => getInitialState(value));

  return (
    <TextControl
      __next40pxDefaultSize
      __nextHasNoMarginBottom
      value={state.text}
      onChange={(text) => {
        text = text.trim();
        let coords: MarkerCoords | null;
        if (text === "") {
          coords = null;
          setState({ type: "empty", text });
        } else {
          coords = parseText(text);
          setState(
            coords ? { type: "valid", text } : { type: "invalid", text },
          );
        }
        onChange(coords);
      }}
      className={clsx(
        state.type === "invalid" && "control-invalid",
        state.type === "empty" && "control-warning",
      )}
    />
  );
};

function getInitialState(coords: MarkerCoords | null): State {
  return coords === null
    ? { type: "empty", text: "" }
    : { type: "valid", text: coordsToText(coords) };
}

function coordsToText(coords: MarkerCoords): string {
  return coords.join(", ");
}

function parseText(text: string): MarkerCoords | null {
  text = text.trim();
  if (text === "") {
    return null;
  }

  const parts = text.split(",").map((part) => part.trim());
  if (parts.length !== 2) {
    return null;
  }
  const lat = Number.parseFloat(parts[0]);
  const lng = Number.parseFloat(parts[1]);
  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return null;
  }
  return [lat, lng];
}
